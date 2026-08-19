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
import { getAdminUsers, updateUserModeration } from '@/lib/admin/server';
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage registered accounts, roles, access permissions, and account moderation.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by username, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-black transition-colors"
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
              className="h-9 px-3 rounded-xl text-xs font-bold bg-white"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-gray-300" />
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500 text-sm">
                    No users match the current search filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditingRole(false);
                      setNewRole(user.role || '');
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar avatarUrl={user.avatar_url} className="w-9 h-9" />
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {user.name}
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-primary/20 text-black">
                                <ShieldCheck size={10} />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            @{user.username} {user.email && `• ${user.email}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {user.role || 'Member'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.is_blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-red-700">
                          <UserX size={11} />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700">
                          <UserCheck size={11} />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditingRole(false);
                            setNewRole(user.role || '');
                          }}
                          className="h-8 px-3 text-xs font-semibold rounded-xl"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleToggleBlock(user)}
                          className={`h-8 px-3 text-xs font-semibold rounded-xl ${
                            user.is_blocked
                              ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                              : 'text-red-700 border-red-200'
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
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div>
            Showing <span className="font-bold text-gray-900">{users.length}</span> of{' '}
            <span className="font-bold text-gray-900">{totalCount}</span> profiles
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
      </div>

      {/* User Detail Side Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUser(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Profile Card Snapshot */}
              <div className="text-center pb-6 border-b border-gray-100">
                <UserAvatar avatarUrl={selectedUser.avatar_url} className="w-18 h-18 mx-auto mb-3 ring-4 ring-gray-100" />
                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1.5">
                  {selectedUser.name}
                  {selectedUser.is_admin && (
                    <ShieldCheck size={16} className="text-primary" />
                  )}
                </h3>
                <div className="text-xs font-semibold text-gray-400">@{selectedUser.username}</div>
                
                {selectedUser.bio && (
                  <p className="text-xs text-gray-600 mt-3 max-w-xs mx-auto leading-relaxed italic">
                    "{selectedUser.bio}"
                  </p>
                )}

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Link
                    href={`/@${selectedUser.username}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Public Profile
                    <ExternalLink size={12} />
                  </Link>
                  <Link
                    href={`/admin/posts?search=${selectedUser.username}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    <Layers size={12} />
                    View Posts
                  </Link>
                </div>
              </div>

              {/* Account Metadata */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 tracking-wider">
                  Account Info
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email Address</span>
                    <span className="font-semibold text-gray-900">{selectedUser.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">User ID</span>
                    <span className="font-mono text-[10px] text-gray-400 truncate max-w-[180px]">
                      {selectedUser.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Joined Date</span>
                    <span className="font-semibold text-gray-900">
                      {selectedUser.created_at ? format(new Date(selectedUser.created_at), 'MMMM d, yyyy') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold ${selectedUser.is_blocked ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedUser.is_blocked ? 'Blocked' : 'Active Account'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Title Management */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 tracking-wider flex items-center justify-between">
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
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-black"
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
                      className="h-8 px-2 text-xs text-gray-500 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700">
                    {selectedUser.role || 'No custom role assigned (Default: Member)'}
                  </div>
                )}
              </div>

              {/* Moderation Actions */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-gray-400 tracking-wider">
                  Moderation Controls
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleBlock(selectedUser)}
                    className={`w-full h-11 rounded-2xl text-xs font-bold justify-between px-4 ${
                      selectedUser.is_blocked
                        ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border-emerald-200'
                        : 'text-red-700 hover:text-red-900 hover:bg-red-50 border-red-200'
                    }`}
                  >
                    <span>{selectedUser.is_blocked ? 'Unblock User Account' : 'Block User from Platform'}</span>
                    {selectedUser.is_blocked ? <UserCheck size={16} /> : <UserX size={16} />}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleToggleAdmin(selectedUser)}
                    className="w-full h-11 rounded-2xl text-xs font-bold justify-between px-4 text-gray-700 hover:bg-gray-50 border-gray-200"
                  >
                    <span>{selectedUser.is_admin ? 'Revoke Administrator Access' : 'Promote to Administrator'}</span>
                    <ShieldCheck size={16} className={selectedUser.is_admin ? 'text-primary' : 'text-black'} />
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
