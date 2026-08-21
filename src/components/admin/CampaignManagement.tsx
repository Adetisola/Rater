"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Link as LinkIcon, 
  RefreshCw, 
  X,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  getCampaigns, 
  getCampaign, 
  createCampaign, 
  updateCampaign, 
  createCampaignLink, 
  deleteCampaignLink 
} from '@/lib/admin/server';
import { normalizeCampaignSlug, normalizeSourceDetail } from '@/utils/attributionNormalize';
import type { Campaign, CampaignLink, CampaignStatus } from '@/types';
import { format } from 'date-fns';

const QUICK_SOURCES = [
  'instagram',
  'tiktok',
  'x',
  'discord',
  'creator',
  'community',
  'bootcamp',
  'event',
  'youtube',
];

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [error, setError] = useState<string | null>(null);

  // Selected Campaign Detail / Link Management Drawer
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeLinks, setActiveLinks] = useState<CampaignLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  // Create Campaign Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Campaign Modal
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<CampaignStatus>('active');
  const [isUpdating, setIsUpdating] = useState(false);

  // New Link in Drawer
  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkDetail, setNewLinkDetail] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Copied feedback map: key = link.id or 'campaign-slug'
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      console.error('Failed to load campaigns:', err);
      setError(err?.message || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleOpenDetail = async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setIsLoadingLinks(true);
    setLinkError(null);
    setNewLinkSource('');
    setNewLinkDetail('');
    try {
      const res = await getCampaign(campaign.id);
      setActiveLinks(res.links);
    } catch (err: any) {
      console.error('Failed to load campaign links:', err);
      setLinkError(err?.message || 'Failed to load tracking links');
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreatingCampaign(true);
    setCreateError(null);

    const res = await createCampaign(newCampaignName, newCampaignDesc);
    setIsCreatingCampaign(false);

    if (!res.ok) {
      setCreateError(res.error || 'Failed to create campaign');
      return;
    }

    setIsCreateModalOpen(false);
    setNewCampaignName('');
    setNewCampaignDesc('');
    await fetchCampaigns();

    if (res.campaign) {
      handleOpenDetail(res.campaign);
    }
  };

  const handleUpdateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign || !editName.trim()) return;

    setIsUpdating(true);
    const res = await updateCampaign(editingCampaign.id, {
      name: editName,
      description: editDesc,
      status: editStatus,
    });
    setIsUpdating(false);

    if (res.ok) {
      setEditingCampaign(null);
      await fetchCampaigns();
      if (activeCampaign?.id === editingCampaign.id) {
        setActiveCampaign((prev) => prev ? { ...prev, name: editName, description: editDesc, status: editStatus } : null);
      }
    }
  };

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !newLinkSource.trim()) return;

    setIsAddingLink(true);
    setLinkError(null);

    const res = await createCampaignLink(activeCampaign.id, newLinkSource, newLinkDetail);
    setIsAddingLink(false);

    if (!res.ok || !res.link) {
      setLinkError(res.error || 'Failed to generate tracking link');
      return;
    }

    setActiveLinks((prev) => [res.link!, ...prev]);
    setNewLinkSource('');
    setNewLinkDetail('');
    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaign.id ? { ...c, links_count: (c.links_count || 0) + 1 } : c))
    );
  };

  const handleDeleteLink = async (linkId: string) => {
    const res = await deleteCampaignLink(linkId);
    if (res.ok && activeCampaign) {
      setActiveLinks((prev) => prev.filter((l) => l.id !== linkId));
      setCampaigns((prev) =>
        prev.map((c) => (c.id === activeCampaign.id ? { ...c, links_count: Math.max((c.links_count || 1) - 1, 0) } : c))
      );
    }
  };

  const getTrackingUrl = (link: CampaignLink) => {
    const slug = activeCampaign?.slug || '';
    if (typeof window !== 'undefined' && window.location.origin) {
      const origin = window.location.origin;
      const detailParam = link.detail ? `&detail=${encodeURIComponent(link.detail)}` : '';
      return `${origin}/?source=${encodeURIComponent(link.source)}${detailParam}&campaign=${encodeURIComponent(slug)}`;
    }
    return link.tracking_url || '';
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Filtered campaigns list
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = campaigns.filter((c) => c.status === 'active').length;
  const pausedCount = campaigns.filter((c) => c.status === 'paused').length;
  const totalLinksCount = campaigns.reduce((acc, c) => acc + (c.links_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
            Campaign Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create marketing campaigns, generate tracked URLs, and monitor growth attribution channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchCampaigns}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl text-xs inline-flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-xl text-xs inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800"
          >
            <Plus size={14} />
            New Campaign
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={fetchCampaigns} className="text-xs text-red-700 h-8">
            Retry
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Campaigns</div>
            <div className="text-3xl font-medium text-gray-900 mt-1">{isLoading ? '...' : activeCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Play size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paused Campaigns</div>
            <div className="text-3xl font-medium text-gray-900 mt-1">{isLoading ? '...' : pausedCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Pause size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracked Links Generated</div>
            <div className="text-3xl font-medium text-gray-900 mt-1">{isLoading ? '...' : totalLinksCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <LinkIcon size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns or slugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'active', 'paused', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Slug (Tag)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tracked Links</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No campaigns found. Create one to get started!
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(campaign)}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div>{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-[11px] text-gray-400 font-normal truncate max-w-xs mt-0.5">
                          {campaign.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-md font-semibold text-[11px]">
                        {campaign.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        campaign.status === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className="inline-flex items-center gap-1 text-gray-900 font-semibold">
                        <LinkIcon size={12} className="text-gray-400" />
                        {campaign.links_count || 0} links
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {campaign.created_at ? format(new Date(campaign.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setEditName(campaign.name);
                            setEditDesc(campaign.description || '');
                            setEditStatus(campaign.status);
                          }}
                          className="h-8 px-2.5 rounded-lg text-xs text-gray-600 hover:text-black"
                          title="Edit Campaign"
                        >
                          <Edit3 size={13} />
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleOpenDetail(campaign)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <span>Manage Links</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Detail / Links Drawer */}
      {activeCampaign && (
        <div className="fixed inset-0 z-60 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setActiveCampaign(null)}
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-gray-900">{activeCampaign.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                    activeCampaign.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    activeCampaign.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {activeCampaign.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  campaign_tag: <span className="text-gray-700 font-semibold">{activeCampaign.slug}</span>
                </p>
              </div>

              <button
                onClick={() => setActiveCampaign(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Generate New Tracking Link Form */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Plus size={14} className="text-primary" />
                  Generate New Tracking Link
                </h3>

                <form onSubmit={handleAddLinkSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Acquisition Source <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. instagram, tiktok, discord"
                        value={newLinkSource}
                        onChange={(e) => setNewLinkSource(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Source Detail (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. @designwithme, bio-link"
                        value={newLinkDetail}
                        onChange={(e) => setNewLinkDetail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {/* Quick-chips for common sources */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 font-semibold mr-1">Quick sources:</span>
                    {QUICK_SOURCES.map((src) => (
                      <button
                        type="button"
                        key={src}
                        onClick={() => setNewLinkSource(src)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] text-gray-600 hover:border-black transition-colors"
                      >
                        {src}
                      </button>
                    ))}
                  </div>

                  {/* Live URL Preview */}
                  {newLinkSource.trim() && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-[11px] font-mono text-gray-600 break-all">
                      <span className="text-gray-400">Preview: </span>
                      {`https://www.raterapp.site/?source=${encodeURIComponent(normalizeSourceDetail(newLinkSource))}${newLinkDetail ? `&detail=${encodeURIComponent(normalizeSourceDetail(newLinkDetail))}` : ''}&campaign=${encodeURIComponent(activeCampaign.slug)}`}
                    </div>
                  )}

                  {linkError && (
                    <div className="text-xs text-red-600 font-medium">{linkError}</div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isAddingLink || !newLinkSource.trim()}
                      className="h-8 px-4 rounded-xl text-xs bg-black text-white hover:bg-gray-800"
                    >
                      {isAddingLink ? 'Generating...' : 'Create Tracking Link'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Existing Tracking Links */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Active Tracking Links ({activeLinks.length})
                </h3>

                {isLoadingLinks ? (
                  <div className="py-8 text-center text-xs text-gray-400">Loading links...</div>
                ) : activeLinks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No tracking links created for this campaign yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2.5 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs uppercase">
                              {link.source}
                            </span>
                            {link.detail && (
                              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-mono">
                                {link.detail}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => copyToClipboard(getTrackingUrl(link), link.id)}
                              className="h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1.5 font-semibold"
                            >
                              {copiedKey === link.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteLink(link.id)}
                              className="h-7 w-7 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Link"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>

                        <div className="p-2 bg-gray-50 rounded-lg text-[11px] font-mono text-gray-500 break-all select-all">
                          {getTrackingUrl(link)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Create New Campaign</h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter the campaign name. A URL-safe slug will automatically be generated for attribution tracking.
            </p>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. First 1,000 Designers"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              {newCampaignName.trim() && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600">
                  <span className="text-gray-400">Generated slug: </span>
                  <span className="font-semibold text-gray-900">{normalizeCampaignSlug(newCampaignName)}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What is the goal of this campaign?"
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              {createError && (
                <div className="text-xs text-red-600 font-medium">{createError}</div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isCreatingCampaign || !newCampaignName.trim()}
                  className="h-9 px-5 rounded-xl text-xs bg-black text-white hover:bg-gray-800"
                >
                  {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setEditingCampaign(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Edit Campaign</h2>
            <p className="text-xs text-gray-500 mb-4 font-mono">slug: {editingCampaign.slug}</p>

            <form onSubmit={handleUpdateCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CampaignStatus)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="h-9 px-4 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isUpdating || !editName.trim()}
                  className="h-9 px-5 rounded-xl text-xs bg-black text-white hover:bg-gray-800"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
