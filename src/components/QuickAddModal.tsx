import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type {
  Charge,
  CommunicationChannel,
  DocumentationStatus,
  DocumentationType,
  Expense,
  LeaseCategory,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceTicket,
  PaymentMethod,
  PaymentVerificationStatus,
  Property,
  PropertyCategory,
  RoleType,
  Tenancy,
  TenantProfile,
  Unit,
  UnitStatus,
  UnitType,
} from '../types/domain';
import {
  createMaintenanceTicketRecord,
  createPropertyRecord,
  createTenancyRecord,
  createTenantRecord,
  createUnitRecord,
  logCommunicationEntry,
  recordExpenseEntry,
  recordPaymentTransaction,
} from '../services/domainService';
import { formatZAR, parseZARToCents } from '../utils/format';
import { useLanguagePreference } from './DesignSystem';
import {
  getContextualQuickActionsForScreen,
  resolveActiveScreenContext,
  type ContextualQuickActionItem,
} from '../config/navigationAndQuickActions';

export type QuickAddTab =
  | 'menu'
  | 'payments_menu'
  | 'payment'
  | 'property'
  | 'unit'
  | 'tenant'
  | 'tenancy'
  | 'maintenance'
  | 'notice'
  | 'expense';

interface QuickAddModalProps {
  isOpen: boolean;
  initialTab?: QuickAddTab;
  onClose: () => void;
  properties: Property[];
  units: Unit[];
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  charges?: Charge[];
  maintenanceTickets?: MaintenanceTicket[];
  activeRole?: RoleType;
  onSuccess?: (message: string) => void;
  onNavigate?: (path: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialTab = 'menu',
  onClose,
  properties,
  units,
  tenants,
  tenancies,
  charges = [],
  maintenanceTickets = [],
  activeRole = 'owner',
  onSuccess,
  onNavigate,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, contextualActions } = useLanguagePreference();

  const [activeTab, setActiveTab] = useState<QuickAddTab>(initialTab);
  const [originMenu, setOriginMenu] = useState<'menu' | 'payments_menu'>(
    initialTab === 'payments_menu' ? 'payments_menu' : 'menu'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve current screen and entity context from active route & parameters
  const screenContext = useMemo(
    () =>
      resolveActiveScreenContext(location.pathname, location.search, {
        properties,
        units,
        tenants,
        tenancies,
        charges,
        maintenanceTickets,
      }),
    [
      location.pathname,
      location.search,
      properties,
      units,
      tenants,
      tenancies,
      charges,
      maintenanceTickets,
    ]
  );

  const contextualMenuConfig = useMemo(
    () => getContextualQuickActionsForScreen(screenContext, activeRole, contextualActions),
    [screenContext, activeRole, contextualActions]
  );

  // 1. Payment Form State
  const [payTenancyId, setPayTenancyId] = useState('');
  const [payAmountRands, setPayAmountRands] = useState('3500.00');
  const [payDate, setPayDate] = useState('2026-11-20');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payVerification, setPayVerification] =
    useState<PaymentVerificationStatus>('landlord-reported');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // 2. Property Form State
  const [propName, setPropName] = useState('');
  const [propCategory, setPropCategory] = useState<PropertyCategory>('residential');
  const [propStreet, setPropStreet] = useState('');
  const [propSuburb, setPropSuburb] = useState('');
  const [propCity, setPropCity] = useState('Johannesburg');
  const [propProvince, setPropProvince] = useState<Property['province']>('Gauteng');
  const [propPostal, setPropPostal] = useState('2000');

  // 3. Unit Form State
  const [unitPropId, setUnitPropId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType] = useState<UnitType>('flat');
  const [unitStatus] = useState<UnitStatus>('vacant');
  const [unitRentRands, setUnitRentRands] = useState('3500.00');
  const [unitElecMeter] = useState('');

