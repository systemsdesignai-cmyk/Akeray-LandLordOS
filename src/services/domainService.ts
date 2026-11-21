import { db } from '../db/database';
import { ORG_ID, OWNER_USER_ID, seedSampleData } from '../db/sampleData';
import type {
  Charge,
  ChargeType,
  CommunicationChannel,
  DepositLiability,
  DocumentCategory,
  DocumentationStatus,
  DocumentationType,
  Expense,
  LeaseCategory,
  LedgerAdjustment,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  MessageDeliveryStatus,
  Payment,
  PaymentMethod,
  PaymentVerificationStatus,
  Property,
  PropertyCategory,
  Receipt,
  RoleType,
  Tenancy,
  TenancyLedgerSummary,
  Unit,
  UnitStatus,
  UnitType,
} from '../types/domain';
import { generateUUID } from '../utils/format';

/**
 * Pure, deterministic ledger balance calculator.
 * Balances are ALWAYS derived from charges, payment allocations, unallocated payment credits, and ledger adjustments.
 * Deposits are tracked separately as liabilities and never mixed into rental revenue.
 */
export function computeTenancyLedgerSummary(
  tenancyId: string,
  allCharges: Charge[],
  allPayments: Payment[],
  allAdjustments: LedgerAdjustment[],
  allDeposits: DepositLiability[]
): TenancyLedgerSummary {
  const charges = allCharges.filter((c) => c.tenancyId === tenancyId && !c.isDeleted && c.status !== 'reversed');
  const payments = allPayments.filter(
    (p) => p.tenancyId === tenancyId && !p.isDeleted && p.verificationStatus !== 'reversed'
  );
  const adjustments = allAdjustments.filter((a) => a.tenancyId === tenancyId && !a.isDeleted);
  const deposits = allDeposits.filter((d) => d.tenancyId === tenancyId && !d.isDeleted);

  let totalChargedCents = 0;
  let totalAllocatedPaidCents = 0;
  let totalWaivedOrCreditedCents = 0;
  let totalDebitAdjustedCents = 0;
  let overdueAmountCents = 0;

  for (const c of charges) {
    totalChargedCents += c.amountCents;
    totalAllocatedPaidCents += c.allocatedPaidCents;
    if (c.adjustedCents < 0) {
      totalWaivedOrCreditedCents += Math.abs(c.adjustedCents);
    } else if (c.adjustedCents > 0) {
      totalDebitAdjustedCents += c.adjustedCents;
    }

    const netChargeRemaining = Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents);
    if (c.status === 'overdue' || (netChargeRemaining > 0 && c.dueDate < '2026-11-20')) {
      overdueAmountCents += netChargeRemaining;
    }
  }

  // Also include standalone tenancy-level adjustments not tied to a single charge
  for (const adj of adjustments) {
    if (!adj.chargeId) {
      if (adj.adjustmentType === 'waiver' || adj.adjustmentType === 'credit_note') {
        totalWaivedOrCreditedCents += adj.amountCents;
      } else if (adj.adjustmentType === 'debit_correction') {
        totalDebitAdjustedCents += adj.amountCents;
      }
    }
  }

  let totalUnallocatedCreditCents = 0;
  for (const p of payments) {
    totalUnallocatedCreditCents += p.unallocatedCents;
  }

  const netBalanceDueCents =
    totalChargedCents +
    totalDebitAdjustedCents -
    totalWaivedOrCreditedCents -
    totalAllocatedPaidCents -
    totalUnallocatedCreditCents;

  const depositHeldLiabilityCents = deposits.reduce(
    (acc, d) => acc + Math.max(0, d.receivedDepositCents + d.accruedInterestCents - d.deductionsCents - d.refundedCents),
    0
  );

  return {
    tenancyId,
    totalChargedCents,
    totalAllocatedPaidCents,
    totalUnallocatedCreditCents,
    totalWaivedOrCreditedCents,
    totalDebitAdjustedCents,
    netBalanceDueCents,
    overdueAmountCents: Math.max(0, overdueAmountCents - totalUnallocatedCreditCents),
    depositHeldLiabilityCents,
  };
}

async function logAuditAndSync(params: {
  entityTable: string;
  entityType: string;
  entityId: string;
  action: string;
  operation: 'insert' | 'update' | 'soft_delete';
  summary: string;
  payload: unknown;
  isFinancialEvent: boolean;
  actorUserId?: string;
  actorName?: string;
  actorRole?: RoleType;
}) {
  const now = new Date().toISOString();
  const settings = await db.applicationSettings.get('settings-default');
  const actorUserId = params.actorUserId || settings?.activeUserId || OWNER_USER_ID;
  const actorRole = params.actorRole || settings?.activeRole || 'owner';
  const user = await db.users.get(actorUserId);
  const actorName = params.actorName || user?.fullName || 'Local Operator';

  await db.auditEvents.add({
    id: generateUUID(),
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actorUserId,
    actorName,
    actorRole,
    summary: params.summary,
    newStateJson: JSON.stringify(params.payload),
  });

  await db.syncOperations.add({
    id: generateUUID(),
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    entityTable: params.entityTable,
    entityId: params.entityId,
    operation: params.operation,
    baseRevision: 0,
    targetRevision: 1,
    payloadJson: JSON.stringify(params.payload),
    isFinancialEvent: params.isFinancialEvent,
    syncStatus: 'queued_local_only',
  });
}

