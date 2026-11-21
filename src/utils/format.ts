/**
 * South African Currency (ZAR integer cents), Date, and Plain-Language Label Formatters
 */

export function formatZAR(cents: number, showSign = false): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(Math.round(cents));
  const rands = Math.floor(absCents / 100);
  const remainderCents = absCents % 100;

  const formattedRands = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formattedCents = remainderCents.toString().padStart(2, '0');

  const prefix = isNegative ? '-R ' : showSign && cents > 0 ? '+R ' : 'R ';
  return `${prefix}${formattedRands}.${formattedCents}`;
}

export function parseZARToCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatSADate(isoDate?: string): string {
  if (!isoDate) return 'Not set';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatSADateTime(isoDate?: string): string {
  if (!isoDate) return 'Not set';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const UNIT_TYPE_LABELS: Record<string, string> = {
  flat: 'Apartment / Flat',
  house: 'Free-Standing House',
  room: 'Inside Room',
  backyard_room: 'Backyard Room / Cottage',
  shared_accommodation: 'Shared Accommodation Bed/Room',
  shop: 'Retail Shopfront',
  office: 'Commercial Office',
  warehouse: 'Warehouse / Workshop',
  storage: 'Storage Unit',
  parking: 'Parking Bay',
};

export const PROPERTY_CATEGORY_LABELS: Record<string, string> = {
  residential: 'Residential Property',
  commercial: 'Commercial Property',
  mixed_use: 'Mixed-Use (Shop + Residential)',
  backyard_accommodation: 'Backyard Rooms & Main House',
  industrial_storage: 'Industrial / Storage / Parking',
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  'not-provided': 'Not Provided (Admin Allowed)',
  'pending-review': 'Pending Landlord Review',
  'reviewed-but-unverified': 'Reviewed (Not Independently Verified)',
  'verified': 'Verified Against Original',
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  sa_id_card: 'South African ID Card / Book',
  passport: 'Foreign Passport',
  asylum_permit: 'Section 22 / 24 Permit',
  work_visa: 'Work / Study Visa',
  affidavit_or_community_letter: 'Sworn Affidavit / Community Reference',
  company_registration: 'CIPC Company Registration',
  not_provided: 'No Formal Document Provided',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash Handed Over',
  eft: 'Bank EFT Transfer',
  atm_cash_deposit: 'ATM Cash Deposit',
  ewallet_voucher: 'eWallet / CashSend / Voucher',
  debit_order: 'External Debit Order',
  other_external: 'Other External Method',
};

export const PAYMENT_VERIFICATION_LABELS: Record<string, string> = {
  'landlord-reported': 'Landlord-Reported (Unverified)',
  'evidence-attached': 'Proof of Payment Attached',
  'reconciled': 'Reconciled with Bank / Cash Count',
  'disputed': 'Disputed / Under Query',
  'reversed': 'Reversed Entry',
};

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  'reported': 'Reported',
  'acknowledged': 'Acknowledged',
  'in-progress': 'In Progress',
  'awaiting-parts': 'Awaiting Parts / Quote',
  'resolved': 'Resolved',
  'closed': 'Closed',
};