  // 4. Tenant Form State
  const [tenFullName, setTenFullName] = useState('');
  const [tenProvisional] = useState('');
  const [tenPhone, setTenPhone] = useState('');
  const [tenAltPhone] = useState('');
  const [tenAltName] = useState('');
  const [tenDocType] = useState<DocumentationType>('not_provided');
  const [tenDocStatus, setTenDocStatus] = useState<DocumentationStatus>('not-provided');
  const [tenHasSmartphone, setTenHasSmartphone] = useState(true);
  const [tenHasBank, setTenHasBank] = useState(true);
  const [tenHasInternet] = useState(true);
  const [tenChannel] = useState<CommunicationChannel>('whatsapp');
  const [tenNotes] = useState('');

  // 5. Tenancy Form State
  const [lseUnitId, setLseUnitId] = useState('');
  const [lseTenantId, setLseTenantId] = useState('');
  const [lseCategory] = useState<LeaseCategory>('residential_standard');
  const [lseStartDate, setLseStartDate] = useState('2026-11-01');
  const [lseRentRands, setLseRentRands] = useState('3500.00');
  const [lseDepositReqRands] = useState('3500.00');
  const [lseDepositRecRands] = useState('3500.00');
  const [lseUtilRands] = useState('250.00');
  const [lseDueDay] = useState('1');

  // 6. Maintenance Form State
  const [mntPropId, setMntPropId] = useState('');
  const [mntUnitId, setMntUnitId] = useState('');
  const [mntTitle, setMntTitle] = useState('');
  const [mntDesc] = useState('');
  const [mntCategory] = useState<MaintenanceCategory>('plumbing_geyser');
  const [mntPriority, setMntPriority] = useState<MaintenancePriority>('medium');
  const [mntEstRands, setMntEstRands] = useState('650.00');
  const [mntContractor] = useState('');

  // 7. Notice Form State
  const [notTenantId, setNotTenantId] = useState('');
  const [notSubject, setNotSubject] = useState('Rent & Inspection Notice');
  const [notChannel, setNotChannel] = useState<CommunicationChannel>('whatsapp');
  const [notBody, setNotBody] = useState(
    'Dear Tenant, please note your upcoming rental payment / routine unit inspection scheduled for this week.'
  );

  // 8. Expense Form State
  const [expPropId, setExpPropId] = useState('');
  const [expCategory] = useState<Expense['category']>('municipal_rates_taxes');
  const [expDesc, setExpDesc] = useState('');
  const [expVendor] = useState('');
  const [expAmountRands, setExpAmountRands] = useState('1250.00');
  const [expDate, setExpDate] = useState('2026-11-20');

