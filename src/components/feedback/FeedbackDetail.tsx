"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ChevronUp, ChevronLeft, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '../UserAvatar';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackDetailProps {
  slug: string;
}

export function FeedbackDetail({ slug }: FeedbackDetailProps) {
  const [request, setRequest] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  
  const { currentProfile } = useAuth();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      
      // 1. Fetch Request
      const { data: reqData } = await supabase
        .from('feedback_requests_with_stats')
        .select('*, author:profiles!feedback_requests_author_id_fkey(name, username, avatar_url)')
        .eq('slug', slug)
        .single();
        
      if (reqData && isMounted) {
        setRequest(reqData);
        
        // 2. Check if user voted
        if (currentProfile) {
          const { data: voteData } = await supabase
            .from('feedback_votes')
            .select('user_id')
            .eq('request_id', reqData.id)
            .eq('user_id', currentProfile.id)
            .single();
            
          if (voteData) setHasVoted(true);
        }
        
        // 3. Fetch Comments
        const { data: commentsData } = await supabase
          .from('feedback_comments')
          .select('*, author:profiles!feedback_comments_author_id_fkey(name, username, avatar_url, bg_color)')
          .eq('request_id', reqData.id)
          .order('created_at', { ascending: true });
          
        if (commentsData) setComments(commentsData);
      }
      if (isMounted) setIsLoading(false);
    }
    
    loadData();
    return () => { isMounted = false; };
  }, [slug, currentProfile]);

  const handleVote = async () => {
    if (!currentProfile || !request) return;
    
    // Optimistic UI
    const currentlyVoted = hasVoted;
    setHasVoted(!currentlyVoted);
    setRequest((prev: any) => ({
      ...prev,
      upvote_count: prev.upvote_count + (currentlyVoted ? -1 : 1)
    }));

    if (currentlyVoted) {
      await supabase.from('feedback_votes').delete().eq('request_id', request.id).eq('user_id', currentProfile.id);
    } else {
      await supabase.from('feedback_votes').insert({ request_id: request.id, user_id: currentProfile.id });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentProfile || !request) return;

    setIsSubmitting(true);
    const commentContent = newComment.trim();
    setNewComment('');

    const { data, error } = await supabase.from('feedback_comments').insert({
      request_id: request.id,
      author_id: currentProfile.id,
      content: commentContent
    }).select('*, author:profiles!feedback_comments_author_id_fkey(name, username, avatar_url, bg_color)').single();

    if (!error && data) {
      setComments(prev => [...prev, data]);
      setRequest((prev: any) => ({ ...prev, comment_count: prev.comment_count + 1 }));
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="py-20 text-center text-gray-500">Loading...</div>;
  if (!request) return <div className="py-20 text-center text-gray-500">Feedback request not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <Link href="/feedback" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-8 transition-colors">
        <ChevronLeft size={20} />
        Back to Board
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm mb-8">
        <div className="flex items-start gap-6">
          <button 
            onClick={handleVote}
            className={`shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-2xl border-2 transition-all ${
              hasVoted 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ChevronUp size={28} strokeWidth={3} className={hasVoted ? 'text-primary' : ''} />
            <span className="text-lg font-bold mt-1">{request.upvote_count || 0}</span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${
                request.status === 'Planned' ? 'bg-blue-50 text-blue-600' :
                request.status === 'In Progress' ? 'bg-purple-50 text-purple-600' :
                request.status === 'Completed' ? 'bg-green-50 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {request.status}
              </span>
              <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                {request.category}
              </span>
              {request.author && (
                <span className="text-sm font-medium text-gray-400">
                  by <span className="text-gray-600">{request.author.name}</span>
                </span>
              )}
              <span className="text-sm font-medium text-gray-400">
                {formatDistanceToNow(new Date(request.created_at))} ago
              </span>
            </div>

            <div className="prose prose-gray max-w-none mb-8 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {request.description}
            </div>
            
            {request.admin_notes && currentProfile?.is_admin && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">Admin Notes (Hidden)</h4>
                <p className="text-yellow-900 whitespace-pre-wrap">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-10 py-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-gray-400" />
            Comments <span className="text-gray-400 ml-1">({request.comment_count || 0})</span>
          </h3>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <UserAvatar avatarUrl={comment.author?.avatar_url} className="w-10 h-10" />
              <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">{comment.author?.name}</span>
                  <span className="text-xs font-medium text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at))} ago
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center text-gray-500 py-8">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>

        {currentProfile ? (
          <div className="p-6 sm:p-10 bg-gray-50 border-t border-gray-100">
            <form onSubmit={handleComment} className="flex gap-4">
              <UserAvatar avatarUrl={currentProfile.avatar_url} className="w-10 h-10" />
              <div className="flex-1 relative">
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 pr-14 font-medium text-gray-900 focus:outline-none focus:border-primary transition-all resize-none min-h-[50px] custom-scrollbar"
                  rows={2}
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-black transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6 sm:p-10 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-gray-500 mb-4">Log in to leave a comment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