export async function createPropertyRecord(input: {
  name: string;
  category: PropertyCategory;
  portfolioId?: string;
  ownerEntityId?: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: Property['province'];
  postalCode: string;
  buildingsCount: number;
  floorsCount: number;
  notes?: string;
}): Promise<Property> {
  const now = new Date().toISOString();
  const property: Property = {
    id: `prop-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    portfolioId: input.portfolioId || 'port-gauteng',
    ownerEntityId: input.ownerEntityId || 'owner-ent-1',
    name: input.name.trim(),
    category: input.category,
    streetAddress: input.streetAddress.trim(),
    suburb: input.suburb.trim(),
    city: input.city.trim(),
    province: input.province,
    postalCode: input.postalCode.trim(),
    buildingsCount: Math.max(1, input.buildingsCount),
    floorsCount: Math.max(1, input.floorsCount),
    notes: input.notes?.trim(),
  };

  await db.properties.add(property);
  await logAuditAndSync({
    entityTable: 'properties',
    entityType: 'Property',
    entityId: property.id,
    action: 'CREATE_PROPERTY',
    operation: 'insert',
    summary: `Created property "${property.name}" in ${property.suburb}, ${property.city}.`,
    payload: property,
    isFinancialEvent: false,
  });
  return property;
}

export async function createUnitRecord(input: {
  propertyId: string;
  unitNumber: string;
  name: string;
  unitType: UnitType;
  buildingName?: string;
  floorLabel?: string;
  status: UnitStatus;
  standardRentCents: number;
  sizeSqm?: number;
  amenities: string[];
  meterNumberElectricity?: string;
  meterNumberWater?: string;
  notes?: string;
}): Promise<Unit> {
  const now = new Date().toISOString();
  const unit: Unit = {
    id: `unit-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    propertyId: input.propertyId,
    unitNumber: input.unitNumber.trim(),
    name: input.name.trim(),
    unitType: input.unitType,
    buildingName: input.buildingName?.trim() || 'Main Structure',
    floorLabel: input.floorLabel?.trim() || 'Ground',
    status: input.status,
    standardRentCents: Math.max(0, Math.round(input.standardRentCents)),
    billingCycle: 'monthly',
    sizeSqm: input.sizeSqm,
    amenities: input.amenities,
    meterNumberElectricity: input.meterNumberElectricity?.trim(),
    meterNumberWater: input.meterNumberWater?.trim(),
    notes: input.notes?.trim(),
  };

  await db.units.add(unit);
  await logAuditAndSync({
    entityTable: 'units',
    entityType: 'Unit',
    entityId: unit.id,
    action: 'CREATE_UNIT',
    operation: 'insert',
    summary: `Added unit ${unit.unitNumber} (${unit.name}) with standard rent R${(unit.standardRentCents / 100).toFixed(2)}.`,
    payload: unit,
    isFinancialEvent: false,
  });
  return unit;
}

export async function createTenantRecord(input: {
  fullName: string;
  provisionalIdentifier?: string;
  primaryPhone?: string;
  alternativePhone?: string;
  alternativeContactName?: string;
  email?: string;
  hasSmartphone: boolean;
  hasBankAccount: boolean;
  hasInternetAccess: boolean;
  documentationType: DocumentationType;
  documentationStatus: DocumentationStatus;
  referenceHint?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  preferredChannel: CommunicationChannel;
  occupantsCount: number;
  portalAccessEnabled: boolean;
  notes?: string;
}) {
  const now = new Date().toISOString();
  const count = await db.tenantProfiles.count();
  const personId = `person-${generateUUID().slice(0, 8)}`;
  const tenantId = `tenant-${generateUUID().slice(0, 8)}`;
  const tenantCode = `TEN-${String(count + 1).padStart(3, '0')}`;

  await db.people.add({
    id: personId,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    fullName: input.fullName.trim(),
    provisionalIdentifier: input.provisionalIdentifier?.trim(),
    primaryPhone: input.primaryPhone?.trim() || undefined,
    alternativePhone: input.alternativePhone?.trim() || undefined,
    alternativeContactRelation: input.alternativeContactName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    hasSmartphone: input.hasSmartphone,
    hasBankAccount: input.hasBankAccount,
    hasInternetAccess: input.hasInternetAccess,
    preferredLanguage: 'English',
  });

  const profile = {
    id: tenantId,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    personId,
    tenantCode,
    fullName: input.fullName.trim(),
    provisionalIdentifier: input.provisionalIdentifier?.trim() || undefined,
    primaryPhone: input.primaryPhone?.trim() || undefined,
    alternativePhone: input.alternativePhone?.trim() || undefined,
    alternativeContactName: input.alternativeContactName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    hasSmartphone: input.hasSmartphone,
    hasBankAccount: input.hasBankAccount,
    hasInternetAccess: input.hasInternetAccess,
    documentationType: input.documentationType,
    documentationStatus: input.documentationStatus,
    emergencyContactName: input.emergencyContactName?.trim() || undefined,
    emergencyContactPhone: input.emergencyContactPhone?.trim() || undefined,
    emergencyContactRelation: input.emergencyContactRelation?.trim() || undefined,
    portalAccessEnabled: input.portalAccessEnabled,
    preferredChannel: input.preferredChannel,
    occupantsCount: Math.max(1, input.occupantsCount),
    notes: input.notes?.trim() || undefined,
  };

  await db.tenantProfiles.add(profile);

  await db.identityEvidences.add({
    id: `idev-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenantId,
    documentationType: input.documentationType,
    documentationStatus: input.documentationStatus,
    referenceHint:
      input.referenceHint?.trim() ||
      (input.documentationStatus === 'not-provided'
        ? 'No formal document collected — administrative record allowed'
        : 'Minimized metadata recorded'),
    verificationNotes:
      'Identity verification and immigration status are distinct concepts. Missing documentation does not imply unlawful status.',
    consentToStoreMetadata: true,
  });

  await db.consentRecords.add({
    id: `con-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenantId,
    purpose: 'tenancy_administration',
    consentGranted: true,
    recordedMethod: input.hasSmartphone ? 'portal_checkbox' : 'verbal_witnessed_logged',
    recordedAt: now,
    recordedByName: 'Sipho Khumalo',
    notes: 'POPIA data minimization applied at tenant registration.',
  });

  await logAuditAndSync({
    entityTable: 'tenantProfiles',
    entityType: 'TenantProfile',
    entityId: tenantId,
    action: 'REGISTER_TENANT',
    operation: 'insert',
    summary: `Registered tenant "${profile.fullName}" (${tenantCode}) with documentation status: ${profile.documentationStatus}.`,
    payload: profile,
    isFinancialEvent: false,
  });

  return profile;
}

