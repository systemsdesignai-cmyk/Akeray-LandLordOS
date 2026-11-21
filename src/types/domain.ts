/**
 * LandlordOS MVP v0.1 — Comprehensive Typed Domain Data Model
 * Designed for South African independent landlords & property managers (2–30+ units).
 * All financial values are stored strictly in integer ZAR cents (100 cents = R1.00).
 */

export type RoleType = 'owner' | 'manager' | 'tenant' | 'unauthenticated';

export type PropertyCategory =
  | 'residential'
  | 'commercial'
  | 'mixed_use'
  | 'backyard_accommodation'
  | 'industrial_storage';

export type UnitType =
  | 'flat'
  | 'house'
  | 'room'
  | 'backyard_room'
  | 'shared_accommodation'
  | 'shop'
  | 'office'
  | 'warehouse'
  | 'storage'
  | 'parking';

export type UnitStatus = 'occupied' | 'vacant' | 'maintenance' | 'reserved';

export type BillingCycle = 'monthly' | 'weekly' | 'biweekly' | 'quarterly';

export type DocumentationType =
  | 'sa_id_card'
  | 'passport'
  | 'asylum_permit'
  | 'work_visa'
  | 'affidavit_or_community_letter'
  | 'company_registration'
  | 'not_provided';

export type DocumentationStatus =
  | 'not-provided'
  | 'pending-review'
  | 'reviewed-but-unverified'
  | 'verified';

export type LeaseCategory = 'residential_standard' | 'backyard_room_agreement' | 'commercial_retail' | 'month_to_month_verbal_logged' | 'parking_storage';

export type TenancyStatus = 'draft' | 'active' | 'notice_given' | 'renewing' | 'ended' | 'terminated';

export type ChargeType = 'rent' | 'water' | 'electricity' | 'refuse' | 'sewerage' | 'parking' | 'late_fee_lawful' | 'other';

export type ChargeStatus = 'due' | 'partially_paid' | 'paid' | 'overdue' | 'waived' | 'adjusted' | 'reversed';

export type PaymentMethod = 'cash' | 'eft' | 'atm_cash_deposit' | 'ewallet_voucher' | 'debit_order' | 'other_external';

export type PaymentVerificationStatus =
  | 'landlord-reported'
  | 'evidence-attached'
  | 'reconciled'
  | 'disputed'
  | 'reversed';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type MaintenanceCategory =
  | 'plumbing_geyser'
  | 'electrical'
  | 'roof_structural'
  | 'locks_security'
  | 'appliances'
  | 'cleaning_grounds'
  | 'commercial_shopfront'
  | 'other';

export type MaintenanceStatus =
  | 'reported'
  | 'acknowledged'
  | 'in-progress'
  | 'awaiting-parts'
  | 'resolved'
  | 'closed';

export type CommunicationChannel = 'whatsapp' | 'sms' | 'in_person' | 'phone_call' | 'printed_notice' | 'portal_note';

export type MessageDeliveryStatus =
  | 'drafted'
  | 'handed-off'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'logged-offline';

export type DocumentCategory =
  | 'lease_agreement'
  | 'receipt'
  | 'inspection_report'
  | 'photograph'
  | 'notice'
  | 'correspondence'
  | 'identity_evidence_meta'
  | 'expense_invoice';

export interface BaseEntity {
  id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  isDeleted?: boolean;
}

export interface Organization extends BaseEntity {
  name: string;
  registrationNote?: string;
  defaultCurrency: 'ZAR';
  countryCode: 'ZA';
  planTier: 'starter_hypothesis' | 'growth_hypothesis' | 'business_hypothesis';
  maxUnitsLimit: number;
  popiaOfficerName: string;
  popiaContactPhone: string;
}

export interface User extends BaseEntity {
  fullName: string;
  email?: string;
  phone: string;
  role: RoleType;
  linkedTenantId?: string;
  assignedPropertyIds?: string[];
}

export interface Membership extends BaseEntity {
  userId: string;
  role: RoleType;
  assignedPropertyIds: string[];
  grantedPermissions: string[];
  status: 'active' | 'suspended';
}

export interface OwnerEntity extends BaseEntity {
  name: string;
  entityType: 'individual' | 'pty_ltd' | 'trust' | 'family_partnership';
  registrationOrTaxRef?: string;
  contactPhone: string;
  bankReferenceNote: string;
}

export interface Portfolio extends BaseEntity {
  ownerEntityId: string;
  name: string;
  description: string;
}

