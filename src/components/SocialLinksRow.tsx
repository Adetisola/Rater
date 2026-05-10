"use client";

/**
 * SocialLinksRow — renders the social icon row below the bio.
 * - VIEW mode: clickable icons that open links in new tabs, with tooltip on hover.
 * - EDIT mode: icons with dropdown (Edit / Remove), plus inline link suggestions.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { SOCIAL_ICON_MAP } from './SocialIcons';
import {
  detectFirstEligibleLink,
  removeUrlFromBio,
  detectPlatform,
  extractUsername,
  extractUrls,
  PLATFORM_META,
  type SocialLink,
  type SocialPlatform,
} from '../logic/socialLinksUtils';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Edit2, Trash2, X, Check, AlertCircle, Mail } from 'lucide-react';

// ─── Types ───
interface SocialLinksRowProps {
  /** Current social_links array from avatar */
  links: SocialLink[];
  /** Optional public email to display at the end of the row */
  email?: string;
  /** Whether the profile is in edit mode */
  isEditing: boolean;
  /** Current bio text (for link detection during editing) */
  bioText: string;
  /** Callback to update social_links on the avatar */
  onLinksChange: (links: SocialLink[]) => void;
  /** Callback to update the bio text (e.g. after removing a URL) */
  onBioChange: (bio: string) => void;
}

