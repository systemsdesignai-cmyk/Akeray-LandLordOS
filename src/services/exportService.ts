import { db } from '../db/database';
import { formatZAR } from '../utils/format';

export interface BackupEnvelope {
  schemaName: 'LandlordOS_MVP_Backup';
  schemaVersion: '0.1.0';
  exportedAt: string;
  currency: 'ZAR';
  counts: {
    properties: number;
    units: number;
    tenantProfiles: number;
    tenancies: number;
    charges: number;
    payments: number;
    receipts: number;
    expenses: number;
    maintenanceTickets: number;
  };
  tables: Record<string, unknown[]>;
}

function triggerBrowserDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportEntityCSV(type: 'payments' | 'tenants' | 'units' | 'charges' | 'expenses'): Promise<void> {
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (type === 'payments') {
    const payments = await db.payments.toArray();
    const headers = [
      'Payment ID',
      'Tenancy ID',
      'Tenant ID',
      'Transaction Date',
      'Amount (ZAR)',
      'Amount (Cents)',
      'Method',
      'Verification Status',
      'External Reference',
      'Recorded By',
    ];
    const rows = payments.map((p) => [
      p.id,
      p.tenancyId,
      p.tenantId,
      p.transactionDate,
      formatZAR(p.amountCents),
      p.amountCents,
      p.method,
      p.verificationStatus,
      p.externalReference || '',
      p.recordedByName,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    triggerBrowserDownload(`Akarai_Payments_${dateStamp}.csv`, csv, 'text/csv;charset=utf-8;');
    return;
  }

  if (type === 'tenants') {
    const tenants = await db.tenantProfiles.toArray();
    const headers = [
      'Tenant Code',
      'Full Name',
      'Provisional Identifier',
      'Primary Phone',
      'Alternative Phone',
      'Documentation Type',
      'Documentation Status',
      'Has Smartphone',
      'Has Bank Account',
      'Preferred Channel',
    ];
    const rows = tenants.map((t) => [
      t.tenantCode,
      t.fullName,
      t.provisionalIdentifier || '',
      t.primaryPhone || 'None',
      t.alternativePhone || '',
      t.documentationType,
      t.documentationStatus,
      t.hasSmartphone ? 'Yes' : 'No',
      t.hasBankAccount ? 'Yes' : 'No',
      t.preferredChannel,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    triggerBrowserDownload(`Akarai_Tenants_${dateStamp}.csv`, csv, 'text/csv;charset=utf-8;');
    return;
  }

  if (type === 'units') {
    const units = await db.units.toArray();
    const headers = ['Unit ID', 'Property ID', 'Unit Number', 'Name', 'Type', 'Status', 'Standard Rent (ZAR)', 'Rent Cents'];
    const rows = units.map((u) => [
      u.id,
      u.propertyId,
      u.unitNumber,
      u.name,
      u.unitType,
      u.status,
      formatZAR(u.standardRentCents),
      u.standardRentCents,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    triggerBrowserDownload(`Akarai_Units_${dateStamp}.csv`, csv, 'text/csv;charset=utf-8;');
    return;
  }

  if (type === 'charges') {
    const charges = await db.charges.toArray();
    const headers = [
      'Charge ID',
      'Tenancy ID',
      'Period Key',
      'Type',
      'Description',
      'Charged (ZAR)',
      'Allocated Paid (ZAR)',
      'Adjusted (ZAR)',
      'Due Date',
      'Status',
    ];
    const rows = charges.map((c) => [
      c.id,
      c.tenancyId,
      c.periodKey,
      c.chargeType,
      c.description,
      formatZAR(c.amountCents),
      formatZAR(c.allocatedPaidCents),
      formatZAR(c.adjustedCents),
      c.dueDate,
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    triggerBrowserDownload(`Akarai_Charges_${dateStamp}.csv`, csv, 'text/csv;charset=utf-8;');
    return;
  }

  if (type === 'expenses') {
    const expenses = await db.expenses.toArray();
    const headers = ['Expense ID', 'Property ID', 'Category', 'Description', 'Vendor', 'Amount (ZAR)', 'Date', 'Status'];
    const rows = expenses.map((e) => [
      e.id,
      e.propertyId,
      e.category,
      e.description,
      e.vendorName || '',
      formatZAR(e.amountCents),
      e.incurredDate,
      e.paidStatus,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    triggerBrowserDownload(`Akarai_Expenses_${dateStamp}.csv`, csv, 'text/csv;charset=utf-8;');
  }
}

export async function exportFullBackupJSON(): Promise<BackupEnvelope> {
  const now = new Date().toISOString();
  const [
    organizations,
    users,
    memberships,
    ownerEntities,
    portfolios,
    properties,
    units,
    people,
    tenantProfiles,
    identityEvidences,
    tenancies,
    tenancyParticipants,
    leaseVersions,
    charges,
    payments,
    paymentAllocations,
    ledgerAdjustments,
    receipts,
    depositLiabilities,
    expenses,
    maintenanceTickets,
    maintenanceEvents,
    documents,
    communicationPreferences,
    messageLogs,
    consentRecords,
    auditEvents,
    syncOperations,
    applicationSettings,
  ] = await Promise.all([
    db.organizations.toArray(),
    db.users.toArray(),
    db.memberships.toArray(),
    db.ownerEntities.toArray(),
    db.portfolios.toArray(),
    db.properties.toArray(),
    db.units.toArray(),
    db.people.toArray(),
    db.tenantProfiles.toArray(),
    db.identityEvidences.toArray(),
    db.tenancies.toArray(),
    db.tenancyParticipants.toArray(),
    db.leaseVersions.toArray(),
    db.charges.toArray(),
    db.payments.toArray(),
    db.paymentAllocations.toArray(),
    db.ledgerAdjustments.toArray(),
    db.receipts.toArray(),
    db.depositLiabilities.toArray(),
    db.expenses.toArray(),
    db.maintenanceTickets.toArray(),
    db.maintenanceEvents.toArray(),
    db.documents.toArray(),
    db.communicationPreferences.toArray(),
    db.messageLogs.toArray(),
    db.consentRecords.toArray(),
    db.auditEvents.toArray(),
    db.syncOperations.toArray(),
    db.applicationSettings.toArray(),
  ]);

  const envelope: BackupEnvelope = {
    schemaName: 'LandlordOS_MVP_Backup',
    schemaVersion: '0.1.0',
    exportedAt: now,
    currency: 'ZAR',
    counts: {
      properties: properties.length,
      units: units.length,
      tenantProfiles: tenantProfiles.length,
      tenancies: tenancies.length,
      charges: charges.length,
      payments: payments.length,
      receipts: receipts.length,
      expenses: expenses.length,
      maintenanceTickets: maintenanceTickets.length,
    },
    tables: {
      organizations,
      users,
      memberships,
      ownerEntities,
      portfolios,
      properties,
      units,
      people,
      tenantProfiles,
      identityEvidences,
      tenancies,
      tenancyParticipants,
      leaseVersions,
      charges,
      payments,
      paymentAllocations,
      ledgerAdjustments,
      receipts,
      depositLiabilities,
      expenses,
      maintenanceTickets,
      maintenanceEvents,
      documents,
      communicationPreferences,
      messageLogs,
      consentRecords,
      auditEvents,
      syncOperations,
      applicationSettings,
    },
  };

  await db.applicationSettings.update('settings-default', {
    lastBackupExportedAt: now,
  });

  triggerBrowserDownload(
    `Akarai_Backup_${now.slice(0, 10)}.json`,
    JSON.stringify(envelope, null, 2),
    'application/json'
  );

  return envelope;
}

export function validateBackupJSON(rawText: string): {
  valid: boolean;
  error?: string;
  envelope?: BackupEnvelope;
} {
  try {
    const parsed = JSON.parse(rawText) as BackupEnvelope;
    if (
      parsed.schemaName !== 'LandlordOS_MVP_Backup' &&
      (parsed.schemaName as string) !== 'Akarai_Backup'
    ) {
      return { valid: false, error: 'Invalid backup schema header: expected Akarai_Backup or LandlordOS_MVP_Backup.' };
    }
    if (!parsed.schemaVersion || !parsed.tables || typeof parsed.tables !== 'object') {
      return { valid: false, error: 'Backup file is missing required schemaVersion or entity tables.' };
    }
    const requiredTables = ['properties', 'units', 'tenantProfiles', 'tenancies', 'charges', 'payments', 'receipts'];
    for (const req of requiredTables) {
      if (!Array.isArray(parsed.tables[req])) {
        return { valid: false, error: `Backup validation failed: missing or corrupted table "${req}".` };
      }
    }
    return { valid: true, envelope: parsed };
  } catch (err) {
    return {
      valid: false,
      error: `JSON parsing error: ${err instanceof Error ? err.message : 'Invalid JSON file'}`,
    };
  }
}

export async function restoreValidatedBackup(envelope: BackupEnvelope): Promise<void> {
  const t = envelope.tables;
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = t[table.name];
      if (Array.isArray(rows) && rows.length > 0) {
        await table.bulkAdd(rows);
      }
    }
  });
}
