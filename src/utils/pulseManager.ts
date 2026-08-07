"use client";

/**
 * Pulse Session Manager
 *
 * Handles localStorage persistence for Pulse feedback sessions.
 * Each post can only have ONE Pulse session (active or expired).
 * Sessions, votes, and expiration states survive page reloads.
 *
 * TODO(backend): Replace localStorage operations with Supabase
 * queries when the backend is integrated.
 */

import type { PulseSession, PulseVote, PulseType, PulseDuration } from '@/types';
import { PULSE_DURATION_MS } from '@/types';

// Simple local ID generator just for anonymous Pulse voting
function getPulseUserId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let uid = localStorage.getItem('rater_pulse_uid');
  if (!uid) {
    uid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('rater_pulse_uid', uid);
  }
  return uid;
}

const PULSE_STORAGE_KEY = 'rater_pulse_sessions';

// ─── Read / Write Helpers ─────────────────────────────────────────────────────

function getAllSessions(): Record<string, PulseSession> {
  try {
    const raw = localStorage.getItem(PULSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllSessions(sessions: Record<string, PulseSession>): void {
  localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(sessions));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the Pulse session for a given post (active or expired).
 * Returns null if no session has ever been created for this post.
 */
export function getPulseSession(postId: string): PulseSession | null {
  const sessions = getAllSessions();
  return sessions[postId] ?? null;
}

/**
 * Check if a Pulse session is currently active (not expired).
 */
export function isPulseActive(session: PulseSession): boolean {
  return new Date(session.expires_at).getTime() > Date.now();
}

/**
 * Check if the current user/device has already voted in a Pulse session.
 */
export function hasVotedInPulse(session: PulseSession, avatarId?: string): boolean {
  const deviceId = getPulseUserId();
  return session.votes.some(v =>
    (avatarId && v.voter_id === avatarId) ||
    v.device_id === deviceId
  );
}

/**
 * Create a new Pulse session for a post.
 * Enforces the one-session-per-post rule.
 */
export function createPulseSession(
  postId: string,
  creatorId: string,
  question: string,
  pulseType: PulseType,
  duration: PulseDuration,
  options?: string[],
  allowMultipleSelections?: boolean,
  sliderConfig?: { min: number; max: number; step: number }
): PulseSession {
  const sessions = getAllSessions();

  // Enforce: only one Pulse per post
  if (sessions[postId]) {
    throw new Error('A Pulse session already exists for this post.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PULSE_DURATION_MS[duration]);

  const session: PulseSession = {
    id: `pulse_${postId}_${Date.now()}`,
    post_id: postId,
    creator_id: creatorId,
    question,
    pulse_type: pulseType,
    duration,
    options: pulseType !== 'slider' ? options : undefined,
    allow_multiple_selections: pulseType === 'choice' ? allowMultipleSelections : undefined,
    slider_min: pulseType === 'slider' ? (sliderConfig?.min ?? 1) : undefined,
    slider_max: pulseType === 'slider' ? (sliderConfig?.max ?? 10) : undefined,
    slider_step: pulseType === 'slider' ? (sliderConfig?.step ?? 1) : undefined,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    votes: [],
  };

  sessions[postId] = session;
  saveAllSessions(sessions);
  return session;
}

/**
 * Cast a vote in an active Pulse session.
 * Enforces single-vote-per-device/user and active session check.
 */
export function voteInPulse(
  postId: string,
  choice: string | number | string[],
  avatarId?: string
): PulseSession | null {
  const sessions = getAllSessions();
  const session = sessions[postId];

  if (!session) return null;
  if (!isPulseActive(session)) return null;
  if (hasVotedInPulse(session, avatarId)) return null;

  const vote: PulseVote = {
    choice,
    voter_id: avatarId,
    device_id: getPulseUserId(),
    voted_at: new Date().toISOString(),
  };

  session.votes.push(vote);
  sessions[postId] = session;
  saveAllSessions(sessions);
  return session;
}

/**
 * Calculate vote distribution for a Pulse session.
 * Returns a map of choice → { count, percentage }.
 */
export function getPulseResults(session: PulseSession): Record<string, { count: number; percentage: number }> {
  const totalVotes = session.votes.length;
  const results: Record<string, { count: number; percentage: number }> = {};

  if (session.pulse_type === 'slider') {
    // For slider, group into ranges or just return raw vote count
    // For V1: return individual value counts
    session.votes.forEach(v => {
      const key = String(v.choice);
      if (!results[key]) results[key] = { count: 0, percentage: 0 };
      results[key].count++;
    });
  } else {
    // Choice (single or multiple)
    const options = session.options || [];
    options.forEach(opt => {
      results[opt] = { count: 0, percentage: 0 };
    });
    session.votes.forEach(v => {
      if (Array.isArray(v.choice)) {
        v.choice.forEach(c => {
          const key = String(c);
          if (!results[key]) results[key] = { count: 0, percentage: 0 };
          results[key].count++;
        });
      } else {
        const key = String(v.choice);
        if (!results[key]) results[key] = { count: 0, percentage: 0 };
        results[key].count++;
      }
    });
  }

  // Calculate percentages
  Object.keys(results).forEach(key => {
    results[key].percentage = totalVotes > 0
      ? Math.round((results[key].count / totalVotes) * 100)
      : 0;
  });

  return results;
}

/**
 * Calculate the average value for a slider-type Pulse session.
 */
export function getPulseSliderAverage(session: PulseSession): number {
  if (session.pulse_type !== 'slider' || session.votes.length === 0) return 0;
  const total = session.votes.reduce((sum, v) => sum + Number(v.choice), 0);
  return Math.round((total / session.votes.length) * 10) / 10;
}

/**
 * Get remaining time for an active Pulse session as a formatted string.
 */
export function getPulseTimeRemaining(session: PulseSession): string {
  const remaining = new Date(session.expires_at).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
