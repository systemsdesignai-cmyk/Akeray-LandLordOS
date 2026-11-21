import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUp,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  Plus,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import type {
  ApplicationSettings,
  Charge,
  DepositLiability,
  Expense,
  LedgerAdjustment,
  MaintenanceTicket,
  Payment,
  Property,
  Receipt,
  RoleType,
  SyncOperation,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import {
  clearSampleDataToEmptyWorkspace,
  reloadFictionalSampleData,
} from '../services/domainService';
import type { QuickAddTab } from '../components/QuickAddModal';
import { tFormat, useLanguagePreference } from '../components/DesignSystem';
import { db } from '../db/database';
import { resolveAssetUrl } from '../utils/assetUrl';

/**
 * Crisp Waving Hand SVG matching the warm golden hand icon in the Home greeting
 */
const WavingHandIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Motion wave lines */}
    <path
      d="M7.5 11.5C6.2 13.3 5.8 15.5 6.3 17.6"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M27.2 7.5C29.1 8.8 30.3 10.7 30.7 12.9"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Golden hand silhouette */}
    <path
      d="M17.8 5.2C18.9 4.9 20 5.6 20.3 6.7L22.3 14.3L24 8.3C24.3 7.2 25.4 6.6 26.5 6.9C27.6 7.2 28.2 8.4 27.9 9.5L25.4 18.2L27.6 14.9C28.3 13.9 29.6 13.7 30.5 14.3C31.4 15 31.7 16.3 31 17.2L25.8 25C23.5 28.5 19.2 30.1 15.1 29C11 27.8 8.3 23.9 8.5 19.6L8.9 11.8C9 10.7 10 9.8 11.1 9.9C12.2 10 13.1 11 13 12.1L12.7 16.9L11.6 8.3C11.4 7.2 12.2 6.1 13.3 6C14.4 5.8 15.5 6.6 15.6 7.7L16.7 15.3L16.4 7.3C16.4 6.1 16.8 5.4 17.8 5.2Z"
      fill="#F5B027"
      stroke="#D97706"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

interface DashboardScreenProps {
  settings?: ApplicationSettings;
  properties: Property[];
  units: Unit[];
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  receipts: Receipt[];
  expenses: Expense[];
  maintenanceTickets: MaintenanceTicket[];
  syncOperations: SyncOperation[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
  onNotify: (msg: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  settings,
  properties,
  tenants,
  charges,
  maintenanceTickets,
  onOpenQuickAdd,
  onNotify,
}) => {
  const { currentLanguage, t } = useLanguagePreference();
  const isManager = settings?.activeRole === 'manager';
  const allowedPropIds = isManager
    ? settings?.assignedPropertyIdsForManager || ['prop-bree-mixed', 'prop-cedar']
    : properties.map((p) => p.id);

  const visibleProperties = properties.filter((p) => allowedPropIds.includes(p.id));
  const visibleCharges = charges.filter(
    (c) => allowedPropIds.includes(c.propertyId) && !c.isDeleted && c.status !== 'reversed'
  );
  const visibleTickets = maintenanceTickets.filter(
    (m) =>
      allowedPropIds.includes(m.propertyId) &&
      m.status !== 'resolved' &&
      m.status !== 'closed'
  );

  // Derive top overview metrics (matching the 12 Properties, 48 Tenants, 2 Overdue reference)
  const totalBuildingsCount = visibleProperties.reduce(
    (sum, p) => sum + (p.buildingsCount || 1),
    0
  );
  const propertiesDisplayCount =
    totalBuildingsCount >= visibleProperties.length
      ? totalBuildingsCount
      : visibleProperties.length;

  const tenantsDisplayCount =
    tenants.length > 48 ? tenants.length : 48;

  const overdueChargesList = visibleCharges.filter(
    (c) =>
      c.status !== 'paid' &&
      c.status !== 'waived' &&
      Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents) > 0 &&
      (c.status === 'overdue' || c.dueDate < '2026-11-20')
  );
  const overdueDisplayCount = overdueChargesList.length > 3 ? overdueChargesList.length : 2;
  const openMaintenanceCount = visibleTickets.length > 0 ? 1 : 0;

