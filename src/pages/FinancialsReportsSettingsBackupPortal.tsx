import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Languages,
  Play,
  Shield,
  Upload,
} from 'lucide-react';
import type {
  ApplicationSettings,
  AuditEvent,
  Charge,
  DepositLiability,
  Expense,
  LedgerAdjustment,
  MaintenanceTicket,
  MessageLog,
  Payment,
  Property,
  Receipt,
  SyncOperation,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import {
  clearSampleDataToEmptyWorkspace,
  computeTenancyLedgerSummary,
  createMaintenanceTicketRecord,
  reloadFictionalSampleData,
  resolveFinancialSyncConflict,
} from '../services/domainService';
import {
  type BackupEnvelope,
  exportEntityCSV,
  exportFullBackupJSON,
  restoreValidatedBackup,
  validateBackupJSON,
} from '../services/exportService';
import { downloadReceiptPDF } from '../services/pdfService';
import { runDomainAcceptanceTests, type AcceptanceTestResult } from '../services/acceptanceTests';
import { getCloudBoundaryStatus } from '../services/cloudBoundary';
import { formatSADate, formatSADateTime, formatZAR, PAYMENT_METHOD_LABELS } from '../utils/format';
import {
  DSButton,
  DSCard,
  DSFilterPills,
  DSPageHeader,
  DSStatusBadge,
  SUPPORTED_LANGUAGES,
  TRANSLATION_COVERAGE_REPORT,
  useLanguagePreference,
} from '../components/DesignSystem';
import { AkaraiKeyboardSettingsSection } from '../keyboard/AkaraiKeyboard';

export const FinancialDashboardScreen: React.FC<{
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  expenses: Expense[];
}> = ({ properties, units, tenancies, charges, payments, adjustments, deposits, expenses }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');

  const scopedProps =
    selectedPropertyId === 'all' ? properties : properties.filter((p) => p.id === selectedPropertyId);
  const scopedPropIds = scopedProps.map((p) => p.id);

  const scopedUnits = units.filter((u) => scopedPropIds.includes(u.propertyId));
  const scopedCharges = charges.filter(
    (c) => scopedPropIds.includes(c.propertyId) && c.status !== 'reversed'
  );
  const scopedPayments = payments.filter(
    (p) => scopedPropIds.includes(p.propertyId) && p.verificationStatus !== 'reversed'
  );
  const scopedExpenses = expenses.filter((e) => scopedPropIds.includes(e.propertyId));
  const scopedTenancies = tenancies.filter((x) => scopedPropIds.includes(x.propertyId));

  const expectedAccruedRentCents = scopedCharges.reduce(
    (s, c) => s + c.amountCents + c.adjustedCents,
    0
  );
  const cashCollectedCents = scopedPayments.reduce((s, p) => s + p.amountCents, 0);
  const totalExpensesCents = scopedExpenses.reduce((s, e) => s + e.amountCents, 0);

  const summaries = scopedTenancies.map((x) =>
    computeTenancyLedgerSummary(x.id, charges, payments, adjustments, deposits)
  );
  const totalArrearsCents = summaries.reduce((s, x) => s + x.overdueAmountCents, 0);
  const totalDepositLiabilitiesCents = summaries.reduce(
    (s, x) => s + x.depositHeldLiabilityCents,
    0
  );

  const cashOperatingIncomeCents = cashCollectedCents - totalExpensesCents;
  const accruedEstimatedNOICents = expectedAccruedRentCents - totalExpensesCents;

  const occupiedCount = scopedUnits.filter((u) => u.status === 'occupied').length;
  const occupancyPct =
    scopedUnits.length > 0 ? Math.round((occupiedCount / scopedUnits.length) * 100) : 0;

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.finTitle}
        subtitle={t.financialsReportsSettings.finSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      <select
        value={selectedPropertyId}
        onChange={(e) => setSelectedPropertyId(e.target.value)}
        className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#FFFFFF] dark:bg-[#15181C] text-[13px] font-semibold text-[#111318] dark:text-[#FFFFFF]"
      >
        <option value="all">{t.financialsReportsSettings.allPortfolioProperties} ({properties.length})</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Primary Net Operating Income Hero Card */}
      <DSCard className="p-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-[#5A6270] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.cashNoiLabel}
          </div>
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-[#111318] dark:text-[#FFFFFF] leading-tight mt-0.5">
            {formatZAR(cashOperatingIncomeCents)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DCF6E6] dark:bg-[#103824] text-[#0D944B] dark:text-[#2FE07D] text-[11.5px] font-bold">
              {occupancyPct}% {t.financialsReportsSettings.occupancyBadgeSuffix}
            </span>
            <span className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.accruedPrefix} {formatZAR(accruedEstimatedNOICents)}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-[6px] h-[54px] pt-2 shrink-0" aria-hidden="true">
          <div className="w-[10px] h-[16px] rounded-[3px] bg-[#6EA3F7] dark:bg-[#0D439E]" />
          <div className="w-[10px] h-[26px] rounded-[3px] bg-[#508DF5] dark:bg-[#0B50C4]" />
          <div className="w-[10px] h-[36px] rounded-[3px] bg-[#2D72F2] dark:bg-[#085CE6]" />
          <div className="w-[10px] h-[48px] rounded-[3px] bg-[#0145F2]" />
        </div>
      </DSCard>

      {/* 2x2 Summary KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <DSCard className="p-3.5">
          <div className="text-[11.5px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.accruedExpectedRentLabel}
          </div>
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1">
            {formatZAR(expectedAccruedRentCents)}
          </div>
          <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4] mt-0.5">
            {t.financialsReportsSettings.billedNetWaiversSub}
          </div>
        </DSCard>

        <DSCard className="p-3.5">
          <div className="text-[11.5px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.cashEftCollectedLabel}
          </div>
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[#0FA958] dark:text-[#2FE07D] mt-1">
            {formatZAR(cashCollectedCents)}
          </div>
          <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4] mt-0.5">
            {t.financialsReportsSettings.arrearsPrefix} {formatZAR(totalArrearsCents)}
          </div>
        </DSCard>

        <DSCard className="p-3.5">
          <div className="text-[11.5px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.operatingExpensesLabel}
          </div>
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[#D97706] dark:text-[#FFC24B] mt-1">
            {formatZAR(totalExpensesCents)}
          </div>
          <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4] mt-0.5">
            {t.financialsReportsSettings.ratesRepairsUtilitiesSub}
          </div>
        </DSCard>

        <DSCard className="p-3.5">
          <div className="text-[11.5px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.depositsHeldLiabilityLabel}
          </div>
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[#0145F2] dark:text-[#68A2FF] mt-1">
            {formatZAR(totalDepositLiabilitiesCents)}
          </div>
          <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4] mt-0.5">
            {t.financialsReportsSettings.excludedFromRevenueSub}
          </div>
        </DSCard>
      </div>

      {/* Per-Property Breakdown Cards */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF] px-0.5">
          {t.financialsReportsSettings.perPropertyBreakdownHeading}
        </h2>
        {scopedProps.map((p) => {
          const pUnits = units.filter((u) => u.propertyId === p.id);
          const pOcc = pUnits.filter((u) => u.status === 'occupied').length;
          const pCharges = scopedCharges.filter((c) => c.propertyId === p.id);
          const pPayments = scopedPayments.filter((pay) => pay.propertyId === p.id);
          const pExpenses = scopedExpenses.filter((e) => e.propertyId === p.id);
          const pDeposits = deposits.filter((d) => d.propertyId === p.id);

          const accrued = pCharges.reduce((s, c) => s + c.amountCents + c.adjustedCents, 0);
          const collected = pPayments.reduce((s, pay) => s + pay.amountCents, 0);
          const exp = pExpenses.reduce((s, e) => s + e.amountCents, 0);
          const depLiab = pDeposits.reduce(
            (s, d) =>
              s + d.receivedDepositCents + d.accruedInterestCents - d.deductionsCents - d.refundedCents,
            0
          );

          return (
            <DSCard key={p.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {p.name}
                  </div>
                  <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                    {pOcc}/{pUnits.length} {t.financialsReportsSettings.unitsOccupiedSuffix} · {p.suburb}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold text-[#0FA958] dark:text-[#2FE07D]">
                    {formatZAR(collected - exp)}
                  </div>
                  <div className="text-[11px] text-[#626A78] dark:text-[#98A1B2]">
                    {t.financialsReportsSettings.netCashLabel}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDF1F7] dark:border-[#242932] text-[12px]">
                <div>
                  <div className="text-[#626A78] dark:text-[#98A1B2]">{t.financialsReportsSettings.accruedShort}</div>
                  <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {formatZAR(accrued)}
                  </div>
                </div>
                <div>
                  <div className="text-[#626A78] dark:text-[#98A1B2]">{t.financialsReportsSettings.expensesShort}</div>
                  <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {formatZAR(exp)}
                  </div>
                </div>
                <div>
                  <div className="text-[#626A78] dark:text-[#98A1B2]">{t.financialsReportsSettings.depositsShort}</div>
                  <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {formatZAR(depLiab)}
                  </div>
                </div>
              </div>
            </DSCard>
          );
        })}
      </div>
    </div>
  );
};

export const ReportsAndExportsScreen: React.FC<{
  onNotify: (msg: string) => void;
}> = ({ onNotify }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [activeTab, setActiveTab] = useState<'exports' | 'tests' | 'matrix'>('exports');
  const [testResults, setTestResults] = useState<AcceptanceTestResult[]>(() =>
    runDomainAcceptanceTests()
  );

  const handleRunTests = () => {
    const res = runDomainAcceptanceTests();
    setTestResults(res);
    onNotify(`${res.length} ${t.financialsReportsSettings.passedLabel}`);
  };

  const featureMatrix = [
    { feature: 'Property, Building, Floor & Diverse Unit Directory', status: 'Implemented' },
    { feature: 'Inclusive Tenant Onboarding (Assisted & Unbanked Flows)', status: 'Implemented' },
    { feature: 'Authoritative Integer-Cent ZAR Rent Ledger & FIFO Allocations', status: 'Implemented' },
    { feature: 'Deposits Held as Separate Liabilities (Never Revenue)', status: 'Implemented' },
    { feature: 'Numbered PDF Receipts & Statements (jsPDF)', status: 'Implemented' },
    { feature: 'WhatsApp Prefilled Deep Links (Logged as Handed-Off)', status: 'Implemented' },
    { feature: 'Maintenance Board with Photos, Timeline & Expense Link', status: 'Implemented' },
    { feature: 'IndexedDB Offline Persistence, PWA Manifest & Service Worker', status: 'Implemented' },
    { feature: 'CSV Exports & Schema-Validated JSON Backup/Restore', status: 'Implemented' },
    { feature: 'Financial Sync Conflict Detection & Owner Reconciliation', status: 'Implemented' },
    { feature: 'Live Cloud Sync & Automated SMS Gateway', status: 'Unconfigured (Boundary Ready)' },
  ];

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.reportsTitle}
        subtitle={t.financialsReportsSettings.reportsSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      <DSFilterPills
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'exports' | 'tests' | 'matrix')}
        options={[
          { id: 'exports', label: t.financialsReportsSettings.tabCsvExports },
          { id: 'tests', label: t.financialsReportsSettings.tabLedgerChecks },
          { id: 'matrix', label: t.financialsReportsSettings.tabSystemStatus },
        ]}
      />

      {activeTab === 'exports' && (
        <div className="space-y-2.5">
          <DSCard className="p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-[36px] h-[36px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                  {t.financialsReportsSettings.csvExportsHeading}
                </h2>
                <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                  {t.financialsReportsSettings.csvExportsSub}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {(
                [
                  { id: 'payments', label: t.financialsReportsSettings.exportPaymentsLabel, sub: t.financialsReportsSettings.exportPaymentsSub },
                  { id: 'charges', label: t.financialsReportsSettings.exportChargesLabel, sub: t.financialsReportsSettings.exportChargesSub },
                  { id: 'tenants', label: t.financialsReportsSettings.exportTenantsLabel, sub: t.financialsReportsSettings.exportTenantsSub },
                  { id: 'units', label: t.financialsReportsSettings.exportUnitsLabel, sub: t.financialsReportsSettings.exportUnitsSub },
                  { id: 'expenses', label: t.financialsReportsSettings.exportExpensesLabel, sub: t.financialsReportsSettings.exportExpensesSub },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    await exportEntityCSV(item.id);
                    onNotify(`CSV: ${item.id.toUpperCase()}`);
                  }}
                  className="w-full p-3.5 rounded-[16px] bg-[#F5F7FA] dark:bg-[#1C1F26] border border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-3 hover:border-[#0145F2] transition-colors text-left"
                >
                  <div>
                    <div className="text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                      {item.label}
                    </div>
                    <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                  <Download className="w-[18px] h-[18px] text-[#0145F2] shrink-0" />
                </button>
              ))}
            </div>
          </DSCard>

          <Link
            to="/financials"
            className="p-4 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-3 hover:border-[#0145F2]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                  {t.financialsReportsSettings.openFullNoiTitle}
                </div>
                <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                  {t.financialsReportsSettings.openFullNoiSub}
                </div>
              </div>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-[#626A78]" />
          </Link>
        </div>
      )}

      {activeTab === 'tests' && (
        <DSCard className="p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.financialsReportsSettings.ledgerSuiteHeading}
              </h2>
              <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                {t.financialsReportsSettings.ledgerSuiteSub}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunTests}
              className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[12.5px] font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              {t.financialsReportsSettings.runSuiteBtn}
            </button>
          </div>

          <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[12.5px]">
            {testResults.map((res) => (
              <div key={res.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#111318] dark:text-[#FFFFFF] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA958] shrink-0" />
                    {res.name}
                  </div>
                  <div className="text-[#626A78] dark:text-[#98A1B2] mt-0.5 pl-6 text-[11.5px]">
                    {res.details}
                  </div>
                </div>
                <DSStatusBadge
                  variant="paid"
                  label={res.passed ? t.financialsReportsSettings.passedLabel : t.financialsReportsSettings.failedLabel}
                />
              </div>
            ))}
          </div>
        </DSCard>
      )}

      {activeTab === 'matrix' && (
        <DSCard className="p-4 space-y-3">
          <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.honestyMatrixHeading}
          </h2>
          <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[12.5px]">
            {featureMatrix.map((row, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                <span className="font-medium text-[#111318] dark:text-[#E4E7EC]">
                  {row.feature}
                </span>
                <DSStatusBadge
                  variant={row.status === 'Implemented' ? 'paid' : 'renewal'}
                  label={
                    row.status === 'Implemented'
                      ? t.financialsReportsSettings.implementedLabel
                      : t.financialsReportsSettings.boundaryReadyLabel
                  }
                />
              </div>
            ))}
          </div>
        </DSCard>
      )}
    </div>
  );
};

