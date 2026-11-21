import Dexie, { type Table } from 'dexie';
import type {
  ApplicationSettings,
  AuditEvent,
  Charge,
  CommunicationPreference,
  ConsentRecord,
  DepositLiability,
  Document,
  Expense,
  IdentityEvidence,
  LedgerAdjustment,
  LeaseVersion,
  MaintenanceEvent,
  MaintenanceTicket,
  Membership,
  MessageLog,
  Organization,
  OwnerEntity,
  Payment,
  PaymentAllocation,
  Person,
  Portfolio,
  Property,
  Receipt,
  SyncOperation,
  Tenancy,
  TenancyParticipant,
  TenantProfile,
  Unit,
  User,
} from '../types/domain';

export class LandlordOSDatabase extends Dexie {
  organizations!: Table<Organization, string>;
  users!: Table<User, string>;
  memberships!: Table<Membership, string>;
  ownerEntities!: Table<OwnerEntity, string>;
  portfolios!: Table<Portfolio, string>;
  properties!: Table<Property, string>;
  units!: Table<Unit, string>;
  people!: Table<Person, string>;
  tenantProfiles!: Table<TenantProfile, string>;
  identityEvidences!: Table<IdentityEvidence, string>;
  tenancies!: Table<Tenancy, string>;
  tenancyParticipants!: Table<TenancyParticipant, string>;
  leaseVersions!: Table<LeaseVersion, string>;
  charges!: Table<Charge, string>;
  payments!: Table<Payment, string>;
  paymentAllocations!: Table<PaymentAllocation, string>;
  ledgerAdjustments!: Table<LedgerAdjustment, string>;
  receipts!: Table<Receipt, string>;
  depositLiabilities!: Table<DepositLiability, string>;
  expenses!: Table<Expense, string>;
  maintenanceTickets!: Table<MaintenanceTicket, string>;
  maintenanceEvents!: Table<MaintenanceEvent, string>;
  documents!: Table<Document, string>;
  communicationPreferences!: Table<CommunicationPreference, string>;
  messageLogs!: Table<MessageLog, string>;
  consentRecords!: Table<ConsentRecord, string>;
  auditEvents!: Table<AuditEvent, string>;
  syncOperations!: Table<SyncOperation, string>;
  applicationSettings!: Table<ApplicationSettings, string>;

  constructor() {
    super('LandlordOS_MVP_v01_DB');
    this.version(1).stores({
      organizations: 'id, name',
      users: 'id, organizationId, role, linkedTenantId',
      memberships: 'id, organizationId, userId, role',
      ownerEntities: 'id, organizationId, name',
      portfolios: 'id, organizationId, ownerEntityId, name',
      properties: 'id, organizationId, portfolioId, ownerEntityId, category, city',
      units: 'id, organizationId, propertyId, unitNumber, unitType, status',
      people: 'id, organizationId, fullName',
      tenantProfiles: 'id, organizationId, personId, tenantCode, fullName, documentationStatus',
      identityEvidences: 'id, organizationId, tenantId, documentationStatus',
      tenancies: 'id, organizationId, propertyId, unitId, primaryTenantId, tenancyReference, status',
      tenancyParticipants: 'id, organizationId, tenancyId, tenantId, role',
      leaseVersions: 'id, organizationId, tenancyId, versionNumber',
      charges: 'id, organizationId, tenancyId, propertyId, unitId, tenantId, periodKey, status, dueDate',
      payments: 'id, organizationId, tenancyId, propertyId, unitId, tenantId, idempotencyKey, transactionDate, verificationStatus',
      paymentAllocations: 'id, organizationId, paymentId, chargeId, tenancyId',
      ledgerAdjustments: 'id, organizationId, tenancyId, chargeId, paymentId, adjustmentType',
      receipts: 'id, organizationId, receiptNumber, paymentId, tenancyId, tenantId, transactionDate',
      depositLiabilities: 'id, organizationId, tenancyId, tenantId, propertyId, status',
      expenses: 'id, organizationId, propertyId, unitId, category, incurredDate',
      maintenanceTickets: 'id, organizationId, ticketNumber, propertyId, unitId, tenancyId, tenantId, status, priority',
      maintenanceEvents: 'id, organizationId, ticketId, eventTimestamp',
      documents: 'id, organizationId, category, propertyId, tenancyId, tenantId',
      communicationPreferences: 'id, organizationId, tenantId',
      messageLogs: 'id, organizationId, tenantId, tenancyId, channel, deliveryStatus, sentOrLoggedAt',
      consentRecords: 'id, organizationId, tenantId, purpose',
      auditEvents: 'id, organizationId, entityType, entityId, createdAt',
      syncOperations: 'id, organizationId, entityTable, entityId, syncStatus, isFinancialEvent',
      applicationSettings: 'id, organizationId',
    });
  }
}

export const db = new LandlordOSDatabase();
