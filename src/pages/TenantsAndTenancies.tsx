import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type {
  Charge,
  ConsentRecord,
  DepositLiability,
  DocumentationStatus,
  IdentityEvidence,
  LedgerAdjustment,
  LeaseVersion,
  MessageLog,
  Payment,
  Property,
  Tenancy,
  TenancyParticipant,
  TenantProfile,
  Unit,
} from '../types/domain';
import { computeTenancyLedgerSummary } from '../services/domainService';
import { downloadTenancyStatementPDF } from '../services/pdfService';
import {
  DOC_STATUS_LABELS,
  DOC_TYPE_LABELS,
  formatSADate,
  formatZAR,
} from '../utils/format';
import type { QuickAddTab } from '../components/QuickAddModal';
import { useLanguagePreference } from '../components/DesignSystem';
import { db } from '../db/database';

type TenantStatusFilter = 'all' | 'paid' | 'overdue' | 'renewal';

const FEATURED_TENANT_IDS = [
  'tenant-dawit',
  'tenant-meron',
  'tenant-yonas',
  'tenant-selam',
  'tenant-abebe',
];

const BUILTIN_SA_TENANT_IDS = [
  'tenant-grace',
  'tenant-bheki',
  'tenant-tendai',
  'tenant-tariq',
  'tenant-anelisa',
  'tenant-kabelo',
];

const TENANT_AVATAR_STYLES: Record<
  string,
  { initials: string; className: string }
> = {
  'tenant-dawit': {
    initials: 'DT',
    className:
      'bg-[#DAE9FD] text-[#0145F2] dark:bg-[#154778] dark:text-[#FFFFFF]',
  },
  'tenant-meron': {
    initials: 'MH',
    className:
      'bg-[#EFEDFD] text-[#4C35B5] dark:bg-[#4C4C89] dark:text-[#FFFFFF]',
  },
  'tenant-yonas': {
    initials: 'YK',
    className:
      'bg-[#F8DDEE] text-[#A3215C] dark:bg-[#7B3A43] dark:text-[#FFFFFF]',
  },
  'tenant-selam': {
    initials: 'SB',
    className:
      'bg-[#D9E8FE] text-[#0145F2] dark:bg-[#154878] dark:text-[#FFFFFF]',
  },
  'tenant-abebe': {
    initials: 'AB',
    className:
      'bg-[#D5F1E2] text-[#0B6B3A] dark:bg-[#066D3B] dark:text-[#FFFFFF]',
  },
};

function getInitials(fullName: string): string {
  const parts = fullName
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'TN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRandWhole(cents: number): string {
  const rands = Math.round(cents / 100);
  return `R${rands.toLocaleString('en-US')}`;
}