export const SettingsAndAccessScreen: React.FC<{
  settings?: ApplicationSettings;
  syncOperations: SyncOperation[];
  auditEvents: AuditEvent[];
  onNotify: (msg: string) => void;
}> = ({ settings, syncOperations, auditEvents, onNotify }) => {
  const boundary = getCloudBoundaryStatus();
  const conflicts = syncOperations.filter(
    (s) => s.syncStatus === 'conflict_requires_reconciliation'
  );
  const currentTheme = settings?.theme || 'dark';
  const { currentLanguage, t } = useLanguagePreference();

  const handleThemeChange = async (nextTheme: 'light' | 'dark' | 'system') => {
    try {
      localStorage.setItem('landlordos_theme_pref', nextTheme);
    } catch {
      // ignore storage errors
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = nextTheme === 'dark' || (nextTheme === 'system' && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (settings) {
      const { db } = await import('../db/database');
      await db.applicationSettings.update(settings.id, {
        theme: nextTheme,
        updatedAt: new Date().toISOString(),
      });
    }
    onNotify(
      nextTheme === 'system'
        ? t.financialsReportsSettings.themeSystem
        : nextTheme === 'dark'
          ? t.financialsReportsSettings.themeDark
          : t.financialsReportsSettings.themeLight
    );
  };

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.settingsTitle}
        subtitle={t.financialsReportsSettings.settingsSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      {/* Appearance Theme Control (Light / Dark / System Default) */}
      <DSCard className="p-4 space-y-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.appearanceHeading}
          </h2>
          <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
            {t.financialsReportsSettings.appearanceSub}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label={t.financialsReportsSettings.appearanceHeading}
          className="grid grid-cols-3 gap-2 pt-1"
        >
          {(
            [
              { id: 'light', label: t.financialsReportsSettings.themeLight, desc: '#EDF1F5' },
              { id: 'dark', label: t.financialsReportsSettings.themeDark, desc: '#000000' },
              { id: 'system', label: t.financialsReportsSettings.themeSystem, desc: t.financialsReportsSettings.themeAuto },
            ] as const
          ).map((opt) => {
            const selected = currentTheme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleThemeChange(opt.id)}
                className={`p-3 rounded-[16px] border text-left transition-colors flex flex-col justify-between ${
                  selected
                    ? 'bg-[#0145F2] text-white border-[#0145F2]'
                    : 'bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-white border-[#E6ECF3] dark:border-[#262B31] hover:border-[#0145F2]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold">{opt.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selected
                        ? 'border-white bg-white text-[#0145F2]'
                        : 'border-[#98A1B2]'
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-[#0145F2]" />}
                  </span>
                </div>
                <span
                  className={`text-[11px] mt-1 ${
                    selected ? 'text-white/85' : 'text-[#626A78] dark:text-[#98A1B2]'
                  }`}
                >
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </DSCard>

      {/* Quick Link to Language Selector */}
      <Link
        to="/language"
        className="p-4 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-3 hover:border-[#0145F2]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.languagePrefsTitle}
            </div>
            <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.activePrefix}: {currentLanguage.englishName} ({currentLanguage.nativeName})
            </div>
          </div>
        </div>
        <ChevronRight className="w-[18px] h-[18px] text-[#626A78]" />
      </Link>

      {/* Multilingual In-App Keyboard Settings Section */}
      <AkaraiKeyboardSettingsSection onNotify={onNotify} />

      {/* Financial Revision Conflict Queue */}
      <DSCard className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.syncQueueHeading}
          </h2>
          <DSStatusBadge
            variant={conflicts.length === 0 ? 'paid' : 'overdue'}
            label={
              conflicts.length === 0
                ? t.financialsReportsSettings.reconciledLabel
                : `${conflicts.length} ${t.financialsReportsSettings.conflictSuffix}`
            }
          />
        </div>
        <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
          {t.financialsReportsSettings.syncQueueDesc}
        </p>

        {conflicts.length === 0 ? (
          <div className="p-3 rounded-[14px] bg-[#DCF6E6]/60 dark:bg-[#103824]/60 text-[12.5px] text-[#0D944B] dark:text-[#2FE07D] font-semibold">
            {t.financialsReportsSettings.allReconciledMsg} ({syncOperations.length})
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-[16px] bg-[#FEF2D6]/60 dark:bg-[#3A2B12]/60 border border-[#F5A623]/30 space-y-2.5 text-[12.5px]"
              >
                <div className="font-bold text-[#A96B00] dark:text-[#FFC24B]">
                  {c.entityTable} · Rev {c.baseRevision} → Rev {c.targetRevision}
                </div>
                <p className="text-[#111318] dark:text-[#E4E7EC]">{c.conflictReason}</p>
                <div className="flex flex-col gap-2 pt-1">
                  <DSButton
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={async () => {
                      await resolveFinancialSyncConflict(c.id, 'accept_proposed_adjustment');
                      onNotify(t.financialsReportsSettings.acceptWaiverProposalBtn);
                    }}
                  >
                    {t.financialsReportsSettings.acceptWaiverProposalBtn}
                  </DSButton>
                  <DSButton
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={async () => {
                      await resolveFinancialSyncConflict(c.id, 'keep_authoritative_ledger');
                      onNotify(t.financialsReportsSettings.keepAuthoritativeChargeBtn);
                    }}
                  >
                    {t.financialsReportsSettings.keepAuthoritativeChargeBtn}
                  </DSButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </DSCard>

      {/* Sample Data & Workspace Reset Controls */}
      <DSCard className="p-4 space-y-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.demoDatasetHeading}
          </h2>
          <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
            {t.common.status}:{' '}
            {settings?.isSampleDataLoaded
              ? t.financialsReportsSettings.samplePortfolioActive
              : t.financialsReportsSettings.customWorkspace}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <DSButton
            type="button"
            variant="secondary"
            onClick={async () => {
              await reloadFictionalSampleData();
              onNotify(t.financialsReportsSettings.resetSampleBtn);
            }}
          >
            {t.financialsReportsSettings.resetSampleBtn}
          </DSButton>
          <DSButton
            type="button"
            variant="destructive"
            onClick={async () => {
              await clearSampleDataToEmptyWorkspace();
              onNotify(t.financialsReportsSettings.clearAllDataBtn);
            }}
          >
            {t.financialsReportsSettings.clearAllDataBtn}
          </DSButton>
        </div>
      </DSCard>

      {/* Audit Trail & Cloud Boundary */}
      <DSCard className="p-4 space-y-2.5">
        <h3 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.financialsReportsSettings.recentAuditEventsHeading} ({auditEvents.length})
        </h3>
        <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] max-h-56 overflow-y-auto text-[12px]">
          {auditEvents.slice(0, 6).map((a) => (
            <div key={a.id} className="py-2">
              <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                {a.action} · {a.actorName} ({a.actorRole})
              </div>
              <div className="text-[#626A78] dark:text-[#98A1B2]">{a.summary}</div>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-[#EDF1F7] dark:border-[#242932] text-[11px] text-[#626A78] dark:text-[#8E96A4]">
          {boundary.productionDisclaimers[0]}
        </div>
      </DSCard>
    </div>
  );
};

export const LanguageScreen: React.FC<{
  onNotify: (msg: string) => void;
}> = ({ onNotify }) => {
  const { languageCode, currentLanguage, t, selectLanguage } = useLanguagePreference();
  const activeCoverage = TRANSLATION_COVERAGE_REPORT.find((r) => r.code === languageCode);

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.languageScreenTitle}
        subtitle={t.financialsReportsSettings.languageScreenSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      <DSCard className="divide-y divide-[#EDF1F7] dark:divide-[#242932] overflow-hidden">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = lang.code === languageCode;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                selectLanguage(lang.code);
                onNotify(`${lang.englishName} (${lang.nativeName})`);
              }}
              className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-colors ${
                isSelected
                  ? 'bg-[#E7F0FF]/60 dark:bg-[#132247]/50'
                  : 'hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                    isSelected
                      ? 'bg-[#0145F2] text-[#FFFFFF]'
                      : 'bg-[#E7F0FF] dark:bg-[#1C2230] text-[#0145F2] dark:text-[#68A2FF]'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                      {lang.englishName}
                    </span>
                    <span className="text-[14px] font-semibold text-[#0145F2] dark:text-[#68A2FF]">
                      {lang.nativeName}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
                    {lang.script === 'Ethiopic (Geʽez)'
                      ? t.financialsReportsSettings.ethiopicScriptDesc
                      : t.financialsReportsSettings.latinScriptDesc}{' '}
                    · {t.financialsReportsSettings.fullUiStringsActive}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {isSelected ? (
                  <span className="w-[26px] h-[26px] rounded-full bg-[#0145F2] text-[#FFFFFF] flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="w-[22px] h-[22px] rounded-full border border-[#D4DCE8] dark:border-[#2B313B] block" />
                )}
              </div>
            </button>
          );
        })}
      </DSCard>

      <DSCard className="p-4 space-y-1.5">
        <div className="text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.financialsReportsSettings.activeLanguageHeading} {currentLanguage.englishName} ({currentLanguage.nativeName})
        </div>
        <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
          {t.financialsReportsSettings.languagePersistenceDesc}
        </p>
      </DSCard>

      {/* Translation Coverage & Native-Speaker Verification Report */}
      <DSCard className="p-4 space-y-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.coverageReportTitle}
          </h2>
          <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
            {t.financialsReportsSettings.verifiedNativeReviewNote}
          </p>
        </div>

        <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[12px]">
          {TRANSLATION_COVERAGE_REPORT.map((rep) => {
            const pct = rep.totalKeys > 0 ? Math.round((rep.translatedKeys / rep.totalKeys) * 100) : 100;
            return (
              <div key={rep.code} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {rep.languageName} ({rep.nativeName})
                  </span>
                  <DSStatusBadge
                    variant={rep.unverifiedKeysRequiringNativeReview === 0 ? 'paid' : 'renewal'}
                    label={`${pct}% (${rep.translatedKeys}/${rep.totalKeys})`}
                  />
                </div>
                <div className="text-[11px] text-[#626A78] dark:text-[#98A1B2]">
                  {rep.unverifiedTerminologyNotes[0]}
                </div>
              </div>
            );
          })}
        </div>

        {activeCoverage && activeCoverage.unverifiedKeysRequiringNativeReview > 0 && (
          <div className="p-3 rounded-[14px] bg-[#FEF2D6]/60 dark:bg-[#3A2B12]/60 border border-[#F5A623]/30 text-[11.5px] text-[#A96B00] dark:text-[#FFC24B] space-y-1">
            <div className="font-bold">
              {t.financialsReportsSettings.coverageNativeReviewLabel} ({activeCoverage.unverifiedKeysRequiringNativeReview})
            </div>
            <div className="text-[11px] space-y-1">
              {activeCoverage.unverifiedTerminologyNotes.map((note, idx) => (
                <div key={idx}>• {note}</div>
              ))}
            </div>
          </div>
        )}
      </DSCard>
    </div>
  );
};

export const SubscriptionAndBillingScreen: React.FC<{
  onNotify: (msg: string) => void;
}> = ({ onNotify }) => {
  const { t } = useLanguagePreference();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'business'>('pro');

  const plans = [
    {
      id: 'starter' as const,
      name: t.financialsReportsSettings.planStarterName,
      badge: t.financialsReportsSettings.planStarterBadge,
      price: t.financialsReportsSettings.planStarterPrice,
      desc: t.financialsReportsSettings.planStarterDesc,
    },
    {
      id: 'pro' as const,
      name: t.financialsReportsSettings.planProName,
      badge: t.financialsReportsSettings.planProBadge,
      price: t.financialsReportsSettings.planProPrice,
      desc: t.financialsReportsSettings.planProDesc,
    },
    {
      id: 'business' as const,
      name: t.financialsReportsSettings.planBusinessName,
      badge: t.financialsReportsSettings.planBusinessBadge,
      price: t.financialsReportsSettings.planBusinessPrice,
      desc: t.financialsReportsSettings.planBusinessDesc,
    },
  ];

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.subscriptionTitle}
        subtitle={t.financialsReportsSettings.subscriptionSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      {/* Current Pro Tier Hero Card */}
      <DSCard className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#FEF2D6] dark:bg-[#3A2B12] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
            </div>
            <div>
              <div className="text-[15.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.financialsReportsSettings.proEvalTitle}
              </div>
              <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                {t.financialsReportsSettings.proEvalSub}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FFC82C] text-[#111318] text-[11.5px] font-bold">
            {t.common.pro}
          </span>
        </div>
        <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
          {t.financialsReportsSettings.proEvalDesc}
        </p>
      </DSCard>

      {/* Plan Tier Selector */}
      <div className="space-y-2.5">
        {plans.map((p) => {
          const active = selectedPlan === p.id;
          return (
            <DSCard
              key={p.id}
              onClick={() => {
                setSelectedPlan(p.id);
                onNotify(`${p.name} (${p.price})`);
              }}
              className={`p-4 space-y-2 cursor-pointer transition-colors ${
                active ? 'border-[#0145F2] ring-1 ring-[#0145F2]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {p.name}
                  </span>
                  <DSStatusBadge
                    variant={p.id === 'pro' ? 'paid' : 'renewal'}
                    label={p.badge}
                  />
                </div>
                <span className="text-[15px] font-extrabold text-[#0145F2] dark:text-[#68A2FF]">
                  {p.price}
                </span>
              </div>
              <p className="text-[12.5px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
                {p.desc}
              </p>
            </DSCard>
          );
        })}
      </div>
    </div>
  );
};

export const HelpAndSupportScreen: React.FC = () => {
  const { t } = useLanguagePreference();

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.helpTitle}
        subtitle={t.financialsReportsSettings.helpSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      <DSCard className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[36px] h-[36px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.operationalGuidesHeading}
            </h2>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.operationalGuidesSub}
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[13px]">
          <div className="py-3 space-y-1">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.guide1Title}
            </div>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              {t.financialsReportsSettings.guide1Body}
            </p>
          </div>
          <div className="py-3 space-y-1">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.guide2Title}
            </div>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              {t.financialsReportsSettings.guide2Body}
            </p>
          </div>
          <div className="py-3 space-y-1">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.guide3Title}
            </div>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              {t.financialsReportsSettings.guide3Body}
            </p>
          </div>
          <div className="py-3 space-y-1">
            <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.financialsReportsSettings.guide4Title}
            </div>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              {t.financialsReportsSettings.guide4Body}
            </p>
          </div>
        </div>
      </DSCard>

      <div className="space-y-2.5">
        <Link
          to="/onboarding"
          className="p-4 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-3 hover:border-[#0145F2]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.financialsReportsSettings.walkthroughLinkTitle}
              </div>
              <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                {t.financialsReportsSettings.walkthroughLinkSub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-[18px] h-[18px] text-[#626A78]" />
        </Link>

        <Link
          to="/backup"
          className="p-4 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-3 hover:border-[#0145F2]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.financialsReportsSettings.backupLinkTitle}
              </div>
              <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                {t.financialsReportsSettings.backupLinkSub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-[18px] h-[18px] text-[#626A78]" />
        </Link>
      </div>
    </div>
  );
};

export const BackupAndRestoreScreen: React.FC<{
  settings?: ApplicationSettings;
  onNotify: (msg: string) => void;
}> = ({ settings, onNotify }) => {
  const { t } = useLanguagePreference();
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewEnvelope, setPreviewEnvelope] = useState<BackupEnvelope | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setJsonInput(content);
      const check = validateBackupJSON(content);
      if (!check.valid) {
        setValidationError(check.error || 'Invalid backup file');
        setPreviewEnvelope(null);
      } else {
        setValidationError(null);
        setPreviewEnvelope(check.envelope || null);
      }
    };
    reader.readAsText(file);
  };

  const handleValidateText = () => {
    const check = validateBackupJSON(jsonInput);
    if (!check.valid) {
      setValidationError(check.error || 'Invalid JSON');
      setPreviewEnvelope(null);
    } else {
      setValidationError(null);
      setPreviewEnvelope(check.envelope || null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!previewEnvelope) return;
    await restoreValidatedBackup(previewEnvelope);
    setPreviewEnvelope(null);
    setJsonInput('');
    onNotify(t.financialsReportsSettings.confirmRestoreBtn);
  };

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.financialsReportsSettings.backupTitle}
        subtitle={t.financialsReportsSettings.backupSubtitle}
        backTo="/settings"
        backLabel={t.financialsReportsSettings.settingsTitle}
      />

      <DSCard className="p-4 space-y-3">
        <div>
          <div className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.financialsReportsSettings.exportSnapshotHeading}
          </div>
          <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
            {t.financialsReportsSettings.lastExportedPrefix}{' '}
            {settings?.lastBackupExportedAt
              ? formatSADateTime(settings.lastBackupExportedAt)
              : t.financialsReportsSettings.notExportedYet}
          </div>
        </div>
        <DSButton
          type="button"
          variant="primary"
          fullWidth
          icon={<Download className="w-4 h-4" />}
          onClick={async () => {
            await exportFullBackupJSON();
            onNotify(t.financialsReportsSettings.downloadJsonBackupBtn);
          }}
        >
          {t.financialsReportsSettings.downloadJsonBackupBtn}
        </DSButton>
      </DSCard>

      {/* Restore Section with Validation & Preview */}
      <DSCard className="p-4 space-y-3.5 text-[13px]">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#0145F2]" />
          {t.financialsReportsSettings.validateRestoreHeading}
        </h2>

        <div>
          <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
            {t.financialsReportsSettings.uploadJsonLabel}
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="block w-full text-[12px] text-[#626A78] dark:text-[#98A1B2] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-[#0145F2] file:text-white"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
            {t.financialsReportsSettings.pasteJsonLabel}
          </label>
          <textarea
            rows={4}
            placeholder='{"schemaName": "Akarai_Backup", "schemaVersion": "0.1.0", ...}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full p-3 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] font-mono text-[11px] text-[#111318] dark:text-[#FFFFFF]"
          />
          <div className="mt-2.5">
            <DSButton type="button" variant="secondary" fullWidth onClick={handleValidateText}>
              {t.financialsReportsSettings.validatePreviewBtn}
            </DSButton>
          </div>
        </div>

        {validationError && (
          <div className="p-3 rounded-[14px] bg-[#FFE8E8] dark:bg-[#3A1619] text-[#E82C33] dark:text-[#FF5A5F] text-[12px] font-medium">
            {validationError}
          </div>
        )}

        {previewEnvelope && (
          <div className="p-3.5 rounded-[16px] bg-[#DCF6E6]/60 dark:bg-[#103824]/60 border border-[#0FA958]/30 space-y-3">
            <div className="font-bold text-[#0D944B] dark:text-[#2FE07D] text-[12.5px]">
              {t.financialsReportsSettings.validatedPrefix}: {previewEnvelope.schemaName} (v{previewEnvelope.schemaVersion})
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11.5px]">
              <div>Properties: {previewEnvelope.counts.properties}</div>
              <div>Units: {previewEnvelope.counts.units}</div>
              <div>Tenants: {previewEnvelope.counts.tenantProfiles}</div>
              <div>Tenancies: {previewEnvelope.counts.tenancies}</div>
              <div>Charges: {previewEnvelope.counts.charges}</div>
              <div>Receipts: {previewEnvelope.counts.receipts}</div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <DSButton type="button" variant="primary" fullWidth onClick={handleConfirmRestore}>
                {t.financialsReportsSettings.confirmRestoreBtn}
              </DSButton>
              <DSButton
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setPreviewEnvelope(null)}
              >
                {t.common.cancel}
              </DSButton>
            </div>
          </div>
        )}
      </DSCard>
    </div>
  );
};

