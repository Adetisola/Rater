"use client";

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Plus, MessageSquare, ChevronUp } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';
import { useFeedback } from '@/hooks/useFeedback';
import Link from 'next/link';

export function FeedbackBoard() {
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('Most Upvoted');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { feedback, isLoading } = useFeedback(sortBy, activeTab);

  const tabs = ['All', 'Feature Requests', 'Bug Reports', 'General Feedback'];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Column - List */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="hidden sm:block bg-gray-50 border-2 border-gray-100 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-primary"
          >
            <option>Most Upvoted</option>
            <option>Trending</option>
            <option>Newest</option>
            <option>Recently Active</option>
          </select>
        </div>
        
        <div className="bg-white rounded-[32px] border border-gray-100 p-2 sm:p-4 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 animate-pulse">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading feedback...</p>
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No feedback found</h3>
              <p className="text-gray-500 mb-6">Be the first to share your thoughts in this category!</p>
              <Button variant="primary" onClick={() => setIsFormOpen(true)}>Create Request</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {feedback.map(item => (
                <Link 
                  href={`/feedback/${item.slug}`} 
                  key={item.id}
                  className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <button 
                    className={`shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-xl border-2 transition-all ${
                      false /* hasVoted */ 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={(e) => { e.preventDefault(); /* toggleVote(item.id) */ }}
                  >
                    <ChevronUp size={20} strokeWidth={3} className={false ? 'text-primary' : ''} />
                    <span className="text-sm font-bold mt-1">{item.upvote_count || 0}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                        item.status === 'Planned' ? 'bg-blue-50 text-blue-600' :
                        item.status === 'In Progress' ? 'bg-purple-50 text-purple-600' :
                        item.status === 'Completed' ? 'bg-green-50 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-400 ml-auto group-hover:text-gray-500">
                        <MessageSquare size={14} />
                        {item.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Controls & Stats */}
      <div className="w-full md:w-[320px] shrink-0">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sticky top-[100px]">
          <h3 className="font-bold text-gray-900 mb-2">Have an idea?</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">Let us know what we should build next, or report an issue you've found.</p>
          
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2 rounded-xl py-6 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={20} />
            New Request
          </Button>
          
          <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Statuses</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSortBy('Planned')}>
                <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Planned</span>
                <span className="font-bold text-gray-400">...</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSortBy('In Progress')}>
                <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2 h-2 rounded-full bg-purple-500"></span> In Progress</span>
                <span className="font-bold text-gray-400">...</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSortBy('Completed')}>
                <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2 h-2 rounded-full bg-green-500"></span> Completed</span>
                <span className="font-bold text-gray-400">...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <FeedbackForm onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
