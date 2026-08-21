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
  Unlock, 
  ArrowRight, 
  Megaphone, 
  Percent, 
  Timer, 
  Inbox, 
  BarChart2,
  CheckCircle2
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
  getSharingMetrics
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
      ] = await Promise.all([
        getAnalyticsPlatformOverview(),
        getActivationMetrics(range),
        getCoreLoopMetrics(range),
        getRatingLiquidityMetrics(range),
        getGrowthLoopCohort(range),
        getAcquisitionBreakdown(range),
        getRetentionMetrics(),
        getCampaignBreakdown(range),
        getSharingMetrics(range),
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
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to load growth analytics:', err);
      setError(err?.message || 'Failed to load telemetry analytics');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-black" />
            Growth & Activation Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Measuring the Rater loop: Upload → Review → Feedback → Score → Share → Invite → Repeat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200/80">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  preset === p
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 font-medium hidden sm:inline-flex items-center gap-1">
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
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={loadAllAnalytics} className="text-xs text-red-700 h-8">
            Retry
          </Button>
        </div>
      )}

      {/* ─── SECTION 1: Platform Overview ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Platform Overview</h2>
            <p className="text-xs text-gray-400">Total volume across Rater (All time cumulative)</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
            All Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={overview?.totalUsers}
            icon={<Users size={18} />}
            iconBg="bg-blue-50 text-blue-600"
            subtext={`+${overview?.users7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Posts"
            value={overview?.totalPosts}
            icon={<FileText size={18} />}
            iconBg="bg-purple-50 text-purple-600"
            subtext={`+${overview?.posts7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Reviews"
            value={overview?.totalReviews}
            icon={<Star size={18} />}
            iconBg="bg-amber-50 text-amber-600"
            subtext={`+${overview?.reviews7dDelta || 0} past 7 days`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Views"
            value={overview?.totalViews}
            icon={<Eye size={18} />}
            iconBg="bg-emerald-50 text-emerald-600"
            subtext="Total post impressions"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ─── SECTION 2: Activation ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Activation Engine
            </h2>
            <p className="text-xs text-gray-400">
              Measuring registered users who both upload design(s) and review other designers.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
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
            tooltip="Activated: Registered user who has BOTH uploaded ≥1 design AND submitted ≥1 valid review on another user's post."
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
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Timer size={16} className="text-purple-600" />
              Rating Liquidity & Marketplace Health
            </h2>
            <p className="text-xs text-gray-400">
              Measuring whether uploaded designs receive enough community feedback and unlocking speed.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 italic">
            Posts created during selected period
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>% With ≥1 Review</span>
              <Tooltip text="Percentage of active designs in period that received at least one review." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${liquidity?.pctPostsWithReviews ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Community coverage</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>% Posts Unlocked</span>
              <Tooltip text="Canonical unlock: Percentage of active designs reaching ≥3 reviews (post_metrics.rating_unlocked)." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${liquidity?.pctPostsUnlocked ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Reached canonical unlock</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-100/80 bg-amber-50/20 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-2">
              <span>Awaiting First Review</span>
              <Tooltip text="Operational metric: Count of posts in period with exactly 0 reviews. Needs community feedback." />
            </div>
            <div className="text-3xl font-medium text-amber-900">
              {isLoading ? '...' : liquidity?.postsAwaitingFirstReview ?? 0}
            </div>
            <div className="text-[11px] text-amber-700 mt-2">Unrated designs</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>Awaiting Unlock</span>
              <Tooltip text="Count of posts with 1 or 2 reviews, needing further critique to reach full unlocked score." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : liquidity?.postsAwaitingUnlock ?? 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">1–2 reviews received</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>Median Time to 1st Review</span>
              <Tooltip text="Median minutes from post upload until first valid review is submitted." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading
                ? '...'
                : liquidity?.medianTimeToFirstReviewMinutes !== null && liquidity?.medianTimeToFirstReviewMinutes !== undefined
                ? `${liquidity.medianTimeToFirstReviewMinutes}m`
                : '—'}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Time to initial feedback</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: Growth Loop Cohort ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Growth Loop Cohort
            </h2>
            <p className="text-xs text-gray-400">
              Percentage of registered users who have reached each growth behavior (non-chronological).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Cohort size: {cohort?.registeredCount ?? 0} users
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-[11px] text-amber-800 flex items-center gap-2 font-medium">
            <HelpCircle size={14} className="shrink-0 text-amber-600" />
            <span>Note: These milestones represent platform behaviors attained by the registered cohort, not sequential steps.</span>
          </div>

          <div className="space-y-3 pt-2">
            {cohort?.stages.map((stage, idx) => (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-900">{stage.name}</span>
                    <span className="text-[11px] text-gray-400 hidden sm:inline">— {stage.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium">{stage.count.toLocaleString()} users</span>
                    <span className="text-xs font-bold text-gray-900 w-12 text-right">{stage.conversionRate}%</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(stage.conversionRate, 2), 100)}%` }}
                  />
                </div>

                {stage.id === 'shared_or_invited' && cohort.stage5Details && (
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 pl-7 pt-0.5">
                    <span>Shared posts: <strong className="text-gray-700">{cohort.stage5Details.sharedCount}</strong></span>
                    <span>Invited users: <strong className="text-gray-700">{cohort.stage5Details.invitedCount}</strong></span>
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
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600" />
              Acquisition Channels
            </h2>
            <p className="text-xs text-gray-400">
              Comparing Marketing Attribution, User Referrals, and Direct traffic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Comparison Overview */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Channel Breakdown
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">Marketing Attribution</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    {acquisition?.comparison.marketingActivated || 0} activated of {acquisition?.comparison.marketingCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {acquisition?.comparison.marketingRate || 0}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">User Referrals</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {acquisition?.comparison.referralActivated || 0} activated of {acquisition?.comparison.referralCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-emerald-900">
                  {acquisition?.comparison.referralRate || 0}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900">Direct / Organic</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {acquisition?.comparison.directOrUnknownActivated || 0} activated of {acquisition?.comparison.directOrUnknownCount || 0} users
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {acquisition?.comparison.directOrUnknownRate || 0}%
                </div>
              </div>
            </div>

            {/* Top Referrers */}
            <div className="pt-2">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Top Community Referrers
              </h4>
              {!acquisition?.referralStats.topReferrers || acquisition.referralStats.topReferrers.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-2">No user referrals recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {acquisition.referralStats.topReferrers.map((ref) => (
                    <div key={ref.referrerId} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900">@{ref.username}</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {ref.referralCount} invited
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Marketing Source Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-6 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Marketing Sources Detail
              </h3>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-y border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Source Channel</th>
                    <th className="px-6 py-3">Users</th>
                    <th className="px-6 py-3">Activated</th>
                    <th className="px-6 py-3 text-right">Activation Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {!acquisition?.sources || acquisition.sources.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        No marketing source parameters logged for this period yet.
                      </td>
                    </tr>
                  ) : (
                    acquisition.sources.map((s) => (
                      <tr key={s.source} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-semibold text-gray-900 uppercase tracking-wide">
                          {s.source}
                        </td>
                        <td className="px-6 py-3">{s.usersCount}</td>
                        <td className="px-6 py-3 text-emerald-600 font-semibold">{s.activatedCount}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">
                          {s.activationRate}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <Link
                href="/admin/campaigns"
                className="text-xs font-semibold text-gray-700 hover:text-black inline-flex items-center gap-1"
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
          <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Core Loop Activity</h2>
          <p className="text-xs text-gray-400">Design critiques, unlock velocities, and referral signups.</p>
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
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Percent size={16} className="text-emerald-600" />
              Meaningful-Action Retention
            </h2>
            <p className="text-xs text-gray-400">
              Calendar-day (UTC) cohort retention: user uploaded a design or submitted a valid review after signup.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
            All-Time Cohort ({retention?.totalCohortUsers ?? 0} Users)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>D1 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on the calendar day immediately following signup." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${retention?.d1RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Day 1 return rate</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>D7 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on any day within days 1–7 after signup." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${retention?.d7RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Week 1 return rate</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>D30 Retention</span>
              <Tooltip text="User returned and uploaded a post or wrote a review on any day within days 1–30 after signup." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${retention?.d30RetentionRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Month 1 return rate</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>Repeat Uploaders</span>
              <Tooltip text="Percentage of designers who have uploaded 2 or more designs." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${retention?.repeatUploadRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">≥2 designs published</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>Repeat Reviewers</span>
              <Tooltip text="Percentage of reviewers who have submitted 2 or more critiques." />
            </div>
            <div className="text-3xl font-medium text-gray-900">
              {isLoading ? '...' : `${retention?.repeatReviewRate ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">≥2 reviews given</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: Campaign Breakdown ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Megaphone size={16} className="text-purple-600" />
              Campaign Performance
            </h2>
            <p className="text-xs text-gray-400">Users, activation, and viral referrals generated per marketing campaign.</p>
          </div>
          <Link
            href="/admin/campaigns"
            className="text-xs font-semibold text-gray-700 hover:text-black inline-flex items-center gap-1"
          >
            <span>Campaign Center</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
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
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No campaign records found. Create campaigns in Campaign Center!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.campaignSlug} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{c.campaignName}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">{c.campaignSlug}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{c.usersCount}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">{c.activatedCount}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{c.activationRate}%</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">
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
          <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Share2 size={16} className="text-blue-500" />
            Social & Sharing Telemetry
          </h2>
          <p className="text-xs text-gray-400">Post share actions and methods across the community.</p>
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

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Shares by Method
            </div>
            {!sharing?.sharesByMethod || sharing.sharesByMethod.length === 0 ? (
              <div className="text-xs text-gray-400 italic py-2">No share actions recorded in period.</div>
            ) : (
              <div className="space-y-2">
                {sharing.sharesByMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900 uppercase">{m.method}</span>
                    <span className="font-mono text-gray-500">{m.count} actions</span>
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
      <HelpCircle size={13} className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
      <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tip:block w-56 p-2 bg-gray-900 text-white text-[10px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
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
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-medium text-gray-900">
        {isLoading ? '...' : (value ?? 0).toLocaleString()}
      </div>
      <div className="mt-3 text-xs text-gray-400 font-medium">{subtext}</div>
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
  const changePct = metric?.changePct;

  const isPositive = changePct !== null && changePct > 0;
  const isNegative = changePct !== null && changePct < 0;

  return (
    <div className={`p-5 rounded-3xl border shadow-sm transition-all group ${
      highlight ? 'bg-white border-primary/40 ring-1 ring-primary/20' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
        <span className="truncate pr-1">{title}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>

      <div className="text-3xl font-medium text-gray-900">
        {isLoading ? '...' : isPercentage ? `${current}%` : current.toLocaleString()}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {changePct !== null && changePct !== undefined ? (
          <span className={`font-semibold flex items-center gap-0.5 ${
            isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
            {isPositive ? `+${changePct}%` : `${changePct}%`}
          </span>
        ) : (
          <span className="text-gray-400 font-medium">—</span>
        )}

        <span className="text-gray-400 text-[10px]">prev: {isPercentage ? `${previous}%` : previous}</span>
      </div>
    </div>
  );
}