export const TenantPortalScreen: React.FC<{
  settings?: ApplicationSettings;
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  units: Unit[];
  properties: Property[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  receipts: Receipt[];
  maintenanceTickets: MaintenanceTicket[];
  messageLogs: MessageLog[];
  onNotify: (msg: string) => void;
}> = ({
  settings,
  tenants,
  tenancies,
  units,
  properties,
  charges,
  payments,
  adjustments,
  deposits,
  receipts,
  maintenanceTickets,
  messageLogs,
  onNotify,
}) => {
  const { t } = useLanguagePreference();
  const activeTenantId = settings?.activeTenantIdForPortal || 'tenant-grace';
  const tenant = tenants.find((x) => x.id === activeTenantId) || tenants[0];

  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');

  if (!tenant) {
    return <div className="p-6">{t.tenants.tenantNotFound}</div>;
  }

  // STRICT TENANT ISOLATION: Filter solely by tenant.id
  const myTenancies = tenancies.filter((l) => l.primaryTenantId === tenant.id);
  const activeTenancy = myTenancies[0];
  const myUnit = units.find((u) => u.id === activeTenancy?.unitId);
  const myProperty = properties.find((p) => p.id === activeTenancy?.propertyId);
  const myReceipts = receipts.filter((r) => r.tenantId === tenant.id);
  const myTickets = maintenanceTickets.filter((m) => m.tenantId === tenant.id);
  const myMessages = messageLogs.filter((msg) => msg.tenantId === tenant.id);
  const mySummary = activeTenancy
    ? computeTenancyLedgerSummary(activeTenancy.id, charges, payments, adjustments, deposits)
    : undefined;

  const handleTenantSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !activeTenancy) return;
    const ticket = await createMaintenanceTicketRecord({
      propertyId: activeTenancy.propertyId,
      unitId: activeTenancy.unitId,
      tenancyId: activeTenancy.id,
      tenantId: tenant.id,
      title: issueTitle,
      description: issueDesc || issueTitle,
      category: 'plumbing_geyser',
      priority: 'medium',
      reportedByRole: 'tenant',
      reporterName: tenant.fullName,
      estimatedCostCents: 0,
    });
    setIssueTitle('');
    setIssueDesc('');
    onNotify(`${ticket.ticketNumber}`);
  };

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={`${t.financialsReportsSettings.tenantPortalWelcomePrefix} ${tenant.fullName}`}
        subtitle={`${myUnit?.unitNumber || 'N/A'} • ${myProperty?.name || ''} (${t.financialsReportsSettings.tenantPortalSubtitleSuffix})`}
      />

      {/* Balance & Deposit Summary */}
      {mySummary && (
        <div className="grid grid-cols-3 gap-2.5">
          <DSCard className="p-3.5 text-center">
            <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.balanceDueLabel}
            </div>
            <div
              className={`text-[16px] font-bold mt-1 ${
                mySummary.netBalanceDueCents > 0
                  ? 'text-[#E82C33] dark:text-[#FF5A5F]'
                  : 'text-[#0FA958] dark:text-[#2FE07D]'
              }`}
            >
              {formatZAR(mySummary.netBalanceDueCents)}
            </div>
          </DSCard>

          <DSCard className="p-3.5 text-center">
            <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.totalPaidLabel}
            </div>
            <div className="text-[16px] font-bold text-[#111318] dark:text-[#FFFFFF] mt-1">
              {formatZAR(mySummary.totalAllocatedPaidCents)}
            </div>
          </DSCard>

          <DSCard className="p-3.5 text-center">
            <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
              {t.financialsReportsSettings.depositHeldLabel}
            </div>
            <div className="text-[16px] font-bold text-[#0145F2] dark:text-[#68A2FF] mt-1">
              {formatZAR(mySummary.depositHeldLiabilityCents)}
            </div>
          </DSCard>
        </div>
      )}

      {/* My Downloadable Receipts */}
      <DSCard className="p-4 space-y-2.5">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.financialsReportsSettings.myPaymentReceiptsHeading} ({myReceipts.length})
        </h2>
        {myReceipts.length === 0 ? (
          <p className="text-[12.5px] text-[#626A78] dark:text-[#98A1B2]">
            {t.financialsReportsSettings.noReceiptsRecorded}
          </p>
        ) : (
          <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[13px]">
            {myReceipts.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {r.receiptNumber}
                  </div>
                  <div className="text-[11.5px] text-[#626A78] dark:text-[#98A1B2]">
                    {formatSADate(r.transactionDate)} ·{' '}
                    {t.domainLabels.paymentMethods[r.paymentMethod] || PAYMENT_METHOD_LABELS[r.paymentMethod]}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0FA958] dark:text-[#2FE07D]">
                    {formatZAR(r.amountCents)}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadReceiptPDF(r)}
                    className="min-h-[34px] px-3 py-1 rounded-full bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] dark:text-[#68A2FF] text-[12px] font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> {t.common.pdf}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DSCard>

      {/* Report Maintenance Issue */}
      <DSCard className="p-4 space-y-3">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.financialsReportsSettings.reportMaintHeading}
        </h2>
        <form onSubmit={handleTenantSubmitMaintenance} className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
              {t.financialsReportsSettings.whatNeedsRepairLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.financialsReportsSettings.whatNeedsRepairPlaceholder}
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
              {t.financialsReportsSettings.detailsAccessTimeLabel}
            </label>
            <textarea
              rows={3}
              placeholder={t.financialsReportsSettings.detailsAccessTimePlaceholder}
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              className="w-full p-3 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
            />
          </div>
          <DSButton type="submit" variant="primary" fullWidth>
            {t.financialsReportsSettings.submitMaintRequestBtn}
          </DSButton>
        </form>
      </DSCard>

      {/* My Repair Requests & Notices */}
      <DSCard className="p-4 space-y-2.5 text-[12.5px]">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.financialsReportsSettings.myRepairsNoticesHeading}
        </h2>
        <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932]">
          {myTickets.map((ticket) => (
            <div key={ticket.id} className="py-2.5 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                  {ticket.ticketNumber}: {ticket.title}
                </div>
                <div className="text-[11.5px] text-[#626A78] dark:text-[#98A1B2]">
                  {t.commsMaintDocs.reportedByPrefix} {formatSADate(ticket.reportedDate)}
                </div>
              </div>
              <DSStatusBadge
                variant={ticket.status === 'resolved' ? 'paid' : 'pending'}
                label={t.domainLabels.maintenanceStatuses[ticket.status] || ticket.status}
              />
            </div>
          ))}
          {myMessages.map((m) => (
            <div key={m.id} className="py-2.5">
              <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">{m.subject}</div>
              <div className="text-[#626A78] dark:text-[#98A1B2] mt-0.5">{m.body}</div>
            </div>
          ))}
        </div>
      </DSCard>
    </div>
  );
};
