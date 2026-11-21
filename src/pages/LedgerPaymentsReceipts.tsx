import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Layers,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { QuickAddTab } from '../components/QuickAddModal';
import { useLanguagePreference } from '../components/DesignSystem';
import type {
  Charge,
  DepositLiability,
  LedgerAdjustment,
  Payment,
  PaymentMethod,
  PaymentVerificationStatus,
  Property,
  Receipt,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import {
  applyChargeAdjustment,
  computeTenancyLedgerSummary,
  generateChargeForTenancy,
  recordPaymentTransaction,
  reversePaymentTransaction,
} from '../services/domainService';
import { downloadReceiptPDF, downloadTenancyStatementPDF } from '../services/pdfService';
import {
  formatSADate,
  formatSADateTime,
  formatZAR,
   parseZARToCents,
  PAYMENT_METHOD_LABELS,
  PAYMENT_VERIFICATION_LABELS,
} from '../utils/format';

export const RentLedgerScreen: React.FC<{
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  units: Unit[];
  properties: Property[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  onNotify: (msg: string) => void;
}> = ({ tenancies, tenants, units, properties, charges, payments, adjustments, deposits, onNotify }) => {
  const { t, sidebarNav } = useLanguagePreference();
  const [searchParams] = useSearchParams();
  const paramTenancyId = searchParams.get('tenancyId');
  const paramView = searchParams.get('view');

  const [selectedTenancyId, setSelectedTenancyId] = useState<string>(paramTenancyId || 'all');
  const [genPeriodMonth, setGenPeriodMonth] = useState<string>('2026-12');
  const [adjustingCharge, setAdjustingCharge] = useState<Charge | null>(null);
  const [adjType, setAdjType] = useState<'waiver' | 'debit_correction'>('waiver');
  const [adjAmountRands, setAdjAmountRands] = useState('100.00');
  const [adjReason, setAdjReason] = useState('');

  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [revReason, setRevReason] = useState('');

  useEffect(() => {
    if (paramTenancyId) {
      setSelectedTenancyId(paramTenancyId);
    }
  }, [paramTenancyId]);

  const filteredTenancies =
    selectedTenancyId === 'all' ? tenancies : tenancies.filter((x) => x.id === selectedTenancyId);

  const totalDepositsHeldCents = filteredTenancies.reduce((sum, tenancy) => {
    const summary = computeTenancyLedgerSummary(tenancy.id, charges, payments, adjustments, deposits);
    return sum + summary.depositHeldLiabilityCents;
  }, 0);

  const handleBatchGenerateCharges = async () => {
    let createdCount = 0;
    let skippedCount = 0;
    for (const tenancy of filteredTenancies) {
      if (tenancy.status === 'active' || tenancy.status === 'notice_given') {
        const res = await generateChargeForTenancy({
          tenancyId: tenancy.id,
          periodMonth: genPeriodMonth,
          includeUtilities: true,
        });
        createdCount += res.createdCharges.length;
        skippedCount += res.skippedDuplicates.length;
      }
    }
    if (createdCount === 0 && skippedCount > 0) {
      onNotify(`${genPeriodMonth}: ${skippedCount}`);
    } else {
      onNotify(`${genPeriodMonth}: +${createdCount} (${skippedCount})`);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCharge || !adjReason.trim()) return;
    await applyChargeAdjustment({
      chargeId: adjustingCharge.id,
      adjustmentType: adjType,
      amountCents: parseZARToCents(adjAmountRands),
      reason: adjReason,
    });
    onNotify(`R${adjAmountRands} — "${adjustingCharge.description}"`);
    setAdjustingCharge(null);
    setAdjReason('');
  };

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment || !revReason.trim()) return;
    const revReceipt = await reversePaymentTransaction(reversingPayment.id, revReason);
    onNotify(`${revReceipt.receiptNumber}`);
    setReversingPayment(null);
    setRevReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.payments.ledgerTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {t.payments.ledgerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={genPeriodMonth}
            onChange={(e) => setGenPeriodMonth(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
            aria-label={t.payments.colPeriodKey}
          />
          <button
            type="button"
            onClick={handleBatchGenerateCharges}
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-xs font-semibold"
          >
            {t.payments.generateChargesBtn} ({genPeriodMonth})
          </button>
          <Link
            to="/payments/new"
            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t.payments.recordPaymentBtn}
          </Link>
        </div>
      </div>

      {/* Tenancy Filter Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={selectedTenancyId}
          onChange={(e) => setSelectedTenancyId(e.target.value)}
          className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
        >
          <option value="all">{t.payments.allActiveTenancies} ({tenancies.length})</option>
          {tenancies.map((tenancy) => {
            const tenant = tenants.find((x) => x.id === tenancy.primaryTenantId);
            const unit = units.find((u) => u.id === tenancy.unitId);
            return (
              <option key={tenancy.id} value={tenancy.id}>
                {tenancy.tenancyReference} — {tenant?.fullName} ({unit?.unitNumber})
              </option>
            );
          })}
        </select>
      </div>

      {paramView === 'deposits' && (
        <div className="p-4 rounded-xl bg-[#E7F0FF] dark:bg-[#132247] border border-[#0145F2]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0145F2] dark:text-[#68A2FF]">
              {sidebarNav.items.deposits}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {t.payments.depositHeldLiabilityPrefix} ({filteredTenancies.length})
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-[#0145F2] dark:text-[#68A2FF]">
            {formatZAR(totalDepositsHeldCents)}
          </div>
        </div>
      )}

      {/* Per-Tenancy Ledger Cards */}
      <div className="space-y-6">
        {filteredTenancies.map((tenancy) => {
          const tenant = tenants.find((x) => x.id === tenancy.primaryTenantId);
          const unit = units.find((u) => u.id === tenancy.unitId);
          const property = properties.find((p) => p.id === tenancy.propertyId);
          const summary = computeTenancyLedgerSummary(tenancy.id, charges, payments, adjustments, deposits);
          const tenancyCharges = charges.filter((c) => c.tenancyId === tenancy.id);
          const tenancyPayments = payments.filter((p) => p.tenancyId === tenancy.id);

          return (
            <div
              key={tenancy.id}
              className="rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden"
            >
              {/* Tenancy Header & Derived Summary */}
              <div className="px-5 py-4 bg-slate-50 dark:bg-neutral-950 border-b border-slate-200 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/tenancies/${tenancy.id}`}
                      className="text-base font-bold text-slate-900 dark:text-white hover:underline"
                    >
                      {tenant?.fullName || 'Tenant'} — {unit?.unitNumber}
                    </Link>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-500">{tenancy.tenancyReference}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {property?.name} · {t.payments.depositHeldLiabilityPrefix}: {formatZAR(summary.depositHeldLiabilityCents)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div>
                    <div className="text-slate-500">{t.payments.chargedLabel}</div>
                    <div className="font-mono font-bold tabular-nums">{formatZAR(summary.totalChargedCents)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">{t.payments.waivedAdjustedLabel}</div>
                    <div className="font-mono font-bold tabular-nums">
                      {formatZAR(summary.totalDebitAdjustedCents - summary.totalWaivedOrCreditedCents, true)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">{t.payments.allocatedPaidLabel}</div>
                    <div className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatZAR(summary.totalAllocatedPaidCents)}
                    </div>
                  </div>
                  {summary.totalUnallocatedCreditCents > 0 && (
                    <div>
                      <div className="text-slate-500">{t.payments.advanceCreditLabel}</div>
                      <div className="font-mono font-bold tabular-nums text-emerald-600">
                        {formatZAR(summary.totalUnallocatedCreditCents)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-slate-500">{t.payments.derivedBalanceLabel}</div>
                    <div
                      className={`text-sm font-mono font-bold tabular-nums ${
                        summary.netBalanceDueCents > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {summary.netBalanceDueCents > 0
                        ? `${formatZAR(summary.netBalanceDueCents)} ${t.payments.dueSuffix}`
                        : summary.netBalanceDueCents < 0
                          ? `${formatZAR(Math.abs(summary.netBalanceDueCents))} ${t.payments.creditSuffix}`
                          : `R 0.00 ${t.payments.settledLabel}`}
                    </div>
                  </div>
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
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 text-xs font-medium flex items-center gap-1 hover:bg-white dark:hover:bg-neutral-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.payments.statementBtn}
                  </button>
                </div>
              </div>

              {/* Charges & Payments Tables */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 mb-2">{t.payments.chargesAdjustmentsHeading}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500">
                          <th className="py-2 pr-3">{t.payments.colDueDate}</th>
                          <th className="py-2 px-3">{t.payments.colPeriodKey}</th>
                          <th className="py-2 px-3">{t.payments.colDescription}</th>
                          <th className="py-2 px-3 text-right">{t.payments.colCharged}</th>
                          <th className="py-2 px-3 text-right">{t.payments.colAdjusted}</th>
                          <th className="py-2 px-3 text-right">{t.payments.colPaid}</th>
                          <th className="py-2 px-3 text-right">{t.payments.colRemaining}</th>
                          <th className="py-2 px-3">{t.payments.colStatus}</th>
                          <th className="py-2 pl-3 text-right">{t.payments.colAction}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                        {tenancyCharges.map((c) => {
                          const netRem = Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents);
                          return (
                            <tr key={c.id}>
                              <td className="py-2.5 pr-3 whitespace-nowrap">{formatSADate(c.dueDate)}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{c.periodKey}</td>
                              <td className="py-2.5 px-3 font-medium">{c.description}</td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {formatZAR(c.amountCents)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {c.adjustedCents !== 0 ? formatZAR(c.adjustedCents, true) : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                {formatZAR(c.allocatedPaidCents)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                                {formatZAR(netRem)}
                              </td>
                              <td className="py-2.5 px-3 font-medium">{c.status}</td>
                              <td className="py-2.5 pl-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setAdjustingCharge(c)}
                                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                                >
                                  {t.payments.waiveAdjustBtn}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {tenancyPayments.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-neutral-800">
                    <h3 className="text-xs font-bold text-slate-500 mb-2">{t.payments.recordedPaymentsReversalsHeading}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500">
                            <th className="py-2 pr-3">{t.common.date}</th>
                            <th className="py-2 px-3">{t.payments.colMethodRef}</th>
                            <th className="py-2 px-3">{t.payments.colVerification}</th>
                            <th className="py-2 px-3">{t.payments.colRecordedBy}</th>
                            <th className="py-2 px-3 text-right">{t.common.amount}</th>
                            <th className="py-2 pl-3 text-right">{t.payments.colAction}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                          {tenancyPayments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 pr-3 whitespace-nowrap">{formatSADate(p.transactionDate)}</td>
                              <td className="py-2.5 px-3">
                                {t.domainLabels.paymentMethods[p.method] || PAYMENT_METHOD_LABELS[p.method]}
                                {p.externalReference ? ` · ${p.externalReference}` : ''}
                              </td>
                              <td className="py-2.5 px-3">
                                {t.domainLabels.verificationStatuses[p.verificationStatus] || PAYMENT_VERIFICATION_LABELS[p.verificationStatus]}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{p.recordedByName}</td>
                              <td
                                className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                                  p.verificationStatus === 'reversed' ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {formatZAR(p.amountCents)}
                              </td>
                              <td className="py-2.5 pl-3 text-right">
                                {p.verificationStatus !== 'reversed' ? (
                                  <button
                                    type="button"
                                    onClick={() => setReversingPayment(p)}
                                    className="text-red-600 dark:text-red-400 hover:underline font-medium inline-flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" /> {t.payments.reverseBtn}
                                  </button>
                                ) : (
                                  <span className="text-slate-400">{t.payments.reversedLabel}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charge Waiver / Adjustment Modal */}
      {adjustingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleApplyAdjustment}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold">{t.payments.adjustModalTitle}</h3>
            <p className="text-slate-500">{adjustingCharge.description}</p>
            <div>
              <label className="block font-medium mb-1">{t.payments.adjustmentTypeLabel}</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as 'waiver' | 'debit_correction')}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              >
                <option value="waiver">{t.payments.creditWaiverOption}</option>
                <option value="debit_correction">{t.payments.debitCorrectionOption}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t.payments.amountZarLabel}</label>
              <input
                type="number"
                step="0.01"
                required
                value={adjAmountRands}
                onChange={(e) => setAdjAmountRands(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">{t.payments.auditReasonLabel}</label>
              <input
                type="text"
                required
                placeholder={t.payments.auditReasonPlaceholder}
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingCharge(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 dark:border-neutral-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
              >
                {t.payments.applyAdjustmentBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleReversePayment}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-red-600">{t.payments.reverseModalTitle}</h3>
            <p className="text-slate-600 dark:text-neutral-300">
              {formatZAR(reversingPayment.amountCents)} ({t.domainLabels.paymentMethods[reversingPayment.method] || PAYMENT_METHOD_LABELS[reversingPayment.method]}) — {t.payments.reverseModalDesc}
            </p>
            <div>
              <label className="block font-medium mb-1">{t.payments.reversalReasonLabel}</label>
              <input
                type="text"
                required
                placeholder={t.payments.reversalReasonPlaceholder}
                value={revReason}
                onChange={(e) => setRevReason(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReversingPayment(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 dark:border-neutral-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 rounded-lg bg-red-600 text-white font-semibold"
              >
                {t.payments.confirmReversalBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const RecordPaymentScreen: React.FC<{
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  units: Unit[];
  onNotify: (msg: string) => void;
}> = ({ tenancies, tenants, units, onNotify }) => {
  const { t } = useLanguagePreference();
  const navigate = useNavigate();
  const [tenancyId, setTenancyId] = useState(tenancies[0]?.id || '');
  const [amountRands, setAmountRands] = useState('900.00');
  const [txDate, setTxDate] = useState('2026-11-20');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [verification, setVerification] = useState<PaymentVerificationStatus>('landlord-reported');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const targetId = tenancyId || tenancies[0]?.id;
      if (!targetId) throw new Error('Select a tenancy');
      const { receipt } = await recordPaymentTransaction({
        tenancyId: targetId,
        amountCents: parseZARToCents(amountRands),
        transactionDate: txDate,
        method,
        verificationStatus: verification,
        externalReference: reference,
        notes,
      });
      onNotify(`${receipt.receiptNumber}`);
      navigate(`/receipts/${receipt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/ledger" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {t.payments.backToLedgerLink}
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.payments.recordExternalTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
          {t.payments.recordExternalDesc}
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">{t.payments.tenancyTenantUnitLabel}</label>
            <select
              value={tenancyId}
              onChange={(e) => setTenancyId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
            >
              {tenancies.map((tenancy) => {
                const tenant = tenants.find((x) => x.id === tenancy.primaryTenantId);
                const unit = units.find((u) => u.id === tenancy.unitId);
                return (
                  <option key={tenancy.id} value={tenancy.id}>
                    {tenancy.tenancyReference} — {tenant?.fullName} ({unit?.unitNumber})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">{t.payments.amountReceivedZarLabel}</label>
              <input
                type="number"
                step="0.01"
                required
                value={amountRands}
                onChange={(e) => setAmountRands(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">{t.payments.transactionDateLabel}</label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">{t.payments.paymentMethodLabel}</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              >
                <option value="cash">{t.domainLabels.paymentMethods.cash}</option>
                <option value="eft">{t.domainLabels.paymentMethods.eft}</option>
                <option value="atm_cash_deposit">{t.domainLabels.paymentMethods.atm_cash_deposit}</option>
                <option value="ewallet_voucher">{t.domainLabels.paymentMethods.ewallet_voucher}</option>
                <option value="debit_order">{t.domainLabels.paymentMethods.debit_order}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t.payments.settlementVerificationLabel}</label>
              <select
                value={verification}
                onChange={(e) => setVerification(e.target.value as PaymentVerificationStatus)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              >
                <option value="landlord-reported">{t.domainLabels.verificationStatuses['landlord-reported']}</option>
                <option value="evidence-attached">{t.domainLabels.verificationStatuses['evidence-attached']}</option>
                <option value="reconciled">{t.domainLabels.verificationStatuses.reconciled}</option>
                <option value="disputed">{t.domainLabels.verificationStatuses.disputed}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">{t.payments.bankCashRefLabel}</label>
            <input
              type="text"
              placeholder={t.payments.bankCashRefPlaceholder}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">{t.common.notes}</label>
            <input
              type="text"
              placeholder={t.payments.optionalReceiptNotePlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link
              to="/ledger"
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 flex items-center"
            >
              {t.common.cancel}
            </Link>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {t.payments.recordIssueReceiptBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type PaymentsFilterTab = 'overview' | 'received' | 'pending' | 'overdue';

function formatRandWhole(cents: number): string {
  const rands = Math.round(cents / 100);
  return `R${rands.toLocaleString('en-US')}`;
}

export const ReceiptsScreen: React.FC<{
  receipts: Receipt[];
  payments: Payment[];
  charges?: Charge[];
  onOpenQuickAdd?: (tab: QuickAddTab) => void;
}> = ({ receipts, payments, charges = [], onOpenQuickAdd }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PaymentsFilterTab>('overview');
  const [showStatementsDrawer, setShowStatementsDrawer] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overdue' || tabParam === 'received' || tabParam === 'pending' || tabParam === 'overview') {
      setActiveTab(tabParam);
      setShowStatementsDrawer(false);
    } else if (tabParam === 'statements') {
      setShowStatementsDrawer(true);
    }
  }, [searchParams]);

  const filterTabs: { id: PaymentsFilterTab; label: string }[] = [
    { id: 'overview', label: t.payments.tabOverview },
    { id: 'received', label: t.payments.tabReceived },
    { id: 'pending', label: t.payments.tabPending },
    { id: 'overdue', label: t.payments.tabOverdue },
  ];

  // Featured recent payments matching the visual reference 1:1, plus any newly recorded payments
  const dawitReceipt = receipts.find((r) => r.id === 'rcp-2026-006' || r.tenantId === 'tenant-dawit');
  const meronReceipt = receipts.find((r) => r.id === 'rcp-2026-007' || r.tenantId === 'tenant-meron');

  const builtinReceiptIds = new Set([
    'rcp-2026-001',
    'rcp-2026-002',
    'rcp-2026-003',
    'rcp-2026-004',
    'rcp-2026-005',
    'rcp-2026-006',
    'rcp-2026-007',
  ]);
  const customNewReceipts = receipts.filter((r) => !builtinReceiptIds.has(r.id));

  const featuredRecentCards = [
    ...customNewReceipts.map((r) => ({
      id: r.id,
      receiptId: r.id,
      initials: r.tenantName
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarClass:
        'bg-[#DAE9FD] text-[#0145F2] dark:bg-[#22344D] dark:text-[#FFFFFF]',
      name: r.tenantName,
      sublabel: `${r.propertyUnitLabel.split('—').pop()?.trim() || 'Unit'} • ${t.common.today}`,
      amountText: `+${formatRandWhole(r.amountCents)}`,
    })),
    {
      id: 'recent-dawit',
      receiptId: dawitReceipt?.id || 'rcp-2026-006',
      initials: 'DT',
      avatarClass:
        'bg-[#DAE9FD] text-[#0145F2] dark:bg-[#22344D] dark:text-[#FFFFFF]',
      name: 'Dawit Tesfaye',
      sublabel: `Unit 2A • ${t.common.today}, 14:32`,
      amountText: '+R3,500',
    },
    {
      id: 'recent-meron',
      receiptId: meronReceipt?.id || 'rcp-2026-007',
      initials: 'MH',
      avatarClass:
        'bg-[#EFEDFD] text-[#4C35B5] dark:bg-[#313355] dark:text-[#FFFFFF]',
      name: 'Meron Haile',
      sublabel: `Unit 3B • ${t.common.today}, 11:08`,
      amountText: '+R3,500',
    },
  ];

  const overdueCharges = charges.filter(
    (c) =>
      !c.isDeleted &&
      c.status !== 'reversed' &&
      c.status !== 'paid' &&
      c.status !== 'waived' &&
      Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents) > 0 &&
      (c.status === 'overdue' || c.dueDate < '2026-11-20')
  );

  const pendingCharges = charges.filter(
    (c) =>
      !c.isDeleted &&
      c.status !== 'reversed' &&
      c.status !== 'paid' &&
      c.status !== 'waived' &&
      Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents) > 0 &&
      c.status !== 'overdue' &&
      c.dueDate >= '2026-11-20'
  );

  return (
    <div className="w-full space-y-3.5 pb-10 relative">
      {/* Page Heading */}
      <div className="pt-1">
        <h1 className="text-[31px] leading-[1.12] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
          {currentLanguage.uiStrings.paymentsTitle}
        </h1>
        <p className="text-[14.2px] leading-[1.35] text-[#374151] dark:text-[#C4C9D1] mt-1">
          {currentLanguage.uiStrings.paymentsSubtitle}
        </p>
      </div>

      {/* 4 Filter Pills: Overview | Received | Pending | Overdue */}
      <div
        role="tablist"
        aria-label={currentLanguage.uiStrings.paymentsTitle}
        className="grid grid-cols-4 gap-2 pt-0.5"
      >
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(tab.id);
                setShowStatementsDrawer(false);
              }}
              className={`h-[37px] px-2.5 rounded-full text-[13.5px] font-semibold transition-colors whitespace-nowrap flex items-center justify-center ${
                isActive
                  ? 'bg-[#0145F2] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.25)]'
                  : 'bg-[#F9FBFE] dark:bg-[#171A20] text-[#111318] dark:text-[#E5E7EB] border border-[#E4E9F0] dark:border-[#262B32] shadow-[0_1px_4px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Hero Card — Rental Income (Nov) */}
      <div className="rounded-[22px] px-4 py-3.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium text-[#374151] dark:text-[#D1D5DB]">
            {t.dashboard.rentalIncomeNov}
          </div>
          <div className="text-[29px] leading-[1.1] font-bold tracking-[-0.02em] tabular-nums text-[#111318] dark:text-[#FFFFFF] mt-1">
            R28,500
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#4CE67C]/45 dark:bg-[#0B3B21] text-[#059E23] dark:text-[#2CE058] text-[12px] font-semibold leading-none">
              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              +12%
            </span>
            <span className="text-[12.5px] text-[#374151] dark:text-[#C4C9D1]">
              {t.dashboard.vsLastMonth}
            </span>
          </div>
        </div>

        {/* 5 Vertical Rounded Bar Chart */}
        <div
          className="flex items-end gap-[7px] h-[58px] pt-1 pr-0.5 shrink-0"
          aria-hidden="true"
        >
          <div className="w-[15px] h-[13px] rounded-[4px] bg-[#A6C8FC] dark:bg-[#083A8C]" />
          <div className="w-[15px] h-[23px] rounded-[4px] bg-[#7FB0FA] dark:bg-[#0A4CB5]" />
          <div className="w-[15px] h-[33px] rounded-[4px] bg-[#5795F8] dark:bg-[#0D5ED8]" />
          <div className="w-[15px] h-[45px] rounded-[4px] bg-[#2C72F5] dark:bg-[#156EEF]" />
          <div className="w-[15px] h-[56px] rounded-[4px] bg-[#0145F2] dark:bg-[#1D7AFC]" />
        </div>
      </div>

      {/* 3-Column Summary Metric Cards: Received | Pending | Overdue */}
      <div className="grid grid-cols-3 gap-2.5 pt-0.5">
        {/* 1. Received */}
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className="rounded-[20px] py-3 px-2 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none flex flex-col items-center justify-center text-center min-h-[94px] transition-transform active:scale-[0.99]"
        >
          <CheckCircle2 className="w-[22px] h-[22px] text-[#12A138] dark:text-[#25D35A] stroke-[2] shrink-0" />
          <div className="text-[17px] leading-tight font-bold tabular-nums tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            R28,500
          </div>
          <div className="text-[12px] text-[#374151] dark:text-[#C4C9D1] mt-0.5 font-normal">
            {t.payments.receivedLabel}
          </div>
        </button>

        {/* 2. Pending */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className="rounded-[20px] py-3 px-2 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none flex flex-col items-center justify-center text-center min-h-[94px] transition-transform active:scale-[0.99]"
        >
          <Clock className="w-[22px] h-[22px] text-[#0145F2] dark:text-[#1D7AFC] stroke-[2] shrink-0" />
          <div className="text-[17px] leading-tight font-bold tabular-nums tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            R4,000
          </div>
          <div className="text-[12px] text-[#374151] dark:text-[#C4C9D1] mt-0.5 font-normal">
            {t.payments.pendingLabel}
          </div>
        </button>

        {/* 3. Overdue */}
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className="rounded-[20px] py-3 px-2 bg-[#FFEEF0] dark:bg-[#2A171B] border border-[#FAD6DA] dark:border-[#462127] shadow-[0_2px_8px_rgba(229,37,42,0.03)] dark:shadow-none flex flex-col items-center justify-center text-center min-h-[94px] transition-transform active:scale-[0.99]"
        >
          <AlertTriangle className="w-[22px] h-[22px] text-[#E5252A] dark:text-[#F85A5A] stroke-[2] shrink-0" />
          <div className="text-[17px] leading-tight font-bold tabular-nums tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF] mt-1.5">
            R6,500
          </div>
          <div className="text-[12px] text-[#E5252A] dark:text-[#F85A5A] mt-0.5 font-medium">
            {t.payments.overdueLabel}
          </div>
        </button>
      </div>

      {/* 3 Stacked Navigation Rows: Upcoming Payments | Payment History | Statements & Receipts */}
      <div className="space-y-2 pt-0.5">
        {/* 1. Upcoming Payments */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className="w-full rounded-[18px] px-3.5 py-2.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[36px] h-[36px] rounded-[11px] bg-[#EBF2FE] dark:bg-[#21262D] flex items-center justify-center text-[#0145F2] dark:text-[#D1D5DB] shrink-0">
              <Calendar className="w-[19px] h-[19px] stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-tight">
                {t.payments.upcomingPaymentsTitle}
              </div>
              <div className="text-[12px] text-[#374151] dark:text-[#B8C0CC] truncate mt-0.5">
                {t.payments.upcomingPaymentsSub}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[15px] font-bold tabular-nums text-[#111318] dark:text-[#FFFFFF]">
              R24,000
            </span>
            <ChevronRight className="w-[16px] h-[16px] text-[#4B5563] dark:text-[#9CA3AF] stroke-[2]" />
          </div>
        </button>

        {/* 2. Payment History */}
        <Link
          to="/ledger"
          className="w-full rounded-[18px] px-3.5 py-2.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[36px] h-[36px] rounded-[11px] bg-transparent dark:bg-[#21262D] flex items-center justify-center text-[#0145F2] dark:text-[#D1D5DB] shrink-0">
              <Layers className="w-[21px] h-[21px] stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-tight">
                {t.payments.paymentHistoryTitle}
              </div>
              <div className="text-[12px] text-[#374151] dark:text-[#B8C0CC] truncate mt-0.5">
                {t.payments.paymentHistorySub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-[16px] h-[16px] text-[#4B5563] dark:text-[#9CA3AF] stroke-[2] shrink-0" />
        </Link>

        {/* 3. Statements & Receipts */}
        <button
          type="button"
          onClick={() => setShowStatementsDrawer((prev) => !prev)}
          className="w-full rounded-[18px] px-3.5 py-2.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[36px] h-[36px] rounded-[11px] bg-transparent dark:bg-[#21262D] flex items-center justify-center text-[#0145F2] dark:text-[#D1D5DB] shrink-0">
              <FileText className="w-[21px] h-[21px] stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-tight">
                {t.payments.statementsReceiptsTitle}
              </div>
              <div className="text-[12px] text-[#374151] dark:text-[#B8C0CC] truncate mt-0.5">
                {t.payments.statementsReceiptsSub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-[16px] h-[16px] text-[#4B5563] dark:text-[#9CA3AF] stroke-[2] shrink-0" />
        </button>
      </div>

      {/* Expandable Official Numbered Receipts & PDF Statements Drawer */}
      {(showStatementsDrawer || activeTab === 'received') && (
        <div className="rounded-[20px] p-3.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.payments.officialReceiptsHeading} ({receipts.length})
            </span>
            {activeTab !== 'overview' && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-xs font-semibold text-[#0145F2] dark:text-[#5CA2FF] hover:underline"
              >
                {t.payments.backToOverviewBtn}
              </button>
            )}
          </div>
          <div className="divide-y divide-[#E6ECF3] dark:divide-[#262B31] text-xs">
            {receipts.map((r) => {
              const pay = payments.find((p) => p.id === r.paymentId);
              return (
                <div
                  key={r.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/receipts/${r.id}`}
                      className="font-bold text-[#111318] dark:text-[#FFFFFF] hover:text-[#0145F2] truncate block"
                    >
                      {r.tenantName} · {r.receiptNumber}
                    </Link>
                    <div className="text-[11px] text-[#4B5563] dark:text-[#A1A1AA] truncate">
                      {r.propertyUnitLabel} • {formatSADate(r.transactionDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold tabular-nums text-[#059D23] dark:text-[#1ED753]">
                      +{formatRandWhole(r.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadReceiptPDF(r, pay)}
                      className="px-2.5 py-1 rounded-full bg-[#EBF2FE] dark:bg-[#21262D] text-[#0145F2] dark:text-[#5CA2FF] text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> {t.common.pdf}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending / Overdue Filtered Views */}
      {activeTab === 'pending' && (
        <div className="rounded-[20px] p-3.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.payments.pendingUpcomingHeading}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-[#0145F2] dark:text-[#5CA2FF] font-semibold hover:underline"
            >
              {t.payments.backToOverviewBtn}
            </button>
          </div>
          {pendingCharges.map((c) => {
            const rem = Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents);
            return (
              <div
                key={c.id}
                className="py-2 border-t border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#111318] dark:text-[#FFFFFF] truncate">
                    {c.description}
                  </div>
                  <div className="text-[11px] text-[#4B5563] dark:text-[#A1A1AA]">
                    {t.payments.duePrefix}: {formatSADate(c.dueDate)}
                  </div>
                </div>
                <span className="font-bold tabular-nums text-[#0145F2] dark:text-[#5CA2FF]">
                  {formatRandWhole(rem)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'overdue' && (
        <div className="rounded-[20px] p-3.5 bg-[#FFEEF0] dark:bg-[#2A171B] border border-[#FAD6DA] dark:border-[#462127] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#E5252A] dark:text-[#FF7A82]">
              {t.payments.overdueChargesHeading} ({overdueCharges.length})
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-[#111318] dark:text-[#FFFFFF] font-semibold hover:underline"
            >
              {t.payments.backToOverviewBtn}
            </button>
          </div>
          {overdueCharges.map((c) => {
            const rem = Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents);
            return (
              <div
                key={c.id}
                className="py-2 border-t border-[#FAD6DA] dark:border-[#462127] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#111318] dark:text-[#FFFFFF] truncate">
                    {c.description}
                  </div>
                  <div className="text-[11px] text-[#E5252A] dark:text-[#FF7A82]">
                    {t.payments.duePrefix}: {formatSADate(c.dueDate)}
                  </div>
                </div>
                <span className="font-bold tabular-nums text-[#E5252A] dark:text-[#FF7A82]">
                  {formatRandWhole(rem)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Payments Section */}
      <div className="pt-1 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[17.5px] font-bold tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF]">
            {t.payments.recentPaymentsHeading}
          </h2>
          <button
            type="button"
            onClick={() => setShowStatementsDrawer((prev) => !prev)}
            className="text-[13px] font-semibold text-[#0145F2] dark:text-[#1E78FF] hover:opacity-85 flex items-center gap-0.5"
          >
            <span>{t.common.viewAll}</span>
            <ChevronRight className="w-[15px] h-[15px] stroke-[2.25]" />
          </button>
        </div>

        <div className="space-y-2">
          {featuredRecentCards.map((card) => (
            <Link
              key={card.id}
              to={`/receipts/${card.receiptId}`}
              className="rounded-[18px] px-3.5 py-2.5 bg-[#F9FBFE] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.02)] dark:shadow-none hover:border-[#0145F2]/50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] font-bold tracking-[-0.01em] shrink-0 ${card.avatarClass}`}
                >
                  {card.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-tight truncate">
                    {card.name}
                  </div>
                  <div className="text-[12.5px] text-[#374151] dark:text-[#B8C0CC] mt-0.5 truncate">
                    {card.sublabel}
                  </div>
                </div>
              </div>

              <div className="text-[15px] font-bold tabular-nums text-[#059D23] dark:text-[#1ED753] shrink-0 pr-1">
                {card.amountText}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Primary Action Button (+) — Opens Quick Actions (Payments) ONLY on this page */}
      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-30 flex justify-end">
        <button
          type="button"
          onClick={() => onOpenQuickAdd?.('payments_menu')}
          aria-label={t.quickActions.paymentsTitle}
          className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#0145F2] hover:bg-[#0039CC] active:scale-95 text-[#FFFFFF] shadow-[0_8px_22px_rgba(1,69,242,0.42)] flex items-center justify-center transition-all"
        >
          <Plus className="w-7 h-7 stroke-[2.25]" />
        </button>
      </div>
    </div>
  );
};

export const ReceiptDetailScreen: React.FC<{
  receipts: Receipt[];
  payments: Payment[];
}> = ({ receipts, payments }) => {
  const { t } = useLanguagePreference();
  const { receiptId } = useParams<{ receiptId: string }>();
  const receipt = receipts.find((r) => r.id === receiptId) || receipts[0];

  if (!receipt) {
    return <div className="p-6">{t.payments.receiptNotFound}</div>;
  }

  const payment = payments.find((p) => p.id === receipt.paymentId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to="/receipts" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {t.payments.allReceiptsLink}
        </Link>
        <button
          type="button"
          onClick={() => downloadReceiptPDF(receipt, payment)}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          {t.payments.downloadOfficialPdfBtn}
        </button>
      </div>

      {/* Receipt Preview Card */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono text-emerald-400">{t.payments.officialReceiptBadge}</div>
            <h1 className="text-lg font-bold font-mono">{receipt.receiptNumber}</h1>
          </div>
          <div className="text-xs text-slate-300 sm:text-right">
            <div>{t.payments.transactionDateLabel}: {formatSADate(receipt.transactionDate)}</div>
            <div>{t.payments.issuedPrefix}: {formatSADateTime(receipt.issuedAt)}</div>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {receipt.isCorrectionOrReversal && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-semibold">
              {t.payments.correctionReversalPrefix}: {receipt.correctionNote}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-slate-500">{t.payments.landlordEntityLabel}</div>
              <div className="font-bold text-sm mt-0.5">{receipt.landlordName}</div>
            </div>
            <div>
              <div className="text-slate-500">{t.payments.receivedFromTenantLabel}</div>
              <div className="font-bold text-sm mt-0.5">{receipt.tenantName}</div>
              <div className="text-slate-500 mt-0.5">{receipt.propertyUnitLabel}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-neutral-400">{t.payments.amountRecordedLabel}</span>
              <span className="text-lg font-bold font-mono tabular-nums">{formatZAR(receipt.amountCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-neutral-400">{t.payments.externalPaymentMethodLabel}</span>
              <span className="font-semibold">
                {t.domainLabels.paymentMethods[receipt.paymentMethod] || PAYMENT_METHOD_LABELS[receipt.paymentMethod]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-neutral-400">{t.payments.settlementVerificationLabel}</span>
              <span className="font-semibold">
                {t.domainLabels.verificationStatuses[receipt.paymentVerificationStatus] || PAYMENT_VERIFICATION_LABELS[receipt.paymentVerificationStatus]}
              </span>
            </div>
            {payment?.externalReference && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-neutral-400">{t.payments.externalReferenceLabel}</span>
                <span className="font-mono">{payment.externalReference}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800">
              <span className="text-slate-600 dark:text-neutral-400">{t.payments.remainingBalanceAfterLabel}</span>
              <span className="font-mono font-bold tabular-nums">
                {formatZAR(receipt.balanceAfterPaymentCents)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t.payments.auditNoticeReceipt}
          </p>
        </div>
      </div>
    </div>
  );
};
