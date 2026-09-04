"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabase/client';

interface FeedbackFormProps {
  onClose: () => void;
}

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Feature Request');
  const [category, setCategory] = useState('UI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarRequests, setSimilarRequests] = useState<any[]>([]);

  const debouncedTitle = useDebounce(title, 300);

  // Live duplicate detection
  useEffect(() => {
    async function searchDuplicates() {
      if (debouncedTitle.trim().length < 3) {
        setSimilarRequests([]);
        return;
      }

      // Using full text search against the view
      const query = debouncedTitle.trim().split(' ').map((term: string) => `'${term}'`).join(' | ');

      const { data, error } = await supabase
        .from('feedback_requests_with_stats')
        .select('id, title, upvote_count')
        .textSearch('fts', query)
        .limit(3);

      if (!error && data) {
        setSimilarRequests(data);
      }
    }

    searchDuplicates();
  }, [debouncedTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    
    // In actual implementation, we will use the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("You must be logged in to submit feedback.");
      setIsSubmitting(false);
      return;
    }

    // Generate a simple slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const { error } = await supabase.from('feedback_requests').insert({
      title,
      description,
      type,
      category,
      slug,
      author_id: session.user.id
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      alert("Failed to submit feedback.");
    } else {
      onClose();
      // Optionally trigger a refresh
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-surface-elevated rounded-[32px] border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-border-default flex items-center justify-between sticky top-0 bg-surface-elevated z-10">
          <h2 className="text-xl font-bold text-text-primary">New Feedback</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-primary hover:bg-surface-hover border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <form id="feedback-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-medium text-text-primary focus:outline-none focus:border-primary transition-all"
                >
                  <option className="bg-surface-elevated text-text-primary">Feature Request</option>
                  <option className="bg-surface-elevated text-text-primary">Bug Report</option>
                  <option className="bg-surface-elevated text-text-primary">General Feedback</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-medium text-text-primary focus:outline-none focus:border-primary transition-all"
                >
                  {['UI', 'Search', 'Performance', 'Profiles', 'Reviews', 'Mobile', 'Accessibility', 'Notifications'].map(cat => (
                    <option key={cat} className="bg-surface-elevated text-text-primary">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title with Duplicate Detection */}
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-text-secondary">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short, descriptive title"
                className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-medium text-text-primary placeholder:text-input-placeholder focus:outline-none focus:border-primary transition-all"
                required
              />
              
              {/* Duplicate Detection Dropdown */}
              <AnimatePresence>
                {similarRequests.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 bg-primary/10 border border-primary/30 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-text-primary mb-2">Did you mean...</p>
                        <div className="space-y-2">
                          {similarRequests.map(req => (
                            <button 
                              key={req.id}
                              type="button"
                              className="w-full flex items-center justify-between text-left px-3 py-2 bg-surface-primary rounded-lg hover:bg-surface-hover border border-border-default transition-colors group"
                            >
                              <span className="flex items-center gap-2 text-sm font-medium text-text-primary group-hover:text-primary">
                                <CheckCircle2 className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                {req.title}
                              </span>
                              <span className="text-xs font-bold text-text-muted bg-surface-interactive px-2 py-1 rounded-md group-hover:text-text-primary transition-colors">
                                {req.upvote_count || 0} votes
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-text-secondary mt-3 font-medium">If your idea is already listed, upvote it instead of creating a new one!</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide details, use cases, or steps to reproduce..."
                rows={5}
                className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-medium text-text-primary placeholder:text-input-placeholder focus:outline-none focus:border-primary transition-all resize-none custom-scrollbar"
                required
              />
            </div>
            
          </form>
        </div>

        <div className="px-6 py-5 border-t border-border-default bg-surface-subtle flex justify-end gap-3 sticky bottom-0 z-10">
          <Button variant="outline" onClick={onClose} type="button" className="bg-surface-primary border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary">Cancel</Button>
          <Button variant="primary" type="submit" form="feedback-form" disabled={isSubmitting || !title.trim() || !description.trim()} className="text-black">
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