export interface Property extends BaseEntity {
  portfolioId: string;
  ownerEntityId: string;
  name: string;
  category: PropertyCategory;
  streetAddress: string;
  suburb: string;
  city: string;
  province: 'Gauteng' | 'Western Cape' | 'KwaZulu-Natal' | 'Eastern Cape' | 'Free State' | 'Limpopo' | 'Mpumalanga' | 'North West' | 'Northern Cape';
  postalCode: string;
  buildingsCount: number;
  floorsCount: number;
  thumbnailUrl?: string;
  notes?: string;
}

export interface Unit extends BaseEntity {
  propertyId: string;
  unitNumber: string;
  name: string;
  unitType: UnitType;
  buildingName?: string;
  floorLabel?: string;
  status: UnitStatus;
  standardRentCents: number;
  billingCycle: BillingCycle;
  sizeSqm?: number;
  amenities: string[];
  meterNumberElectricity?: string;
  meterNumberWater?: string;
  notes?: string;
}

export interface Person extends BaseEntity {
  fullName: string;
  preferredName?: string;
  provisionalIdentifier?: string;
  primaryPhone?: string;
  alternativePhone?: string;
  alternativeContactRelation?: string;
  email?: string;
  hasSmartphone: boolean;
  hasBankAccount: boolean;
  hasInternetAccess: boolean;
  preferredLanguage: string;
}

export interface TenantProfile extends BaseEntity {
  personId: string;
  tenantCode: string;
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
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  portalAccessEnabled: boolean;
  preferredChannel: CommunicationChannel;
  occupantsCount: number;
  notes?: string;
}

export interface IdentityEvidence extends BaseEntity {
  tenantId: string;
  documentationType: DocumentationType;
  documentationStatus: DocumentationStatus;
  referenceHint?: string; // Minimized metadata (last 4 digits or document type note, never full unencrypted ID dump in logs)
  reviewedByUserId?: string;
  reviewedAt?: string;
  verificationNotes: string;
  consentToStoreMetadata: boolean;
}

export interface Tenancy extends BaseEntity {
  propertyId: string;
  unitId: string;
  primaryTenantId: string;
  tenancyReference: string;
  leaseCategory: LeaseCategory;
  status: TenancyStatus;
  startDate: string;
  endDate?: string;
  moveInDate: string;
  moveOutDate?: string;
  rentAmountCents: number;
  paymentFrequency: BillingCycle;
  dueDayOfMonth: number;
  depositRequiredCents: number;
  recurringUtilityChargeCents: number;
  recurringUtilityLabel?: string;
  noticePeriodDays: number;
  legalReviewStatus: 'neutral_template_unreviewed' | 'practitioner_reviewed';
  specialTerms?: string;
}

export interface TenancyParticipant extends BaseEntity {
  tenancyId: string;
  tenantId: string;
  fullName: string;
  role: 'primary_tenant' | 'co_tenant' | 'authorized_occupant' | 'guarantor';
  joinedDate: string;
  leftDate?: string;
}

export interface LeaseVersion extends BaseEntity {
  tenancyId: string;
  versionNumber: number;
  effectiveDate: string;
  rentAmountCents: number;
  termsSummary: string;
  templateTitle: string;
  isLegalReviewed: boolean;
  createdByUserId: string;
}

export interface Charge extends BaseEntity {
  tenancyId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  periodKey: string; // e.g., "2026-11" to prevent duplicate recurring charges
  chargeType: ChargeType;
  description: string;
  amountCents: number;
  allocatedPaidCents: number;
  adjustedCents: number;
  dueDate: string;
  effectiveDate: string;
  status: ChargeStatus;
  recordedByUserId: string;
}

export interface Payment extends BaseEntity {
  tenancyId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  idempotencyKey: string;
  amountCents: number;
  unallocatedCents: number; // Advance payment / overpayment credit held on tenancy ledger
  transactionDate: string;
  effectiveDate: string;
  method: PaymentMethod;
  externalReference?: string;
  verificationStatus: PaymentVerificationStatus;
  recordedByUserId: string;
  recordedByName: string;
  notes?: string;
  reversalOfPaymentId?: string;
}

export interface PaymentAllocation extends BaseEntity {
  paymentId: string;
  chargeId: string;
  tenancyId: string;
  amountCents: number;
  allocatedAt: string;
}

export interface LedgerAdjustment extends BaseEntity {
  tenancyId: string;
  chargeId?: string;
  paymentId?: string;
  adjustmentType: 'waiver' | 'credit_note' | 'debit_correction' | 'reversal';
  amountCents: number; // Positive integer cents; direction defined by adjustmentType
  reason: string;
  effectiveDate: string;
  recordedByUserId: string;
  recordedByName: string;
}

export interface Receipt extends BaseEntity {
  receiptNumber: string;
  paymentId: string;
  tenancyId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  landlordName: string;
  tenantName: string;
  propertyUnitLabel: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  paymentVerificationStatus: PaymentVerificationStatus;
  transactionDate: string;
  issuedAt: string;
  balanceAfterPaymentCents: number;
  isCorrectionOrReversal: boolean;
  correctionNote?: string;
}

