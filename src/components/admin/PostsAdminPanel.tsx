"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Star, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  X, 
  Image as ImageIcon,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/UserAvatar';
import { PostThumbnail } from '@/components/PostThumbnail';
import { OptimizedMedia } from '@/components/OptimizedMedia';
import { MediaCarousel } from '@/components/MediaCarousel';
import { ConfirmDialog } from './ConfirmDialog';
import { getAdminPosts, updatePostModeration, hardDeletePostAdmin } from '@/lib/admin/server';
import type { Post } from '@/types';
import { format } from 'date-fns';

const CATEGORIES = [
  'All',
  'Web Design',
  'Mobile App Design',
  'Brand Identity Design',
  'Mockup Design',
  'Logo Design',
  'Poster Design',
  'Flyer Design',
  'Social Media Design',
  'AI Image',
  '3D Design',
  'Packaging Design',
  'Banner Design',
  'Ad Creative Design',
  'Illustration',
  'Icon Design',
  'Typography Design',
  'UI Design',
  'Landing Page Design',
  'Dashboard Design'
];

export function PostsAdminPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');

  // Preview Post Modal State
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  // Edit Metadata State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAdminPosts({
        search: debouncedSearch,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        status: statusFilter,
        page,
        limit: 15,
      });
      setPosts(res.posts);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, categoryFilter, statusFilter, page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleToggleSoftDelete = (post: Post) => {
    const willDelete = !post.is_deleted;
    setConfirmDialog({
      isOpen: true,
      title: willDelete ? `Hide "${post.title}"?` : `Restore "${post.title}"?`,
      description: willDelete
        ? 'Soft-deleting will immediately hide this post from the public browse feed, search results, and creator profile. It remains archived in the admin panel and can be restored at any time.'
        : 'Restoring will make this post immediately visible again across all public feeds.',
      confirmLabel: willDelete ? 'Hide Post' : 'Restore Post',
      variant: willDelete ? 'danger' : 'default',
      action: async () => {
        try {
          setIsActionLoading(true);
          const res = await updatePostModeration(post.id, { is_deleted: willDelete });
          if (res.ok) {
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_deleted: willDelete } : p));
            if (previewPost?.id === post.id) {
              setPreviewPost(prev => prev ? { ...prev, is_deleted: willDelete } : null);
            }
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(err.message || 'Failed to update post status');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  const handleHardDelete = (post: Post) => {
    setConfirmDialog({
      isOpen: true,
      title: `PERMANENTLY Delete "${post.title}"?`,
      description: 'WARNING: This is permanent and IRREVERSIBLE. It will delete the post, all associated reviews, ratings, view records, notifications, and permanently purge media assets from Cloudinary.',
      confirmLabel: 'Permanently Purge Post',
      variant: 'danger',
      action: async () => {
        try {
          setIsActionLoading(true);
          const res = await hardDeletePostAdmin(post.id);
          if (res.ok) {
            setPosts(prev => prev.filter(p => p.id !== post.id));
            setTotalCount(prev => Math.max(0, prev - 1));
            setPreviewPost(null);
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(err.message || 'Failed to hard-delete post');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  const handleSaveMetadata = async () => {
    if (!previewPost) return;
    try {
      setIsActionLoading(true);
      const res = await updatePostModeration(previewPost.id, {
        title: editTitle.trim() || previewPost.title,
        category: editCategory || previewPost.category,
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === previewPost.id ? {
          ...p,
          title: editTitle.trim() || previewPost.title,
          category: (editCategory || previewPost.category) as any,
        } : p));
        setPreviewPost(prev => prev ? {
          ...prev,
          title: editTitle.trim() || previewPost.title,
          category: (editCategory || previewPost.category) as any,
        } : null);
        setIsEditing(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update metadata');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Post Moderation
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Audit published designs, inspect media & AI prompts, manage categories, and soft/hard delete posts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-primary border border-border-default rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface-primary border border-border-default rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-surface-primary border border-border-default rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deleted">Soft-Deleted</option>
          </select>

          <Button
            variant="outline"
            onClick={loadPosts}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-surface-primary border-border-default text-text-primary hover:bg-surface-hover"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-surface-primary border border-border-default rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/75 border-b border-border-default text-[11px] font-semibold text-text-muted tracking-wider">
                <th className="px-6 py-4">Post & Media</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Score / Reviews</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-text-muted text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-text-muted" />
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-text-secondary text-sm">
                    No posts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr 
                    key={post.id}
                    className="hover:bg-surface-hover/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setPreviewPost(post);
                      setIsEditing(false);
                      setEditTitle(post.title);
                      setEditCategory(post.category);
                    }}
                  >
                    {/* Thumbnail & Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PostThumbnail
                          publicId={post.media?.[0]?.public_id}
                          imageUrl={post.image_url}
                          preset="POST_THUMBNAIL_SM"
                          badgeCount={post.media?.length}
                          alt={post.title}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary truncate max-w-xs flex items-center gap-1.5">
                            {post.title}
                            {post.uses_ai && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Sparkles size={9} />
                                AI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted truncate max-w-xs mt-0.5">
                            {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
                      {post.author ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar avatarUrl={post.author.avatar_url} size="xs" className="w-6 h-6" />
                          <div className="text-xs font-semibold text-text-secondary">
                            @{post.author.username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-text-secondary bg-surface-interactive px-2.5 py-1 rounded-lg">
                        {post.category}
                      </span>
                    </td>

                    {/* Score / Reviews */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                        <Star size={13} className="text-primary fill-primary" />
                        <span>{post.average_score ? Number(post.average_score).toFixed(1) : '—'}</span>
                        <span className="text-text-muted font-normal">({post.review_count || 0})</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {post.is_deleted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-status-error-bg text-status-error-fg border border-status-error-border">
                          Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-status-success-bg text-status-success-fg border border-status-success-fg/30">
                          Published
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPreviewPost(post);
                            setIsEditing(false);
                            setEditTitle(post.title);
                            setEditCategory(post.category);
                          }}
                          className="h-8 px-3 text-xs font-bold rounded-xl border-border-default text-text-primary hover:bg-surface-hover"
                        >
                          Inspect
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleToggleSoftDelete(post)}
                          className={`h-8 px-3 text-xs font-bold rounded-xl ${
                            post.is_deleted
                              ? 'text-status-success-fg hover:bg-status-success-bg border-status-success-fg/30'
                              : 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30'
                          }`}
                        >
                          {post.is_deleted ? 'Restore' : 'Hide'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleHardDelete(post)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl text-status-error-fg hover:bg-status-error-bg border-status-error-border"
                          title="Permanently Delete Post"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-default flex items-center justify-between text-xs text-text-secondary font-medium">
          <div>
            Showing <span className="font-bold text-text-primary">{posts.length}</span> of{' '}
            <span className="font-bold text-text-primary">{totalCount}</span> posts
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg text-xs border-border-default text-text-primary hover:bg-surface-hover"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-bold text-text-secondary">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-lg text-xs border-border-default text-text-primary hover:bg-surface-hover"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Post Preview & Inspect Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-overlay-backdrop backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewPost(null)}
          />

          <div className="relative w-full max-w-2xl bg-surface-primary rounded-3xl p-6 sm:p-8 shadow-elevated z-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 border border-border-default">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-default mb-6">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Post Inspection</h2>
                <span className="text-xs text-text-muted font-mono">ID: {previewPost.id}</span>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-hover"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media Gallery Preview */}
            <div className="mb-6">
              {Array.isArray(previewPost.media) && previewPost.media.length > 0 ? (
                <div className="rounded-2xl overflow-hidden bg-art-canvas border border-art-canvas-border">
                  <MediaCarousel media={previewPost.media} variant="detail" className="max-h-80" />
                </div>
              ) : previewPost.image_url ? (
                <div className="rounded-2xl overflow-hidden bg-art-canvas border border-art-canvas-border flex items-center justify-center max-h-80">
                  <OptimizedMedia
                    media={{ url: previewPost.image_url, type: 'image' }}
                    variant="detail"
                    priority={true}
                    alt={previewPost.title}
                    className="max-h-80 w-auto object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-subtle p-8 flex items-center justify-center text-text-muted">
                  <ImageIcon size={32} />
                </div>
              )}
            </div>

            {/* Post Metadata Editing */}
            <div className="space-y-4 mb-6">
              {isEditing ? (
                <div className="p-4 bg-surface-subtle rounded-2xl space-y-3 border border-border-default">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Post Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="primary"
                      onClick={handleSaveMetadata}
                      disabled={isActionLoading}
                      className="h-8 px-4 text-xs font-bold rounded-xl"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="h-8 px-3 text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-subtle rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Title</span>
                    <span className="font-bold text-text-primary">{previewPost.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Category</span>
                    <span className="font-semibold text-text-primary">{previewPost.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Author</span>
                    <span className="font-semibold text-text-primary">
                      @{previewPost.author?.username || previewPost.avatar_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Uploaded</span>
                    <span className="font-semibold text-text-primary">
                      {previewPost.created_at ? format(new Date(previewPost.created_at), 'MMMM d, yyyy h:mm a') : '—'}
                    </span>
                  </div>
                  {previewPost.description && (
                    <div className="pt-2 border-t border-border-default">
                      <span className="text-text-secondary block mb-1">Description</span>
                      <p className="text-text-secondary italic">"{previewPost.description}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Attribution Inspection */}
            {previewPost.uses_ai && (
              <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/30 mb-6 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <Sparkles size={14} className="text-purple-600" />
                  AI Generation Attribution
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-300">
                  <span className="font-semibold">Tool:</span> {previewPost.ai_tool || 'Not specified'}
                </div>
                {previewPost.ai_prompt && (
                  <div className="text-xs text-purple-600 dark:text-purple-300 bg-surface-primary p-2.5 rounded-xl border border-purple-500/30 italic">
                    "{previewPost.ai_prompt}"
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-default">
              <div className="flex items-center gap-2">
                <Link
                  href={`/post/${previewPost.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-default text-xs font-bold text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <ExternalLink size={13} />
                  View Live
                </Link>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 border-border-default text-text-primary hover:bg-surface-hover"
                  >
                    <Edit2 size={13} />
                    Edit Info
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleToggleSoftDelete(previewPost)}
                  className={`h-9 px-4 text-xs font-bold rounded-xl ${
                    previewPost.is_deleted
                      ? 'text-status-success-fg hover:bg-status-success-bg border-status-success-fg/30'
                      : 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  {previewPost.is_deleted ? 'Restore to Feed' : 'Hide from Feed'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleHardDelete(previewPost)}
                  className="h-9 px-4 text-xs font-bold rounded-xl bg-status-error-bg text-status-error-fg hover:bg-status-error-bg/80 border border-status-error-border shadow-none"
                >
                  Hard Delete
                </Button>
              </div>
            </div>
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