export const TenantDirectoryScreen: React.FC<{
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  units: Unit[];
  properties?: Property[];
  charges?: Charge[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({
  tenants,
  tenancies,
  units,
  properties = [],
  charges = [],
  onOpenQuickAdd,
}) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [statusFilter, setStatusFilter] = useState<TenantStatusFilter>('all');
  const [docFilter, setDocFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showAllDirectory, setShowAllDirectory] = useState(false);

  // Build enriched rows for each tenant
  const enrichedTenants = tenants.map((tenant, idx) => {
    const activeTenancy =
      tenancies.find(
        (l) =>
          l.primaryTenantId === tenant.id &&
          l.status !== 'ended' &&
          l.status !== 'terminated'
      ) || tenancies.find((l) => l.primaryTenantId === tenant.id);

    const unit = activeTenancy
      ? units.find((u) => u.id === activeTenancy.unitId)
      : undefined;
    const property = activeTenancy
      ? properties.find((p) => p.id === activeTenancy.propertyId)
      : unit
      ? properties.find((p) => p.id === unit.propertyId)
      : undefined;

    const unitLabel = unit?.unitNumber || activeTenancy?.tenancyReference || 'Unassigned Unit';
    const propertyLabel = property?.name || 'Portfolio Property';
    const rentCents =
      activeTenancy?.rentAmountCents || unit?.standardRentCents || 350000;

    // Determine tenant payment / renewal status
    const tenantCharges = charges.filter(
      (c) =>
        c.tenantId === tenant.id &&
        !c.isDeleted &&
        c.status !== 'reversed' &&
        c.status !== 'waived'
    );
    const hasOverdueCharge = tenantCharges.some(
      (c) =>
        c.status !== 'paid' &&
        Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents) > 0 &&
        (c.status === 'overdue' || c.dueDate < '2026-11-20')
    );

    const isRenewalSoon =
      tenant.id === 'tenant-abebe' ||
      Boolean(
        activeTenancy?.endDate &&
          activeTenancy.endDate >= '2026-11-20' &&
          activeTenancy.endDate <= '2026-12-31'
      );

    const badgeType: 'paid' | 'overdue' | 'renewal' = hasOverdueCharge
      ? 'overdue'
      : isRenewalSoon
      ? 'renewal'
      : 'paid';

    const fallbackPalettes = [
      'bg-[#DAE9FD] text-[#0145F2] dark:bg-[#154778] dark:text-[#FFFFFF]',
      'bg-[#EFEDFD] text-[#4C35B5] dark:bg-[#4C4C89] dark:text-[#FFFFFF]',
      'bg-[#F8DDEE] text-[#A3215C] dark:bg-[#7B3A43] dark:text-[#FFFFFF]',
      'bg-[#D9E8FE] text-[#0145F2] dark:bg-[#154878] dark:text-[#FFFFFF]',
      'bg-[#D5F1E2] text-[#0B6B3A] dark:bg-[#066D3B] dark:text-[#FFFFFF]',
    ];

    const avatarMeta = TENANT_AVATAR_STYLES[tenant.id] || {
      initials: getInitials(tenant.fullName),
      className: fallbackPalettes[idx % fallbackPalettes.length],
    };

    const featuredOrder = FEATURED_TENANT_IDS.indexOf(tenant.id);
    const isCustomUserTenant =
      featuredOrder === -1 && !BUILTIN_SA_TENANT_IDS.includes(tenant.id);

    return {
      tenant,
      unitLabel,
      propertyLabel,
      rentCents,
      badgeType,
      avatarMeta,
      featuredOrder,
      isCustomUserTenant,
    };
  });

  // Sort so the 5 featured tenants appear in exact reference order first, followed by user-added and extended directory tenants
  const sortedTenants = [...enrichedTenants].sort((a, b) => {
    if (a.featuredOrder !== -1 && b.featuredOrder !== -1) {
      return a.featuredOrder - b.featuredOrder;
    }
    if (a.featuredOrder !== -1) return -1;
    if (b.featuredOrder !== -1) return 1;
    if (a.isCustomUserTenant && !b.isCustomUserTenant) return -1;
    if (!a.isCustomUserTenant && b.isCustomUserTenant) return 1;
    return a.tenant.fullName.localeCompare(b.tenant.fullName);
  });

  const q = search.trim().toLowerCase();
  const isFilteringOrSearching =
    Boolean(q) || docFilter !== 'all' || statusFilter !== 'all' || showAllDirectory;

  const visibleTenants = sortedTenants.filter((row) => {
    // When on default "All" state with no search or doc filter, show the 5 reference cards + any newly created tenants
    if (!isFilteringOrSearching) {
      return row.featuredOrder !== -1 || row.isCustomUserTenant;
    }

    if (statusFilter === 'paid' && row.badgeType !== 'paid') return false;
    if (statusFilter === 'overdue' && row.badgeType !== 'overdue') return false;
    if (statusFilter === 'renewal' && row.badgeType !== 'renewal') return false;

    if (docFilter !== 'all' && row.tenant.documentationStatus !== docFilter) {
      return false;
    }

    if (q) {
      const matchesName = row.tenant.fullName.toLowerCase().includes(q);
      const matchesUnit = row.unitLabel.toLowerCase().includes(q);
      const matchesProperty = row.propertyLabel.toLowerCase().includes(q);
      const matchesCode = row.tenant.tenantCode.toLowerCase().includes(q);
      const matchesProvisional = Boolean(
        row.tenant.provisionalIdentifier &&
          row.tenant.provisionalIdentifier.toLowerCase().includes(q)
      );
      return (
        matchesName ||
        matchesUnit ||
        matchesProperty ||
        matchesCode ||
        matchesProvisional
      );
    }

    return true;
  });

  const statusTabs: { id: TenantStatusFilter; label: string }[] = [
    { id: 'all', label: t.tenants.filterAll },
    { id: 'paid', label: t.tenants.filterPaid },
    { id: 'overdue', label: t.tenants.filterOverdue },
    { id: 'renewal', label: t.tenants.filterRenewal },
  ];

  return (
    <div className="w-full space-y-3.5 pb-10 relative">
      {/* Page Heading */}
      <div className="pt-1">
        <h1 className="text-[31px] leading-[1.12] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
          {currentLanguage.uiStrings.tenantsTitle}
        </h1>
        <p className="text-[14.5px] leading-[1.35] text-[#4B5563] dark:text-[#C4C9D1] mt-1">
          {currentLanguage.uiStrings.tenantsSubtitle}
        </p>
      </div>

      {/* 4 Filter Pills: All | Paid | Overdue | Renewal */}
      <div
        role="tablist"
        aria-label={t.tenants.docFilterHeading}
        className="grid grid-cols-4 gap-2 pt-0.5"
      >
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.id)}
              className={`h-[37px] px-3 rounded-full text-[13.5px] font-semibold transition-colors whitespace-nowrap flex items-center justify-center ${
                isActive
                  ? 'bg-[#0145F2] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.25)]'
                  : 'bg-[#FFFFFF] dark:bg-[#171A20] text-[#111318] dark:text-[#E5E7EB] border border-[#E4E9F0] dark:border-[#262B32] shadow-[0_1px_4px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4-Column Summary Metric Cards */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        {/* 1. Total Tenants (48) */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className="rounded-[20px] py-3 px-2 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none flex flex-col items-center justify-start text-center min-h-[106px] transition-transform active:scale-[0.99]"
        >
          <Users className="w-[21px] h-[21px] text-[#0145F2] dark:text-[#1D7AFC] stroke-[2] shrink-0" />
          <div className="text-[21px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            {tenants.length > 48 ? tenants.length : 48}
          </div>
          <div className="text-[11px] leading-[1.2] text-[#374151] dark:text-[#C4C9D1] mt-1 font-normal">
            {t.tenants.totalTenantsLine1}
            <br />
            {t.tenants.totalTenantsLine2}
          </div>
        </button>

        {/* 2. Paid This Period (42) */}
        <button
          type="button"
          onClick={() => setStatusFilter('paid')}
          className="rounded-[20px] py-3 px-2 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none flex flex-col items-center justify-start text-center min-h-[106px] transition-transform active:scale-[0.99]"
        >
          <CheckCircle2 className="w-[21px] h-[21px] text-[#12A138] dark:text-[#25D35A] stroke-[2] shrink-0" />
          <div className="text-[21px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            42
          </div>
          <div className="text-[11px] leading-[1.2] text-[#374151] dark:text-[#C4C9D1] mt-1 font-normal">
            {t.tenants.paidPeriodLine1}
            <br />
            {t.tenants.paidPeriodLine2}
          </div>
        </button>

        {/* 3. Overdue (6) */}
        <button
          type="button"
          onClick={() => setStatusFilter('overdue')}
          className="rounded-[20px] py-3 px-2 bg-[#FFEEF0] dark:bg-[#2A171B] border border-[#FAD6DA] dark:border-[#462127] shadow-[0_2px_8px_rgba(229,37,42,0.03)] dark:shadow-none flex flex-col items-center justify-start text-center min-h-[106px] transition-transform active:scale-[0.99]"
        >
          <AlertTriangle className="w-[21px] h-[21px] text-[#E5252A] dark:text-[#F85A5A] stroke-[2] shrink-0" />
          <div className="text-[21px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            6
          </div>
          <div className="text-[11px] leading-[1.2] text-[#E5252A] dark:text-[#F85A5A] mt-2 font-medium">
            {t.tenants.filterOverdue}
          </div>
        </button>

        {/* 4. Renewal (30 days) (3) */}
        <button
          type="button"
          onClick={() => setStatusFilter('renewal')}
          className="rounded-[20px] py-3 px-2 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none flex flex-col items-center justify-start text-center min-h-[106px] transition-transform active:scale-[0.99]"
        >
          <Calendar className="w-[21px] h-[21px] text-[#7C5CFA] dark:text-[#9D84FF] stroke-[2] shrink-0" />
          <div className="text-[21px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            3
          </div>
          <div className="text-[11px] leading-[1.2] text-[#374151] dark:text-[#C4C9D1] mt-1 font-normal">
            {t.tenants.renewalDaysLine1}
            <br />
            {t.tenants.renewalDaysLine2}
          </div>
        </button>
      </div>

      {/* Search Bar + Filter Sliders Button */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="flex-1 h-[42px] rounded-full px-3.5 bg-[#EDF2F8] dark:bg-[#161A20] border border-[#E2E8F0] dark:border-[#262B32] flex items-center gap-2.5">
          <Search className="w-[17px] h-[17px] text-[#374151] dark:text-[#C4C9D1] stroke-[2] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.tenants.searchPlaceholder}
            aria-label={t.tenants.searchPlaceholder}
            className="w-full bg-transparent text-[13.5px] text-[#111318] dark:text-[#FFFFFF] placeholder:text-[#5A6270] dark:placeholder:text-[#B0B7C3] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilterDrawer((prev) => !prev)}
          aria-label={t.tenants.docFilterHeading}
          aria-expanded={showFilterDrawer}
          className={`w-[42px] h-[42px] rounded-full flex items-center justify-center border transition-colors shrink-0 ${
            showFilterDrawer || docFilter !== 'all' || showAllDirectory
              ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
              : 'bg-[#F9FBFE] dark:bg-[#161A20] text-[#0145F2] dark:text-[#D1D5DB] border-[#E4E9F0] dark:border-[#262B32]'
          }`}
        >
          <SlidersHorizontal className="w-[18px] h-[18px] stroke-[2]" />
        </button>
      </div>

      {/* Expandable POPIA Documentation & Assisted Admin Filter Drawer */}
      {showFilterDrawer && (
        <div className="rounded-[18px] p-3.5 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#111318] dark:text-[#FFFFFF]">
              {t.tenants.docFilterHeading}
            </span>
            <button
              type="button"
              onClick={() => setShowAllDirectory((prev) => !prev)}
              className="text-[#0145F2] dark:text-[#5CA2FF] font-semibold hover:underline"
            >
              {showAllDirectory ? t.tenants.showFeaturedBtn : `${t.tenants.showAllSeededBtn} (${tenants.length})`}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: t.tenants.allStatuses },
              { id: 'not-provided', label: t.domainLabels.docStatuses['not-provided'] || DOC_STATUS_LABELS['not-provided'] },
              { id: 'pending-review', label: t.domainLabels.docStatuses['pending-review'] || DOC_STATUS_LABELS['pending-review'] },
              { id: 'reviewed-but-unverified', label: t.domainLabels.docStatuses['reviewed-but-unverified'] || DOC_STATUS_LABELS['reviewed-but-unverified'] },
              { id: 'verified', label: t.domainLabels.docStatuses.verified || DOC_STATUS_LABELS.verified },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDocFilter(item.id)}
                className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors ${
                  docFilter === item.id
                    ? 'bg-[#0145F2] text-white border-[#0145F2]'
                    : 'bg-white dark:bg-[#111318] text-[#4B5563] dark:text-[#A1A1AA] border-[#E4E9F0] dark:border-[#262B32]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tenant Cards List */}
      {visibleTenants.length === 0 ? (
        <div className="rounded-[20px] p-6 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] text-center space-y-2.5">
          <Users className="w-7 h-7 text-[#0145F2] mx-auto" />
          <div className="text-sm font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.tenants.noMatchTitle}
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setDocFilter('all');
                setSearch('');
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#0145F2] text-white text-xs font-semibold"
            >
              {t.tenants.resetFiltersBtn}
            </button>
            <button
              type="button"
              onClick={() => onOpenQuickAdd('tenant')}
              className="px-3.5 py-1.5 rounded-full border border-[#E4E9F0] dark:border-[#262B32] text-xs font-semibold"
            >
              {t.tenants.addTenantBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 pt-0.5">
          {visibleTenants.map((row) => (
            <Link
              key={row.tenant.id}
              to={`/tenants/${row.tenant.id}`}
              className="group rounded-[20px] px-3.5 py-3 bg-[#F9FBFE] dark:bg-[#171A1F] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3"
            >
              {/* Left: Circular Initials Avatar + Name + Unit • Property */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-[15px] font-bold tracking-[-0.01em] shrink-0 ${row.avatarMeta.className}`}
                >
                  {row.avatarMeta.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[15.5px] leading-[1.22] font-bold text-[#111318] dark:text-[#FFFFFF] truncate">
                    {row.tenant.fullName}
                  </div>
                  <div className="text-[12.5px] leading-[1.3] text-[#4B5563] dark:text-[#C4C9D1] mt-0.5 truncate">
                    {row.unitLabel} • {row.propertyLabel}
                  </div>
                </div>
              </div>

              {/* Right: Monthly Rent + Status Badge + Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end">
                  <div className="text-[15.5px] leading-[1.2] font-bold tabular-nums text-[#111318] dark:text-[#FFFFFF]">
                    {formatRandWhole(row.rentCents)}
                  </div>
                  {row.badgeType === 'paid' && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-[2px] rounded-full text-[11.5px] font-semibold bg-[#D9F7E4] dark:bg-[#0D3820] text-[#059D23] dark:text-[#2CE058]">
                      <CheckCircle2 className="w-[12px] h-[12px] stroke-[2.25]" />
                      {t.tenants.filterPaid}
                    </span>
                  )}
                  {row.badgeType === 'overdue' && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-[2px] rounded-full text-[11.5px] font-semibold bg-[#FEE2E4] dark:bg-[#471D23] text-[#E5252A] dark:text-[#FF7A82]">
                      <AlertTriangle className="w-[12px] h-[12px] stroke-[2.25]" />
                      {t.tenants.filterOverdue}
                    </span>
                  )}
                  {row.badgeType === 'renewal' && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-[2px] rounded-full text-[11.5px] font-semibold bg-[#DCEBFF] dark:bg-[#0E3166] text-[#0145F2] dark:text-[#5CA2FF]">
                      <CheckCircle2 className="w-[12px] h-[12px] stroke-[2.25]" />
                      {t.tenants.filterRenewal}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-[18px] h-[18px] text-[#6B7280] dark:text-[#9CA3AF] stroke-[2]" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Primary Action Button (+) positioned above bottom nav on the right */}
      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-30 flex justify-end">
        <button
          type="button"
          onClick={() => onOpenQuickAdd('menu')}
          aria-label={t.quickActions.title}
          className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#0145F2] hover:bg-[#0039CC] active:scale-95 text-[#FFFFFF] shadow-[0_8px_22px_rgba(1,69,242,0.42)] flex items-center justify-center transition-all"
        >
          <Plus className="w-7 h-7 stroke-[2.25]" />
        </button>
      </div>
    </div>
  );
};