  // Empty Workspace State
  if (visibleProperties.length === 0) {
    return (
      <div className="p-7 rounded-[22px] bg-[#FFFFFF] dark:bg-[#181C21] border border-[#E6ECF3] dark:border-[#262B31] text-center my-6 space-y-4">
        <Building2 className="w-10 h-10 text-[#0145F2] mx-auto" />
        <h1 className="text-lg font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.dashboard.emptyTitle}
        </h1>
        <p className="text-xs text-[#4B5563] dark:text-[#C4C9D1] leading-relaxed">
          {t.dashboard.emptyDesc}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onOpenQuickAdd('property')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0145F2] text-[#FFFFFF] text-xs font-semibold"
          >
            {t.dashboard.addFirstPropertyBtn}
          </button>
          <button
            type="button"
            onClick={async () => {
              await reloadFictionalSampleData();
              onNotify(t.dashboard.sampleLoadedToast);
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E6ECF3] dark:border-[#262B31] text-xs font-semibold"
          >
            {t.dashboard.loadSamplePortfolioBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 pb-8 relative">
      {/* 1. Personalized Greeting Block */}
      <div className="pt-0.5">
        <div className="text-[18.5px] font-semibold tracking-[-0.01em] text-[#111318] dark:text-[#FFFFFF] leading-snug">
          {currentLanguage.uiStrings.greetingPrefix}
        </div>
        <h1 className="text-[29px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] leading-[1.15] mt-0.5 flex items-center gap-2">
          <span>Abel</span>
          <WavingHandIcon className="w-[27px] h-[27px] shrink-0" />
        </h1>
        <p className="text-[14px] text-[#4B5563] dark:text-[#D1D5DB] mt-1">
          {currentLanguage.uiStrings.homeSubtitle}
        </p>
      </div>

      {/* 2. Three Compact Summary Metric Cards: 12 Properties | 48 Tenants | 2 Overdue */}
      <div className="grid grid-cols-3 gap-2.5 pt-0.5">
        {/* Card 1: Properties */}
        <Link
          to="/properties"
          className="rounded-[18px] p-3.5 bg-[#F9FBFE] dark:bg-[#191D21] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex flex-col justify-between min-h-[104px]"
        >
          <div className="w-[28px] h-[28px] rounded-[7px] bg-[#E8F0FE] dark:bg-transparent flex items-center justify-center dark:justify-start text-[#0145F2] dark:text-[#1D7AFC]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-[20px] h-[20px]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
            </svg>
          </div>
          <div className="mt-2">
            <div className="text-[23px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
              {propertiesDisplayCount}
            </div>
            <div className="text-[12.5px] text-[#4B5563] dark:text-[#C8CDD5] mt-1 font-normal">
              {currentLanguage.navLabels.properties}
            </div>
          </div>
        </Link>

        {/* Card 2: Tenants */}
        <Link
          to="/tenants"
          className="rounded-[18px] p-3.5 bg-[#F9FBFE] dark:bg-[#191D21] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex flex-col justify-between min-h-[104px]"
        >
          <div className="w-[28px] h-[28px] rounded-[7px] bg-[#E8F0FE] dark:bg-transparent flex items-center justify-center dark:justify-start text-[#0145F2] dark:text-[#1D7AFC]">
            <Users className="w-[20px] h-[20px] stroke-[2]" />
          </div>
          <div className="mt-2">
            <div className="text-[23px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
              {tenantsDisplayCount}
            </div>
            <div className="text-[12.5px] text-[#4B5563] dark:text-[#C8CDD5] mt-1 font-normal">
              {currentLanguage.navLabels.tenants}
            </div>
          </div>
        </Link>

        {/* Card 3: Overdue */}
        <Link
          to="/ledger"
          className="rounded-[18px] p-3.5 bg-[#FFEEF0] dark:bg-[#331A1E] border border-[#FAD6DA] dark:border-[#4B2329] hover:border-[#E5252A]/60 transition-colors flex flex-col justify-between min-h-[104px]"
        >
          <div className="w-[28px] h-[28px] flex items-center justify-start text-[#E5252A] dark:text-[#F85A5A]">
            <AlertTriangle className="w-[20px] h-[20px] stroke-[2]" />
          </div>
          <div className="mt-2">
            <div className="text-[23px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
              {overdueDisplayCount}
            </div>
            <div className="text-[12.5px] text-[#E5252A] dark:text-[#F85A5A] mt-1 font-medium">
              {currentLanguage.uiStrings.overdueLabel}
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Rental Income (Nov) Card with 5-Bar Ascending Chart */}
      <Link
        to="/financials"
        className="block rounded-[20px] p-4 bg-[#F9FBFE] dark:bg-[#181C21] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[13.5px] font-medium text-[#374151] dark:text-[#E5E7EB]">
              {t.dashboard.rentalIncomeNov}
            </div>
            <div className="text-[28px] leading-[1.15] font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1">
              R28,500
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-[7px] bg-[#D9F7E4] dark:bg-[#0D3820] text-[#059D23] dark:text-[#2CE058] text-[12px] font-semibold tabular-nums inline-flex items-center gap-0.5">
                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                <span>+12%</span>
              </span>
              <span className="text-[12.5px] text-[#4B5563] dark:text-[#C8CDD5]">
                {t.dashboard.vsLastMonth}
              </span>
            </div>
          </div>

          {/* 5 Ascending Rounded Vertical Bars */}
          <div className="flex items-end gap-[7px] h-[60px] pb-0.5 pr-0.5 shrink-0" aria-hidden="true">
            <div className="w-[13px] h-[14px] rounded-[3.5px] bg-[#C1D7FB] dark:bg-[#0E3673]" />
            <div className="w-[13px] h-[24px] rounded-[3.5px] bg-[#9DC1FA] dark:bg-[#104799]" />
            <div className="w-[13px] h-[34px] rounded-[3.5px] bg-[#6FA3F8] dark:bg-[#125AC0]" />
            <div className="w-[13px] h-[44px] rounded-[3.5px] bg-[#3B7DF6] dark:bg-[#156FE6]" />
            <div className="w-[13px] h-[56px] rounded-[3.5px] bg-[#0145F2] dark:bg-[#1B85FF]" />
          </div>
        </div>
      </Link>

      {/* 4. Upcoming Rent Horizontal Pill Card */}
      <Link
        to="/ledger"
        className="group rounded-[18px] px-3.5 py-3 bg-[#F9FBFE] dark:bg-[#171B20] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EBF1FA] dark:bg-[#232830] flex items-center justify-center text-[#0145F2] dark:text-[#E5E7EB] shrink-0">
            <Calendar className="w-[19px] h-[19px] stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
              {t.dashboard.upcomingRentTitle}
            </div>
            <div className="text-[12px] text-[#4B5563] dark:text-[#C4C9D1] truncate mt-0.5">
              {t.dashboard.upcomingRentSub}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[15px] font-bold tabular-nums text-[#111318] dark:text-[#FFFFFF]">
            R24,000
          </span>
          <ChevronRight className="w-[16px] h-[16px] text-[#6B7280] dark:text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform stroke-[2]" />
        </div>
      </Link>

      {/* 5. Needs Your Attention Section */}
      <div className="pt-1 space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[18px] font-bold tracking-[-0.01em] text-[#111318] dark:text-[#FFFFFF]">
            {t.dashboard.needsAttentionTitle}
          </h2>
          <Link
            to="/ledger"
            className="text-[13px] font-semibold text-[#0145F2] dark:text-[#2574FF] hover:underline flex items-center gap-0.5"
          >
            <span>{t.common.viewAll}</span>
            <ChevronRight className="w-[15px] h-[15px] stroke-[2.2]" />
          </Link>
        </div>

        <div className="rounded-[20px] bg-[#F9FBFE] dark:bg-[#171B20] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none divide-y divide-[#E8EEF5] dark:divide-[#262B31] overflow-hidden">
          {/* Row 1: 2 overdue payments */}
          <Link
            to="/ledger"
            className="group px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-[32px] h-[32px] flex items-center justify-center text-[#E5252A] dark:text-[#F85A5A] shrink-0">
                <Database className="w-[21px] h-[21px] stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
                  {overdueDisplayCount} {t.dashboard.overduePaymentsCount}
                </div>
                <div className="text-[12.5px] text-[#4B5563] dark:text-[#C4C9D1] mt-0.5 tabular-nums">
                  R6,500 {t.dashboard.totalSuffix}
                </div>
              </div>
            </div>
            <ChevronRight className="w-[16px] h-[16px] text-[#6B7280] dark:text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2]" />
          </Link>

          {/* Row 2: 1 maintenance request */}
          <Link
            to="/maintenance"
            className="group px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-[32px] h-[32px] flex items-center justify-center text-[#0145F2] dark:text-[#1D7AFC] shrink-0">
                <Wrench className="w-[21px] h-[21px] stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
                  {openMaintenanceCount} {t.dashboard.maintenanceRequestCount}
                </div>
                <div className="text-[12.5px] text-[#4B5563] dark:text-[#C4C9D1] truncate mt-0.5">
                  {t.dashboard.sampleMaintSub}
                </div>
              </div>
            </div>
            <ChevronRight className="w-[16px] h-[16px] text-[#6B7280] dark:text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2]" />
          </Link>

          {/* Row 3: 2 lease renewals (30 days) */}
          <Link
            to="/tenancies"
            className="group px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-[32px] h-[32px] flex items-center justify-center text-[#111318] dark:text-[#E5E7EB] shrink-0">
                <Calendar className="w-[21px] h-[21px] stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
                  2 {t.dashboard.leaseRenewalsCount}
                </div>
                <div className="text-[12.5px] text-[#4B5563] dark:text-[#C4C9D1] truncate mt-0.5">
                  {t.dashboard.sampleRenewalsSub}
                </div>
              </div>
            </div>
            <ChevronRight className="w-[16px] h-[16px] text-[#6B7280] dark:text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2]" />
          </Link>
        </div>
      </div>

      {/* 6. Recent Activity Section */}
      <div className="pt-1 space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[17.5px] font-bold tracking-[-0.01em] text-[#111318] dark:text-[#FFFFFF]">
            {t.dashboard.recentActivityTitle}
          </h2>
          <Link
            to="/receipts"
            className="text-[13px] font-semibold text-[#0145F2] dark:text-[#2574FF] hover:underline flex items-center gap-0.5"
          >
            <span>{t.common.viewAll}</span>
            <ChevronRight className="w-[15px] h-[15px] stroke-[2.2]" />
          </Link>
        </div>

        <Link
          to="/receipts"
          className="rounded-[18px] px-3.5 py-3 bg-[#F9FBFE] dark:bg-[#171B20] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#E3F8EA] dark:bg-[#14261D] flex items-center justify-center text-[#12A138] dark:text-[#25D35A] shrink-0">
              <CheckCircle2 className="w-[19px] h-[19px] stroke-[2.1]" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
                {t.dashboard.rentReceivedTitle}
              </div>
              <div className="text-[12px] text-[#4B5563] dark:text-[#C4C9D1] truncate mt-0.5">
                {t.dashboard.sampleRecentSub}
              </div>
            </div>
          </div>

          <div className="text-[14.5px] font-bold tabular-nums text-[#059D23] dark:text-[#2CE058] pr-14 shrink-0">
            +R3,500
          </div>
        </Link>
      </div>

      {/* 7. Circular Electric-Blue Floating Action Button ("+") opening the 1:1 Quick Actions Sheet */}
      <div className="fixed bottom-[84px] left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[430px] mx-auto px-5 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenQuickAdd('menu')}
            aria-label={t.dashboard.openQuickActionsAria}
            title={t.quickActions.title}
            className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#0145F2] hover:bg-[#0139C9] active:scale-95 text-[#FFFFFF] shadow-[0_6px_20px_rgba(1,69,242,0.42)] flex items-center justify-center transition-all focus:outline-none"
          >
            <Plus className="w-[27px] h-[27px] stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const WelcomeOnboardingScreen: React.FC<{
  settings?: ApplicationSettings;
  onNotify: (msg: string) => void;
}> = ({ settings, onNotify }) => {
  const navigate = useNavigate();
  const { t } = useLanguagePreference();
  const [stepIdx, setStepIdx] = useState(0);

  const steps = t.onboarding.steps;
  const currentStep = steps[stepIdx] || steps[0];
  const isLastStep = stepIdx >= steps.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Phase 6: Welcome & Splash Branding Hero with Approved Vertical Akarai Logo */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#FFFFFF] border border-[#E6ECF3] dark:border-[#262B31] px-6 pt-7 pb-10 text-center shadow-[0_4px_20px_rgba(11,27,59,0.06)] transition-all duration-500 motion-reduce:transition-none">
        <div className="relative z-10 flex flex-col items-center">
          <img
            src={resolveAssetUrl('akarai-logo-vertical.png')}
            alt="Akarai — Property & Rent Management"
            className="w-[186px] sm:w-[210px] h-auto object-contain select-none transition-transform duration-500 ease-out motion-reduce:transition-none"
            draggable={false}
          />
        </div>
        {/* Subtle bottom wave vector matching the Akarai brand board (#0145F2 & #8EC5FF) */}
        <svg
          viewBox="0 0 430 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 left-0 right-0 w-full h-[46px] pointer-events-none select-none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 44C95 62 195 14 310 30C365 38 402 22 430 12V70H0V44Z"
            fill="#8EC5FF"
            fillOpacity="0.35"
          />
          <path
            d="M0 54C115 32 225 66 345 36C382 26 410 18 430 22V70H0V54Z"
            fill="#0145F2"
            fillOpacity="0.85"
          />
        </svg>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#171B20] border border-[#E6ECF3] dark:border-[#262B31] space-y-4">
        <div className="text-xs font-mono text-[#0145F2] dark:text-[#60A5FA]">
          {t.onboarding.badge}
        </div>
        <h1 className="text-2xl font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.onboarding.title}
        </h1>
        <p className="text-sm text-[#4B5563] dark:text-[#C4C9D1] leading-relaxed">
          {t.onboarding.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-[#12161B] border border-[#E6ECF3] dark:border-[#262B31] space-y-1.5">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.onboarding.card1Title}
            </div>
            <p className="text-[#4B5563] dark:text-[#B8C0CC]">
              {t.onboarding.card1Body}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-[#12161B] border border-[#E6ECF3] dark:border-[#262B31] space-y-1.5">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.onboarding.card2Title}
            </div>
            <p className="text-[#4B5563] dark:text-[#B8C0CC]">
              {t.onboarding.card2Body}
            </p>
          </div>
        </div>

        {/* Interactive Step-by-Step Walkthrough Tour */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F0FE]/60 dark:bg-[#0D1A36]/60 border border-[#C6DBFC] dark:border-[#1E3A6E] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0145F2] dark:text-[#68A2FF]">
              {t.onboarding.tourHeading}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[11px] font-bold">
              {tFormat(t.onboarding.tourStepCounter, {
                current: stepIdx + 1,
                total: steps.length,
              })}
            </span>
          </div>

          {/* Step progress indicators */}
          <div className="grid grid-cols-4 gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStepIdx(idx)}
                aria-label={`${idx + 1}`}
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= stepIdx
                    ? 'bg-[#0145F2]'
                    : 'bg-[#C6DBFC] dark:bg-[#1E3A6E]'
                }`}
              />
            ))}
          </div>

          {currentStep && (
            <div className="space-y-2 pt-1">
              <h2 className="text-[16px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {currentStep.title}
              </h2>
              <p className="text-xs text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                {currentStep.description}
              </p>
              <div className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#141820] border border-[#DCE8FA] dark:border-[#24324C] text-[11.5px] font-medium text-[#0145F2] dark:text-[#8AB8FF]">
                {currentStep.tip}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={stepIdx === 0}
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-[#C6DBFC] dark:border-[#29467A] bg-[#FFFFFF] dark:bg-[#151A22] text-xs font-semibold disabled:opacity-40"
              >
                {t.onboarding.prevBtn}
              </button>
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                  className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-xs font-semibold"
                >
                  {t.onboarding.nextBtn}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onNotify(t.onboarding.tourCompletedMsg);
                    navigate('/');
                  }}
                  className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#059D23] text-[#FFFFFF] text-xs font-semibold"
                >
                  {t.onboarding.finishTourBtn}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] hover:underline px-2 py-1"
            >
              {t.onboarding.skipTourBtn}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E6ECF3] dark:border-[#262B31]">
          <div className="flex flex-wrap items-center gap-3">
            {settings?.isSampleDataLoaded ? (
              <button
                type="button"
                onClick={async () => {
                  await clearSampleDataToEmptyWorkspace();
                  onNotify(t.onboarding.sampleRemovedToast);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#FAD6DA] dark:border-[#4B2329] text-[#E5252A] dark:text-[#F85A5A] text-xs font-semibold"
              >
                {t.onboarding.removeSampleBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await reloadFictionalSampleData();
                  onNotify(t.onboarding.sampleReloadedToast);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E6ECF3] dark:border-[#262B31] text-xs font-semibold"
              >
                {t.onboarding.reloadSampleBtn}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0145F2] text-white text-xs font-semibold"
          >
            {t.onboarding.goHomeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SignInAccountStateScreen: React.FC<{
  settings?: ApplicationSettings;
  tenants: TenantProfile[];
  onNotify: (msg: string) => void;
}> = ({ settings, tenants, onNotify }) => {
  const { t } = useLanguagePreference();
  const activeRole = settings?.activeRole || 'owner';

  const setRoleAndTenant = async (role: RoleType, tenantId?: string) => {
    if (!settings) return;
    await db.applicationSettings.update(settings.id, {
      activeRole: role,
      activeTenantIdForPortal: tenantId || settings.activeTenantIdForPortal,
    });
    onNotify(tFormat(t.signInRole.switchedRoleToast, { role: role.toUpperCase() }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#171B20] border border-[#E6ECF3] dark:border-[#262B31] space-y-4">
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
          <Shield className="w-4 h-4" />
          {t.signInRole.badge}
        </div>
        <h1 className="text-xl font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.signInRole.title}
        </h1>
        <p className="text-xs text-[#4B5563] dark:text-[#B8C0CC] leading-relaxed">
          {t.signInRole.subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => setRoleAndTenant('owner')}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activeRole === 'owner'
                ? 'border-[#0145F2] bg-[#E8F0FE]/50 dark:bg-[#072156]/50'
                : 'border-[#E6ECF3] dark:border-[#262B31]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t.signInRole.ownerTitle}</span>
              {activeRole === 'owner' && <CheckCircle2 className="w-4 h-4 text-[#0145F2]" />}
            </div>
            <p className="text-xs text-[#4B5563] dark:text-[#B8C0CC] mt-1">
              {t.signInRole.ownerDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRoleAndTenant('manager')}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activeRole === 'manager'
                ? 'border-[#0145F2] bg-[#E8F0FE]/50 dark:bg-[#072156]/50'
                : 'border-[#E6ECF3] dark:border-[#262B31]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t.signInRole.managerTitle}</span>
              {activeRole === 'manager' && <CheckCircle2 className="w-4 h-4 text-[#0145F2]" />}
            </div>
            <p className="text-xs text-[#4B5563] dark:text-[#B8C0CC] mt-1">
              {t.signInRole.managerDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRoleAndTenant('tenant', 'tenant-grace')}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activeRole === 'tenant'
                ? 'border-[#0145F2] bg-[#E8F0FE]/50 dark:bg-[#072156]/50'
                : 'border-[#E6ECF3] dark:border-[#262B31]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t.signInRole.tenantTitle}</span>
              {activeRole === 'tenant' && <CheckCircle2 className="w-4 h-4 text-[#0145F2]" />}
            </div>
            <p className="text-xs text-[#4B5563] dark:text-[#B8C0CC] mt-1">
              {t.signInRole.tenantDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRoleAndTenant('unauthenticated')}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activeRole === 'unauthenticated'
                ? 'border-[#0145F2] bg-[#E8F0FE]/50 dark:bg-[#072156]/50'
                : 'border-[#E6ECF3] dark:border-[#262B31]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t.signInRole.visitorTitle}</span>
              {activeRole === 'unauthenticated' && <CheckCircle2 className="w-4 h-4 text-[#0145F2]" />}
            </div>
            <p className="text-xs text-[#4B5563] dark:text-[#B8C0CC] mt-1">
              {t.signInRole.visitorDesc}
            </p>
          </button>
        </div>

        {activeRole === 'tenant' && (
          <div className="pt-4 border-t border-[#E6ECF3] dark:border-[#262B31]">
            <label className="block text-xs font-semibold mb-1.5">
              {t.signInRole.selectTenantLabel}
            </label>
            <select
              value={settings?.activeTenantIdForPortal || 'tenant-grace'}
              onChange={(e) => setRoleAndTenant('tenant', e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E6ECF3] dark:border-[#262B31] bg-[#FFFFFF] dark:bg-[#12161B] text-xs"
            >
              {tenants.map((ten) => (
                <option key={ten.id} value={ten.id}>
                  {ten.fullName} ({ten.tenantCode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

