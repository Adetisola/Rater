"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { updateFeedbackRequest } from '@/lib/admin/server';
import { format } from 'date-fns';
import { 
  Search, 
  Edit2, 
  RefreshCw, 
  Pin, 
  Lock, 
  MessageSquare,
  ThumbsUp,
  Sparkles,
  ExternalLink,
  X,
  Loader2,
  CheckCircle2,
  BookmarkCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/GlobalOverlays';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { FeedbackStatus, FeedbackCategory } from '@/types';

const CATEGORIES: FeedbackCategory[] = [
  'UI',
  'Search',
  'Performance',
  'Profiles',
  'Reviews',
  'Mobile',
  'Accessibility',
  'Notifications',
  'General',
];

const STATUSES: FeedbackStatus[] = [
  'New',
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Declined',
  'Resolved Duplicate',
];

export function FeedbackAdminPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal / Editor State
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackStatus>('New');
  const [editCategory, setEditCategory] = useState<FeedbackCategory>('UI');
  const [editOfficialResponse, setEditOfficialResponse] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('feedback_requests_with_stats')
      .select('id, title, description, slug, created_at, status, category, admin_notes, official_response, official_response_at, upvote_count, comment_count, follow_count, is_pinned, is_locked')
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setIsLoading(false);
  }

  const handleOpenEdit = (req: any) => {
    setEditingRequest(req);
    setEditStatus((req.status as FeedbackStatus) || 'New');
    setEditCategory((req.category as FeedbackCategory) || 'UI');
    setEditOfficialResponse(req.official_response || '');
    setEditAdminNotes(req.admin_notes || '');
  };

  const handleCloseEdit = () => {
    setEditingRequest(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    try {
      setIsSaving(true);
      const res = await updateFeedbackRequest(editingRequest.id, {
        status: editStatus,
        category: editCategory,
        official_response: editOfficialResponse,
        admin_notes: editAdminNotes,
      });

      if (res.ok) {
        setRequests(prev =>
          prev.map(r =>
            r.id === editingRequest.id
              ? {
                  ...r,
                  status: editStatus,
                  category: editCategory,
                  official_response: editOfficialResponse.trim() || null,
                  official_response_at: editOfficialResponse.trim() ? new Date().toISOString() : null,
                  admin_notes: editAdminNotes.trim() || null,
                }
              : r
          )
        );
        showToast('Feedback request updated and audit log saved.', 'success');
        handleCloseEdit();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update feedback request.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const willPin = !currentPin;
      await updateFeedbackRequest(id, { is_pinned: willPin });
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, is_pinned: willPin } : r)));
      showToast(willPin ? 'Pinned feedback to top.' : 'Unpinned feedback.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update pin.', 'error');
    }
  };

  const handleToggleLock = async (id: string, currentLock: boolean) => {
    try {
      const willLock = !currentLock;
      await updateFeedbackRequest(id, { is_locked: willLock });
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, is_locked: willLock } : r)));
      showToast(willLock ? 'Discussion closed.' : 'Discussion reopened.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lock.', 'error');
    }
  };

  // Metrics Count
  const counts = {
    total: requests.length,
    new: requests.filter(r => !r.status || r.status === 'New').length,
    underReview: requests.filter(r => r.status === 'Under Review').length,
    planned: requests.filter(r => r.status === 'Planned').length,
    inProgress: requests.filter(r => r.status === 'In Progress').length,
    completed: requests.filter(r => r.status === 'Completed').length,
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'New' && (!req.status || req.status === 'New')) ||
      req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Feedback & Roadmap Moderation
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Manage community ideas, publish official responses, and update roadmap statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            <input 
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface-primary border border-border-default rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <Button
            variant="outline"
            onClick={fetchRequests}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-surface-primary border-border-default text-text-primary hover:bg-surface-hover shadow-2xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* 2. Status Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'All'
              ? "bg-surface-interactive text-text-primary border-border-strong shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">All Submissions</p>
          <p className="text-lg font-bold mt-0.5">{counts.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('New')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'New'
              ? "bg-surface-interactive text-text-primary border-border-strong shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">New</p>
          <p className="text-lg font-bold mt-0.5">{counts.new}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Under Review')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'Under Review'
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500 shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Under Review</p>
          <p className="text-lg font-bold mt-0.5">{counts.underReview}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Planned')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'Planned'
              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500 shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Planned</p>
          <p className="text-lg font-bold mt-0.5">{counts.planned}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('In Progress')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'In Progress'
              ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500 shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">In Progress</p>
          <p className="text-lg font-bold mt-0.5">{counts.inProgress}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Completed')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            statusFilter === 'Completed'
              ? "bg-status-success-bg text-status-success-fg border-status-success-fg shadow-2xs font-semibold"
              : "bg-surface-primary border-border-default hover:border-border-strong text-text-secondary"
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-status-success-fg">Completed</p>
          <p className="text-lg font-bold mt-0.5">{counts.completed}</p>
        </button>
      </div>

      {/* 3. Feedback Submissions Table */}
      <div className="bg-surface-primary border border-border-default rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/75 border-b border-border-default text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Title & Context</th>
                <th className="px-6 py-4 w-36">Status</th>
                <th className="px-6 py-4 w-32">Category</th>
                <th className="px-6 py-4 w-32 text-center">Engagement</th>
                <th className="px-6 py-4 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs sm:text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-muted">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-text-muted" />
                    Loading feedback submissions...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-muted">
                    No feedback requests match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-hover/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className="flex flex-col gap-1 mt-0.5">
                          {req.is_pinned && (
                            <span title="Pinned to top" className="text-amber-500">
                              <Pin size={13} className="fill-amber-500" />
                            </span>
                          )}
                          {req.is_locked && (
                            <span title="Discussion locked" className="text-text-muted">
                              <Lock size={13} />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary line-clamp-1">{req.title}</span>
                            {req.official_response && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-primary/20 shrink-0">
                                <Sparkles size={10} className="text-primary" />
                                <span>Responded</span>
                              </span>
                            )}
                          </div>
                          <p className="text-text-secondary line-clamp-1 text-xs">{req.description}</p>
                          <div className="text-[11px] text-text-muted font-medium pt-0.5">
                            {format(new Date(req.created_at), 'MMM d, yyyy')} •{' '}
                            <Link
                              href={`/feedback/${req.slug}`}
                              target="_blank"
                              className="text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>View Public</span>
                              <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          req.status === 'Planned' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                          req.status === 'In Progress' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
                          req.status === 'Completed' && "bg-status-success-bg text-status-success-fg border-status-success-fg/30",
                          req.status === 'Under Review' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                          req.status === 'Declined' && "bg-status-error-bg text-status-error-fg border-status-error-border",
                          req.status === 'Resolved Duplicate' && "bg-surface-interactive text-text-secondary border-border-default",
                          (!req.status || req.status === 'New') && "bg-surface-subtle text-text-secondary border-border-default"
                        )}
                      >
                        {req.status || 'New'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-text-secondary bg-surface-interactive px-2.5 py-1 rounded-lg">
                        {req.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2.5 text-xs text-text-secondary font-bold">
                        <span className="inline-flex items-center gap-1" title="Upvotes">
                          <ThumbsUp size={12} className="text-primary" />
                          {req.upvote_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-text-muted" title="Comments">
                          <MessageSquare size={12} />
                          {req.comment_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Followers">
                          <BookmarkCheck size={12} />
                          {req.follow_count || 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          onClick={() => handleTogglePin(req.id, Boolean(req.is_pinned))}
                          className={cn(
                            "h-8 w-8 p-0 rounded-xl",
                            req.is_pinned ? "text-amber-600 border-amber-500/30 bg-amber-500/10" : "text-text-muted hover:text-text-primary"
                          )}
                          title={req.is_pinned ? 'Unpin from top' : 'Pin to top'}
                        >
                          <Pin size={13} className={req.is_pinned ? 'fill-amber-500' : ''} />
                        </Button>

                        <Button 
                          variant="outline" 
                          onClick={() => handleToggleLock(req.id, Boolean(req.is_locked))}
                          className={cn(
                            "h-8 w-8 p-0 rounded-xl",
                            req.is_locked ? "text-amber-600 border-amber-500/30 bg-amber-500/10" : "text-text-muted hover:text-text-primary"
                          )}
                          title={req.is_locked ? 'Unlock comments' : 'Lock comments'}
                        >
                          <Lock size={13} />
                        </Button>

                        <Button 
                          variant="outline" 
                          onClick={() => handleOpenEdit(req)} 
                          className="h-8 px-2.5 text-xs font-bold rounded-xl inline-flex items-center gap-1 bg-surface-primary border-border-default text-text-primary hover:bg-surface-hover"
                        >
                          <Edit2 size={12} />
                          <span>Respond</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Edit / Official Response Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-overlay-backdrop backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-surface-primary rounded-3xl shadow-elevated border border-border-default overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-default flex items-center justify-between bg-surface-primary">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-text-primary">Respond & Moderate Feedback</h3>
                <p className="text-xs text-text-secondary line-clamp-1">{editingRequest.title}</p>
              </div>

              <button
                onClick={handleCloseEdit}
                className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Lifecycle Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as FeedbackStatus)}
                    className="w-full h-10 border border-border-default rounded-xl px-3 text-xs font-semibold bg-surface-subtle text-text-primary focus:outline-none focus:border-primary"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as FeedbackCategory)}
                    className="w-full h-10 border border-border-default rounded-xl px-3 text-xs font-semibold bg-surface-subtle text-text-primary focus:outline-none focus:border-primary"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Public Official Response */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Sparkles size={13} className="text-primary" />
                    <span>Official Team Response (Public)</span>
                  </label>
                  <span className="text-[11px] text-text-muted">Visible to all community members</span>
                </div>
                <textarea
                  value={editOfficialResponse}
                  onChange={e => setEditOfficialResponse(e.target.value)}
                  placeholder="e.g., We've added this to our Q3 roadmap and work has started..."
                  rows={4}
                  className="w-full border border-border-default rounded-2xl p-3.5 text-xs sm:text-[13px] bg-surface-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Private Internal Admin Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary">
                    Internal Admin Notes (Private)
                  </label>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Staff only (hidden from public)</span>
                </div>
                <textarea
                  value={editAdminNotes}
                  onChange={e => setEditAdminNotes(e.target.value)}
                  placeholder="Internal team notes, Jira ticket references, technical implementation details..."
                  rows={3}
                  className="w-full border border-border-default rounded-2xl p-3.5 text-xs bg-surface-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-border-default flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseEdit}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Changes & Log Audit</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
