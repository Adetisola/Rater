/**
 * Notification Event Registry
 *
 * Single source of truth for all notification definitions, channel eligibility,
 * canonical copy, action labels, and target URLs.
 * Strictly adheres to the Rater Copy Dictionary.
 */

import type { NotificationEventType } from '@/types';
import type { NotificationEventDefinition } from './types';

export const NOTIFICATION_REGISTRY: Record<NotificationEventType, NotificationEventDefinition> = {
  // ─── 1. First Critique Received ─────────────────────────────────────────────
  FIRST_CRITIQUE_RECEIVED: {
    type: 'FIRST_CRITIQUE_RECEIVED',
    category: 'activity',
    priority: 'high',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ workTitle, postId, reviewId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      return {
        title: 'Someone critiqued your Work.',
        message: `Your first Critique is in. See what they noticed on ${titleClean}.`,
        pushTitle: 'First Critique on Rater',
        pushBody: `Your first Critique is in for ${titleClean}.`,
        actionLabel: 'View Critique',
        actionUrl: postId ? `/post/${postId}?tab=critique${reviewId ? `#review-${reviewId}` : ''}` : '/browse',
      };
    },
  },

  // ─── 2. Subsequent Critique Received ─────────────────────────────────────────
  CRITIQUE_RECEIVED: {
    type: 'CRITIQUE_RECEIVED',
    category: 'activity',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    preferenceKey: 'notify_critiques',
    renderCopy: ({ actorName, workTitle, postId, reviewId }) => {
      const reviewer = actorName?.trim() || 'A creative';
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      return {
        title: 'New Critique on your Work',
        message: `${reviewer} shared a critique on ${titleClean}.`,
        pushTitle: 'New Critique on Rater',
        pushBody: `${reviewer} left feedback on ${titleClean}.`,
        actionLabel: 'View Critique',
        actionUrl: postId ? `/post/${postId}?tab=critique${reviewId ? `#review-${reviewId}` : ''}` : '/browse',
      };
    },
  },

  // ─── 3. Overall Score Unlocked ───────────────────────────────────────────────
  WORK_RATING_UNLOCKED: {
    type: 'WORK_RATING_UNLOCKED',
    category: 'milestones',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      return {
        title: 'Your Work has a score.',
        message: `${titleClean} has received 3 Critiques. Your Overall Score and Criteria Scores are now unlocked.`,
        pushTitle: 'Overall Score Unlocked 🎉',
        pushBody: `${titleClean} has received 3 Critiques. Your Overall Score is live.`,
        emailSubject: `Your Work ${titleClean} has unlocked its Overall Score`,
        actionLabel: 'See Score',
        actionUrl: postId ? `/post/${postId}` : '/browse',
      };
    },
  },

  // ─── 4. Insights Ready ──────────────────────────────────────────────────────
  INSIGHTS_READY: {
    type: 'INSIGHTS_READY',
    category: 'insights',
    priority: 'high',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_insights',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'your Work';
      return {
        title: 'Insights ready',
        message: `Patterns and synthesis across community critiques are now available for ${titleClean}.`,
        pushTitle: 'Insights Ready',
        pushBody: `Discover what the studio observed in ${titleClean}.`,
        emailSubject: `New Insights ready for ${titleClean}`,
        actionLabel: 'Explore Insights',
        actionUrl: postId ? `/post/${postId}?tab=insights` : '/browse',
      };
    },
  },

  // ─── 5. Top Rated Badge Awarded ─────────────────────────────────────────────
  BADGE_TOP_RATED_AWARDED: {
    type: 'BADGE_TOP_RATED_AWARDED',
    category: 'milestones',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: true,
      email: true,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      return {
        title: 'Top Rated in the Studio 🏆',
        message: `${titleClean} has earned the Top Rated badge for exceptional community standing.`,
        pushTitle: 'Top Rated Badge Earned! 🏆',
        pushBody: `${titleClean} is now featured as Top Rated in the Studio.`,
        emailSubject: `Congratulations! ${titleClean} is now Top Rated on Rater`,
        actionLabel: 'Share Result',
        actionUrl: postId ? `/post/${postId}` : '/browse',
      };
    },
  },

  // ─── 6. First Work Published ────────────────────────────────────────────────
  FIRST_WORK_PUBLISHED: {
    type: 'FIRST_WORK_PUBLISHED',
    category: 'milestones',
    priority: 'normal',
    channels: {
      inApp: true,
      push: false,
      email: false,
    },
    preferenceKey: 'notify_milestones',
    renderCopy: ({ workTitle, postId }) => {
      const titleClean = workTitle ? `"${workTitle}"` : 'Your Work';
      return {
        title: 'Work published to the Studio',
        message: `${titleClean} is live. Community critiques and ratings will appear here.`,
        actionLabel: 'View Work',
        actionUrl: postId ? `/post/${postId}` : '/browse',
      };
    },
  },

  // ─── 7. Feedback Request Response ───────────────────────────────────────────
  FEEDBACK_REQUEST_REPLY: {
    type: 'FEEDBACK_REQUEST_REPLY',
    category: 'community',
    priority: 'normal',
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    renderCopy: ({ feedbackTitle, feedbackSlug }) => {
      const titleClean = feedbackTitle ? `"${feedbackTitle}"` : 'your idea';
      return {
        title: 'Update on your feedback',
        message: `The Rater team responded to your feedback on ${titleClean}.`,
        pushTitle: 'Feedback Update',
        pushBody: 'The Rater team responded to your feedback.',
        actionLabel: 'View Response',
        actionUrl: feedbackSlug ? `/feedback?item=${feedbackSlug}` : '/feedback',
      };
    },
  },

  // ─── 8. Account Suspended (System Bypass) ───────────────────────────────────
  ACCOUNT_SUSPENDED: {
    type: 'ACCOUNT_SUSPENDED',
    category: 'system',
    priority: 'urgent',
    channels: {
      inApp: true,
      push: false,
      email: true,
    },
    renderCopy: () => ({
      title: 'Account Suspended',
      message: 'Your profile has been suspended for community guideline violations.',
      emailSubject: 'Important notice regarding your Rater account',
      actionLabel: 'Contact Studio',
      actionUrl: 'mailto:hello@raterapp.site',
    }),
  },
};