// ─── Suggestion Bar ───
function LinkSuggestion({
  platform,
  existingLinks,
  onConvert,
  onDismiss,
}: {
  url: string;
  platform: SocialPlatform;
  username?: string;
  existingLinks: SocialLink[];
  onConvert: () => void;
  onDismiss: () => void;
}) {
  const meta = PLATFORM_META[platform];
  const isDuplicate = existingLinks.some(l => l.type === platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 mt-2 py-1.5 px-3 rounded-full bg-gray-50 border border-gray-100 text-xs w-fit"
    >
      {isDuplicate ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-gray-500">
            You already added a <strong className="text-gray-700">{meta.label}</strong> link
          </span>
          <button
            onClick={onDismiss}
            className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="text-gray-500">
            Convert to <strong style={{ color: meta.color }}>{meta.label}</strong> link?
          </span>
          <button
            onClick={onConvert}
            className="px-2.5 py-0.5 rounded-full bg-[#111111] text-white font-medium hover:bg-[#333333] transition-colors"
          >
            Convert
          </button>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </motion.div>
  );
}

// ─── Single Social Icon (view mode) ───
function SocialIconView({ link }: { link: SocialLink }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = SOCIAL_ICON_MAP[link.type];

  return (
    <div className="relative">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-gray-50 transition-all group"
        title={link.url}
      >
        <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
        {link.username && (
          <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium transition-colors">
            {link.username}
          </span>
        )}
      </a>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-lg bg-[#111111] text-white text-[10px] whitespace-nowrap z-50 pointer-events-none shadow-lg"
          >
            {link.url}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#111111]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single Social Icon (edit mode) ───
function SocialIconEdit({
  link,
  onEdit,
  onRemove,
}: {
  link: SocialLink;
  onEdit: (url: string) => void;
  onRemove: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editUrl, setEditUrl] = useState(link.url);
  const [editError, setEditError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = SOCIAL_ICON_MAP[link.type];
  const meta = PLATFORM_META[link.type];

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsEditingUrl(false);
        setEditError('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  useEffect(() => {
    if (isEditingUrl) inputRef.current?.focus();
  }, [isEditingUrl]);

  const handleSaveEdit = () => {
    const trimmed = editUrl.trim();
    if (!trimmed) {
      setEditError('Enter a URL');
      return;
    }
    // Normalize
    let normalized = trimmed;
    if (normalized.startsWith('www.')) normalized = 'https://' + normalized;
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;

    // Re-validate: detect new platform
    const newPlatform = detectPlatform(normalized);
    if (!newPlatform) {
      // Unsupported: pass back to parent to move to bio as plain text
      onEdit('__unsupported__' + normalized);
      setShowDropdown(false);
      setIsEditingUrl(false);
      return;
    }

    onEdit(normalized);
    setShowDropdown(false);
    setIsEditingUrl(false);
    setEditError('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all group",
          showDropdown ? "bg-gray-100" : "hover:bg-gray-50"
        )}
      >
        <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 transition-colors" />
        {link.username && (
          <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium transition-colors">
            {link.username}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 min-w-[200px] overflow-hidden"
          >
            {!isEditingUrl ? (
              <>
                <button
                  onClick={() => { setIsEditingUrl(true); setEditUrl(link.url); }}
                  className="w-full px-4 py-3 flex items-center gap-2.5 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit link
                </button>
                <button
                  onClick={() => { onRemove(); setShowDropdown(false); }}
                  className="w-full px-4 py-3 flex items-center gap-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </>
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Edit {meta.label} link</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={editUrl}
                  onChange={e => { setEditUrl(e.target.value); setEditError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setIsEditingUrl(false); setEditError(''); } }}
                  className={cn(
                    "w-full text-sm px-3 py-2 rounded-lg border bg-gray-50 outline-none transition-all focus:bg-white focus:border-gray-300",
                    editError ? "border-red-300 bg-red-50/50" : "border-gray-200"
                  )}
                  placeholder="https://..."
                />
                {editError && <p className="text-[11px] text-red-500">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-1.5 rounded-full bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => { setIsEditingUrl(false); setEditError(''); }}
                    className="px-3 py-1.5 rounded-full text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───
export function SocialLinksRow({
  links,
  email,
  isEditing,
  bioText,
  onLinksChange,
  onBioChange,
}: SocialLinksRowProps) {
  const [suggestion, setSuggestion] = useState<{
    url: string;
    rawUrl: string;
    platform: SocialPlatform;
    username?: string;
  } | null>(null);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced link detection when bio text changes during editing
  useEffect(() => {
    if (!isEditing) {
      setSuggestion(null);
      setDismissedUrls(prev => prev.size === 0 ? prev : new Set());
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const eligible = detectFirstEligibleLink(bioText, links);
      if (eligible && !dismissedUrls.has(eligible.url)) {
        setSuggestion(eligible);
      } else {
        // Check if there's a duplicate to warn about
        const urls: string[] = extractUrls(bioText);
        const existingTypes = new Set(links.map(l => l.type));
        for (const rawUrl of urls) {
          let normalized = rawUrl.trim();
          if (normalized.startsWith('www.')) normalized = 'https://' + normalized;
          normalized = normalized.replace(/[.,;:!?)]+$/, '');
          const platform = detectPlatform(normalized);
          if (platform && existingTypes.has(platform) && !dismissedUrls.has(normalized)) {
            setSuggestion({ url: normalized, rawUrl: normalized, platform });
            return;
          }
        }
        setSuggestion(null);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [bioText, isEditing, links, dismissedUrls]);

  const handleConvert = useCallback(() => {
    if (!suggestion) return;
    const { url, rawUrl, platform, username } = suggestion;

    // Add to links
    const newLink: SocialLink = { type: platform, url, username };
    onLinksChange([...links, newLink]);

    // Remove URL from bio
    const cleanBio = removeUrlFromBio(bioText, rawUrl);
    onBioChange(cleanBio);

    setSuggestion(null);
  }, [suggestion, links, bioText, onLinksChange, onBioChange]);

  const handleDismiss = useCallback(() => {
    if (!suggestion) return;
    setDismissedUrls(prev => new Set(prev).add(suggestion.url));
    setSuggestion(null);
  }, [suggestion]);

  const handleRemoveLink = useCallback((index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onLinksChange(updated);
  }, [links, onLinksChange]);

  const handleEditLink = useCallback((index: number, newUrl: string) => {
    // If unsupported, move back to bio
    if (newUrl.startsWith('__unsupported__')) {
      const realUrl = newUrl.replace('__unsupported__', '');
      const updated = links.filter((_, i) => i !== index);
      onLinksChange(updated);
      // Append to bio
      onBioChange(bioText ? bioText + '\n' + realUrl : realUrl);
      return;
    }

    const platform = detectPlatform(newUrl);
    if (!platform) return;

    const username = extractUsername(newUrl, platform);

    // Check for duplicate (different index, same type)
    const duplicate = links.findIndex((l, i) => i !== index && l.type === platform);
    if (duplicate !== -1) {
      // Replace the duplicate
      const updated = links.filter((_, i) => i !== duplicate);
      updated[index > duplicate ? index - 1 : index] = { type: platform, url: newUrl, username };
      onLinksChange(updated);
    } else {
      const updated = [...links];
      updated[index] = { type: platform, url: newUrl, username };
      onLinksChange(updated);
    }
  }, [links, bioText, onLinksChange, onBioChange]);

  if (links.length === 0 && !suggestion && (!email || isEditing)) return null;

  return (
    <div className="mt-2 flex flex-col items-center md:items-start">
      {/* Icon Row */}
      {(links.length > 0 || (!isEditing && email)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-center md:justify-start gap-0.5"
        >
          {links.map((link, i) =>
            isEditing ? (
              <SocialIconEdit
                key={`${link.type}-${i}`}
                link={link}
                onEdit={(url) => handleEditLink(i, url)}
                onRemove={() => handleRemoveLink(i)}
              />
            ) : (
              <SocialIconView key={`${link.type}-${i}`} link={link} />
            )
          )}
          {!isEditing && email && (
            <div className="relative group/email">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-gray-50 transition-all"
                title={email}
              >
                <Mail className="w-3.5 h-3.5 text-gray-400 group-hover/email:text-[#FEC312] transition-colors" />
                <span className="text-xs text-gray-500 group-hover/email:text-gray-700 font-medium transition-colors">
                  Contact
                </span>
              </a>
            </div>
          )}
        </motion.div>
      )}

      {/* Inline Suggestion */}
      <AnimatePresence>
        {isEditing && suggestion && (
          <LinkSuggestion
            url={suggestion.url}
            platform={suggestion.platform}
            username={suggestion.username}
            existingLinks={links}
            onConvert={handleConvert}
            onDismiss={handleDismiss}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