export async function createTenancyRecord(input: {
  propertyId: string;
  unitId: string;
  primaryTenantId: string;
  coOccupantNames?: string[];
  leaseCategory: LeaseCategory;
  startDate: string;
  endDate?: string;
  rentAmountCents: number;
  dueDayOfMonth: number;
  depositRequiredCents: number;
  depositReceivedCents: number;
  recurringUtilityChargeCents: number;
  recurringUtilityLabel?: string;
  noticePeriodDays: number;
  specialTerms?: string;
  generateFirstMonthCharge: boolean;
  firstChargePeriodKey?: string;
}) {
  const now = new Date().toISOString();
  const unit = await db.units.get(input.unitId);
  const tenant = await db.tenantProfiles.get(input.primaryTenantId);
  const count = await db.tenancies.count();
  const tenancyId = `tenancy-${generateUUID().slice(0, 8)}`;
  const tenancyReference = `LSE-${unit?.unitNumber || 'U'}-${String(count + 1).padStart(2, '0')}`;

  const tenancy: Tenancy = {
    id: tenancyId,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    propertyId: input.propertyId,
    unitId: input.unitId,
    primaryTenantId: input.primaryTenantId,
    tenancyReference,
    leaseCategory: input.leaseCategory,
    status: 'active',
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    moveInDate: input.startDate,
    rentAmountCents: Math.round(input.rentAmountCents),
    paymentFrequency: 'monthly',
    dueDayOfMonth: Math.min(28, Math.max(1, input.dueDayOfMonth)),
    depositRequiredCents: Math.round(input.depositRequiredCents),
    recurringUtilityChargeCents: Math.round(input.recurringUtilityChargeCents),
    recurringUtilityLabel: input.recurringUtilityLabel?.trim() || 'Recurring Utility Charge',
    noticePeriodDays: input.noticePeriodDays || 30,
    legalReviewStatus: 'neutral_template_unreviewed',
    specialTerms: input.specialTerms?.trim(),
  };

  await db.tenancies.add(tenancy);

  // Update unit status to occupied
  if (unit) {
    await db.units.update(unit.id, { status: 'occupied', updatedAt: now, revision: unit.revision + 1 });
  }

  // Add primary participant & optional co-occupants
  await db.tenancyParticipants.add({
    id: `part-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenancyId,
    tenantId: input.primaryTenantId,
    fullName: tenant?.fullName || 'Primary Tenant',
    role: 'primary_tenant',
    joinedDate: input.startDate,
  });

  if (input.coOccupantNames && input.coOccupantNames.length > 0) {
    for (const coName of input.coOccupantNames) {
      if (coName.trim()) {
        await db.tenancyParticipants.add({
          id: `part-${generateUUID().slice(0, 8)}`,
          organizationId: ORG_ID,
          createdAt: now,
          updatedAt: now,
          revision: 1,
          tenancyId,
          tenantId: input.primaryTenantId,
          fullName: coName.trim(),
          role: 'authorized_occupant',
          joinedDate: input.startDate,
        });
      }
    }
  }

  // Record initial lease version
  await db.leaseVersions.add({
    id: `lv-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenancyId,
    versionNumber: 1,
    effectiveDate: input.startDate,
    rentAmountCents: tenancy.rentAmountCents,
    termsSummary: `Initial agreement (${input.leaseCategory}) at R${(tenancy.rentAmountCents / 100).toFixed(2)}/month.`,
    templateTitle:
      input.leaseCategory === 'commercial_retail'
        ? 'Neutral Commercial Lease Template (Requires Legal Review)'
        : 'Neutral Residential / Room Agreement Template (Requires Legal Review)',
    isLegalReviewed: false,
    createdByUserId: OWNER_USER_ID,
  });

  // Record Deposit Liability separately from rental revenue
  if (input.depositRequiredCents > 0 || input.depositReceivedCents > 0) {
    await db.depositLiabilities.add({
      id: `dep-${generateUUID().slice(0, 8)}`,
      organizationId: ORG_ID,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      tenancyId,
      tenantId: input.primaryTenantId,
      propertyId: input.propertyId,
      unitId: input.unitId,
      agreedDepositCents: Math.round(input.depositRequiredCents),
      receivedDepositCents: Math.round(input.depositReceivedCents),
      accruedInterestCents: 0,
      deductionsCents: 0,
      refundedCents: 0,
      heldInAccountNote: 'Dedicated Deposit Liability Account (Excluded from Rental Income)',
      status:
        input.depositReceivedCents >= input.depositRequiredCents
          ? 'held_as_liability'
          : input.depositReceivedCents > 0
            ? 'partially_held'
            : 'pending',
    });
  }

  if (input.generateFirstMonthCharge) {
    const periodMonth = input.firstChargePeriodKey || input.startDate.slice(0, 7);
    await generateChargeForTenancy({
      tenancyId,
      periodMonth,
      includeUtilities: true,
    });
  }

  await logAuditAndSync({
    entityTable: 'tenancies',
    entityType: 'Tenancy',
    entityId: tenancyId,
    action: 'CREATE_TENANCY',
    operation: 'insert',
    summary: `Created tenancy ${tenancyReference} for ${tenant?.fullName || 'Tenant'} on unit ${unit?.unitNumber || ''}.`,
    payload: tenancy,
    isFinancialEvent: true,
  });

  return tenancy;
}

