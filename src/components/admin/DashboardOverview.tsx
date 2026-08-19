"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Star, 
  Eye, 
  ShieldAlert, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDashboardStats } from '@/lib/admin/server';
import type { AdminDashboardStats } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function DashboardOverview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  async function loadStats() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError(err?.message || 'Failed to load telemetry metrics');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform performance overview, moderation queues, and user activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-base hidden sm:inline-flex items-center gap-1">
            <Clock size={12} />
            Refreshed {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </span>
          <Button
            variant="secondary"
            onClick={loadStats}
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
          <Button variant="ghost" onClick={loadStats} className="text-xs text-red-700 h-8">
            Retry
          </Button>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 tracking-wider">Profiles</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-medium text-gray-900">
            {isLoading ? '...' : stats?.totalProfiles.toLocaleString() ?? '0'}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-base text-emerald-600 font-semibold flex items-center gap-0.5">
              +{stats?.profilesLast7Days || 0}
            </span>
            <span className="text-gray-400 font-medium">past 7 days</span>
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 tracking-wider">Posts & Media</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-3xl font-medium text-gray-900">
            {isLoading ? '...' : stats?.totalPosts.toLocaleString() ?? '0'}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-base text-emerald-600 font-semibold flex items-center gap-0.5">
              +{stats?.postsLast7Days || 0}
            </span>
            <span className="text-gray-400 font-medium">past 7 days</span>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 tracking-wider">Reviews</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={18} />
            </div>
          </div>
          <div className="text-3xl font-medium text-gray-900">
            {isLoading ? '...' : stats?.totalReviews.toLocaleString() ?? '0'}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-base text-emerald-600 font-semibold flex items-center gap-0.5">
              +{stats?.reviewsLast7Days || 0}
            </span>
            <span className="text-gray-400 font-medium">past 7 days</span>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 tracking-wider">Post Views</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-3xl font-medium text-gray-900">
            {isLoading ? '...' : stats?.totalViews.toLocaleString() ?? '0'}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-semibold">Total impressions</span>
            <span className="text-gray-400 font-medium">All time</span>
          </div>
        </div>
      </div>

      {/* Moderation Queue Priority Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Reports Banner */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                (stats?.pendingReports || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Safety & Abuse Reports</h2>
                <p className="text-xs text-gray-500">Triage reported content and user violations</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              (stats?.pendingReports || 0) > 0 
                ? 'bg-red-100 text-red-700 animate-pulse' 
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {stats?.pendingReports || 0} Pending
            </span>
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-100 text-sm font-semibold text-gray-700 hover:text-black group"
          >
            <span>Open Safety Queue</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Feedback Banner */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MessageSquare size={22} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Feedback Management</h2>
                <p className="text-xs text-gray-500">Categorize feature requests and community ideas</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              {stats?.activeFeedback || 0} Active
            </span>
          </div>

          <Link
            href="/admin/feedback"
            className="inline-flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-100 text-sm font-semibold text-gray-700 hover:text-black group"
          >
            <span>Review Feedback Submissions</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-1">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-gray-900 font-semibold text-sm mb-1">
              <span>Moderate Users</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <p className="text-xs text-gray-500">Search users, toggle admin rights, and block accounts.</p>
          </Link>

          <Link
            href="/admin/posts"
            className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-gray-900 font-semibold text-sm mb-1">
              <span>Moderate Posts</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <p className="text-xs text-gray-500">Preview media, edit categories, and soft/hard delete posts.</p>
          </Link>

          <Link
            href="/admin/reports"
            className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-gray-900 font-semibold text-sm mb-1">
              <span>Process Reports</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <p className="text-xs text-gray-500">Review community abuse reports and take instant action.</p>
          </Link>

          <Link
            href="/admin/settings"
            className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-gray-900 font-semibold text-sm mb-1">
              <span>Platform Settings</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <p className="text-xs text-gray-500">Configure announcements, maintenance mode, and feature switches.</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center justify-between">
          <span>Recent Platform Activity</span>
          <span className="text-xs text-gray-400 font-normal">Latest submissions across Rater</span>
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading activity feed...</div>
        ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No recent activity found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    item.type === 'post' ? 'bg-purple-50 text-purple-600' :
                    item.type === 'report' ? 'bg-red-50 text-red-600' :
                    item.type === 'feedback' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {item.type === 'post' ? <FileText size={14} /> :
                     item.type === 'report' ? <ShieldAlert size={14} /> :
                     item.type === 'feedback' ? <MessageSquare size={14} /> :
                     <Users size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 truncate">{item.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                  <Link
                    href={item.link}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
                  >
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
