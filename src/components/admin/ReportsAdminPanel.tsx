"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/UserAvatar';
import { PostThumbnail } from '@/components/PostThumbnail';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  getReports, 
  updateReportStatus, 
  updatePostModeration, 
  updateUserModeration,
  deleteReviewModeration,
  deleteReplyModeration
} from '@/lib/admin/server';
import type { Report, ReportStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function ReportsAdminPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  // Active Admin Note State for resolving
  const [activeReportNotes, setActiveReportNotes] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'default';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'default',
    action: async () => {},
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getReports({
        status: statusFilter,
        target_type: targetTypeFilter,
        page,
        limit: 10,
      });
      setReports(res.reports);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, targetTypeFilter, page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus, actionTaken?: string) => {
    try {
      setIsActionLoading(true);
      const notes = activeReportNotes[reportId] || undefined;
      const res = await updateReportStatus(reportId, {
        status: newStatus,
        action_taken: actionTaken,
        admin_notes: notes,
      });

      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? {
          ...r,
          status: newStatus,
          action_taken: actionTaken || r.action_taken,
          admin_notes: notes || r.admin_notes,
        } : r));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update report');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTakeActionAndResolve = (
    report: Report, 
    actionType: 'hide_post' | 'block_user' | 'delete_review' | 'block_reviewer' | 'delete_reply' | 'block_reply_author'
  ) => {
    if (actionType === 'hide_post' && report.target_post) {
      setConfirmDialog({
        isOpen: true,
        title: `Hide Reported Post "${report.target_post.title}"?`,
        description: 'This will immediately hide the reported post from all public feeds and resolve this safety report.',
        confirmLabel: 'Hide Post & Resolve Report',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await updatePostModeration(report.target_id, { is_deleted: true });
            await handleUpdateStatus(report.id, 'resolved', 'Post soft-deleted by admin');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to execute moderation action');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    } else if (actionType === 'block_user' && report.target_profile) {
      setConfirmDialog({
        isOpen: true,
        title: `Block Reported User @${report.target_profile.username}?`,
        description: 'This will immediately block the user from the platform and resolve this safety report.',
        confirmLabel: 'Block User & Resolve Report',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await updateUserModeration(report.target_id, { is_blocked: true });
            await handleUpdateStatus(report.id, 'resolved', 'User profile blocked by admin');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to execute moderation action');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    } else if (actionType === 'delete_review' && report.target_review) {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Reported Critique?',
        description: 'This will permanently remove this critique and its ratings from the post, recalculating the work\'s average score, and resolve this safety report.',
        confirmLabel: 'Delete Critique & Resolve',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await deleteReviewModeration(report.target_id);
            await handleUpdateStatus(report.id, 'resolved', 'Critique deleted due to community violations');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to delete critique');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    } else if (actionType === 'block_reviewer' && report.target_review?.reviewer_id) {
      const username = report.target_review.reviewer?.username || 'user';
      setConfirmDialog({
        isOpen: true,
        title: `Block Reviewer @${username}?`,
        description: 'This will immediately suspend this user from Rater and resolve this safety report.',
        confirmLabel: 'Block Reviewer & Resolve',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await updateUserModeration(report.target_review!.reviewer_id, { is_blocked: true });
            await handleUpdateStatus(report.id, 'resolved', `User @${username} blocked by admin`);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to block user');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    } else if (actionType === 'delete_reply' && report.target_reply) {
      setConfirmDialog({
        isOpen: true,
        title: 'Remove Reported Reply?',
        description: 'This will remove this reply due to community violations, replacing it with a violation notice while preserving thread continuity.',
        confirmLabel: 'Remove Reply & Resolve',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await deleteReplyModeration(report.target_id);
            await handleUpdateStatus(report.id, 'resolved', 'Reply removed due to community violations');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to remove reply');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    } else if (actionType === 'block_reply_author' && report.target_reply?.author_id) {
      const username = report.target_reply.author?.username || 'user';
      setConfirmDialog({
        isOpen: true,
        title: `Block Author @${username}?`,
        description: 'This will immediately suspend this user from Rater and resolve this safety report.',
        confirmLabel: 'Block Author & Resolve',
        variant: 'danger',
        action: async () => {
          try {
            setIsActionLoading(true);
            await updateUserModeration(report.target_reply!.author_id, { is_blocked: true });
            await handleUpdateStatus(report.id, 'resolved', `User @${username} blocked by admin`);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            alert(err?.message || 'Failed to block user');
          } finally {
            setIsActionLoading(false);
          }
        },
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
            Reports & Safety Queue
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700">
              {totalCount} Reports
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review user-submitted abuse reports, copyright violations, and inappropriate content.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
          >
            <option value="all">All Targets</option>
            <option value="post">Posts Only</option>
            <option value="review">Critiques Only</option>
            <option value="reply">Replies Only</option>
            <option value="profile">Profiles Only</option>
          </select>

          <Button
            variant="outline"
            onClick={loadReports}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-white"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Reports Queue List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-gray-300" />
            Loading safety queue...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-500 text-sm">
            <ShieldCheck size={36} className="text-emerald-500 mx-auto mb-3" />
            <div className="font-bold text-gray-900 text-base">Safety Queue Clear</div>
            <p className="text-xs text-gray-400 mt-1">No reports matching the selected filters.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report.id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:border-gray-200 transition-all space-y-4"
            >
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    report.status === 'pending' ? 'bg-red-100 text-red-700' :
                    report.status === 'under_review' ? 'bg-amber-100 text-amber-800' :
                    report.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>

                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-lg",
                    report.target_type === 'post' && "bg-blue-50 text-blue-800",
                    report.target_type === 'review' && "bg-purple-50 text-purple-800",
                    report.target_type === 'reply' && "bg-amber-50 text-amber-900",
                    report.target_type === 'profile' && "bg-gray-100 text-gray-900"
                  )}>
                    {report.target_type === 'post' ? 'Post Violation' :
                     report.target_type === 'review' ? 'Critique Report' :
                     report.target_type === 'reply' ? 'Critique Reply Report' :
                     'Profile Violation'}
                  </span>

                  <span className="text-xs text-gray-400 font-medium">
                    Reported {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                {report.reporter && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>by</span>
                    <UserAvatar avatarUrl={report.reporter.avatar_url} className="w-5 h-5" />
                    <span className="font-bold text-gray-700">@{report.reporter.username}</span>
                  </div>
                )}
              </div>

              {/* Reported Reason & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Reason description */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Violation Reason
                  </div>
                  <div className="text-sm font-bold text-red-900 bg-red-50/50 p-3 rounded-2xl border border-red-100/80">
                    "{report.reason}"
                  </div>
                  {report.details && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl italic">
                      "{report.details}"
                    </div>
                  )}
                  {report.action_taken && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      <span className="font-bold">Action Taken:</span> {report.action_taken}
                    </div>
                  )}
                </div>

                {/* Right: Target Entity Preview */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Reported Content
                  </div>

                  {/* Post Preview */}
                  {report.target_type === 'post' && report.target_post && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <PostThumbnail
                        publicId={report.target_post.media?.[0]?.public_id}
                        imageUrl={report.target_post.image_url}
                        preset="POST_THUMBNAIL_SM"
                        alt={report.target_post.title}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {report.target_post.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          by @{report.target_post.author?.username || 'user'} • {report.target_post.category}
                        </div>
                        <Link
                          href={`/post/${report.target_post.id}`}
                          target="_blank"
                          className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          Inspect Live Post
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Profile Preview */}
                  {report.target_type === 'profile' && report.target_profile && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <UserAvatar avatarUrl={report.target_profile.avatar_url} size="sm" className="w-10 h-10" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900">
                          {report.target_profile.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{report.target_profile.username}
                        </div>
                        <Link
                          href={`/@${report.target_profile.username}`}
                          target="_blank"
                          className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          View Profile
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Critique / Review Preview */}
                  {report.target_type === 'review' && report.target_review && (
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar avatarUrl={report.target_review.reviewer?.avatar_url} size="xs" className="w-6 h-6" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {report.target_review.reviewer?.name || 'Reviewer'}
                          </span>
                          {report.target_review.reviewer?.username && (
                            <span className="text-[11px] text-gray-500 truncate">
                              @{report.target_review.reviewer.username}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-full border border-gray-200/80">
                          <img src="/icons/star-active-yellow.svg" className="w-3 h-3" alt="" />
                          <span className="text-[11px] font-bold text-gray-800">
                            {(() => {
                              const ratings = report.target_review.ratings || {};
                              const vals = Object.values(ratings).filter(v => typeof v === 'number') as number[];
                              if (vals.length === 0) return '-';
                              return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
                            })()}
                          </span>
                        </div>
                      </div>

                      {report.target_review.comment && (
                        <div className="text-xs text-gray-800 bg-white p-2.5 rounded-xl border border-gray-100 leading-relaxed max-h-28 overflow-y-auto">
                          &ldquo;{report.target_review.comment}&rdquo;
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                        <div className="text-gray-500 truncate flex-1 min-w-0 mr-2">
                          On work: <span className="font-semibold text-gray-800">{report.target_review.post?.title || 'Published Work'}</span>
                        </div>
                        {report.target_review.post_id && (
                          <Link
                            href={`/post/${report.target_review.post_id}?tab=critique&critiqueId=${report.target_id}#critique-${report.target_id}`}
                            target="_blank"
                            className="font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                          >
                            Inspect Live Critique
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Critique Reply Preview */}
                  {report.target_type === 'reply' && report.target_reply && (
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar avatarUrl={report.target_reply.author?.avatar_url} size="xs" className="w-6 h-6" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {report.target_reply.author?.name || 'User'}
                          </span>
                          {report.target_reply.author?.username && (
                            <span className="text-[11px] text-gray-500 truncate">
                              @{report.target_reply.author.username}
                            </span>
                          )}
                        </div>

                        {report.target_reply.is_tombstone && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            Already Deleted
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-800 bg-white p-2.5 rounded-xl border border-gray-100 leading-relaxed max-h-28 overflow-y-auto">
                        &ldquo;{report.target_reply.content}&rdquo;
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                        <div className="text-gray-500 truncate flex-1 min-w-0 mr-2">
                          On work: <span className="font-semibold text-gray-800">{report.target_reply.post?.title || 'Published Work'}</span>
                        </div>
                        {report.target_reply.critique?.post_id && (
                          <Link
                            href={`/post/${report.target_reply.critique.post_id}?tab=critique&critiqueId=${report.target_reply.critique_id}&replyId=${report.target_id}#critique-${report.target_reply.critique_id}`}
                            target="_blank"
                            className="font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                          >
                            Inspect Live Reply
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Target content deleted or missing fallback */}
                  {((report.target_type === 'post' && !report.target_post) || 
                    (report.target_type === 'profile' && !report.target_profile) ||
                    (report.target_type === 'review' && !report.target_review) ||
                    (report.target_type === 'reply' && !report.target_reply)) && (
                    <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-400 italic">
                      Target content was deleted or no longer exists.
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Action Toolbar */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[200px] max-w-sm">
                  <input
                    type="text"
                    placeholder="Add internal resolution note..."
                    value={activeReportNotes[report.id] || ''}
                    onChange={(e) => setActiveReportNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {report.status !== 'under_review' && report.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold rounded-xl text-amber-700 hover:bg-amber-50 border-amber-200"
                    >
                      Mark Under Review
                    </Button>
                  )}

                  {/* Post Moderation */}
                  {report.target_type === 'post' && report.target_post && (
                    <Button
                      variant="outline"
                      onClick={() => handleTakeActionAndResolve(report, 'hide_post')}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                    >
                      Hide Post & Resolve
                    </Button>
                  )}

                  {/* Profile Moderation */}
                  {report.target_type === 'profile' && report.target_profile && (
                    <Button
                      variant="outline"
                      onClick={() => handleTakeActionAndResolve(report, 'block_user')}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                    >
                      Block User & Resolve
                    </Button>
                  )}

                  {/* Critique Moderation */}
                  {report.target_type === 'review' && report.target_review && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleTakeActionAndResolve(report, 'delete_review')}
                        disabled={isActionLoading}
                        className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                      >
                        Delete Critique & Resolve
                      </Button>
                      {report.target_review.reviewer_id && (
                        <Button
                          variant="outline"
                          onClick={() => handleTakeActionAndResolve(report, 'block_reviewer')}
                          disabled={isActionLoading}
                          className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                        >
                          Block Reviewer
                        </Button>
                      )}
                    </>
                  )}

                  {/* Critique Reply Moderation */}
                  {report.target_type === 'reply' && report.target_reply && !report.target_reply.is_tombstone && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleTakeActionAndResolve(report, 'delete_reply')}
                        disabled={isActionLoading}
                        className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                      >
                        Remove Reply & Resolve
                      </Button>
                      {report.target_reply.author_id && (
                        <Button
                          variant="outline"
                          onClick={() => handleTakeActionAndResolve(report, 'block_reply_author')}
                          disabled={isActionLoading}
                          className="h-8 px-3 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                        >
                          Block Author
                        </Button>
                      )}
                    </>
                  )}

                  {report.status !== 'dismissed' && (
                    <Button
                      variant="ghost"
                      onClick={() => handleUpdateStatus(report.id, 'dismissed', 'Report dismissed by admin')}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold text-gray-500 rounded-xl"
                    >
                      Dismiss
                    </Button>
                  )}

                  {report.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      onClick={() => handleUpdateStatus(report.id, 'resolved', 'Resolved without direct deletion')}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold rounded-xl"
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {reports.length > 0 && (
        <div className="bg-white p-4 border border-gray-100 rounded-2xl flex items-center justify-between text-xs text-gray-500 font-medium">
          <div>
            Showing <span className="font-bold text-gray-900">{reports.length}</span> of{' '}
            <span className="font-bold text-gray-900">{totalCount}</span> reports
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-bold text-gray-700">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        isLoading={isActionLoading}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
