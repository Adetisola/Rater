/**
 * Notification Event Registry
 *
 * Single source of truth for all notification definitions, channel eligibility,
 * canonical copy, action labels, and target URLs.
 * Strictly adheres to the Rater Copy Dictionary.
 */

import type { NotificationEventType } from '@/types';
import type { NotificationEventDefinition } from './types';

export const NOTIFICATION_REGISTRY: Record<NotificationEventType, NotificationEventDefinition> = {
  // ─── 1. First Critique Received ─────────────────────────────────────────────
  FIRST_CRITIQUE_RECEIVED: {
    type: 'FIRST_CRITIQUE_RECEIVED',
    category: 'activity',
    priority: 'high',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ workTitle, postId, reviewId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      const critiqueUrl = postId ? `/post/${postId}?tab=critique${reviewId ? `#review-${reviewId}` : ''}` : '/browse';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      return {
        title: 'Someone critiqued your Work.',
        message: `Your first Critique is in. See what they noticed on ${titleClean}.`,
        pushTitle: 'First Critique on Rater',
        pushBody: `Your first Critique is in for ${titleClean}.`,
        actionLabel: 'View Critique',
        actionUrl: critiqueUrl,
        pushActions: [
          { action: 'view_critique', title: 'View Critique', url: critiqueUrl },
          { action: 'view_score', title: 'View Score', url: postUrl },
          { action: 'studio', title: 'Studio', url: '/browse' },
        ],
      };
    },
  },

  // ─── 2. Subsequent Critique Received ─────────────────────────────────────────
  CRITIQUE_RECEIVED: {
    type: 'CRITIQUE_RECEIVED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ actorName, workTitle, postId, reviewId }) => {
      const reviewer = actorName?.trim() || 'A creative';
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      const critiqueUrl = postId ? `/post/${postId}?tab=critique${reviewId ? `#review-${reviewId}` : ''}` : '/browse';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      return {
        title: 'New Critique on your Work',
        message: `${reviewer} shared a critique on ${titleClean}.`,
        pushTitle: 'New Critique on Rater',
        pushBody: `${reviewer} left feedback on ${titleClean}.`,
        actionLabel: 'View Critique',
        actionUrl: critiqueUrl,
        pushActions: [
          { action: 'view_critique', title: 'View Critique', url: critiqueUrl },
          { action: 'view_score', title: 'View Score', url: postUrl },
          { action: 'studio', title: 'Studio', url: '/browse' },
        ],
      };
    },
  },

  // ─── 2b. Reply to Critique ──────────────────────────────────────────────────
  CRITIQUE_REPLY_RECEIVED: {
    type: 'CRITIQUE_REPLY_RECEIVED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ actorName, workTitle, postId, reviewId, metadata }) => {
      const replier = actorName?.trim() || 'A creative';
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      const cId = reviewId || metadata?.critiqueId;
      const rId = metadata?.replyId;
      const targetUrl = postId
        ? `/post/${postId}?tab=critique${cId ? `&critiqueId=${cId}` : ''}${rId ? `&replyId=${rId}` : ''}${cId ? `#critique-${cId}` : ''}`
        : '/browse';
      return {
        title: 'New reply on your critique',
        message: `${replier} replied to your critique on ${titleClean}.`,
        pushTitle: 'New Reply on Rater',
        pushBody: `${replier} replied to your critique on ${titleClean}.`,
        actionLabel: 'View Reply',
        actionUrl: targetUrl,
        pushActions: [
          { action: 'view_reply', title: 'View Reply', url: targetUrl },
        ],
      };
    },
  },

  // ─── 2c. Reply to Another Reply ─────────────────────────────────────────────
  REPLY_TO_REPLY_RECEIVED: {
    type: 'REPLY_TO_REPLY_RECEIVED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ actorName, workTitle, postId, reviewId, metadata }) => {
      const replier = actorName?.trim() || 'A creative';
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      const cId = reviewId || metadata?.critiqueId;
      const rId = metadata?.replyId;
      const targetUrl = postId
        ? `/post/${postId}?tab=critique${cId ? `&critiqueId=${cId}` : ''}${rId ? `&replyId=${rId}` : ''}${cId ? `#critique-${cId}` : ''}`
        : '/browse';
      return {
        title: 'New reply to your comment',
        message: `${replier} replied to your reply on ${titleClean}.`,
        pushTitle: 'New Reply on Rater',
        pushBody: `${replier} replied to your reply on ${titleClean}.`,
        actionLabel: 'View Reply',
        actionUrl: targetUrl,
        pushActions: [
          { action: 'view_reply', title: 'View Reply', url: targetUrl },
        ],
      };
    },
  },

  // ─── 2d. Mention in Reply ───────────────────────────────────────────────────
  REPLY_MENTION_RECEIVED: {
    type: 'REPLY_MENTION_RECEIVED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ actorName, workTitle, postId, reviewId, metadata }) => {
      const mentioner = actorName?.trim() || 'A creative';
      const titleClean = workTitle ? `"${workTitle}"` : 'a design';
      const cId = reviewId || metadata?.critiqueId;
      const rId = metadata?.replyId;
      const targetUrl = postId
        ? `/post/${postId}?tab=critique${cId ? `&critiqueId=${cId}` : ''}${rId ? `&replyId=${rId}` : ''}${cId ? `#critique-${cId}` : ''}`
        : '/browse';
      return {
        title: 'Mentioned in a critique reply',
        message: `${mentioner} mentioned you in a reply on ${titleClean}.`,
        pushTitle: 'New Mention on Rater',
        pushBody: `${mentioner} mentioned you in a reply on ${titleClean}.`,
        actionLabel: 'View Mention',
        actionUrl: targetUrl,
        pushActions: [
          { action: 'view_mention', title: 'View Mention', url: targetUrl },
        ],
      };
    },
  },

  // ─── 3. Overall Score Unlocked ───────────────────────────────────────────────
  WORK_RATING_UNLOCKED: {
    type: 'WORK_RATING_UNLOCKED',
    category: 'milestones',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      const critiquesUrl = postId ? `/post/${postId}?tab=critique` : '/browse';
      return {
        title: 'Your Work has a score.',
        message: `${titleClean} has received 3 Critiques. Your Overall Score and Criteria Scores are now unlocked.`,
        pushTitle: 'Overall Score Unlocked 🎉',
        pushBody: `${titleClean} has received 3 Critiques. Your Overall Score is live.`,
        emailSubject: `Your Work ${titleClean} has unlocked its Overall Score`,
        actionLabel: 'See Score',
        actionUrl: postUrl,
        pushActions: [
          { action: 'see_score', title: 'See Score', url: postUrl },
          { action: 'view_critiques', title: 'Critiques', url: critiquesUrl },
          { action: 'share_score', title: 'Share', url: postUrl },
        ],
      };
    },
  },

  // ─── 4. Insights Ready ──────────────────────────────────────────────────────
  INSIGHTS_READY: {
    type: 'INSIGHTS_READY',
    category: 'insights',
    priority: 'high',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_insights',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      const insightsUrl = postId ? `/post/${postId}?tab=insights` : '/browse';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      return {
        title: 'Insights ready',
        message: `Patterns and synthesis across community critiques are now available for ${titleClean}.`,
        pushTitle: 'Insights Ready',
        pushBody: `Discover what the studio observed in ${titleClean}.`,
        emailSubject: `New Insights ready for ${titleClean}`,
        actionLabel: 'Explore Insights',
        actionUrl: insightsUrl,
        pushActions: [
          { action: 'explore_insights', title: 'Explore Insights', url: insightsUrl },
          { action: 'view_work', title: 'View Work', url: postUrl },
        ],
      };
    },
  },

  // ─── 5. Top Rated Badge Awarded ─────────────────────────────────────────────
  BADGE_TOP_RATED_AWARDED: {
    type: 'BADGE_TOP_RATED_AWARDED',
    category: 'milestones',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      const critiquesUrl = postId ? `/post/${postId}?tab=critique` : '/browse';
      return {
        title: 'Top Rated in the Studio 🏆',
        message: `${titleClean} has earned the Top Rated badge for exceptional community standing.`,
        pushTitle: 'Top Rated Badge Earned! 🏆',
        pushBody: `${titleClean} is now featured as Top Rated in the Studio.`,
        emailSubject: `Congratulations! ${titleClean} is now Top Rated on Rater`,
        actionLabel: 'Share Result',
        actionUrl: postUrl,
        pushActions: [
          { action: 'view_badge', title: 'View Badge 🏆', url: postUrl },
          { action: 'view_critiques', title: 'Critiques', url: critiquesUrl },
          { action: 'share_result', title: 'Share', url: postUrl },
        ],
      };
    },
  },

  // ─── 6. First Work Published ────────────────────────────────────────────────
  FIRST_WORK_PUBLISHED: {
    type: 'FIRST_WORK_PUBLISHED',
    category: 'milestones',
    priority: 'normal',
    channels: {
      inApp: true,
      push: false,
      email: false,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      return {
        title: 'Work published to the Studio',
        message: `${titleClean} is live. Community critiques and ratings will appear here.`,
        actionLabel: 'View Work',
        actionUrl: postId ? `/post/${postId}` : '/browse',
      };
    },
  },

  // ─── 6b. New Work Published (Discovery) ─────────────────────────────────────
  NEW_WORK_PUBLISHED: {
    type: 'NEW_WORK_PUBLISHED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_new_work',
    renderCopy: ({ actorName, workTitle, postId }) => {
      const creatorName = actorName?.trim() || 'A creator';
      const titleClean = workTitle ? `"${workTitle}"` : 'a new design';
      const postUrl = postId ? `/post/${postId}` : '/browse';
      return {
        title: 'New work on Rater',
        message: `${creatorName} published ${titleClean}.`,
        pushTitle: 'New work on Rater',
        pushBody: `${creatorName} just published something new.`,
        actionLabel: 'View Work',
        actionUrl: postUrl,
        pushActions: [
          { action: 'view_work', title: 'View Work', url: postUrl },
        ],
      };
    },
  },

  // ─── 7. Feedback Request Response ───────────────────────────────────────────
  FEEDBACK_REQUEST_REPLY: {
    type: 'FEEDBACK_REQUEST_REPLY',
    category: 'community',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_feedback_status',
    renderCopy: ({ feedbackTitle, feedbackSlug }) => {
      const titleClean = feedbackTitle ? `"${feedbackTitle}"` : 'your idea';
      const discussionUrl = feedbackSlug ? `/feedback/${feedbackSlug}` : '/feedback';
      return {
        title: 'Team responded to feedback',
        message: `The Rater team posted an official response to ${titleClean}.`,
        pushTitle: 'Official Feedback Response',
        pushBody: `The Rater team responded to ${titleClean}.`,
        actionLabel: 'View Response',
        actionUrl: discussionUrl,
        pushActions: [
          { action: 'view_response', title: 'View Response', url: discussionUrl },
          { action: 'feedback_board', title: 'Feedback Board', url: '/feedback' },
        ],
      };
    },
  },

  // ─── 8. Feedback Status Changed ─────────────────────────────────────────────
  FEEDBACK_STATUS_CHANGED: {
    type: 'FEEDBACK_STATUS_CHANGED',
    category: 'community',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_feedback_status',
    renderCopy: ({ feedbackTitle, feedbackSlug, metadata }) => {
      const titleClean = feedbackTitle ? `"${feedbackTitle}"` : 'your followed idea';
      const newStatus = metadata?.newStatus || 'Updated';
      const discussionUrl = feedbackSlug ? `/feedback/${feedbackSlug}` : '/feedback';
      return {
        title: `Feedback status moved to ${newStatus}`,
        message: `${titleClean} is now ${newStatus}.`,
        pushTitle: 'Feedback Status Update',
        pushBody: `${titleClean} is now ${newStatus}.`,
        actionLabel: 'View Request',
        actionUrl: discussionUrl,
        pushActions: [
          { action: 'view_request', title: 'View Request', url: discussionUrl },
          { action: 'feedback_board', title: 'Feedback Board', url: '/feedback' },
        ],
      };
    },
  },

  // ─── 9. Feedback Comment Received ───────────────────────────────────────────
  FEEDBACK_COMMENT_RECEIVED: {
    type: 'FEEDBACK_COMMENT_RECEIVED',
    category: 'community',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_feedback_comments',
    renderCopy: ({ actorName, feedbackTitle, feedbackSlug }) => {
      const commenter = actorName?.trim() || 'A creative';
      const titleClean = feedbackTitle ? `"${feedbackTitle}"` : 'a followed idea';
      const discussionUrl = feedbackSlug ? `/feedback/${feedbackSlug}#comments` : '/feedback';
      return {
        title: 'New comment on followed idea',
        message: `${commenter} commented on ${titleClean}.`,
        pushTitle: 'New Feedback Comment',
        pushBody: `${commenter} joined the discussion on ${titleClean}.`,
        actionLabel: 'View Discussion',
        actionUrl: discussionUrl,
        pushActions: [
          { action: 'view_discussion', title: 'View Discussion', url: discussionUrl },
          { action: 'feedback_board', title: 'Feedback Board', url: '/feedback' },
        ],
      };
    },
  },

  // ─── 10. Account Suspended (System Bypass) ──────────────────────────────────
  ACCOUNT_SUSPENDED: {
    type: 'ACCOUNT_SUSPENDED',
    category: 'system',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: false,
      email: true,
    },
    renderCopy: () => ({
      title: 'Account Suspended',
      message: 'Your profile has been suspended for community guideline violations.',
      emailSubject: 'Important notice regarding your Rater account',
      actionLabel: 'Contact Studio',
      actionUrl: 'mailto:hello@raterapp.site',
    }),
  },
};