/**
 * Generates recurring or manual charges for a tenancy while strictly preventing duplicate recurring charges for the same periodKey.
 */
export async function generateChargeForTenancy(input: {
  tenancyId: string;
  periodMonth: string; // e.g., "2026-11" or "2026-12"
  includeUtilities?: boolean;
  customCharge?: {
    chargeType: ChargeType;
    description: string;
    amountCents: number;
    dueDate: string;
  };
}): Promise<{ createdCharges: Charge[]; skippedDuplicates: string[] }> {
  const now = new Date().toISOString();
  const tenancy = await db.tenancies.get(input.tenancyId);
  if (!tenancy) throw new Error('Tenancy not found');

  const unit = await db.units.get(tenancy.unitId);
  const existingCharges = await db.charges.where('tenancyId').equals(tenancy.id).toArray();
  const createdCharges: Charge[] = [];
  const skippedDuplicates: string[] = [];

  if (input.customCharge) {
    const customKey = `${input.periodMonth}-${input.customCharge.chargeType}-${generateUUID().slice(0, 4)}`;
    const charge: Charge = {
      id: `chg-${generateUUID().slice(0, 8)}`,
      organizationId: ORG_ID,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      tenancyId: tenancy.id,
      propertyId: tenancy.propertyId,
      unitId: tenancy.unitId,
      tenantId: tenancy.primaryTenantId,
      periodKey: customKey,
      chargeType: input.customCharge.chargeType,
      description: input.customCharge.description.trim(),
      amountCents: Math.round(input.customCharge.amountCents),
      allocatedPaidCents: 0,
      adjustedCents: 0,
      dueDate: input.customCharge.dueDate,
      effectiveDate: input.customCharge.dueDate,
      status: input.customCharge.dueDate < '2026-11-20' ? 'overdue' : 'due',
      recordedByUserId: OWNER_USER_ID,
    };
    await db.charges.add(charge);
    createdCharges.push(charge);
  } else {
    const rentPeriodKey = `${input.periodMonth}-rent`;
    const hasExistingRent = existingCharges.some(
      (c) => c.periodKey === rentPeriodKey && c.status !== 'reversed' && !c.isDeleted
    );

    const dueDayStr = String(tenancy.dueDayOfMonth).padStart(2, '0');
    const dueDate = `${input.periodMonth}-${dueDayStr}`;

    if (hasExistingRent) {
      skippedDuplicates.push(`Rent charge for ${input.periodMonth} (${tenancy.tenancyReference})`);
    } else {
      const rentCharge: Charge = {
        id: `chg-${generateUUID().slice(0, 8)}`,
        organizationId: ORG_ID,
        createdAt: now,
        updatedAt: now,
        revision: 1,
        tenancyId: tenancy.id,
        propertyId: tenancy.propertyId,
        unitId: tenancy.unitId,
        tenantId: tenancy.primaryTenantId,
        periodKey: rentPeriodKey,
        chargeType: 'rent',
        description: `${input.periodMonth} Monthly Rent — ${unit?.name || tenancy.tenancyReference}`,
        amountCents: tenancy.rentAmountCents,
        allocatedPaidCents: 0,
        adjustedCents: 0,
        dueDate,
        effectiveDate: `${input.periodMonth}-01`,
        status: dueDate < '2026-11-20' ? 'overdue' : 'due',
        recordedByUserId: OWNER_USER_ID,
      };
      await db.charges.add(rentCharge);
      createdCharges.push(rentCharge);
    }

    if (input.includeUtilities && tenancy.recurringUtilityChargeCents > 0) {
      const utilPeriodKey = `${input.periodMonth}-utility`;
      const hasExistingUtil = existingCharges.some(
        (c) => c.periodKey === utilPeriodKey && c.status !== 'reversed' && !c.isDeleted
      );
      if (hasExistingUtil) {
        skippedDuplicates.push(`Utility charge for ${input.periodMonth} (${tenancy.tenancyReference})`);
      } else {
        const utilCharge: Charge = {
          id: `chg-${generateUUID().slice(0, 8)}`,
          organizationId: ORG_ID,
          createdAt: now,
          updatedAt: now,
          revision: 1,
          tenancyId: tenancy.id,
          propertyId: tenancy.propertyId,
          unitId: tenancy.unitId,
          tenantId: tenancy.primaryTenantId,
          periodKey: utilPeriodKey,
          chargeType: 'water',
          description: `${input.periodMonth} ${tenancy.recurringUtilityLabel || 'Utility Charge'}`,
          amountCents: tenancy.recurringUtilityChargeCents,
          allocatedPaidCents: 0,
          adjustedCents: 0,
          dueDate,
          effectiveDate: `${input.periodMonth}-01`,
          status: dueDate < '2026-11-20' ? 'overdue' : 'due',
          recordedByUserId: OWNER_USER_ID,
        };
        await db.charges.add(utilCharge);
        createdCharges.push(utilCharge);
      }
    }
  }

  if (createdCharges.length > 0) {
    await logAuditAndSync({
      entityTable: 'charges',
      entityType: 'Charge',
      entityId: createdCharges[0].id,
      action: 'GENERATE_CHARGES',
      operation: 'insert',
      summary: `Generated ${createdCharges.length} charge(s) for tenancy ${tenancy.tenancyReference} (${input.periodMonth}).`,
      payload: createdCharges,
      isFinancialEvent: true,
    });
  }

  return { createdCharges, skippedDuplicates };
}

/**
 * Records an externally processed payment (Cash, EFT, ATM deposit, eWallet),
 * prevents duplicate idempotency submissions, allocates oldest unpaid charges first (FIFO),
 * tracks advance/overpayment credits, and generates an auditable Receipt.
 */
