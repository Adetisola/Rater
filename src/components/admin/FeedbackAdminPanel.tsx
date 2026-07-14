"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Search, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FeedbackAdminPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
      .select('*')
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
    const { error } = await supabase
      .from('feedback_requests')
      .update({
        status: editStatus,
        category: editCategory,
        admin_notes: editAdminNotes
      })
      .eq('id', id);

    if (!error) {
      setRequests(prev => prev.map(req => 
        req.id === id 
          ? { ...req, status: editStatus, category: editCategory, admin_notes: editAdminNotes } 
          : req
      ));
      setEditingId(null);
    } else {
      alert('Failed to update request');
    }
  };

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-500 mt-1">Review, categorize, and update product feedback.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 w-32">Status</th>
                <th className="px-6 py-4 w-32">Category</th>
                <th className="px-6 py-4 w-24 text-center">Votes</th>
                <th className="px-6 py-4 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 mb-1 line-clamp-1">{req.title}</div>
                    <div className="text-gray-500 line-clamp-1 text-xs">{req.description}</div>
                    <div className="text-xs text-gray-400 mt-2 font-medium">
                      {format(new Date(req.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  
                  {editingId === req.id ? (
                    <td className="px-6 py-4" colSpan={3}>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                              <option>Pending</option>
                              <option>Under Review</option>
                              <option>Planned</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                              <option>Declined</option>
                              <option>Resolved Duplicate</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                              <option>UI</option>
                              <option>Search</option>
                              <option>Performance</option>
                              <option>Profiles</option>
                              <option>Mobile</option>
                              <option>Accessibility</option>
                              <option>General</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Admin Notes</label>
                          <textarea 
                            value={editAdminNotes} 
                            onChange={e => setEditAdminNotes(e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white h-24 resize-none"
                            placeholder="Internal notes (not visible to regular users)"
                          />
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          req.status === 'Planned' ? 'bg-blue-50 text-blue-700' :
                          req.status === 'In Progress' ? 'bg-purple-50 text-purple-700' :
                          req.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          req.status === 'Declined' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-medium">{req.category}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-gray-900">{req.upvote_count || 0}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">votes</div>
                      </td>
                    </>
                  )}
                  
                  <td className="px-6 py-4 text-right">
                    {editingId === req.id ? (
                      <div className="flex flex-col gap-2 justify-end">
                        <Button variant="primary" onClick={() => handleSave(req.id)} className="px-3 py-1.5 h-8 text-xs">Save</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)} className="px-3 py-1.5 h-8 text-xs">Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => handleEdit(req)} className="px-3 py-1.5 h-8 text-xs inline-flex items-center gap-1.5 hover:bg-gray-50">
                        <Edit size={12} />
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!isLoading && filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">No feedback matches your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
