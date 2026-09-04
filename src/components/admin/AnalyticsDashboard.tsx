"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Star, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  Share2, 
  HelpCircle, 
  UserPlus, 
  ArrowRight, 
  Megaphone, 
  Percent, 
  Timer, 
  BarChart2,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  getAnalyticsPlatformOverview,
  getActivationMetrics,
  getCoreLoopMetrics,
  getRatingLiquidityMetrics,
  getGrowthLoopCohort,
  getAcquisitionBreakdown,
  getRetentionMetrics,
  getCampaignBreakdown,
  getSharingMetrics,
  getSearchIntelligenceAnalytics
} from '@/lib/admin/server';
import type { 
  AnalyticsPlatformOverview,
  ActivationMetrics,
  CoreLoopMetrics,
  RatingLiquidityMetrics,
  GrowthLoopCohortData,
  AcquisitionBreakdownData,
  RetentionMetrics,
  CampaignBreakdownRow,
  SharingMetrics,
  SearchIntelligenceMetrics,
  TrendMetric,
  AnalyticsDateRange
} from '@/types';
import { formatDistanceToNow } from 'date-fns';

type DatePreset = '7d' | '30d' | '90d' | 'all';

export function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Analytics states
  const [overview, setOverview] = useState<AnalyticsPlatformOverview | null>(null);
  const [activation, setActivation] = useState<ActivationMetrics | null>(null);
  const [coreLoop, setCoreLoop] = useState<CoreLoopMetrics | null>(null);
  const [liquidity, setLiquidity] = useState<RatingLiquidityMetrics | null>(null);
  const [cohort, setCohort] = useState<GrowthLoopCohortData | null>(null);
  const [acquisition, setAcquisition] = useState<AcquisitionBreakdownData | null>(null);
  const [retention, setRetention] = useState<RetentionMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignBreakdownRow[]>([]);
  const [sharing, setSharing] = useState<SharingMetrics | null>(null);
  const [searchSummary, setSearchSummary] = useState<SearchIntelligenceMetrics | null>(null);

  const getDateRangeFromPreset = useCallback((p: DatePreset): AnalyticsDateRange | undefined => {
    if (p === 'all') return undefined;
    const now = new Date();
    const days = p === '7d' ? 7 : p === '30d' ? 30 : 90;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  }, []);

  const loadAllAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const range = getDateRangeFromPreset(preset);

      const [
        overviewRes,
        activationRes,
        coreLoopRes,
        liquidityRes,
        cohortRes,
        acquisitionRes,
        retentionRes,
        campaignsRes,
        sharingRes,
        searchRes,
      ] = await Promise.all([
        getAnalyticsPlatformOverview(),
        getActivationMetrics(range),
        getCoreLoopMetrics(range),
        getRatingLiquidityMetrics(range),
        getGrowthLoopCohort(),
        getAcquisitionBreakdown(range),
        getRetentionMetrics(),
        getCampaignBreakdown(range),
        getSharingMetrics(range),
        getSearchIntelligenceAnalytics(range),
      ]);

      setOverview(overviewRes);
      setActivation(activationRes);
      setCoreLoop(coreLoopRes);
      setLiquidity(liquidityRes);
      setCohort(cohortRes);
      setAcquisition(acquisitionRes);
      setRetention(retentionRes);
      setCampaigns(campaignsRes);
      setSharing(sharingRes);
      setSearchSummary(searchRes);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('[AnalyticsDashboard] Load failed:', err);
      setError(err?.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [preset, getDateRangeFromPreset]);

  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Refresh & Global Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-default">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-text-primary" />
            Growth & Activation Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Measuring the Rater loop: Upload → Review → Feedback → Score → Share → Invite → Repeat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center bg-surface-secondary p-1 rounded-2xl border border-border-default">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  preset === p
                    ? 'bg-surface-primary text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <span className="text-xs text-text-muted font-medium hidden sm:inline-flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </span>

          <Button
            variant="secondary"
            onClick={loadAllAnalytics}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl text-xs inline-flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={loadAllAnalytics} className="text-xs text-red-600 dark:text-red-400 h-8">
            Retry
          </Button>
        </div>
      )}

      {/* ─── SECTION 1: Platform Overview ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">Platform Overview</h2>
            <p className="text-xs text-text-muted">Total volume across Rater (All time cumulative)</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-secondary text-text-secondary uppercase tracking-wider">
            All Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={overview?.totalUsers}
            icon={<Users size={18} />}
            iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            subtext={`+${overview?.users7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Posts"
            value={overview?.totalPosts}
            icon={<FileText size={18} />}
            iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
            subtext={`+${overview?.posts7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Reviews"
            value={overview?.totalReviews}
            icon={<Star size={18} />}
            iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            subtext={`+${overview?.reviews7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Views"
            value={overview?.totalViews}
            icon={<Eye size={18} />}
            iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            subtext="Total post impressions"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ─── SECTION 2: Activation ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Activation Engine
            </h2>
            <p className="text-xs text-text-muted">
              Measuring registered users who upload a design or review another designer.
            </p>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            Comparing vs previous {preset === 'all' ? 'period' : preset}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <TrendCard
            title="New Registrations"
            metric={activation?.newRegistrations}
            tooltip="New user accounts created within the selected period."
            isLoading={isLoading}
          />
          <TrendCard
            title="Reviewers"
            metric={activation?.ratersCount}
            tooltip="Users in this cohort who submitted at least one valid review on another user's post."
            isLoading={isLoading}
          />
          <TrendCard
            title="Uploaders"
            metric={activation?.uploadersCount}
            tooltip="Users in this cohort who uploaded at least one valid, non-deleted design."
            isLoading={isLoading}
          />
          <TrendCard
            title="Activated Users"
            metric={activation?.activatedUsers}
            tooltip="Activated: Registered user who has uploaded ≥1 design OR submitted ≥1 valid review on another user's post."
            highlight
            isLoading={isLoading}
          />
          <TrendCard
            title="Activation Rate"
            metric={activation?.activationRate}
            isPercentage
            tooltip="Activated users divided by new registrations."
            highlight
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ─── SECTION 3: Rating Liquidity ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <Timer size={16} className="text-purple-600 dark:text-purple-400" />
              Rating Liquidity & Marketplace Health
            </h2>
            <p className="text-xs text-text-muted">
              Measuring whether uploaded designs receive enough community feedback and unlocking speed.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-text-muted italic">
            Posts created during selected period
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>% With ≥1 Review</span>
              <Tooltip text="Percentage of active designs in period that received at least one review." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${liquidity?.pctPostsWithReviews ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Community coverage</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>% Posts Unlocked</span>
              <Tooltip text="Canonical unlock: Percentage of active designs reaching ≥3 reviews (post_metrics.rating_unlocked)." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${liquidity?.pctPostsUnlocked ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Reached canonical unlock</div>
          </div>

          <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-2">
              <span>Awaiting First Review</span>
              <Tooltip text="Operational metric: Count of posts in period with exactly 0 reviews. Needs community feedback." />
            </div>
            <div className="text-3xl font-medium text-amber-700 dark:text-amber-300">
              {isLoading ? '...' : liquidity?.postsAwaitingFirstReview ?? 0}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">Unrated designs</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>Awaiting Unlock</span>
              <Tooltip text="Count of posts with 1 or 2 reviews, needing further critique to reach full unlocked score." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : liquidity?.postsAwaitingUnlock ?? 0}
            </div>
            <div className="text-[11px] text-text-muted mt-2">1–2 reviews received</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>Median Time to 1st Review</span>
              <Tooltip text="Median minutes from post upload until first valid review is submitted." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading
                ? '...'
                : liquidity?.medianTimeToFirstReviewMinutes !== null && liquidity?.medianTimeToFirstReviewMinutes !== undefined
                ? `${liquidity.medianTimeToFirstReviewMinutes}m`
                : '—'}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Time to initial feedback</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: Growth Loop Cohort ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              Growth Loop Cohort
            </h2>
            <p className="text-xs text-text-muted">
              Percentage of registered users who have reached each growth behavior (non-chronological).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-text-muted bg-surface-secondary px-3 py-1 rounded-full border border-border-default">
            Cohort size: {cohort?.registeredCount ?? 0} users
          </span>
        </div>

        <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2 font-medium">
            <HelpCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Note: These milestones represent platform behaviors attained by the registered cohort, not sequential steps.</span>
          </div>

          <div className="space-y-3 pt-2">
            {cohort?.stages.map((stage, idx) => (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-secondary text-text-primary font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-text-primary">{stage.name}</span>
                    <span className="text-[11px] text-text-muted hidden sm:inline">— {stage.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary font-medium">{stage.count.toLocaleString()} users</span>
                    <span className="text-xs font-bold text-text-primary w-12 text-right">{stage.conversionRate}%</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-surface-inverted rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(stage.conversionRate, 2), 100)}%` }}
                  />
                </div>

                {stage.id === 'shared_or_invited' && cohort.stage5Details && (
                  <div className="flex items-center gap-4 text-[11px] text-text-muted pl-7 pt-0.5">
                    <span>Shared posts: <strong className="text-text-primary">{cohort.stage5Details.sharedCount}</strong></span>
                    <span>Invited users: <strong className="text-text-primary">{cohort.stage5Details.invitedCount}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: Acquisition Breakdown ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
              Acquisition Channels
            </h2>
            <p className="text-xs text-text-muted">
              Comparing Marketing Attribution, User Referrals, and Direct traffic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Comparison Overview */}
          <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Channel Breakdown
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Marketing Attribution</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                    {acquisition?.comparison.marketingActivated || 0} activated of {acquisition?.comparison.marketingCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {acquisition?.comparison.marketingRate || 0}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">User Referrals</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {acquisition?.comparison.referralActivated || 0} activated of {acquisition?.comparison.referralCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {acquisition?.comparison.referralRate || 0}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-border-default flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text-primary">Direct / Organic</div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    {acquisition?.comparison.directOrUnknownActivated || 0} activated of {acquisition?.comparison.directOrUnknownCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {acquisition?.comparison.directOrUnknownRate || 0}%
                </div>
              </div>
            </div>

            {/* Top Referrers */}
            <div className="pt-2">
              <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                Top Community Referrers
              </h4>
              {!acquisition?.referralStats.topReferrers || acquisition.referralStats.topReferrers.length === 0 ? (
                <div className="text-xs text-text-muted italic py-2">No user referrals recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {acquisition.referralStats.topReferrers.map((ref) => (
                    <div key={ref.referrerId} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">@{ref.username}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {ref.referralCount} invited
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Marketing Source Table */}
          <div className="lg:col-span-2 bg-surface-primary rounded-3xl border border-border-default shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-6 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Marketing Sources Detail
              </h3>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/75 border-y border-border-default text-text-muted font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Source Channel</th>
                    <th className="px-6 py-3">Users</th>
                    <th className="px-6 py-3">Activated</th>
                    <th className="px-6 py-3 text-right">Activation Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-text-secondary">
                  {!acquisition?.sources || acquisition.sources.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-text-muted">
                        No marketing source parameters logged for this period yet.
                      </td>
                    </tr>
                  ) : (
                    acquisition.sources.map((s) => (
                      <tr key={s.source} className="hover:bg-surface-secondary/50">
                        <td className="px-6 py-3 font-semibold text-text-primary uppercase tracking-wide">
                          {s.source}
                        </td>
                        <td className="px-6 py-3">{s.usersCount}</td>
                        <td className="px-6 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{s.activatedCount}</td>
                        <td className="px-6 py-3 text-right font-bold text-text-primary">
                          {s.activationRate}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-surface-secondary border-t border-border-default text-right">
              <Link
                href="/admin/campaigns"
                className="text-xs font-semibold text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
              >
                <span>Manage Tracking Links</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: Core Loop Secondary Metrics ───────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Core Loop Activity</h2>
          <p className="text-xs text-text-muted">Design critiques, unlock velocities, and referral signups.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TrendCard
            title="Posts Submitted"
            metric={coreLoop?.postsSubmitted}
            tooltip="Active designs published in the selected period."
            isLoading={isLoading}
          />
          <TrendCard
            title="Reviews Given"
            metric={coreLoop?.reviewsGiven}
            tooltip="Valid reviews submitted across designs (excluding self-reviews)."
            isLoading={isLoading}
          />
          <TrendCard
            title="Avg Reviews / Post"
            metric={coreLoop?.avgReviewsPerPost}
            tooltip="Average number of critiques received per design published in period."
            isLoading={isLoading}
          />
          <TrendCard
            title="Posts Unlocked"
            metric={coreLoop?.postsUnlocked}
            tooltip="Designs reaching the unlock threshold (≥3 reviews)."
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ─── SECTION 7: Retention ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <Percent size={16} className="text-emerald-600 dark:text-emerald-400" />
              Meaningful-Action Retention
            </h2>
            <p className="text-xs text-text-muted">
              Calendar-day (UTC) cohort retention: user uploaded a design or submitted a valid review after signup.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-secondary text-text-secondary uppercase tracking-wider border border-border-default">
            All-Time Cohort ({retention?.totalCohortUsers ?? 0} Users)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>D1 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on the calendar day immediately following signup." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${retention?.d1RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Day 1 return rate</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>D7 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on any day within days 1–7 after signup." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${retention?.d7RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Week 1 return rate</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>D30 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on any day within days 1–30 after signup." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${retention?.d30RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">Month 1 return rate</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>Repeat Uploaders</span>
              <Tooltip text="Percentage of designers who have uploaded 2 or more designs." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${retention?.repeatUploadRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">≥2 designs published</div>
          </div>

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs relative group">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
              <span>Repeat Reviewers</span>
              <Tooltip text="Percentage of reviewers who have submitted 2 or more critiques." />
            </div>
            <div className="text-3xl font-medium text-text-primary">
              {isLoading ? '...' : `${retention?.repeatReviewRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-text-muted mt-2">≥2 reviews given</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: Campaign Breakdown ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <Megaphone size={16} className="text-purple-600 dark:text-purple-400" />
              Campaign Performance
            </h2>
            <p className="text-xs text-text-muted">Users, activation, and viral referrals generated per marketing campaign.</p>
          </div>
          <Link
            href="/admin/campaigns"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
          >
            <span>Campaign Center</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-surface-primary rounded-3xl border border-border-default shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/75 border-b border-border-default text-text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Tag / Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Users Acquired</th>
                  <th className="px-6 py-4">Activated</th>
                  <th className="px-6 py-4">Activation Rate</th>
                  <th className="px-6 py-4 text-right">Referrals Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default text-text-secondary">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No campaign records found. Create campaigns in Campaign Center!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.campaignSlug} className="hover:bg-surface-secondary/50">
                      <td className="px-6 py-4 font-semibold text-text-primary">{c.campaignName}</td>
                      <td className="px-6 py-4 font-mono text-text-muted">{c.campaignSlug}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          c.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-secondary text-text-secondary'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{c.usersCount}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">{c.activatedCount}</td>
                      <td className="px-6 py-4 font-bold text-text-primary">{c.activationRate}%</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {c.referralsGenerated}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: Sharing Analytics ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <Share2 size={16} className="text-blue-500 dark:text-blue-400" />
            Social & Sharing Telemetry
          </h2>
          <p className="text-xs text-text-muted">Post share actions and methods across the community.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TrendCard
            title="Total Share Actions"
            metric={sharing?.totalShareActions}
            tooltip="Total times users triggered native share or copied post links."
            isLoading={isLoading}
          />
          <TrendCard
            title="Unique Posts Shared"
            metric={sharing?.uniquePostsShared}
            tooltip="Distinct designs shared by users."
            isLoading={isLoading}
          />

          <div className="bg-surface-primary p-5 rounded-3xl border border-border-default shadow-xs space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              Shares by Method
            </div>
            {!sharing?.sharesByMethod || sharing.sharesByMethod.length === 0 ? (
              <div className="text-xs text-text-muted italic py-2">No share actions recorded in period.</div>
            ) : (
              <div className="space-y-2">
                {sharing.sharesByMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary uppercase">{m.method}</span>
                    <span className="font-mono text-text-muted">{m.count} actions</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: Search Intelligence & Discovery Telemetry ────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <Search size={16} className="text-primary" />
            Search Intelligence & Discovery Telemetry
          </h2>
          <p className="text-xs text-text-muted">Search patterns, popular platform queries, and zero-result product demand signals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Top Popular Searches */}
          <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Popular Queries</span>
              <span className="text-[11px] font-mono text-text-muted">Total: {searchSummary?.totalSearches ?? 0} searches</span>
            </div>
            <p className="text-[11px] text-text-muted">Most frequent search terms across the platform.</p>

            {!searchSummary?.popularSearches || searchSummary.popularSearches.length === 0 ? (
              <div className="text-xs text-text-muted italic py-4 text-center">No search events recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchSummary.popularSearches.map((item, idx) => (
                  <div key={`pop-${item.query}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-4 font-mono text-text-muted font-bold">{idx + 1}.</span>
                      <span className="font-semibold text-text-primary truncate">{item.query}</span>
                    </div>
                    <span className="font-mono text-text-secondary bg-surface-primary px-2 py-0.5 rounded-full border border-border-default shrink-0">{item.count} searches</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Trending / Rising Searches */}
          <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" />
                Trending (48h)
              </span>
              <span className="text-[11px] font-mono text-emerald-600/80 dark:text-emerald-400/80">Velocity</span>
            </div>
            <p className="text-[11px] text-text-muted">Queries with high search volume over the last 48 hours.</p>

            {!searchSummary?.trendingSearches || searchSummary.trendingSearches.length === 0 ? (
              <div className="text-xs text-text-muted italic py-4 text-center">No trending searches in window.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchSummary.trendingSearches.map((item, idx) => (
                  <div key={`trend-${item.query}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-4 font-mono text-emerald-500 font-bold">{idx + 1}.</span>
                      <span className="font-semibold text-text-primary truncate">{item.query}</span>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-surface-primary px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">{item.count} recent</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Zero-Result Search Opportunities */}
          <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Zero-Result Demands
              </span>
              <span className="text-[11px] font-mono text-amber-600/80 dark:text-amber-400/80">{searchSummary?.zeroResultCount ?? 0} unfulfilled</span>
            </div>
            <p className="text-[11px] text-text-muted">Queries returning 0 creators or works — content opportunities.</p>

            {!searchSummary?.noResultSearches || searchSummary.noResultSearches.length === 0 ? (
              <div className="text-xs text-text-muted italic py-4 text-center">No unfulfilled queries recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchSummary.noResultSearches.map((item, idx) => (
                  <div key={`zero-${item.query}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-4 font-mono text-amber-500 font-bold">{idx + 1}.</span>
                      <span className="font-semibold text-text-primary truncate">{item.query}</span>
                    </div>
                    <span className="font-mono text-amber-600 dark:text-amber-400 bg-surface-primary px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">{item.count} misses</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── UI Helper Components ─────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex items-center">
      <HelpCircle size={13} className="text-text-muted hover:text-text-secondary cursor-help transition-colors" />
      <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tip:block w-56 p-2 bg-surface-inverted text-text-inverted text-[10px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed border border-border-default">
        {text}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  iconBg,
  subtext,
  isLoading,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  iconBg: string;
  subtext: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-surface-primary p-6 rounded-3xl border border-border-default shadow-xs relative overflow-hidden group hover:border-border-muted transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-medium text-text-primary">
        {isLoading ? '...' : (value ?? 0).toLocaleString()}
      </div>
      <div className="mt-3 text-xs text-text-muted font-medium">{subtext}</div>
    </div>
  );
}

function TrendCard({
  title,
  metric,
  isPercentage = false,
  tooltip,
  highlight = false,
  isLoading,
}: {
  title: string;
  metric?: TrendMetric | null;
  isPercentage?: boolean;
  tooltip?: string;
  highlight?: boolean;
  isLoading: boolean;
}) {
  const current = metric?.current ?? 0;
  const previous = metric?.previous ?? 0;
  const changePct = metric?.changePct ?? null;

  const isPositive = changePct !== null && changePct > 0;
  const isNegative = changePct !== null && changePct < 0;

  return (
    <div className={`p-5 rounded-3xl border shadow-xs transition-all group ${
      highlight ? 'bg-surface-primary border-primary/40 ring-1 ring-primary/20' : 'bg-surface-primary border-border-default hover:border-border-muted'
    }`}>
      <div className="flex items-center justify-between text-xs text-text-secondary font-semibold mb-2">
        <span className="truncate pr-1">{title}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>

      <div className="text-3xl font-medium text-text-primary">
        {isLoading ? '...' : isPercentage ? `${current}%` : current.toLocaleString()}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {changePct !== null ? (
          <span className={`font-semibold flex items-center gap-0.5 ${
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-text-muted'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
            {isPositive ? `+${changePct}%` : `${changePct}%`}
          </span>
        ) : (
          <span className="text-text-muted font-medium">—</span>
        )}

        <span className="text-text-muted text-[10px]">prev: {isPercentage ? `${previous}%` : previous}</span>
      </div>
    </div>
  );
}