export async function recordPaymentTransaction(input: {
  tenancyId: string;
  amountCents: number;
  transactionDate: string;
  method: PaymentMethod;
  externalReference?: string;
  verificationStatus: PaymentVerificationStatus;
  notes?: string;
  idempotencyToken?: string;
}): Promise<{ payment: Payment; receipt: Receipt }> {
  const now = new Date().toISOString();
  const tenancy = await db.tenancies.get(input.tenancyId);
  if (!tenancy) throw new Error('Tenancy not found');

  const roundedCents = Math.round(input.amountCents);
  if (roundedCents <= 0) throw new Error('Payment amount must be greater than R 0.00');

  // Prevent duplicate payment submissions within same day/reference/amount
  const idempotencyKey =
    input.idempotencyToken ||
    `${tenancy.id}-${input.transactionDate}-${input.method}-${roundedCents}-${input.externalReference?.trim() || 'noref'}`;

  const duplicate = await db.payments.where('idempotencyKey').equals(idempotencyKey).first();
  if (duplicate && duplicate.verificationStatus !== 'reversed') {
    throw new Error(
      `Duplicate payment submission prevented: A payment of R${(roundedCents / 100).toFixed(2)} on ${input.transactionDate} with the same reference is already recorded.`
    );
  }

  const settings = await db.applicationSettings.get('settings-default');
  const activeUser = await db.users.get(settings?.activeUserId || OWNER_USER_ID);
  const property = await db.properties.get(tenancy.propertyId);
  const unit = await db.units.get(tenancy.unitId);
  const tenant = await db.tenantProfiles.get(tenancy.primaryTenantId);
  const ownerEntity = property ? await db.ownerEntities.get(property.ownerEntityId) : undefined;

  // Fetch open charges for this tenancy ordered by dueDate ascending (FIFO allocation)
  const charges = (await db.charges.where('tenancyId').equals(tenancy.id).toArray())
    .filter((c) => !c.isDeleted && c.status !== 'reversed' && c.status !== 'paid' && c.status !== 'waived')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let remainingToAllocate = roundedCents;
  const paymentId = `pay-${generateUUID().slice(0, 8)}`;

  for (const charge of charges) {
    if (remainingToAllocate <= 0) break;
    const chargeNetDue = Math.max(0, charge.amountCents + charge.adjustedCents - charge.allocatedPaidCents);
    if (chargeNetDue <= 0) continue;

    const allocCents = Math.min(remainingToAllocate, chargeNetDue);
    const newAllocated = charge.allocatedPaidCents + allocCents;
    const isNowPaid = newAllocated >= charge.amountCents + charge.adjustedCents;

    await db.charges.update(charge.id, {
      allocatedPaidCents: newAllocated,
      status: isNowPaid ? 'paid' : 'partially_paid',
      updatedAt: now,
      revision: charge.revision + 1,
    });

    await db.paymentAllocations.add({
      id: `alloc-${generateUUID().slice(0, 8)}`,
      organizationId: ORG_ID,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      paymentId,
      chargeId: charge.id,
      tenancyId: tenancy.id,
      amountCents: allocCents,
      allocatedAt: now,
    });

    remainingToAllocate -= allocCents;
  }

  const payment: Payment = {
    id: paymentId,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenancyId: tenancy.id,
    propertyId: tenancy.propertyId,
    unitId: tenancy.unitId,
    tenantId: tenancy.primaryTenantId,
    idempotencyKey,
    amountCents: roundedCents,
    unallocatedCents: remainingToAllocate, // Any excess becomes advance credit on ledger
    transactionDate: input.transactionDate,
    effectiveDate: input.transactionDate,
    method: input.method,
    externalReference: input.externalReference?.trim() || undefined,
    verificationStatus: input.verificationStatus,
    recordedByUserId: activeUser?.id || OWNER_USER_ID,
    recordedByName: activeUser?.fullName || 'Sipho Khumalo (Owner)',
    notes: input.notes?.trim() || undefined,
  };

  await db.payments.add(payment);

  // Compute exact updated ledger balance after this payment
  const [allCharges, allPayments, allAdjustments, allDeposits] = await Promise.all([
    db.charges.where('tenancyId').equals(tenancy.id).toArray(),
    db.payments.where('tenancyId').equals(tenancy.id).toArray(),
    db.ledgerAdjustments.where('tenancyId').equals(tenancy.id).toArray(),
    db.depositLiabilities.where('tenancyId').equals(tenancy.id).toArray(),
  ]);

  const summary = computeTenancyLedgerSummary(tenancy.id, allCharges, allPayments, allAdjustments, allDeposits);
  const receiptCount = await db.receipts.count();
  const receiptNumber = `RCP-${input.transactionDate.slice(0, 7).replace('-', '')}-${String(receiptCount + 1).padStart(3, '0')}`;

  const receipt: Receipt = {
    id: `rcp-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    receiptNumber,
    paymentId: payment.id,
    tenancyId: tenancy.id,
    propertyId: tenancy.propertyId,
    unitId: tenancy.unitId,
    tenantId: tenancy.primaryTenantId,
    landlordName: ownerEntity?.name || 'Sipho Khumalo (Landlord)',
    tenantName: tenant?.fullName || 'Tenant',
    propertyUnitLabel: `${property?.name || 'Property'} — ${unit?.unitNumber || ''} (${unit?.name || ''})`,
    amountCents: roundedCents,
    paymentMethod: input.method,
    paymentVerificationStatus: input.verificationStatus,
    transactionDate: input.transactionDate,
    issuedAt: now,
    balanceAfterPaymentCents: summary.netBalanceDueCents,
    isCorrectionOrReversal: false,
  };

  await db.receipts.add(receipt);

  await logAuditAndSync({
    entityTable: 'payments',
    entityType: 'Payment',
    entityId: payment.id,
    action: 'RECORD_PAYMENT',
    operation: 'insert',
    summary: `Recorded R${(roundedCents / 100).toFixed(2)} (${input.method}) for ${tenant?.fullName || 'Tenant'} and issued receipt ${receiptNumber}.`,
    payload: { payment, receipt },
    isFinancialEvent: true,
  });

  return { payment, receipt };
}

/**
 * Reverses a payment entry safely without deleting historical records.
 * Restores charge balances, marks the payment as reversed, logs a LedgerAdjustment, and issues a reversal receipt record.
 */
export async function reversePaymentTransaction(paymentId: string, reason: string): Promise<Receipt> {
  const now = new Date().toISOString();
  const payment = await db.payments.get(paymentId);
  if (!payment) throw new Error('Payment not found');
  if (payment.verificationStatus === 'reversed') {
    throw new Error('This payment has already been reversed');
  }

  const allocations = await db.paymentAllocations.where('paymentId').equals(payment.id).toArray();
  for (const alloc of allocations) {
    const charge = await db.charges.get(alloc.chargeId);
    if (charge) {
      const updatedPaid = Math.max(0, charge.allocatedPaidCents - alloc.amountCents);
      const netTotal = charge.amountCents + charge.adjustedCents;
      const newStatus =
        updatedPaid >= netTotal
          ? 'paid'
          : updatedPaid > 0
            ? 'partially_paid'
            : charge.dueDate < '2026-11-20'
              ? 'overdue'
              : 'due';
      await db.charges.update(charge.id, {
        allocatedPaidCents: updatedPaid,
        status: newStatus,
        updatedAt: now,
        revision: charge.revision + 1,
      });
    }
  }

  await db.payments.update(payment.id, {
    verificationStatus: 'reversed',
    unallocatedCents: 0,
    updatedAt: now,
    revision: payment.revision + 1,
    notes: `${payment.notes ? payment.notes + ' | ' : ''}REVERSED: ${reason}`,
  });

  const settings = await db.applicationSettings.get('settings-default');
  const activeUser = await db.users.get(settings?.activeUserId || OWNER_USER_ID);

  await db.ledgerAdjustments.add({
    id: `adj-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenancyId: payment.tenancyId,
    paymentId: payment.id,
    adjustmentType: 'reversal',
    amountCents: payment.amountCents,
    reason: reason.trim(),
    effectiveDate: now.slice(0, 10),
    recordedByUserId: activeUser?.id || OWNER_USER_ID,
    recordedByName: activeUser?.fullName || 'Sipho Khumalo (Owner)',
  });

  const [allCharges, allPayments, allAdjustments, allDeposits] = await Promise.all([
    db.charges.where('tenancyId').equals(payment.tenancyId).toArray(),
    db.payments.where('tenancyId').equals(payment.tenancyId).toArray(),
    db.ledgerAdjustments.where('tenancyId').equals(payment.tenancyId).toArray(),
    db.depositLiabilities.where('tenancyId').equals(payment.tenancyId).toArray(),
  ]);
  const summary = computeTenancyLedgerSummary(payment.tenancyId, allCharges, allPayments, allAdjustments, allDeposits);

  const originalReceipt = await db.receipts.where('paymentId').equals(payment.id).first();
  const count = await db.receipts.count();
  const reversalReceipt: Receipt = {
    id: `rcp-rev-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    receiptNumber: `REV-${String(count + 1).padStart(3, '0')}`,
    paymentId: payment.id,
    tenancyId: payment.tenancyId,
    propertyId: payment.propertyId,
    unitId: payment.unitId,
    tenantId: payment.tenantId,
    landlordName: originalReceipt?.landlordName || 'Landlord',
    tenantName: originalReceipt?.tenantName || 'Tenant',
    propertyUnitLabel: originalReceipt?.propertyUnitLabel || 'Unit',
    amountCents: -payment.amountCents,
    paymentMethod: payment.method,
    paymentVerificationStatus: 'reversed',
    transactionDate: now.slice(0, 10),
    issuedAt: now,
    balanceAfterPaymentCents: summary.netBalanceDueCents,
    isCorrectionOrReversal: true,
    correctionNote: `Reversal of receipt ${originalReceipt?.receiptNumber || payment.id}: ${reason.trim()}`,
  };

  await db.receipts.add(reversalReceipt);

  await logAuditAndSync({
    entityTable: 'payments',
    entityType: 'PaymentReversal',
    entityId: payment.id,
    action: 'REVERSE_PAYMENT',
    operation: 'update',
    summary: `Reversed payment ${payment.id} (R${(payment.amountCents / 100).toFixed(2)}). Reason: ${reason}`,
    payload: reversalReceipt,
    isFinancialEvent: true,
  });

  return reversalReceipt;
}

/**
 * Applies a credit waiver or debit correction to a specific charge and recalculates charge status.
 */
export async function applyChargeAdjustment(input: {
  chargeId: string;
  adjustmentType: 'waiver' | 'debit_correction';
  amountCents: number;
  reason: string;
}) {
  const now = new Date().toISOString();
  const charge = await db.charges.get(input.chargeId);
  if (!charge) throw new Error('Charge not found');

  const signedDelta =
    input.adjustmentType === 'waiver' ? -Math.abs(Math.round(input.amountCents)) : Math.abs(Math.round(input.amountCents));
  const newAdjusted = charge.adjustedCents + signedDelta;
  const effectiveRequired = Math.max(0, charge.amountCents + newAdjusted);

  const newStatus =
    effectiveRequired === 0
      ? 'waived'
      : charge.allocatedPaidCents >= effectiveRequired
        ? 'paid'
        : charge.allocatedPaidCents > 0
          ? 'partially_paid'
          : charge.dueDate < '2026-11-20'
            ? 'overdue'
            : 'adjusted';

  await db.charges.update(charge.id, {
    adjustedCents: newAdjusted,
    status: newStatus,
    updatedAt: now,
    revision: charge.revision + 1,
  });

  const settings = await db.applicationSettings.get('settings-default');
  const activeUser = await db.users.get(settings?.activeUserId || OWNER_USER_ID);

  await db.ledgerAdjustments.add({
    id: `adj-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenancyId: charge.tenancyId,
    chargeId: charge.id,
    adjustmentType: input.adjustmentType,
    amountCents: Math.abs(Math.round(input.amountCents)),
    reason: input.reason.trim(),
    effectiveDate: now.slice(0, 10),
    recordedByUserId: activeUser?.id || OWNER_USER_ID,
    recordedByName: activeUser?.fullName || 'Sipho Khumalo (Owner)',
  });

  await logAuditAndSync({
    entityTable: 'ledgerAdjustments',
    entityType: 'LedgerAdjustment',
    entityId: charge.id,
    action: 'ADJUST_CHARGE',
    operation: 'update',
    summary: `Applied ${input.adjustmentType} of R${(Math.abs(input.amountCents) / 100).toFixed(2)} on charge "${charge.description}". Reason: ${input.reason}`,
    payload: { chargeId: charge.id, signedDelta, reason: input.reason },
    isFinancialEvent: true,
  });
}

