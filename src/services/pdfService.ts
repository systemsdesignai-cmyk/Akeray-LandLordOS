import { jsPDF } from 'jspdf';
import type { Charge, Payment, Receipt, Tenancy, TenancyLedgerSummary, TenantProfile } from '../types/domain';
import {
  formatSADate,
  formatSADateTime,
  formatZAR,
  PAYMENT_METHOD_LABELS,
  PAYMENT_VERIFICATION_LABELS,
} from '../utils/format';

export function downloadReceiptPDF(receipt: Receipt, payment?: Payment): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  let y = 52;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, 507, 64, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AKARAI — OFFICIAL PAYMENT RECEIPT', margin + 18, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    receipt.isCorrectionOrReversal
      ? 'REVERSAL / CORRECTION RECEIPT RECORD'
      : 'Traceable South African Rental Transaction Record (ZAR)',
    margin + 18,
    y + 46
  );

  y += 88;
  doc.setTextColor(15, 23, 42);

  // Receipt Meta Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Receipt Number: ${receipt.receiptNumber}`, margin, y);
  doc.text(`Transaction Date: ${formatSADate(receipt.transactionDate)}`, 360, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Issued Timestamp: ${formatSADateTime(receipt.issuedAt)}`, margin, y);
  doc.text(`Tenancy Reference: ${receipt.tenancyId}`, 360, y);

  y += 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + 507, y);

  // Parties & Unit Details
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Landlord / Managing Entity', margin, y);
  doc.text('Tenant / Payer Details', 300, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(receipt.landlordName, margin, y);
  doc.text(receipt.tenantName, 300, y);

  y += 16;
  doc.text(`Property & Unit: ${receipt.propertyUnitLabel}`, margin, y);

  y += 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, 507, 112, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Financial Breakdown', margin + 16, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Amount Recorded:', margin + 16, y + 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(formatZAR(receipt.amountCents), 380, y + 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Payment Method:', margin + 16, y + 70);
  doc.text(PAYMENT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod, 380, y + 70);

  doc.text('Remaining Tenancy Balance After Transaction:', margin + 16, y + 92);
  doc.setFont('helvetica', 'bold');
  doc.text(
    receipt.balanceAfterPaymentCents > 0
      ? `${formatZAR(receipt.balanceAfterPaymentCents)} (Balance Due)`
      : receipt.balanceAfterPaymentCents < 0
        ? `${formatZAR(Math.abs(receipt.balanceAfterPaymentCents))} (Advance Credit)`
        : 'R 0.00 (Settled)',
    350,
    y + 92
  );

  y += 136;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `Verification Status: ${PAYMENT_VERIFICATION_LABELS[receipt.paymentVerificationStatus] || receipt.paymentVerificationStatus}`,
    margin,
    y
  );

  if (payment?.externalReference) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.text(`External Payment Reference: ${payment.externalReference}`, margin, y);
  }

  if (payment?.recordedByName) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.text(`Recorded By: ${payment.recordedByName}`, margin, y);
  }

  if (receipt.isCorrectionOrReversal && receipt.correctionNote) {
    y += 24;
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`Correction / Reversal Notice: ${receipt.correctionNote}`, margin, y);
    doc.setTextColor(15, 23, 42);
  }

  // Audit & Legal Notice
  y += 40;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + 507, y);
  y += 18;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Important Notice: Recording an external payment in Akarai documents an administrative receipt entry. Unless marked "Reconciled with Bank / Cash Count", recording a payment does not independently verify bank settlement. Akarai does not process or hold funds.',
    margin,
    y,
    { maxWidth: 507 }
  );

  doc.save(`${receipt.receiptNumber}.pdf`);
}

export function downloadTenancyStatementPDF(params: {
  tenancy: Tenancy;
  tenant?: TenantProfile;
  propertyUnitLabel: string;
  summary: TenancyLedgerSummary;
  charges: Charge[];
  payments: Payment[];
}): void {
  const { tenancy, tenant, propertyUnitLabel, summary, charges, payments } = params;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  let y = 50;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, 507, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('AKARAI — TENANCY LEDGER STATEMENT (ZAR)', margin + 16, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Reference: ${tenancy.tenancyReference} | Generated: ${formatSADate('2026-11-20')}`, margin + 16, y + 42);

  y += 76;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Tenant: ${tenant?.fullName || 'Tenant'}`, margin, y);
  doc.text(`Unit: ${propertyUnitLabel}`, 280, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Total Charged: ${formatZAR(summary.totalChargedCents)}`, margin, y);
  doc.text(`Total Paid (Allocated): ${formatZAR(summary.totalAllocatedPaidCents)}`, 190, y);
  doc.text(`Net Balance Due: ${formatZAR(summary.netBalanceDueCents)}`, 380, y);

  y += 16;
  doc.text(
    `Deposit Held as Liability (Not Rental Income): ${formatZAR(summary.depositHeldLiabilityCents)}`,
    margin,
    y
  );

  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Charges Ledger', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const c of charges) {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
    doc.text(
      `${formatSADate(c.dueDate)} | ${c.description.slice(0, 45)} | Charged: ${formatZAR(c.amountCents)} | Paid: ${formatZAR(c.allocatedPaidCents)} | [${c.status.toUpperCase()}]`,
      margin,
      y
    );
    y += 14;
  }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Recorded Payments', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const p of payments) {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
    doc.text(
      `${formatSADate(p.transactionDate)} | ${PAYMENT_METHOD_LABELS[p.method] || p.method} | ${formatZAR(p.amountCents)} | Status: ${p.verificationStatus}`,
      margin,
      y
    );
    y += 14;
  }

  doc.save(`Statement_${tenancy.tenancyReference}.pdf`);
}
