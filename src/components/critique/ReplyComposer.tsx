"use client";

import { useState, useRef, useCallback, useMemo } from 'react';
import { X, CornerDownRight } from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { AuthOverlay } from '@/components/AuthOverlay';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/Button';
import { ProfileCache } from '@/lib/profiles';
import type { Avatar } from '@/types';

interface ParticipantInfo {
  id?: string;
  username: string;
  name: string;
  avatar_url?: string | null;
}

interface ReplyComposerProps {
  critiqueId?: string;
  replyingTo?: { username: string; name?: string; replyId?: string } | null;
  onClearReplyingTo: () => void;
  onSubmitReply: (content: string, parentReplyId?: string) => Promise<void>;
  isSubmitting: boolean;
  participants?: ParticipantInfo[];
  placeholder?: string;
}

export function ReplyComposer({
  replyingTo,
  onClearReplyingTo,
  onSubmitReply,
  isSubmitting,
  participants = [],
  placeholder = "Write a reply...",
}: ReplyComposerProps) {
  const { currentProfile } = useAuthState();
  const [content, setContent] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number>(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Adjust textarea height on change
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, []);

  // Filter mention suggestions
  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();

    // 1. Gather distinct candidates from participants and global ProfileCache
    const candidatesMap = new Map<string, ParticipantInfo>();

    participants.forEach((p) => {
      if (p.username && p.id !== currentProfile?.id) {
        candidatesMap.set(p.username.toLowerCase(), p);
      }
    });

    const cachedProfiles = ProfileCache.getAll();
    cachedProfiles.forEach((p: Avatar) => {
      if (p.username && p.id !== currentProfile?.id && !candidatesMap.has(p.username.toLowerCase())) {
        candidatesMap.set(p.username.toLowerCase(), {
          id: p.id,
          username: p.username,
          name: p.name,
          avatar_url: p.avatar_url,
        });
      }
    });

    const allCandidates = Array.from(candidatesMap.values());

    if (!q) {
      return allCandidates.slice(0, 5);
    }

    return allCandidates
      .filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [mentionQuery, participants, currentProfile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    adjustHeight();

    // Detect if cursor is immediately after an @token
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/(?:^|\s)@([a-z0-9_.]*)$/i);

    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1]);
      setMentionCursorIndex(cursorPos - lastAtMatch[1].length - 1);
      setSelectedSuggestionIndex(0);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (candidateUsername: string) => {
    const textBeforeMention = content.slice(0, mentionCursorIndex);
    const textAfterCursor = content.slice(textareaRef.current?.selectionStart || mentionCursorIndex);
    const prefix = mentionCursorIndex > 0 && !textBeforeMention.endsWith(' ') ? ' ' : '';
    const newText = `${textBeforeMention}${prefix}@${candidateUsername} ${textAfterCursor}`;

    setContent(newText);
    setShowSuggestions(false);
    setMentionQuery(null);

    // Refocus textarea and place cursor after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = mentionCursorIndex + prefix.length + candidateUsername.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        adjustHeight();
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const candidate = suggestions[selectedSuggestionIndex];
        if (candidate) {
          handleSelectMention(candidate.username);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!currentProfile) {
      setIsAuthOpen(true);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    try {
      await onSubmitReply(trimmed, replyingTo?.replyId);
      setContent('');
      onClearReplyingTo();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Error handled by caller
    }
  };

  return (
    <div className="w-full mt-3">
      {/* Replying-to Target Chip */}
      {replyingTo && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5 px-1 animate-in fade-in duration-150">
          <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Replying to <span className="text-black font-semibold">@{replyingTo.username}</span>
          </span>
          <button
            type="button"
            onClick={onClearReplyingTo}
            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors ml-1 focus:outline-none"
            title="Cancel reply targeting"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Composer Input Box */}
      <div className="relative bg-gray-50/80 border border-gray-200 focus-within:border-primary/60 focus-within:bg-white rounded-2xl transition-all duration-200 p-2.5 sm:p-3">
        {/* Autocomplete Suggestions Popover */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-48 overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
              People
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={item.username}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectMention(item.username);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm transition-colors ${
                  idx === selectedSuggestionIndex ? 'bg-primary/10 text-black font-medium' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <UserAvatar avatarUrl={item.avatar_url} size="xs" className="w-5 h-5" />
                <span className="truncate font-medium text-black">{item.name}</span>
                <span className="text-xs text-gray-400 font-normal truncate">@{item.username}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <div className="shrink-0 mt-0.5">
            <UserAvatar
              avatarUrl={currentProfile?.avatar_url}
              size="xs"
              className="w-6 h-6"
              iconClassName="w-3/4 h-3/4"
            />
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              placeholder={currentProfile ? placeholder : "Sign in to reply..."}
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm text-black placeholder:text-gray-400 resize-none focus:outline-none leading-relaxed py-0.5"
            />
          </div>

          <div className="shrink-0 flex items-center gap-1.5 self-end">
            {content.length > 800 && (
              <span className={`text-[11px] font-medium ${content.length >= 1000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {1000 - content.length}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="h-8 px-3.5 rounded-full text-xs gap-1.5 focus:outline-none"
              title="Reply (Cmd+Enter)"
            >
              <span>Reply</span>
            </Button>
          </div>
        </div>
      </div>

      {isAuthOpen && (
        <AuthOverlay
          onClose={() => setIsAuthOpen(false)}
          initialTab="login"
          redirectOnSuccess={false}
        />
      )}
    </div>
  );
}