export interface DepositLiability extends BaseEntity {
  tenancyId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  agreedDepositCents: number;
  receivedDepositCents: number;
  accruedInterestCents: number;
  deductionsCents: number;
  refundedCents: number;
  heldInAccountNote: string;
  status: 'pending' | 'partially_held' | 'held_as_liability' | 'partially_refunded' | 'refunded';
}

export interface Expense extends BaseEntity {
  propertyId: string;
  unitId?: string;
  maintenanceTicketId?: string;
  category:
    | 'municipal_rates_taxes'
    | 'water_electricity_bulk'
    | 'repairs_maintenance'
    | 'security_cleaning'
    | 'insurance'
    | 'management_admin'
    | 'capital_improvement'
    | 'other';
  description: string;
  vendorName?: string;
  amountCents: number;
  incurredDate: string;
  paidStatus: 'paid' | 'unpaid_invoice';
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  recordedByUserId: string;
}

export interface MaintenanceTicket extends BaseEntity {
  ticketNumber: string;
  propertyId: string;
  unitId?: string;
  tenancyId?: string;
  tenantId?: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: string;
  reportedByRole: 'landlord' | 'manager' | 'tenant';
  reporterName: string;
  assignedContractorName?: string;
  assignedContractorPhone?: string;
  estimatedCostCents: number;
  actualCostCents: number;
  photoUrls: string[];
  completionNotes?: string;
  resolvedAt?: string;
}

export interface MaintenanceEvent extends BaseEntity {
  ticketId: string;
  statusFrom?: MaintenanceStatus;
  statusTo: MaintenanceStatus;
  note: string;
  actorName: string;
  eventTimestamp: string;
}

export interface Document extends BaseEntity {
  title: string;
  category: DocumentCategory;
  propertyId?: string;
  unitId?: string;
  tenancyId?: string;
  tenantId?: string;
  ownerName: string;
  accessScope: 'owner_only' | 'owner_and_manager' | 'shared_with_tenant';
  storageMode: 'local_indexeddb_blob' | 'cloud_private_bucket_unconfigured';
  mimeType: string;
  fileSizeBytes: number;
  localDataUrl?: string;
  retentionExpiresAt?: string;
  notes?: string;
}

export interface CommunicationPreference extends BaseEntity {
  tenantId: string;
  preferredChannel: CommunicationChannel;
  whatsappNumber?: string;
  smsNumber?: string;
  optedInReminders: boolean;
  optedOutAt?: string;
  languageNote: string;
}

export interface MessageLog extends BaseEntity {
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
  recordedByName: string;
  sentOrLoggedAt: string;
}

export interface ConsentRecord extends BaseEntity {
  tenantId: string;
  purpose: 'tenancy_administration' | 'identity_metadata_storage' | 'whatsapp_sms_communication';
  consentGranted: boolean;
  recordedMethod: 'signed_paper_logged' | 'verbal_witnessed_logged' | 'portal_checkbox';
  recordedAt: string;
  recordedByName: string;
  notes?: string;
}

export interface AuditEvent extends BaseEntity {
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  actorName: string;
  actorRole: RoleType;
  summary: string;
  previousStateJson?: string;
  newStateJson?: string;
}

export interface SyncOperation extends BaseEntity {
  entityTable: string;
  entityId: string;
  operation: 'insert' | 'update' | 'soft_delete';
  baseRevision: number;
  targetRevision: number;
  payloadJson: string;
  isFinancialEvent: boolean;
  syncStatus: 'queued_local_only' | 'conflict_requires_reconciliation' | 'reconciled_local';
  conflictReason?: string;
}

export interface ApplicationSettings extends BaseEntity {
  activeRole: RoleType;
  activeUserId: string;
  activeTenantIdForPortal?: string;
  assignedPropertyIdsForManager: string[];
  isSampleDataLoaded: boolean;
  theme: 'light' | 'dark' | 'system';
  supabaseConnected: boolean;
  smsProviderConfigured: boolean;
  lastBackupExportedAt?: string;
  onboardingCompleted: boolean;
}

export interface TenancyLedgerSummary {
  tenancyId: string;
  totalChargedCents: number;
  totalAllocatedPaidCents: number;
  totalUnallocatedCreditCents: number;
  totalWaivedOrCreditedCents: number;
  totalDebitAdjustedCents: number;
  netBalanceDueCents: number; // Positive = tenant owes arrears/due; Negative = tenant in advance/credit
  overdueAmountCents: number;
  depositHeldLiabilityCents: number;
}