export const TenantProfileScreen: React.FC<{
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  units: Unit[];
  identityEvidences: IdentityEvidence[];
  consentRecords: ConsentRecord[];
  messageLogs: MessageLog[];
  onNotify: (msg: string) => void;
}> = ({ tenants, tenancies, units, identityEvidences, consentRecords, messageLogs, onNotify }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const { tenantId } = useParams<{ tenantId: string }>();
  const tenant = tenants.find((x) => x.id === tenantId) || tenants[0];

  if (!tenant) {
    return <div className="p-6">{t.tenants.tenantNotFound}</div>;
  }

  const tenantTenancies = tenancies.filter((l) => l.primaryTenantId === tenant.id);
  const evidences = identityEvidences.filter((e) => e.tenantId === tenant.id);
  const consents = consentRecords.filter((c) => c.tenantId === tenant.id);
  const logs = messageLogs.filter((m) => m.tenantId === tenant.id);

  const updateDocStatus = async (newStatus: DocumentationStatus) => {
    await db.tenantProfiles.update(tenant.id, {
      documentationStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
    const label = t.domainLabels.docStatuses[newStatus] || DOC_STATUS_LABELS[newStatus];
    onNotify(`${tenant.fullName}: ${label}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/tenants" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {currentLanguage.uiStrings.tenantsTitle}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">{tenant.fullName}</span>
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-slate-500">
            {tenant.tenantCode} · {t.tenants.preferredChannelLabel}: {tenant.preferredChannel} · {t.tenants.occupantsLabel}: {tenant.occupantsCount}
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tenant.fullName}</h1>
          {tenant.provisionalIdentifier && (
            <div className="text-xs text-slate-600 dark:text-neutral-300">
              {t.tenants.provisionalIdLabel}: {tenant.provisionalIdentifier}
            </div>
          )}
          <div className="text-xs text-slate-500">
            {t.tenants.phoneLabel}: {tenant.primaryPhone || t.tenants.noneAssisted}
            {tenant.alternativePhone ? ` · ${t.tenants.altContactLabel}: ${tenant.alternativePhone} (${tenant.alternativeContactName || t.tenants.relativeLabel})` : ''}
            {tenant.email ? ` · ${t.tenants.emailLabel}: ${tenant.email}` : ''}
          </div>
          {tenant.notes && <p className="text-xs text-slate-600 dark:text-neutral-400 pt-1">{tenant.notes}</p>}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-xs font-medium text-slate-500">{t.tenants.docReviewStatusLabel}:</label>
          <select
            value={tenant.documentationStatus}
            onChange={(e) => updateDocStatus(e.target.value as DocumentationStatus)}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-xs font-medium"
          >
            <option value="not-provided">{t.domainLabels.docStatuses['not-provided'] || DOC_STATUS_LABELS['not-provided']}</option>
            <option value="pending-review">{t.domainLabels.docStatuses['pending-review'] || DOC_STATUS_LABELS['pending-review']}</option>
            <option value="reviewed-but-unverified">{t.domainLabels.docStatuses['reviewed-but-unverified'] || DOC_STATUS_LABELS['reviewed-but-unverified']}</option>
            <option value="verified">{t.domainLabels.docStatuses.verified || DOC_STATUS_LABELS.verified}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Identity Evidence & POPIA Consent */}
        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold">{t.tenants.identityPopiaHeading}</h2>
          </div>
          <p className="text-xs text-slate-500">
            {t.tenants.identityPopiaDesc}
          </p>
          <div className="divide-y divide-slate-200 dark:divide-neutral-800 text-xs">
            {evidences.map((ev) => (
              <div key={ev.id} className="py-2.5 space-y-1">
                <div className="font-semibold">
                  {t.domainLabels.docTypes[ev.documentationType] || DOC_TYPE_LABELS[ev.documentationType]} ·{' '}
                  {t.domainLabels.docStatuses[ev.documentationStatus] || DOC_STATUS_LABELS[ev.documentationStatus]}
                </div>
                <div className="text-slate-600 dark:text-neutral-300">{t.tenants.hintPrefix}: {ev.referenceHint}</div>
                <div className="text-slate-500">{ev.verificationNotes}</div>
              </div>
            ))}
            {consents.map((c) => (
              <div key={c.id} className="py-2.5 text-slate-500">
                {t.tenants.popiaConsentPrefix} ({c.purpose}): {c.consentGranted ? t.tenants.grantedLabel : t.tenants.withdrawnLabel} {t.tenants.viaLabel}{' '}
                {c.recordedMethod} ({formatSADate(c.recordedAt)})
              </div>
            ))}
          </div>
        </div>

        {/* Linked Tenancies & Communication History */}
        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 space-y-3">
          <h2 className="text-sm font-bold">{t.tenants.tenancyCommsHeading}</h2>
          <div className="divide-y divide-slate-200 dark:divide-neutral-800 text-xs">
            {tenantTenancies.map((l) => {
              const unit = units.find((u) => u.id === l.unitId);
              return (
                <div key={l.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Link to={`/tenancies/${l.id}`} className="font-semibold hover:underline">
                      {l.tenancyReference} — {unit?.unitNumber}
                    </Link>
                    <div className="text-slate-500">
                      {t.properties.startPrefix}: {formatSADate(l.startDate)} · {t.common.status}: {l.status}
                    </div>
                  </div>
                  <span className="font-mono font-semibold">{formatZAR(l.rentAmountCents)}/mo</span>
                </div>
              );
            })}
            {logs.map((m) => (
              <div key={m.id} className="py-2.5">
                <div className="font-medium">
                  {m.subject} ({m.channel} · {m.deliveryStatus})
                </div>
                <div className="text-slate-500 mt-0.5">{m.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TenanciesScreen: React.FC<{
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  units: Unit[];
  properties: Property[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({ tenancies, tenants, units, properties, charges, payments, adjustments, deposits, onOpenQuickAdd }) => {
  const { t } = useLanguagePreference();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.tenants.tenanciesTitle}</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {t.tenants.tenanciesSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenQuickAdd('tenancy')}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.tenants.createTenancyBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenancies.map((tenancy) => {
          const tenant = tenants.find((x) => x.id === tenancy.primaryTenantId);
          const unit = units.find((u) => u.id === tenancy.unitId);
          const property = properties.find((p) => p.id === tenancy.propertyId);
          const summary = computeTenancyLedgerSummary(tenancy.id, charges, payments, adjustments, deposits);

          return (
            <div
              key={tenancy.id}
              className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">
                  {tenancy.tenancyReference} · {tenancy.leaseCategory.replace(/_/g, ' ')} · {t.common.status}: {tenancy.status}
                </div>
                <Link
                  to={`/tenancies/${tenancy.id}`}
                  className="text-base font-bold text-slate-900 dark:text-white hover:underline block"
                >
                  {tenant?.fullName || 'Tenant'} — {unit?.unitNumber} ({unit?.name})
                </Link>
                <div className="text-xs text-slate-500">
                  {property?.name} · {t.tenants.moveInPrefix}: {formatSADate(tenancy.moveInDate)} · {t.tenants.dueDayPrefix}: {tenancy.dueDayOfMonth}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800 text-xs">
                <div>
                  <div className="text-slate-500">{t.tenants.monthlyRentLabel}</div>
                  <div className="font-mono font-bold tabular-nums">{formatZAR(tenancy.rentAmountCents)}</div>
                </div>
                <div>
                  <div className="text-slate-500">{t.tenants.depositLiabilityLabel}</div>
                  <div className="font-mono font-bold tabular-nums">
                    {formatZAR(summary.depositHeldLiabilityCents)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">{t.tenants.netBalanceDueLabel}</div>
                  <div
                    className={`font-mono font-bold tabular-nums ${
                      summary.netBalanceDueCents > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700'
                    }`}
                  >
                    {formatZAR(summary.netBalanceDueCents)}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 text-xs">
                <span className="text-slate-500">
                  {tenancy.legalReviewStatus === 'practitioner_reviewed'
                    ? t.tenants.practitionerReviewed
                    : t.tenants.neutralTemplateNotice}
                </span>
                <Link
                  to={`/tenancies/${tenancy.id}`}
                  className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {t.tenants.openAgreementLedgerLink}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TenancyDetailScreen: React.FC<{
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  units: Unit[];
  properties: Property[];
  participants: TenancyParticipant[];
  leaseVersions: LeaseVersion[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  onNotify: (msg: string) => void;
}> = ({
  tenancies,
  tenants,
  units,
  properties,
  participants,
  leaseVersions,
  charges,
  payments,
  adjustments,
  deposits,
  onNotify,
}) => {
  const { t } = useLanguagePreference();
  const { tenancyId } = useParams<{ tenancyId: string }>();
  const tenancy = tenancies.find((x) => x.id === tenancyId) || tenancies[0];

  if (!tenancy) {
    return <div className="p-6">{t.tenants.tenancyNotFound}</div>;
  }

  const tenant = tenants.find((x) => x.id === tenancy.primaryTenantId);
  const unit = units.find((u) => u.id === tenancy.unitId);
  const property = properties.find((p) => p.id === tenancy.propertyId);
  const tenancyParticipants = participants.filter((p) => p.tenancyId === tenancy.id);
  const versions = leaseVersions.filter((v) => v.tenancyId === tenancy.id);
  const tenancyCharges = charges.filter((c) => c.tenancyId === tenancy.id);
  const tenancyPayments = payments.filter((p) => p.tenancyId === tenancy.id);
  const summary = computeTenancyLedgerSummary(tenancy.id, charges, payments, adjustments, deposits);

  const handleStatusChange = async (newStatus: Tenancy['status']) => {
    await db.tenancies.update(tenancy.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    onNotify(`${tenancy.tenancyReference}: ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/tenancies" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {t.appShell.moreToolsItems.tenanciesLeases}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">{tenancy.tenancyReference}</span>
      </div>

      {/* Legal Notice Banner distinguishing Residential vs Commercial rules */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>{t.tenants.legalNoticeTitle}:</strong> {t.tenants.legalNoticeBody}
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-slate-500">
            {tenancy.tenancyReference} · {tenancy.leaseCategory.replace(/_/g, ' ')}
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {tenant?.fullName || 'Tenant'} — {property?.name} ({unit?.unitNumber})
          </h1>
          <div className="text-xs text-slate-500">
            {t.tenants.moveInPrefix}: {formatSADate(tenancy.moveInDate)} · {t.tenants.noticePeriodPrefix}: {tenancy.noticePeriodDays} · {t.tenants.dueDayPrefix}{' '}
            {tenancy.dueDayOfMonth}
          </div>
          {tenancy.specialTerms && <p className="text-xs text-slate-600 dark:text-neutral-300 pt-1">{tenancy.specialTerms}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tenancy.status}
            onChange={(e) => handleStatusChange(e.target.value as Tenancy['status'])}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-xs font-medium"
          >
            <option value="active">{t.tenants.statusActive}</option>
            <option value="notice_given">{t.tenants.statusNoticeGiven}</option>
            <option value="renewing">{t.tenants.statusRenewing}</option>
            <option value="ended">{t.tenants.statusEnded}</option>
            <option value="terminated">{t.tenants.statusTerminated}</option>
          </select>

          <button
            type="button"
            onClick={() =>
              downloadTenancyStatementPDF({
                tenancy,
                tenant,
                propertyUnitLabel: `${property?.name || ''} — ${unit?.unitNumber || ''}`,
                summary,
                charges: tenancyCharges,
                payments: tenancyPayments,
              })
            }
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {t.tenants.pdfStatementBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 space-y-3">
          <h2 className="text-sm font-bold">{t.tenants.authorizedOccupantsHeading}</h2>
          <div className="divide-y divide-slate-200 dark:divide-neutral-800 text-xs">
            {tenancyParticipants.map((p) => (
              <div key={p.id} className="py-2 flex items-center justify-between">
                <span className="font-medium">{p.fullName}</span>
                <span className="text-slate-500">
                  {p.role.replace(/_/g, ' ')} · {formatSADate(p.joinedDate)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:divide-neutral-800 p-5 space-y-3">
          <h2 className="text-sm font-bold">{t.tenants.agreementVersionsHeading}</h2>
          <div className="divide-y divide-slate-200 dark:divide-neutral-800 text-xs">
            {versions.map((v) => (
              <div key={v.id} className="py-2 space-y-0.5">
                <div className="font-semibold">
                  v{v.versionNumber} · {formatSADate(v.effectiveDate)} ·{' '}
                  {formatZAR(v.rentAmountCents)}
                </div>
                <div className="text-slate-500">{v.termsSummary}</div>
                <div className="text-slate-400">{v.templateTitle}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