export async function createMaintenanceTicketRecord(input: {
  propertyId: string;
  unitId?: string;
  tenancyId?: string;
  tenantId?: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  reportedByRole: 'landlord' | 'manager' | 'tenant';
  reporterName: string;
  assignedContractorName?: string;
  assignedContractorPhone?: string;
  estimatedCostCents: number;
  photoDataUrl?: string;
}) {
  const now = new Date().toISOString();
  const count = await db.maintenanceTickets.count();
  const ticketId = `mnt-${generateUUID().slice(0, 8)}`;
  const ticketNumber = `MNT-2026-${String(count + 14).padStart(3, '0')}`;

  const ticket = {
    id: ticketId,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    ticketNumber,
    propertyId: input.propertyId,
    unitId: input.unitId || undefined,
    tenancyId: input.tenancyId || undefined,
    tenantId: input.tenantId || undefined,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority,
    status: 'reported' as MaintenanceStatus,
    reportedDate: now.slice(0, 10),
    reportedByRole: input.reportedByRole,
    reporterName: input.reporterName.trim(),
    assignedContractorName: input.assignedContractorName?.trim() || undefined,
    assignedContractorPhone: input.assignedContractorPhone?.trim() || undefined,
    estimatedCostCents: Math.round(input.estimatedCostCents || 0),
    actualCostCents: 0,
    photoUrls: input.photoDataUrl ? [input.photoDataUrl] : [],
  };

  await db.maintenanceTickets.add(ticket);
  await db.maintenanceEvents.add({
    id: `mev-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    ticketId,
    statusTo: 'reported',
    note: `Ticket opened by ${ticket.reporterName} (${ticket.reportedByRole}).`,
    actorName: ticket.reporterName,
    eventTimestamp: now,
  });

  await logAuditAndSync({
    entityTable: 'maintenanceTickets',
    entityType: 'MaintenanceTicket',
    entityId: ticketId,
    action: 'CREATE_MAINTENANCE_TICKET',
    operation: 'insert',
    summary: `Created maintenance ticket ${ticketNumber}: "${ticket.title}".`,
    payload: ticket,
    isFinancialEvent: false,
  });

  return ticket;
}

export async function updateMaintenanceTicketStatus(input: {
  ticketId: string;
  newStatus: MaintenanceStatus;
  note: string;
  assignedContractorName?: string;
  actualCostCents?: number;
  completionNotes?: string;
  recordAsExpense?: boolean;
}) {
  const now = new Date().toISOString();
  const ticket = await db.maintenanceTickets.get(input.ticketId);
  if (!ticket) throw new Error('Maintenance ticket not found');

  const settings = await db.applicationSettings.get('settings-default');
  const activeUser = await db.users.get(settings?.activeUserId || OWNER_USER_ID);
  const actorName = activeUser?.fullName || 'Sipho Khumalo';

  const actualCostCents =
    input.actualCostCents !== undefined ? Math.round(input.actualCostCents) : ticket.actualCostCents;

  await db.maintenanceTickets.update(ticket.id, {
    status: input.newStatus,
    assignedContractorName: input.assignedContractorName?.trim() || ticket.assignedContractorName,
    actualCostCents,
    completionNotes: input.completionNotes?.trim() || ticket.completionNotes,
    resolvedAt: input.newStatus === 'resolved' || input.newStatus === 'closed' ? now : ticket.resolvedAt,
    updatedAt: now,
    revision: ticket.revision + 1,
  });

  await db.maintenanceEvents.add({
    id: `mev-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    ticketId: ticket.id,
    statusFrom: ticket.status,
    statusTo: input.newStatus,
    note: input.note.trim() || `Status updated to ${input.newStatus}`,
    actorName,
    eventTimestamp: now,
  });

  if (input.recordAsExpense && actualCostCents > 0) {
    await recordExpenseEntry({
      propertyId: ticket.propertyId,
      unitId: ticket.unitId,
      maintenanceTicketId: ticket.id,
      category: 'repairs_maintenance',
      description: `Maintenance ${ticket.ticketNumber}: ${ticket.title}`,
      vendorName: input.assignedContractorName || ticket.assignedContractorName || 'Maintenance Contractor',
      amountCents: actualCostCents,
      incurredDate: now.slice(0, 10),
      paidStatus: 'paid',
      paymentMethod: 'eft',
    });
  }
}