  // Build context-aware reminder message for a specific tenant
  const buildReminderMessageForTenant = (targetTenantId?: string) => {
    const ten = tenants.find((x) => x.id === targetTenantId);
    if (!ten) {
      return 'Dear Tenant, this is a friendly reminder regarding your upcoming or overdue rental payment. Please share your proof of payment once completed.';
    }
    const tenancy =
      tenancies.find((l) => l.primaryTenantId === ten.id && l.status !== 'ended') ||
      tenancies.find((l) => l.primaryTenantId === ten.id);
    const unit = units.find((u) => u.id === tenancy?.unitId);
    const unpaidCents = tenancy
      ? charges
          .filter(
            (c) =>
              c.tenancyId === tenancy.id &&
              !c.isDeleted &&
              c.status !== 'reversed' &&
              c.status !== 'paid' &&
              c.status !== 'waived'
          )
          .reduce(
            (sum, c) => sum + Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents),
            0
          )
      : 0;
    const balanceDisplay =
      unpaidCents > 0
        ? formatZAR(unpaidCents)
        : tenancy
          ? formatZAR(tenancy.rentAmountCents)
          : 'R3,500.00';
    return `Dear ${ten.fullName}, friendly reminder regarding ${unit ? unit.unitNumber : 'your unit'}. Current balance due: ${balanceDisplay}. Reference: ${tenancy?.tenancyReference || ten.tenantCode}.`;
  };

  // Apply context-aware preselection when modal opens (never silently guessing when ambiguous)
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab);
    if (initialTab === 'payments_menu' || initialTab === 'menu') {
      setOriginMenu(initialTab);
    }
    setErrorMsg(null);

    const resolvedPropId =
      screenContext.propertyId || (properties.length === 1 ? properties[0].id : '');
    const propUnits = resolvedPropId
      ? units.filter((u) => u.propertyId === resolvedPropId)
      : units;
    const resolvedUnitId =
      screenContext.unitId || (propUnits.length === 1 ? propUnits[0].id : '');
    const resolvedTenantId =
      screenContext.tenantId || (tenants.length === 1 ? tenants[0].id : '');
    const resolvedTenancyId =
      screenContext.tenancyId || (tenancies.length === 1 ? tenancies[0].id : '');

    setUnitPropId(resolvedPropId);
    setMntPropId(resolvedPropId);
    setMntUnitId(screenContext.unitId || '');
    setExpPropId(resolvedPropId);

    setLseUnitId(resolvedUnitId);
    setLseTenantId(resolvedTenantId);
    if (screenContext.standardRentCents) {
      const rentStr = (screenContext.standardRentCents / 100).toFixed(2);
      setLseRentRands(rentStr);
      setUnitRentRands(rentStr);
    }

    setPayTenancyId(resolvedTenancyId);
    if (screenContext.overdueBalanceCents && screenContext.overdueBalanceCents > 0) {
      setPayAmountRands((screenContext.overdueBalanceCents / 100).toFixed(2));
    } else if (screenContext.standardRentCents && screenContext.standardRentCents > 0) {
      setPayAmountRands((screenContext.standardRentCents / 100).toFixed(2));
    } else {
      setPayAmountRands('3500.00');
    }

    setNotTenantId(resolvedTenantId);
    if (resolvedTenantId) {
      setNotBody(buildReminderMessageForTenant(resolvedTenantId));
    }

    if (screenContext.estimatedRepairCostCents && screenContext.estimatedRepairCostCents > 0) {
      setExpAmountRands((screenContext.estimatedRepairCostCents / 100).toFixed(2));
    }
  }, [isOpen, initialTab, screenContext]);

  // Escape key & Android Back button handling when QuickAddModal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    let pushedHistoryState = false;
    try {
      if (window.history.state?.akaraiQuickActionsOpen !== true) {
        window.history.pushState(
          { ...window.history.state, akaraiQuickActionsOpen: true },
          ''
        );
        pushedHistoryState = true;
      }
    } catch {
      // ignore
    }

    const handlePopState = () => {
      pushedHistoryState = false;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (pushedHistoryState && window.history.state?.akaraiQuickActionsOpen === true) {
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectContextualAction = (item: ContextualQuickActionItem) => {
    setErrorMsg(null);

    if (item.targetRoute) {
      onClose();
      if (onNavigate) {
        onNavigate(item.targetRoute);
      } else {
        navigate(item.targetRoute);
      }
      return;
    }

    if (item.presetMode === 'issue_receipt') {
      setPayNotes('Official Rent Receipt Issued & Shared');
    } else if (item.presetMode === 'rent_reminder') {
      setNotSubject(t.commsMaintDocs.templateRentReminder);
      setNotBody(buildReminderMessageForTenant(notTenantId || screenContext.tenantId));
    }

    if (item.targetTab) {
      setActiveTab(item.targetTab);
    }
  };

  // Contextual Quick Actions Bottom Sheet Menu (adapts dynamically to Home, Properties, Tenants, Payments & nested screens)
  if (activeTab === 'menu' || activeTab === 'payments_menu') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 dark:bg-black/65 backdrop-blur-[1px] transition-opacity duration-200 motion-reduce:transition-none"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={contextualMenuConfig.menuTitle}
          className="w-full max-w-[430px] rounded-t-[28px] bg-[#F7F9FD] dark:bg-[#171C23] border-t border-[#E4E9F2] dark:border-[#272E38] px-4 pt-3 pb-5 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] dark:shadow-[0_-10px_36px_rgba(0,0,0,0.75)] transition-transform duration-200 ease-out motion-reduce:transition-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Drag Handle */}
          <div className="w-[42px] h-[4px] rounded-full bg-[#94A3B8]/80 dark:bg-[#525B68] mx-auto mb-3.5" />

          {/* Header & Active Entity Context Badge */}
          <div className="mb-3.5 px-0.5">
            {contextualMenuConfig.contextLabel && (
              <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] dark:text-[#68A2FF] text-[11.5px] font-semibold">
                <span>{contextualActions.context.activeContextPrefix}:</span>
                <span className="font-bold truncate max-w-[260px]">
                  {contextualMenuConfig.contextLabel}
                </span>
              </div>
            )}
            <h2 className="text-[21px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] leading-tight">
              {contextualMenuConfig.menuTitle}
            </h2>
            <p className="text-[13px] text-[#374151] dark:text-[#C4C9D1] mt-1">
              {contextualMenuConfig.menuSubtitle}
            </p>
          </div>

          {/* Contextual Action Cards */}
          <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-0.5">
            {contextualMenuConfig.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectContextualAction(item)}
                  className="w-full rounded-[16px] px-3.5 py-2.5 bg-[#FFFFFF] dark:bg-[#1E242D] border border-[#E6ECF4] dark:border-[#2B333F] shadow-[0_1px_3px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50 dark:hover:border-[#3B4656] transition-colors flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[34px] h-[34px] flex items-center justify-center text-[#0145F2] dark:text-[#1E80FF] shrink-0">
                      <Icon className="w-[22px] h-[22px] stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug break-words">
                        {item.title}
                      </div>
                      <div className="text-[12px] leading-[1.3] text-[#374151] dark:text-[#B8C0CC] whitespace-pre-line mt-0.5 break-words">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-[16px] h-[16px] text-[#374151] dark:text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2]" />
                </button>
              );
            })}
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-3.5 w-full h-[46px] rounded-[15px] bg-[#E2ECFC] dark:bg-[#262C36] hover:bg-[#D5E3FA] dark:hover:bg-[#2F3744] text-[#0145F2] dark:text-[#E5E7EB] text-[14.5px] font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-[17px] h-[17px] stroke-[2.3]" />
            <span>{t.common.cancel}</span>
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: QuickAddTab; label: string }[] = [
    { id: 'property', label: t.common.property },
    { id: 'tenant', label: t.common.tenant },
    { id: 'payment', label: t.common.payments },
    { id: 'maintenance', label: t.common.maintenance },
    { id: 'notice', label: t.common.notice },
    { id: 'unit', label: t.common.unit },
    { id: 'tenancy', label: t.common.tenancy },
    { id: 'expense', label: t.common.expense },
  ];

  // Filtered units when a property is selected in context or form
  const selectableUnitsForTenancy = screenContext.propertyId
    ? units.filter((u) => u.propertyId === screenContext.propertyId)
    : units;

  const selectableUnitsForMaintenance = mntPropId
    ? units.filter((u) => u.propertyId === mntPropId)
    : units;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (activeTab === 'payment') {
        if (!payTenancyId) {
          throw new Error(contextualActions.context.confirmTenancyRequired);
        }
        const { receipt } = await recordPaymentTransaction({
          tenancyId: payTenancyId,
          amountCents: parseZARToCents(payAmountRands),
          transactionDate: payDate,
          method: payMethod,
          verificationStatus: payVerification,
          externalReference: payRef,
          notes: payNotes,
        });
        onSuccess?.(`${t.quickActions.recordPaymentTitle}: ${receipt.receiptNumber}`);
        onClose();
      } else if (activeTab === 'property') {
        if (!propName.trim() || !propStreet.trim())
          throw new Error('Property name and street address are required.');
        const prop = await createPropertyRecord({
          name: propName,
          category: propCategory,
          streetAddress: propStreet,
          suburb: propSuburb || propCity || 'Johannesburg',
          city: propCity || 'Johannesburg',
          province: propProvince,
          postalCode: propPostal || '2000',
          buildingsCount: 1,
          floorsCount: 1,
        });
        onSuccess?.(`${t.common.property}: "${prop.name}"`);
        onClose();
      } else if (activeTab === 'unit') {
        if (!unitPropId) {
          throw new Error(contextualActions.context.confirmPropertyRequired);
        }
        if (!unitNumber.trim() || !unitName.trim())
          throw new Error('Unit code and unit name are required.');
        const u = await createUnitRecord({
          propertyId: unitPropId,
          unitNumber,
          name: unitName,
          unitType,
          status: unitStatus,
          standardRentCents: parseZARToCents(unitRentRands),
          amenities: ['Prepaid Sub-meter'],
          meterNumberElectricity: unitElecMeter,
        });
        onSuccess?.(`${t.common.unit}: ${u.unitNumber} (${u.name})`);
        onClose();
      } else if (activeTab === 'tenant') {
        if (!tenFullName.trim())
          throw new Error('Tenant name or provisional identifier is required.');
        const ten = await createTenantRecord({
          fullName: tenFullName,
          provisionalIdentifier: tenProvisional,
          primaryPhone: tenPhone,
          alternativePhone: tenAltPhone,
          alternativeContactName: tenAltName,
          hasSmartphone: tenHasSmartphone,
          hasBankAccount: tenHasBank,
          hasInternetAccess: tenHasInternet,
          documentationType: tenDocType,
          documentationStatus: tenDocStatus,
          preferredChannel: tenHasSmartphone ? tenChannel : 'in_person',
          occupantsCount: 1,
          portalAccessEnabled: tenHasSmartphone && tenHasInternet,
          notes: tenNotes,
        });
        onSuccess?.(`${t.common.tenant}: "${ten.fullName}" (${ten.tenantCode})`);
        onClose();
      } else if (activeTab === 'tenancy') {
        if (!lseUnitId || !lseTenantId) {
          throw new Error(contextualActions.context.confirmUnitAndTenantRequired);
        }
        const unitObj = units.find((u) => u.id === lseUnitId);
        const lse = await createTenancyRecord({
          propertyId: unitObj?.propertyId || screenContext.propertyId || properties[0]?.id || '',
          unitId: lseUnitId,
          primaryTenantId: lseTenantId,
          leaseCategory: lseCategory,
          startDate: lseStartDate,
          rentAmountCents: parseZARToCents(lseRentRands),
          dueDayOfMonth: parseInt(lseDueDay, 10) || 1,
          depositRequiredCents: parseZARToCents(lseDepositReqRands),
          depositReceivedCents: parseZARToCents(lseDepositRecRands),
          recurringUtilityChargeCents: parseZARToCents(lseUtilRands),
          recurringUtilityLabel: 'Water & Refuse Contribution',
          noticePeriodDays: 30,
          generateFirstMonthCharge: true,
          firstChargePeriodKey: '2026-11',
        });
        onSuccess?.(`${t.common.tenancy}: ${lse.tenancyReference}`);
        onClose();
      } else if (activeTab === 'maintenance') {
        if (!mntPropId) {
          throw new Error(contextualActions.context.confirmPropertyRequired);
        }
        if (!mntTitle.trim())
          throw new Error('Property and issue summary are required.');
        const ticket = await createMaintenanceTicketRecord({
          propertyId: mntPropId,
          unitId: mntUnitId || undefined,
          title: mntTitle,
          description: mntDesc || mntTitle,
          category: mntCategory,
          priority: mntPriority,
          reportedByRole: 'landlord',
          reporterName: 'Abel (Landlord)',
          assignedContractorName: mntContractor,
          estimatedCostCents: parseZARToCents(mntEstRands),
        });
        onSuccess?.(`${t.common.maintenance}: ${ticket.ticketNumber}`);
        onClose();
      } else if (activeTab === 'notice') {
        const targetTenant = tenants.find((ten) => ten.id === notTenantId);
        if (!targetTenant) {
          throw new Error(contextualActions.context.confirmTenantRequired);
        }
        const tenancy = tenancies.find((ten) => ten.primaryTenantId === targetTenant.id);
        await logCommunicationEntry({
          tenantId: targetTenant.id,
          tenancyId: tenancy?.id,
          propertyId: tenancy?.propertyId,
          channel: notChannel,
          templateType: 'general_message',
          subject: notSubject || 'Landlord Notice',
          body: notBody,
          recipientContact:
            targetTenant.primaryPhone || targetTenant.alternativePhone || 'In-Person Delivery',
          deliveryStatus: notChannel === 'in_person' ? 'logged-offline' : 'drafted',
          statusEvidenceNote:
            notChannel === 'in_person'
              ? 'Logged as printed/in-person notice.'
              : 'Saved notice in Communication Center.',
        });
        onSuccess?.(`${t.common.notice}: "${notSubject}" (${targetTenant.fullName})`);
        onClose();
      } else if (activeTab === 'expense') {
        if (!expPropId) {
          throw new Error(contextualActions.context.confirmPropertyRequired);
        }
        if (!expDesc.trim())
          throw new Error('Property and expense description are required.');
        await recordExpenseEntry({
          propertyId: expPropId,
          category: expCategory,
          description: expDesc,
          vendorName: expVendor,
          amountCents: parseZARToCents(expAmountRands),
          incurredDate: expDate,
          paidStatus: 'paid',
          paymentMethod: 'eft',
        });
        onSuccess?.(`${t.common.expense}: ${expDesc}`);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 dark:bg-black/70 backdrop-blur-[1px]">
      <div className="w-full max-w-[430px] rounded-t-[28px] bg-[#F6F8FC] dark:bg-[#171C23] border-t border-[#E4E9F2] dark:border-[#272E38] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="w-[42px] h-[4px] rounded-full bg-[#94A3B8]/80 dark:bg-[#525B68] mx-auto mt-3" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E9F2] dark:border-[#272E38]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab(originMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#0145F2] dark:text-[#1E80FF] shrink-0"
              aria-label={t.common.back}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#111318] dark:text-[#FFFFFF] truncate">
                  {contextualMenuConfig.menuTitle}
                </h2>
                {screenContext.contextLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] dark:text-[#68A2FF] text-[10.5px] font-bold truncate max-w-[140px]">
                    {screenContext.contextLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#4B5563] dark:text-[#B8C0CC] truncate">
                {t.quickActions.offlinePersistHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#4B5563] dark:text-[#B8C0CC] hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Tab Selector */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#EDF1F7] dark:bg-[#12161C] border-b border-[#E4E9F2] dark:border-[#272E38] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg(null);
              }}
              className={`h-[32px] px-3 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0145F2] text-white'
                  : 'bg-[#FFFFFF] dark:bg-[#1E242D] text-[#4B5563] dark:text-[#B8C0CC] border border-[#E4E9F2] dark:border-[#2B333F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDECEE] dark:bg-[#331A1E] border border-[#F9D7DB] dark:border-[#4C2329] text-xs text-[#E5252A] dark:text-[#F85A5A]">
              {errorMsg}
            </div>
          )}

          {activeTab === 'payment' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.tenancyUnit}
                </label>
                <select
                  value={payTenancyId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setPayTenancyId(nextId);
                    const found = tenancies.find((l) => l.id === nextId);
                    if (found) {
                      setPayAmountRands((found.rentAmountCents / 100).toFixed(2));
                    }
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D] text-[#111318] dark:text-[#FFFFFF]"
                >
                  <option value="">{contextualActions.context.selectTenancyPrompt}</option>
                  {tenancies.map((tenancyItem) => {
                    const ten = tenants.find((x) => x.id === tenancyItem.primaryTenantId);
                    const unit = units.find((u) => u.id === tenancyItem.unitId);
                    return (
                      <option key={tenancyItem.id} value={tenancyItem.id}>
                        {tenancyItem.tenancyReference} — {ten?.fullName || t.common.tenant} (
                        {unit?.unitNumber || t.common.unit})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.amountReceivedZar}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmountRands}
                    onChange={(e) => setPayAmountRands(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.transactionDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.paymentMethod}
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="cash">{t.domainLabels.paymentMethods.cash}</option>
                    <option value="eft">{t.domainLabels.paymentMethods.eft}</option>
                    <option value="atm_cash_deposit">
                      {t.domainLabels.paymentMethods.atm_cash_deposit}
                    </option>
                    <option value="ewallet_voucher">
                      {t.domainLabels.paymentMethods.ewallet_voucher}
                    </option>
                    <option value="debit_order">{t.domainLabels.paymentMethods.debit_order}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.verificationStatus}
                  </label>
                  <select
                    value={payVerification}
                    onChange={(e) =>
                      setPayVerification(e.target.value as PaymentVerificationStatus)
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="landlord-reported">
                      {t.domainLabels.verificationStatuses['landlord-reported']}
                    </option>
                    <option value="evidence-attached">
                      {t.domainLabels.verificationStatuses['evidence-attached']}
                    </option>
                    <option value="reconciled">{t.financialsReportsSettings.reconciledLabel}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.referenceNotesOpt}
                </label>
                <input
                  type="text"
                  placeholder="e.g. CASH-NOV-20 or EFT Ref"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                />
              </div>
            </>
          )}

          {activeTab === 'property' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.propertyName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oakwood Apartments"
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.propertyCategory}
                </label>
                <select
                  value={propCategory}
                  onChange={(e) => setPropCategory(e.target.value as PropertyCategory)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                >
                  <option value="residential">
                    {t.domainLabels.propertyCategories.residential}
                  </option>
                  <option value="backyard_accommodation">
                    {t.domainLabels.propertyCategories.backyard_accommodation}
                  </option>
                  <option value="mixed_use">
                    {t.domainLabels.propertyCategories.mixed_use}
                  </option>
                  <option value="commercial">
                    {t.domainLabels.propertyCategories.commercial}
                  </option>
                  <option value="industrial_storage">
                    {t.domainLabels.propertyCategories.industrial_storage}
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.streetAddress}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 Main Road"
                    value={propStreet}
                    onChange={(e) => setPropStreet(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.citySuburb}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johannesburg"
                    value={propCity}
                    onChange={(e) => {
                      setPropCity(e.target.value);
                      setPropSuburb(e.target.value);
                    }}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'tenant' && (
            <>
              <div>
                <label className="block text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF] mb-1.5">
                  {t.quickActions.fields.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdiis Dhababaa / ዳዊት ተስፋዬ"
                  value={tenFullName}
                  onChange={(e) => setTenFullName(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 rounded-[14px] border-2 border-[#0145F2] bg-[#FFFFFF] dark:bg-[#111317] text-[15px] font-medium text-[#111318] dark:text-[#FFFFFF] focus:outline-none focus:border-[#0145F2]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF] mb-1.5">
                  {t.quickActions.fields.unit}
                </label>
                <select
                  value={lseUnitId}
                  onChange={(e) => setLseUnitId(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 rounded-[14px] border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#161920] text-[14.5px] font-medium text-[#111318] dark:text-[#FFFFFF] focus:outline-none focus:border-[#0145F2]"
                >
                  <option value="">{contextualActions.context.selectUnitPrompt}</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {t.common.unit} {u.unitNumber} {u.name ? `· ${u.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF] mb-1.5">
                  {t.quickActions.fields.phone}
                </label>
                <input
                  type="tel"
                  placeholder="+27 71 234 5678"
                  value={tenPhone}
                  onChange={(e) => setTenPhone(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 rounded-[14px] border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#161920] text-[14.5px] font-medium text-[#111318] dark:text-[#FFFFFF] focus:outline-none focus:border-[#0145F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.quickActions.fields.docStatus}
                  </label>
                  <select
                    value={tenDocStatus}
                    onChange={(e) => setTenDocStatus(e.target.value as DocumentationStatus)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="not-provided">
                      {t.domainLabels.docStatuses['not-provided']}
                    </option>
                    <option value="pending-review">
                      {t.domainLabels.docStatuses['pending-review']}
                    </option>
                    <option value="reviewed-but-unverified">
                      {t.domainLabels.docStatuses['reviewed-but-unverified']}
                    </option>
                    <option value="verified">{t.domainLabels.docStatuses.verified}</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={tenHasSmartphone}
                      onChange={(e) => setTenHasSmartphone(e.target.checked)}
                    />
                    {t.quickActions.fields.smartphone}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={tenHasBank}
                      onChange={(e) => setTenHasBank(e.target.checked)}
                    />
                    {t.quickActions.fields.bank}
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === 'maintenance' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.property}
                  </label>
                  <select
                    value={mntPropId}
                    onChange={(e) => {
                      setMntPropId(e.target.value);
                      setMntUnitId('');
                    }}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="">{contextualActions.context.selectPropertyPrompt}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.unit}
                  </label>
                  <select
                    value={mntUnitId}
                    onChange={(e) => setMntUnitId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="">{contextualActions.context.optionalUnitNone}</option>
                    {selectableUnitsForMaintenance.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} — {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.issueSummary}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leaking tap – Unit 3A"
                  value={mntTitle}
                  onChange={(e) => setMntTitle(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.priority}
                  </label>
                  <select
                    value={mntPriority}
                    onChange={(e) => setMntPriority(e.target.value as MaintenancePriority)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="low">{t.quickActions.fields.priorityLow}</option>
                    <option value="medium">{t.quickActions.fields.priorityMedium}</option>
                    <option value="high">{t.quickActions.fields.priorityHigh}</option>
                    <option value="urgent">{t.quickActions.fields.priorityUrgent}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.estCostZar}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={mntEstRands}
                    onChange={(e) => setMntEstRands(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D] font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'notice' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.recipientTenant}
                </label>
                <select
                  value={notTenantId}
                  onChange={(e) => {
                    const nextTenantId = e.target.value;
                    setNotTenantId(nextTenantId);
                    if (nextTenantId) {
                      setNotBody(buildReminderMessageForTenant(nextTenantId));
                    }
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                >
                  <option value="">{contextualActions.context.selectTenantPrompt}</option>
                  {tenants.map((ten) => (
                    <option key={ten.id} value={ten.id}>
                      {ten.fullName} ({ten.tenantCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.noticeSubject}
                  </label>
                  <input
                    type="text"
                    required
                    value={notSubject}
                    onChange={(e) => setNotSubject(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.deliveryChannel}
                  </label>
                  <select
                    value={notChannel}
                    onChange={(e) => setNotChannel(e.target.value as CommunicationChannel)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="whatsapp">{t.quickActions.fields.channelWhatsapp}</option>
                    <option value="sms">{t.quickActions.fields.channelSms}</option>
                    <option value="in_person">{t.quickActions.fields.channelInPerson}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.noticeMessage}
                </label>
                <textarea
                  rows={3}
                  required
                  value={notBody}
                  onChange={(e) => setNotBody(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                />
              </div>
            </>
          )}

          {activeTab === 'unit' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.property}
                </label>
                <select
                  value={unitPropId}
                  onChange={(e) => setUnitPropId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                >
                  <option value="">{contextualActions.context.selectPropertyPrompt}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.unitCode}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 3A"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.unitName}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-Bed Apartment"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'tenancy' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.unit}
                  </label>
                  <select
                    value={lseUnitId}
                    onChange={(e) => {
                      const nextUnitId = e.target.value;
                      setLseUnitId(nextUnitId);
                      const unitObj = units.find((u) => u.id === nextUnitId);
                      if (unitObj) {
                        setLseRentRands((unitObj.standardRentCents / 100).toFixed(2));
                      }
                    }}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="">{contextualActions.context.selectUnitPrompt}</option>
                    {selectableUnitsForTenancy.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} — {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.common.tenant}
                  </label>
                  <select
                    value={lseTenantId}
                    onChange={(e) => setLseTenantId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  >
                    <option value="">{contextualActions.context.selectTenantPrompt}</option>
                    {tenants.map((ten) => (
                      <option key={ten.id} value={ten.id}>
                        {ten.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.monthlyRentZar}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={lseRentRands}
                    onChange={(e) => setLseRentRands(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.quickActions.fields.startDate}
                  </label>
                  <input
                    type="date"
                    value={lseStartDate}
                    onChange={(e) => setLseStartDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.property}
                </label>
                <select
                  value={expPropId}
                  onChange={(e) => setExpPropId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                >
                  <option value="">{contextualActions.context.selectPropertyPrompt}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                  {t.quickActions.fields.expenseDescription}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Municipal Water & Rates"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.payments.amountZarLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmountRands}
                    onChange={(e) => setExpAmountRands(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111318] dark:text-[#E5E7EB] mb-1">
                    {t.common.date}
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E4E9F2] dark:border-[#2B333F] bg-[#FFFFFF] dark:bg-[#1E242D]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab(originMenu)}
              className="flex-1 h-[44px] rounded-[14px] bg-[#E8EFFA] dark:bg-[#262C36] text-[#0145F2] dark:text-[#E5E7EB] text-xs font-semibold"
            >
              {t.common.back}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 h-[44px] px-5 rounded-[14px] bg-[#0145F2] hover:bg-[#0139C9] text-white text-xs font-semibold"
            >
              {submitting ? t.common.saving : t.common.saveRecord}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
