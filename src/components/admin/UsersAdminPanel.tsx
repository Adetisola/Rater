"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  ExternalLink, 
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/UserAvatar';
import { ConfirmDialog } from './ConfirmDialog';
import { getAdminUsers, updateUserModeration, updateUserAttribution } from '@/lib/admin/server';
import type { Avatar } from '@/types';
import { format } from 'date-fns';

export function UsersAdminPanel() {
  const [users, setUsers] = useState<Avatar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'admin'>('all');

  // Selected User Drawer State
  const [selectedUser, setSelectedUser] = useState<Avatar | null>(null);

  // Edit Role inline
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRole, setNewRole] = useState('');

  // Attribution Edit State
  const [isEditingAttribution, setIsEditingAttribution] = useState(false);
  const [editSource, setEditSource] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editCampaign, setEditCampaign] = useState('');
  const [editReferredBy, setEditReferredBy] = useState('');

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAdminUsers({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleBlock = (user: Avatar) => {
    const willBlock = !user.is_blocked;
    setConfirmDialog({
      isOpen: true,
      title: willBlock ? `Block @${user.username}?` : `Unblock @${user.username}?`,
      description: willBlock
        ? 'Blocking will prevent this user from posting, reviewing, or interacting with the platform. Their profile will be hidden from search results and sitemaps.'
        : 'Unblocking will restore this user\'s full account access and visibility.',
      confirmLabel: willBlock ? 'Block User' : 'Unblock User',
      variant: willBlock ? 'danger' : 'default',
      action: async () => {
        try {
          setIsActionLoading(true);
          const res = await updateUserModeration(user.id, { is_blocked: willBlock });
          if (res.ok) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: willBlock } : u));
            if (selectedUser?.id === user.id) {
              setSelectedUser(prev => prev ? { ...prev, is_blocked: willBlock } : null);
            }
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(err.message || 'Failed to update user status');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  const handleToggleAdmin = (user: Avatar) => {
    const willGrant = !user.is_admin;
    setConfirmDialog({
      isOpen: true,
      title: willGrant ? `Grant Admin to @${user.username}?` : `Revoke Admin from @${user.username}?`,
      description: willGrant
        ? 'This user will gain full access to the Admin Panel, including moderation actions, user management, and system settings.'
        : 'This user will lose access to all admin tools and moderation interfaces.',
      confirmLabel: willGrant ? 'Grant Admin Privileges' : 'Revoke Admin Privileges',
      variant: willGrant ? 'warning' : 'danger',
      action: async () => {
        try {
          setIsActionLoading(true);
          const res = await updateUserModeration(user.id, { is_admin: willGrant });
          if (res.ok) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: willGrant } : u));
            if (selectedUser?.id === user.id) {
              setSelectedUser(prev => prev ? { ...prev, is_admin: willGrant } : null);
            }
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(err.message || 'Failed to update admin privileges');
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      setIsActionLoading(true);
      const roleToSave = newRole.trim() || null;
      const res = await updateUserModeration(selectedUser.id, { role: roleToSave });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: roleToSave } : u));
        setSelectedUser(prev => prev ? { ...prev, role: roleToSave } : null);
        setIsEditingRole(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenUser = (user: Avatar) => {
    setSelectedUser(user);
    setIsEditingRole(false);
    setNewRole(user.role || '');
    setIsEditingAttribution(false);
    setEditSource(user.acquisition_source || '');
    setEditDetail(user.acquisition_detail || '');
    setEditCampaign(user.campaign_tag || '');
    setEditReferredBy(user.referred_by || '');
  };

  const handleSaveAttribution = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);
    try {
      const res = await updateUserAttribution(selectedUser.id, {
        acquisition_source: editSource || null,
        acquisition_detail: editDetail || null,
        campaign_tag: editCampaign || null,
        referred_by: editReferredBy || null,
      });

      if (res.ok) {
        const updatedFields = {
          acquisition_source: editSource || null,
          acquisition_detail: editDetail || null,
          campaign_tag: editCampaign || null,
          referred_by: editReferredBy || null,
        };
        setSelectedUser(prev => prev ? { ...prev, ...updatedFields } : null);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updatedFields } : u));
        setIsEditingAttribution(false);
      } else {
        alert(res.error || 'Failed to update attribution');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attribution');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage registered accounts, roles, access permissions, and account moderation.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by username, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-primary border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-surface-primary border border-border-default rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked</option>
              <option value="admin">Admins</option>
            </select>

            <Button
              variant="outline"
              onClick={loadUsers}
              disabled={isLoading}
              className="h-9 px-3 rounded-xl text-xs font-bold bg-surface-primary border-border-default text-text-primary hover:bg-surface-hover"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-primary border border-border-default rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/75 border-b border-border-default text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-muted text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-text-muted" />
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-secondary text-sm">
                    No users match the current search filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-surface-hover/60 transition-colors cursor-pointer"
                    onClick={() => handleOpenUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar avatarUrl={user.avatar_url} size="xs" className="w-9 h-9" />
                        <div>
                          <div className="font-semibold text-text-primary flex items-center gap-1.5">
                            {user.name}
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-primary/20 text-text-primary">
                                <ShieldCheck size={10} />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted font-medium">
                            @{user.username} {user.email && `• ${user.email}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-text-secondary bg-surface-interactive px-2.5 py-1 rounded-lg">
                        {user.role || 'Member'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.is_blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-status-error-bg text-status-error-fg border border-status-error-border">
                          <UserX size={11} />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-status-success-bg text-status-success-fg border border-status-success-fg/30">
                          <UserCheck size={11} />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-text-muted font-medium">
                      {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenUser(user)}
                          className="h-8 px-3 text-xs font-semibold rounded-xl border-border-default text-text-primary hover:bg-surface-hover"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleToggleBlock(user)}
                          className={`h-8 px-3 text-xs font-semibold rounded-xl ${
                            user.is_blocked
                              ? 'text-status-success-fg hover:bg-status-success-bg border-status-success-fg/30'
                              : 'text-status-error-fg hover:bg-status-error-bg border-status-error-border'
                          }`}
                        >
                          {user.is_blocked ? 'Unblock' : 'Block'}
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
            Showing <span className="font-bold text-text-primary">{users.length}</span> of{' '}
            <span className="font-bold text-text-primary">{totalCount}</span> profiles
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

      {/* User Detail Side Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-overlay-backdrop backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUser(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-surface-primary h-full shadow-elevated z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-border-default">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border-default flex items-center justify-between bg-surface-subtle/50">
              <h2 className="text-lg font-bold text-text-primary">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Profile Card Snapshot */}
              <div className="text-center pb-6 border-b border-border-default">
                <UserAvatar avatarUrl={selectedUser.avatar_url} className="w-18 h-18 mx-auto mb-3 ring-4 ring-border-subtle" />
                <h3 className="text-xl font-bold text-text-primary flex items-center justify-center gap-1.5">
                  {selectedUser.name}
                  {selectedUser.is_admin && (
                    <ShieldCheck size={16} className="text-primary" />
                  )}
                </h3>
                <div className="text-xs font-semibold text-text-muted">@{selectedUser.username}</div>
                
                {selectedUser.bio && (
                  <p className="text-xs text-text-secondary mt-3 max-w-xs mx-auto leading-relaxed italic">
                    "{selectedUser.bio}"
                  </p>
                )}

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Link
                    href={`/@${selectedUser.username}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-default text-xs font-bold text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    Public Profile
                    <ExternalLink size={12} />
                  </Link>
                  <Link
                    href={`/admin/posts?search=${selectedUser.username}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-interactive text-text-primary text-xs font-bold hover:bg-surface-hover border border-border-default transition-colors"
                  >
                    <Layers size={12} />
                    View Posts
                  </Link>
                </div>
              </div>

              {/* Account Metadata */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-text-muted tracking-wider">
                  Account Info
                </div>

                <div className="bg-surface-subtle border border-border-default p-4 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Email Address</span>
                    <span className="font-semibold text-text-primary">{selectedUser.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">User ID</span>
                    <span className="font-mono text-[10px] text-text-muted truncate max-w-[180px]">
                      {selectedUser.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Joined Date</span>
                    <span className="font-semibold text-text-primary">
                      {selectedUser.created_at ? format(new Date(selectedUser.created_at), 'MMMM d, yyyy') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Status</span>
                    <span className={`font-bold ${selectedUser.is_blocked ? 'text-status-error-fg' : 'text-status-success-fg'}`}>
                      {selectedUser.is_blocked ? 'Blocked' : 'Active Account'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Title Management */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-text-muted tracking-wider flex items-center justify-between">
                  <span>Role Title</span>
                  {!isEditingRole && (
                    <button
                      onClick={() => setIsEditingRole(true)}
                      className="text-primary hover:underline inline-flex items-center gap-1 font-bold text-[11px]"
                    >
                      <Edit2 size={11} />
                      Edit
                    </button>
                  )}
                </div>

                {isEditingRole ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="e.g. Senior Designer"
                      className="flex-1 bg-surface-primary border border-border-default rounded-xl px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                    />
                    <Button
                      variant="primary"
                      onClick={handleSaveRole}
                      disabled={isActionLoading}
                      className="h-8 px-3 text-xs font-bold rounded-xl"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditingRole(false)}
                      className="h-8 px-2 text-xs text-text-secondary rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-subtle border border-border-default rounded-xl text-xs font-semibold text-text-secondary">
                    {selectedUser.role || 'No custom role assigned (Default: Member)'}
                  </div>
                )}
              </div>

              {/* Growth & Attribution Metadata */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-text-muted tracking-wider flex items-center justify-between">
                  <span>Growth & Attribution</span>
                  {!isEditingAttribution && (
                    <button
                      onClick={() => setIsEditingAttribution(true)}
                      className="text-primary hover:underline inline-flex items-center gap-1 font-bold text-[11px]"
                    >
                      <Edit2 size={11} />
                      Override
                    </button>
                  )}
                </div>

                {isEditingAttribution ? (
                  <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-3 text-xs">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                      Attribution Override (Admin Correction)
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary font-semibold mb-1">Acquisition Source</label>
                      <input
                        type="text"
                        placeholder="e.g. instagram, tiktok, discord, direct"
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary font-semibold mb-1">Source Detail</label>
                      <input
                        type="text"
                        placeholder="e.g. @designwithme, event-name"
                        value={editDetail}
                        onChange={(e) => setEditDetail(e.target.value)}
                        className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary font-semibold mb-1">Campaign Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. first-1000, get-rated"
                        value={editCampaign}
                        onChange={(e) => setEditCampaign(e.target.value)}
                        className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary font-semibold mb-1">Referred By (User UUID)</label>
                      <input
                        type="text"
                        placeholder="e.g. UUID of referrer profile"
                        value={editReferredBy}
                        onChange={(e) => setEditReferredBy(e.target.value)}
                        className="w-full bg-surface-primary border border-border-default rounded-xl px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="primary"
                        onClick={handleSaveAttribution}
                        disabled={isActionLoading}
                        className="h-8 px-3 text-xs font-bold rounded-xl"
                      >
                        Save Correction
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditingAttribution(false)}
                        className="h-8 px-2 text-xs text-text-secondary rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-subtle border border-border-default p-4 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Marketing Source</span>
                      <span className="font-semibold text-text-primary uppercase tracking-wide">
                        {selectedUser.acquisition_source || 'Direct / Organic'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Source Detail</span>
                      <span className="font-mono text-text-secondary text-[11px]">
                        {selectedUser.acquisition_detail || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Campaign Tag</span>
                      <span className="font-mono text-text-secondary text-[11px]">
                        {selectedUser.campaign_tag || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Referred By</span>
                      <span className="font-mono text-[10px] text-text-secondary truncate max-w-[170px]">
                        {selectedUser.referred_by || 'None'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Moderation Actions */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-text-muted tracking-wider">
                  Moderation Controls
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleBlock(selectedUser)}
                    className={`w-full h-11 rounded-2xl text-xs font-bold justify-between px-4 ${
                      selectedUser.is_blocked
                        ? 'text-status-success-fg hover:text-status-success-fg hover:bg-status-success-bg border-status-success-fg/30'
                        : 'text-status-error-fg hover:text-status-error-fg hover:bg-status-error-bg border-status-error-border'
                    }`}
                  >
                    <span>{selectedUser.is_blocked ? 'Unblock User Account' : 'Block User from Platform'}</span>
                    {selectedUser.is_blocked ? <UserCheck size={16} /> : <UserX size={16} />}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleToggleAdmin(selectedUser)}
                    className="w-full h-11 rounded-2xl text-xs font-bold justify-between px-4 text-text-secondary hover:text-text-primary hover:bg-surface-hover border-border-default"
                  >
                    <span>{selectedUser.is_admin ? 'Revoke Administrator Access' : 'Promote to Administrator'}</span>
                    <ShieldCheck size={16} className={selectedUser.is_admin ? 'text-primary' : 'text-text-primary'} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog */}
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