export async function recordExpenseEntry(input: {
  propertyId: string;
  unitId?: string;
  maintenanceTicketId?: string;
  category: Expense['category'];
  description: string;
  vendorName?: string;
  amountCents: number;
  incurredDate: string;
  paidStatus: 'paid' | 'unpaid_invoice';
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
}) {
  const now = new Date().toISOString();
  const expense: Expense = {
    id: `exp-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    propertyId: input.propertyId,
    unitId: input.unitId || undefined,
    maintenanceTicketId: input.maintenanceTicketId || undefined,
    category: input.category,
    description: input.description.trim(),
    vendorName: input.vendorName?.trim() || undefined,
    amountCents: Math.round(input.amountCents),
    incurredDate: input.incurredDate,
    paidStatus: input.paidStatus,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber?.trim() || undefined,
    recordedByUserId: OWNER_USER_ID,
  };

  await db.expenses.add(expense);
  await logAuditAndSync({
    entityTable: 'expenses',
    entityType: 'Expense',
    entityId: expense.id,
    action: 'RECORD_EXPENSE',
    operation: 'insert',
    summary: `Recorded expense "${expense.description}" of R${(expense.amountCents / 100).toFixed(2)}.`,
    payload: expense,
    isFinancialEvent: true,
  });

  return expense;
}

export async function logCommunicationEntry(input: {
  tenantId: string;
  tenancyId?: string;
  propertyId?: string;
  channel: CommunicationChannel;
  templateType:
    | 'rent_reminder'
    | 'payment_acknowledgement'
    | 'arrears_follow_up'
    | 'maintenance_update'
    | 'renewal_notice'
    | 'in_person_record'
    | 'general_message';
  subject: string;
  body: string;
  recipientContact: string;
  deliveryStatus: MessageDeliveryStatus;
  statusEvidenceNote: string;
}) {
  const now = new Date().toISOString();
  const settings = await db.applicationSettings.get('settings-default');
  const activeUser = await db.users.get(settings?.activeUserId || OWNER_USER_ID);

  const entry = {
    id: `msg-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    tenantId: input.tenantId,
    tenancyId: input.tenancyId,
    propertyId: input.propertyId,
    channel: input.channel,
    templateType: input.templateType,
    subject: input.subject.trim(),
    body: input.body.trim(),
    recipientContact: input.recipientContact.trim(),
    deliveryStatus: input.deliveryStatus,
    statusEvidenceNote: input.statusEvidenceNote,
    recordedByName: activeUser?.fullName || 'Sipho Khumalo',
    sentOrLoggedAt: now,
  };

  await db.messageLogs.add(entry);
  return entry;
}

