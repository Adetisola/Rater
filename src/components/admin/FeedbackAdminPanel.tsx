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
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  'UI',
  'Search',
  'Performance',
  'Profiles',
  'Mobile',
  'Accessibility',
  'General'
];

const STATUSES = [
  'Pending',
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Declined',
  'Resolved Duplicate'
];

export function FeedbackAdminPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit Form State
  const [editStatus, setEditStatus] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('feedback_requests_with_stats')
      .select('id, title, description, created_at, status, category, admin_notes, upvote_count, comment_count, is_pinned, is_locked')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setIsLoading(false);
  }

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setEditStatus(req.status || 'Pending');
    setEditCategory(req.category || 'General');
    setEditAdminNotes(req.admin_notes || '');
  };

  const handleSave = async (id: string) => {
    try {
      setIsSaving(true);
      const res = await updateFeedbackRequest(id, {
        status: editStatus,
        category: editCategory,
        admin_notes: editAdminNotes,
      });

      if (res.ok) {
        setRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, status: editStatus, category: editCategory, admin_notes: editAdminNotes } 
            : req
        ));
        setEditingId(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const willPin = !currentPin;
      await updateFeedbackRequest(id, { is_pinned: willPin });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, is_pinned: willPin } : r));
    } catch (err: any) {
      alert(err?.message || 'Failed to pin/unpin');
    }
  };

  const handleToggleLock = async (id: string, currentLock: boolean) => {
    try {
      const willLock = !currentLock;
      await updateFeedbackRequest(id, { is_locked: willLock });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, is_locked: willLock } : r));
    } catch (err: any) {
      alert(err?.message || 'Failed to lock/unlock');
    }
  };

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Feedback Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review community ideas, adjust statuses, and manage internal product notes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <Button
            variant="outline"
            onClick={fetchRequests}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-white"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Title & Context</th>
                <th className="px-6 py-4 w-36">Status</th>
                <th className="px-6 py-4 w-32">Category</th>
                <th className="px-6 py-4 w-28 text-center">Community</th>
                <th className="px-6 py-4 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-gray-300" />
                    Loading feedback submissions...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500 text-sm">
                    No feedback matches the search criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        {req.is_pinned && (
                          <span title="Pinned to top" className="text-primary mt-1">
                            <Pin size={13} className="fill-primary" />
                          </span>
                        )}
                        {req.is_locked && (
                          <span title="Locked thread" className="text-gray-400 mt-1">
                            <Lock size={13} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 line-clamp-1">{req.title}</div>
                          <div className="text-gray-500 line-clamp-1 text-xs mt-0.5">{req.description}</div>
                          <div className="text-[11px] text-gray-400 mt-1 font-medium">
                            {format(new Date(req.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {editingId === req.id ? (
                      <td className="px-6 py-4" colSpan={3}>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                              <select 
                                value={editStatus} 
                                onChange={e => setEditStatus(e.target.value)} 
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-black"
                              >
                                {STATUSES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                              <select 
                                value={editCategory} 
                                onChange={e => setEditCategory(e.target.value)} 
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-black"
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Admin Notes</label>
                            <textarea 
                              value={editAdminNotes} 
                              onChange={e => setEditAdminNotes(e.target.value)} 
                              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white h-24 resize-none focus:outline-none focus:border-black"
                              placeholder="Internal administrative notes (not visible to public users)"
                            />
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            req.status === 'Planned' ? 'bg-blue-50 text-blue-700' :
                            req.status === 'In Progress' ? 'bg-purple-50 text-purple-700' :
                            req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                            req.status === 'Declined' ? 'bg-red-50 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {req.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {req.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3 text-xs text-gray-600 font-bold">
                            <span className="inline-flex items-center gap-1">
                              <ThumbsUp size={12} className="text-primary" />
                              {req.upvote_count || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              <MessageSquare size={12} />
                              {req.comment_count || 0}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    
                    <td className="px-6 py-4 text-right">
                      {editingId === req.id ? (
                        <div className="flex flex-col gap-2 justify-end">
                          <Button 
                            variant="primary" 
                            onClick={() => handleSave(req.id)} 
                            disabled={isSaving}
                            className="px-3 py-1.5 h-8 text-xs font-bold rounded-xl"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => setEditingId(null)} 
                            className="px-3 py-1.5 h-8 text-xs font-semibold rounded-xl text-gray-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            onClick={() => handleTogglePin(req.id, Boolean(req.is_pinned))}
                            className={`h-8 w-8 p-0 rounded-xl ${req.is_pinned ? 'text-primary border-primary/30' : 'text-gray-400'}`}
                            title={req.is_pinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={13} className={req.is_pinned ? 'fill-primary' : ''} />
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleToggleLock(req.id, Boolean(req.is_locked))}
                            className={`h-8 w-8 p-0 rounded-xl ${req.is_locked ? 'text-amber-600 border-amber-200' : 'text-gray-400'}`}
                            title={req.is_locked ? 'Unlock comments' : 'Lock comments'}
                          >
                            <Lock size={13} />
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleEdit(req)} 
                            className="h-8 px-3 text-xs font-bold rounded-xl inline-flex items-center gap-1"
                          >
                            <Edit2 size={12} />
                            Edit
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
