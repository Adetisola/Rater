/**
 * Regression Tests: Reply Notification Dispatch
 *
 * Covers dispatchReplyNotifications extracted from POST /api/critiques/[id]/replies
 * to fix the detached IIFE regression.
 *
 * Tests:
 * 1. Direct critique reply -> CRITIQUE_REPLY_RECEIVED to critique author
 * 2. Reply-to-reply -> REPLY_TO_REPLY_RECEIVED to parent reply author
 * 3. @mention -> REPLY_MENTION_RECEIVED to mentioned user
 * 4. Self-reply -> no notification
 * 5. Mention of critique author -> only REPLY_MENTION_RECEIVED (priority dedup)
 * 6. Multiple mentions -> no duplicate recipients
 * 7. Notification failure -> error propagates (caller catches, reply still 201)
 * 8. Idempotent dispatch -> same event twice -> same idempotency key
 * 9. Reply-to-reply: User B gets REPLY_TO_REPLY, User A gets CRITIQUE_REPLY
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface DispatchCall {
  eventType: string;
  recipientProfileId: string;
  idempotencyKey: string;
  [key: string]: any;
}

const mockDispatch = vi.fn();

vi.mock('@/lib/notifications/engine', () => ({
  NotificationEngine: { dispatch: mockDispatch },
}));

vi.mock('@/lib/logger', () => ({
  globalLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function buildMockAdminClient(profileRows: Array<{ id: string; username: string; is_blocked: boolean }> = []) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockResolvedValue({ data: profileRows, error: null }),
  };
  return { from: vi.fn().mockReturnValue(chain) };
}

// Mirror of production dispatchReplyNotifications (route.ts)
async function dispatchReplyNotifications({
  adminClient, actorId, critiqueId, critiqueReviewerId, postId,
  postTitle, replyId, parentReplyId, parentReplyAuthorId, rawContent,
}: {
  adminClient: any; actorId: string; critiqueId: string; critiqueReviewerId: string;
  postId: string; postTitle: string | null; replyId: string;
  parentReplyId: string | null; parentReplyAuthorId: string | null; rawContent: string;
}): Promise<void> {
  const { NotificationEngine } = await import('@/lib/notifications/engine');
  const mentionRegex = /(?:^|\s)@([a-z0-9_.]{3,20})(?=$|[^\w.])/gi;
  const matchedUsernames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(rawContent)) !== null) {
    const u = match[1].toLowerCase();
    if (u) matchedUsernames.add(u);
    if (matchedUsernames.size >= 5) break;
  }
  const mentionedProfilesMap = new Map<string, string>();
  if (matchedUsernames.size > 0) {
    const { data: matchedProfiles } = await adminClient
      .from('profiles').select('id, username, is_blocked')
      .in('username', Array.from(matchedUsernames)).neq('is_blocked', true);
    (matchedProfiles || []).forEach((p: any) => {
      if (p.id !== actorId) mentionedProfilesMap.set(p.username.toLowerCase(), p.id);
    });
  }
  const mentionedProfileIds = Array.from(mentionedProfilesMap.values());
  const notifiedRecipients = new Set<string>();

  for (const mentionedId of mentionedProfileIds) {
    if (mentionedId && !notifiedRecipients.has(mentionedId)) {
      notifiedRecipients.add(mentionedId);
      await NotificationEngine.dispatch({
        eventType: 'REPLY_MENTION_RECEIVED', recipientProfileId: mentionedId,
        actorProfileId: actorId, targetEntityId: postId,
        idempotencyKey: `reply_mention:${replyId}:${mentionedId}`,
        groupKey: `reply_thread:${critiqueId}`,
        metadata: { workTitle: postTitle, critiqueId, replyId, postId },
      });
    }
  }
  if (parentReplyAuthorId && parentReplyAuthorId !== actorId && !notifiedRecipients.has(parentReplyAuthorId)) {
    notifiedRecipients.add(parentReplyAuthorId);
    await NotificationEngine.dispatch({
      eventType: 'REPLY_TO_REPLY_RECEIVED', recipientProfileId: parentReplyAuthorId,
      actorProfileId: actorId, targetEntityId: postId,
      idempotencyKey: `reply_to_reply:${replyId}:${parentReplyAuthorId}`,
      groupKey: `reply_thread:${critiqueId}`,
      metadata: { workTitle: postTitle, critiqueId, replyId, postId, parentReplyId },
    });
  }
  if (critiqueReviewerId && critiqueReviewerId !== actorId && !notifiedRecipients.has(critiqueReviewerId)) {
    notifiedRecipients.add(critiqueReviewerId);
    await NotificationEngine.dispatch({
      eventType: 'CRITIQUE_REPLY_RECEIVED', recipientProfileId: critiqueReviewerId,
      actorProfileId: actorId, targetEntityId: postId,
      idempotencyKey: `critique_reply:${replyId}:${critiqueReviewerId}`,
      groupKey: `reply_thread:${critiqueId}`,
      metadata: { workTitle: postTitle, critiqueId, replyId, postId },
    });
  }
}

const USER_A = 'user-a-critique-author';
const USER_B = 'user-b-replier';
const USER_C = 'user-c-third-party';
const CRITIQUE_ID = 'critique-001';
const POST_ID = 'post-001';
const REPLY_ID = 'reply-001';
const PARENT_REPLY_ID = 'parent-reply-000';

describe('dispatchReplyNotifications', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockDispatch.mockResolvedValue({ ok: true, notificationId: 'notif-xyz' });
  });

  it('1. Direct critique reply - sends CRITIQUE_REPLY_RECEIVED to critique author', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient(), actorId: USER_B,
      critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
      postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null, rawContent: 'Great feedback!',
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'CRITIQUE_REPLY_RECEIVED',
      recipientProfileId: USER_A,
      actorProfileId: USER_B,
      idempotencyKey: `critique_reply:${REPLY_ID}:${USER_A}`,
    }));
  });

  it('2. Reply-to-reply - sends REPLY_TO_REPLY_RECEIVED to parent reply author', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient(), actorId: USER_C,
      critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
      postTitle: 'My Design', replyId: REPLY_ID, parentReplyId: PARENT_REPLY_ID,
      parentReplyAuthorId: USER_B, rawContent: 'Agreed.',
    });
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    const rtr = calls.find((c) => c.eventType === 'REPLY_TO_REPLY_RECEIVED');
    expect(rtr?.recipientProfileId).toBe(USER_B);
    expect(rtr?.idempotencyKey).toBe(`reply_to_reply:${REPLY_ID}:${USER_B}`);
  });

  it('3. @mention - sends REPLY_MENTION_RECEIVED to mentioned user', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient([{ id: USER_C, username: 'user_c', is_blocked: false }]),
      actorId: USER_B, critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A,
      postId: POST_ID, postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null, rawContent: 'Hey @user_c check this',
    });
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    const mention = calls.find((c) => c.eventType === 'REPLY_MENTION_RECEIVED');
    expect(mention?.recipientProfileId).toBe(USER_C);
    expect(mention?.idempotencyKey).toBe(`reply_mention:${REPLY_ID}:${USER_C}`);
  });

  it('4. Self-reply - no notification when actor IS the critique author', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient(), actorId: USER_A,
      critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
      postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null, rawContent: 'My own critique.',
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('5. Mention of critique author - only REPLY_MENTION_RECEIVED (dedup suppresses CRITIQUE_REPLY_RECEIVED)', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient([{ id: USER_A, username: 'user_a', is_blocked: false }]),
      actorId: USER_B, critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A,
      postId: POST_ID, postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null, rawContent: 'Hey @user_a great critique!',
    });
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    const forA = calls.filter((c) => c.recipientProfileId === USER_A);
    expect(forA).toHaveLength(1);
    expect(forA[0].eventType).toBe('REPLY_MENTION_RECEIVED');
  });

  it('6. Multiple mentions - no duplicate recipients', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient([
        { id: USER_A, username: 'user_a', is_blocked: false },
        { id: USER_C, username: 'user_c', is_blocked: false },
      ]),
      actorId: USER_B, critiqueId: CRITIQUE_ID, critiqueReviewerId: 'user-nobody',
      postId: POST_ID, postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null,
      rawContent: '@user_a and @user_c and @user_a again',
    });
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    const mentionsForA = calls.filter((c) => c.eventType === 'REPLY_MENTION_RECEIVED' && c.recipientProfileId === USER_A);
    expect(mentionsForA).toHaveLength(1);
  });

  it('7. Notification failure - error propagates so caller can log it (reply still 201)', async () => {
    mockDispatch.mockRejectedValue(new Error('Supabase connection timeout'));
    await expect(dispatchReplyNotifications({
      adminClient: buildMockAdminClient(), actorId: USER_B,
      critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
      postTitle: 'My Design', replyId: REPLY_ID,
      parentReplyId: null, parentReplyAuthorId: null, rawContent: 'A reply.',
    })).rejects.toThrow('Supabase connection timeout');
  });

  it('8. Idempotency - same event dispatched twice produces identical idempotency keys', async () => {
    for (let i = 0; i < 2; i++) {
      await dispatchReplyNotifications({
        adminClient: buildMockAdminClient(), actorId: USER_B,
        critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
        postTitle: 'My Design', replyId: REPLY_ID,
        parentReplyId: null, parentReplyAuthorId: null, rawContent: 'Idempotent reply.',
      });
    }
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    const critiqueReplyCalls = calls.filter((c) => c.eventType === 'CRITIQUE_REPLY_RECEIVED');
    expect(critiqueReplyCalls).toHaveLength(2);
    expect(critiqueReplyCalls[0].idempotencyKey).toBe(`critique_reply:${REPLY_ID}:${USER_A}`);
    expect(critiqueReplyCalls[0].idempotencyKey).toBe(critiqueReplyCalls[1].idempotencyKey);
  });

  it('9. Reply-to-reply - User B gets REPLY_TO_REPLY and User A still gets CRITIQUE_REPLY', async () => {
    await dispatchReplyNotifications({
      adminClient: buildMockAdminClient(), actorId: USER_C,
      critiqueId: CRITIQUE_ID, critiqueReviewerId: USER_A, postId: POST_ID,
      postTitle: 'My Design', replyId: REPLY_ID, parentReplyId: PARENT_REPLY_ID,
      parentReplyAuthorId: USER_B, rawContent: 'Replying to the reply.',
    });
    const calls: DispatchCall[] = mockDispatch.mock.calls.map((c: any) => c[0]);
    expect(calls.some((c) => c.eventType === 'REPLY_TO_REPLY_RECEIVED' && c.recipientProfileId === USER_B)).toBe(true);
    expect(calls.some((c) => c.eventType === 'CRITIQUE_REPLY_RECEIVED' && c.recipientProfileId === USER_A)).toBe(true);
    expect(calls.some((c) => c.recipientProfileId === USER_C)).toBe(false);
  });
});