export async function addDocumentRecord(input: {
  title: string;
  category: DocumentCategory;
  propertyId?: string;
  unitId?: string;
  tenancyId?: string;
  tenantId?: string;
  accessScope: 'owner_only' | 'owner_and_manager' | 'shared_with_tenant';
  mimeType: string;
  fileSizeBytes: number;
  localDataUrl?: string;
  retentionExpiresAt?: string;
  notes?: string;
}) {
  const now = new Date().toISOString();
  const doc = {
    id: `doc-${generateUUID().slice(0, 8)}`,
    organizationId: ORG_ID,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    title: input.title.trim(),
    category: input.category,
    propertyId: input.propertyId || undefined,
    unitId: input.unitId || undefined,
    tenancyId: input.tenancyId || undefined,
    tenantId: input.tenantId || undefined,
    ownerName: 'Sipho Khumalo',
    accessScope: input.accessScope,
    storageMode: 'local_indexeddb_blob' as const,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    localDataUrl: input.localDataUrl,
    retentionExpiresAt: input.retentionExpiresAt || '2031-12-31',
    notes: input.notes?.trim() || undefined,
  };
  await db.documents.add(doc);
  return doc;
}

export async function resolveFinancialSyncConflict(
  syncOpId: string,
  resolution: 'accept_proposed_adjustment' | 'keep_authoritative_ledger'
) {
  const now = new Date().toISOString();
  const op = await db.syncOperations.get(syncOpId);
  if (!op) return;

  if (resolution === 'accept_proposed_adjustment' && op.entityId === 'chg-kabelo-nov-util') {
    await applyChargeAdjustment({
      chargeId: 'chg-kabelo-nov-util',
      adjustmentType: 'waiver',
      amountCents: 5000,
      reason: 'Reconciled offline caretaker adjustment proposal (R50.00 water waiver).',
    });
  }

  await db.syncOperations.update(syncOpId, {
    syncStatus: 'reconciled_local',
    updatedAt: now,
    conflictReason: `Explicitly reconciled by Owner (${resolution === 'accept_proposed_adjustment' ? 'Applied R50.00 waiver' : 'Retained R200.00 authoritative charge'}).`,
  });
}

export async function clearSampleDataToEmptyWorkspace() {
  const now = new Date().toISOString();
  await Promise.all([
    db.properties.clear(),
    db.units.clear(),
    db.people.clear(),
    db.tenantProfiles.clear(),
    db.identityEvidences.clear(),
    db.tenancies.clear(),
    db.tenancyParticipants.clear(),
    db.leaseVersions.clear(),
    db.charges.clear(),
    db.payments.clear(),
    db.paymentAllocations.clear(),
    db.ledgerAdjustments.clear(),
    db.receipts.clear(),
    db.depositLiabilities.clear(),
    db.expenses.clear(),
    db.maintenanceTickets.clear(),
    db.maintenanceEvents.clear(),
    db.documents.clear(),
    db.communicationPreferences.clear(),
    db.messageLogs.clear(),
    db.consentRecords.clear(),
    db.auditEvents.clear(),
    db.syncOperations.clear(),
  ]);

  await db.applicationSettings.update('settings-default', {
    isSampleDataLoaded: false,
    updatedAt: now,
  });
}

export async function reloadFictionalSampleData() {
  await seedSampleData(true);
}
