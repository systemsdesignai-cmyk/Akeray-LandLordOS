import type React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Folder,
  HelpCircle,
  Home,
  Languages,
  Layers,
  MessageSquare,
  PieChart,
  Plus,
  Receipt as ReceiptIcon,
  Send,
  Settings,
  Shield,
  Smartphone,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type {
  Charge,
  MaintenanceTicket,
  Property,
  RoleType,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import type { QuickAddTab } from '../components/QuickAddModal';
import type {
  ContextualQuickActionStrings,
  SidebarNavigationStrings,
} from '../i18n/navAndQuickActionsI18n';

export type SidebarGroupId =
  | 'overview'
  | 'propertyManagement'
  | 'finance'
  | 'communication'
  | 'documentsData'
  | 'accountSupport';

export interface SidebarNavItemConfig {
  id: string;
  label: string;
  to: string;
  icon: React.FC<{ className?: string }>;
  roles: RoleType[];
  badgeText?: string;
  badgeVariant?: 'pro' | 'dot';
  isLanguageRow?: boolean;
  isActive: (pathname: string, search: string) => boolean;
}

export interface SidebarNavGroupConfig {
  id: SidebarGroupId;
  title: string;
  icon: React.FC<{ className?: string }>;
  items: SidebarNavItemConfig[];
  defaultExpanded?: boolean;
}

export function getSidebarNavigationGroups(
  activeRole: RoleType,
  sidebarNav: SidebarNavigationStrings,
  proBadgeLabel: string
): SidebarNavGroupConfig[] {
  const allGroups: SidebarNavGroupConfig[] = [
    {
      id: 'overview',
      title: sidebarNav.groups.overview,
      icon: Home,
      defaultExpanded: true,
      items: [
        {
          id: 'dashboard-home',
          label: sidebarNav.items.dashboardHome,
          to: activeRole === 'tenant' ? '/tenant-portal' : '/',
          icon: Home,
          roles: ['owner', 'manager', 'tenant'],
          isActive: (pathname) =>
            activeRole === 'tenant'
              ? pathname === '/tenant-portal'
              : pathname === '/' || pathname === '/dashboard',
        },
        {
          id: 'financial-dashboard',
          label: sidebarNav.items.financialDashboard,
          to: '/financials',
          icon: PieChart,
          roles: ['owner'],
          isActive: (pathname) => pathname.startsWith('/financials'),
        },
        {
          id: 'reports-exports',
          label: sidebarNav.items.reportsExports,
          to: '/reports',
          icon: BarChart3,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/reports'),
        },
      ],
    },
    {
      id: 'propertyManagement',
      title: sidebarNav.groups.propertyManagement,
      icon: Building2,
      defaultExpanded: true,
      items: [
        {
          id: 'properties-units',
          label: sidebarNav.items.propertiesUnits,
          to: '/properties',
          icon: Building2,
          roles: ['owner', 'manager'],
          isActive: (pathname) =>
            pathname.startsWith('/properties') || pathname.startsWith('/units'),
        },
        {
          id: 'tenants',
          label: sidebarNav.items.tenants,
          to: '/tenants',
          icon: Users,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/tenants'),
        },
        {
          id: 'tenancies-leases',
          label: sidebarNav.items.tenanciesLeases,
          to: '/tenancies',
          icon: FileText,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/tenancies'),
        },
        {
          id: 'maintenance-board',
          label: sidebarNav.items.maintenanceBoard,
          to: '/maintenance',
          icon: Wrench,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/maintenance'),
        },
      ],
    },
    {
      id: 'finance',
      title: sidebarNav.groups.finance,
      icon: CreditCard,
      defaultExpanded: false,
      items: [
        {
          id: 'rent-ledger',
          label: sidebarNav.items.rentLedger,
          to: '/ledger',
          icon: Layers,
          roles: ['owner', 'manager'],
          isActive: (pathname, search) =>
            pathname.startsWith('/ledger') && !search.includes('view=deposits'),
        },
        {
          id: 'payments-receipts',
          label: sidebarNav.items.paymentsReceipts,
          to: '/receipts',
          icon: CreditCard,
          roles: ['owner', 'manager'],
          isActive: (pathname, search) =>
            (pathname.startsWith('/receipts') || pathname.startsWith('/payments')) &&
            !search.includes('tab=statements'),
        },
        {
          id: 'statements',
          label: sidebarNav.items.statements,
          to: '/receipts?tab=statements',
          icon: ReceiptIcon,
          roles: ['owner', 'manager'],
          isActive: (pathname, search) =>
            (pathname.startsWith('/receipts') || pathname.startsWith('/payments')) &&
            search.includes('tab=statements'),
        },
        {
          id: 'deposits',
          label: sidebarNav.items.deposits,
          to: '/ledger?view=deposits',
          icon: Wallet,
          roles: ['owner', 'manager'],
          isActive: (pathname, search) =>
            pathname.startsWith('/ledger') && search.includes('view=deposits'),
        },
      ],
    },
    {
      id: 'communication',
      title: sidebarNav.groups.communication,
      icon: MessageSquare,
      defaultExpanded: false,
      items: [
        {
          id: 'communication-center',
          label: sidebarNav.items.communicationCenter,
          to: '/communications',
          icon: MessageSquare,
          roles: ['owner', 'manager'],
          badgeVariant: 'dot',
          isActive: (pathname, search) =>
            pathname.startsWith('/communications') && !search.includes('tab=history'),
        },
        {
          id: 'reminders-notices',
          label: sidebarNav.items.remindersNotices,
          to: '/communications?tab=history',
          icon: Bell,
          roles: ['owner', 'manager'],
          isActive: (pathname, search) =>
            pathname.startsWith('/communications') && search.includes('tab=history'),
        },
      ],
    },
    {
      id: 'documentsData',
      title: sidebarNav.groups.documentsData,
      icon: Folder,
      defaultExpanded: false,
      items: [
        {
          id: 'documents',
          label: sidebarNav.items.documents,
          to: '/documents',
          icon: Folder,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/documents'),
        },
        {
          id: 'backup-restore',
          label: sidebarNav.items.backupRestore,
          to: '/backup',
          icon: Download,
          roles: ['owner'],
          isActive: (pathname) => pathname.startsWith('/backup'),
        },
      ],
    },
    {
      id: 'accountSupport',
      title: sidebarNav.groups.accountSupport,
      icon: Settings,
      defaultExpanded: false,
      items: [
        {
          id: 'tenant-portal-view',
          label: sidebarNav.items.tenantPortalView,
          to: '/tenant-portal',
          icon: Smartphone,
          roles: ['owner', 'manager', 'tenant'],
          isActive: (pathname) => pathname.startsWith('/tenant-portal'),
        },
        {
          id: 'subscription-billing',
          label: sidebarNav.items.subscriptionBilling,
          to: '/subscription',
          icon: Crown,
          roles: ['owner'],
          badgeText: proBadgeLabel,
          badgeVariant: 'pro',
          isActive: (pathname) => pathname.startsWith('/subscription'),
        },
        {
          id: 'settings-appearance',
          label: sidebarNav.items.settingsAppearance,
          to: '/settings',
          icon: Settings,
          roles: ['owner', 'manager'],
          isActive: (pathname) => pathname.startsWith('/settings'),
        },
        {
          id: 'language-preferences',
          label: sidebarNav.items.languagePreferences,
          to: '/language',
          icon: Languages,
          roles: ['owner', 'manager', 'tenant', 'unauthenticated'],
          isLanguageRow: true,
          isActive: (pathname) => pathname.startsWith('/language'),
        },
        {
          id: 'welcome-guide',
          label: sidebarNav.items.welcomeGuide,
          to: '/onboarding',
          icon: FileText,
          roles: ['owner', 'manager', 'tenant', 'unauthenticated'],
          isActive: (pathname) => pathname.startsWith('/onboarding'),
        },
        {
          id: 'help-support',
          label: sidebarNav.items.helpSupport,
          to: '/help',
          icon: HelpCircle,
          roles: ['owner', 'manager', 'tenant', 'unauthenticated'],
          isActive: (pathname) => pathname.startsWith('/help'),
        },
        {
          id: 'signin-role-state',
          label: sidebarNav.items.signInRoleState,
          to: '/account',
          icon: Shield,
          roles: ['owner', 'manager', 'tenant', 'unauthenticated'],
          isActive: (pathname) => pathname.startsWith('/account'),
        },
      ],
    },
  ];

  return allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(activeRole)),
    }))
    .filter((group) => group.items.length > 0);
}

export type ScreenContextCategory =
  | 'home'
  | 'properties'
  | 'property_detail'
  | 'unit_detail'
  | 'tenants'
  | 'tenant_detail'
  | 'tenancies'
  | 'tenancy_detail'
  | 'payments'
  | 'ledger'
  | 'maintenance'
  | 'maintenance_detail'
  | 'communications'
  | 'documents'
  | 'financials'
  | 'reports'
  | 'other';

export interface ActiveScreenContext {
  category: ScreenContextCategory;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  tenancyId?: string;
  ticketId?: string;
  overdueBalanceCents?: number;
  standardRentCents?: number;
  estimatedRepairCostCents?: number;
  contextLabel?: string;
}

export function resolveActiveScreenContext(
  pathname: string,
  search: string,
  data: {
    properties: Property[];
    units: Unit[];
    tenants: TenantProfile[];
    tenancies: Tenancy[];
    charges: Charge[];
    maintenanceTickets: MaintenanceTicket[];
  }
): ActiveScreenContext {
  const { properties, units, tenants, tenancies, charges, maintenanceTickets } = data;
  const params = new URLSearchParams(search);

  const computeTenancyUnpaidCents = (tenancyId?: string): number => {
    if (!tenancyId) return 0;
    return charges
      .filter(
        (c) =>
          c.tenancyId === tenancyId &&
          !c.isDeleted &&
          c.status !== 'reversed' &&
          c.status !== 'paid' &&
          c.status !== 'waived'
      )
      .reduce(
        (sum, c) => sum + Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents),
        0
      );
  };

  // 1. Home / Dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    return { category: 'home' };
  }

  // 2. Property Detail: /properties/:propertyId
  if (pathname.startsWith('/properties/')) {
    const propId = pathname.split('/')[2];
    const prop = properties.find((p) => p.id === propId);
    return {
      category: 'property_detail',
      propertyId: prop?.id,
      contextLabel: prop?.name,
    };
  }

  // 3. Properties Directory: /properties
  if (pathname === '/properties') {
    return { category: 'properties' };
  }

  // 4. Unit Detail: /units/:unitId
  if (pathname.startsWith('/units/')) {
    const unitId = pathname.split('/')[2];
    const unit = units.find((u) => u.id === unitId);
    const prop = properties.find((p) => p.id === unit?.propertyId);
    const activeTenancy = tenancies.find(
      (ten) => ten.unitId === unit?.id && ten.status !== 'ended' && ten.status !== 'terminated'
    );
    const tenant = tenants.find((x) => x.id === activeTenancy?.primaryTenantId);
    const unpaid = computeTenancyUnpaidCents(activeTenancy?.id);
    const labelParts = [prop?.name, unit ? unit.unitNumber : undefined, tenant?.fullName].filter(
      Boolean
    );
    return {
      category: 'unit_detail',
      propertyId: prop?.id || unit?.propertyId,
      unitId: unit?.id,
      tenancyId: activeTenancy?.id,
      tenantId: tenant?.id,
      overdueBalanceCents: unpaid,
      standardRentCents: activeTenancy?.rentAmountCents || unit?.standardRentCents,
      contextLabel: labelParts.join(' · '),
    };
  }

  // 5. Tenant Detail: /tenants/:tenantId
  if (pathname.startsWith('/tenants/')) {
    const tenantId = pathname.split('/')[2];
    const tenant = tenants.find((x) => x.id === tenantId);
    const activeTenancy =
      tenancies.find(
        (ten) =>
          ten.primaryTenantId === tenant?.id &&
          ten.status !== 'ended' &&
          ten.status !== 'terminated'
      ) || tenancies.find((ten) => ten.primaryTenantId === tenant?.id);
    const unit = units.find((u) => u.id === activeTenancy?.unitId);
    const prop = properties.find((p) => p.id === (activeTenancy?.propertyId || unit?.propertyId));
    const unpaid = computeTenancyUnpaidCents(activeTenancy?.id);
    const labelParts = [tenant?.fullName, unit?.unitNumber, prop?.name].filter(Boolean);
    return {
      category: 'tenant_detail',
      tenantId: tenant?.id,
      tenancyId: activeTenancy?.id,
      unitId: unit?.id,
      propertyId: prop?.id,
      overdueBalanceCents: unpaid,
      standardRentCents: activeTenancy?.rentAmountCents || unit?.standardRentCents,
      contextLabel: labelParts.join(' · '),
    };
  }

  // 6. Tenants Directory: /tenants
  if (pathname === '/tenants') {
    return { category: 'tenants' };
  }

  // 7. Tenancy Detail: /tenancies/:tenancyId
  if (pathname.startsWith('/tenancies/')) {
    const tenancyId = pathname.split('/')[2];
    const tenancy = tenancies.find((ten) => ten.id === tenancyId);
    const tenant = tenants.find((x) => x.id === tenancy?.primaryTenantId);
    const unit = units.find((u) => u.id === tenancy?.unitId);
    const prop = properties.find((p) => p.id === (tenancy?.propertyId || unit?.propertyId));
    const unpaid = computeTenancyUnpaidCents(tenancy?.id);
    const labelParts = [tenancy?.tenancyReference, tenant?.fullName, unit?.unitNumber].filter(
      Boolean
    );
    return {
      category: 'tenancy_detail',
      tenancyId: tenancy?.id,
      tenantId: tenant?.id,
      unitId: unit?.id,
      propertyId: prop?.id,
      overdueBalanceCents: unpaid,
      standardRentCents: tenancy?.rentAmountCents,
      contextLabel: labelParts.join(' · '),
    };
  }

  // 8. Tenancies List: /tenancies
  if (pathname === '/tenancies') {
    return { category: 'tenancies' };
  }

  // 9. Payments & Receipts: /receipts, /payments, /receipts/:receiptId
  if (pathname.startsWith('/receipts') || pathname.startsWith('/payments')) {
    return { category: 'payments' };
  }

  // 10. Rent Ledger: /ledger
  if (pathname.startsWith('/ledger')) {
    const qTenancyId = params.get('tenancyId') || undefined;
    const tenancy = qTenancyId ? tenancies.find((t) => t.id === qTenancyId) : undefined;
    const tenant = tenancy ? tenants.find((x) => x.id === tenancy.primaryTenantId) : undefined;
    const unit = tenancy ? units.find((u) => u.id === tenancy.unitId) : undefined;
    const prop = tenancy ? properties.find((p) => p.id === tenancy.propertyId) : undefined;
    return {
      category: 'ledger',
      tenancyId: tenancy?.id,
      tenantId: tenant?.id,
      unitId: unit?.id,
      propertyId: prop?.id,
      overdueBalanceCents: computeTenancyUnpaidCents(tenancy?.id),
      standardRentCents: tenancy?.rentAmountCents,
      contextLabel: tenancy
        ? [tenant?.fullName, unit?.unitNumber, tenancy.tenancyReference].filter(Boolean).join(' · ')
        : undefined,
    };
  }

  // 11. Maintenance Detail: /maintenance/:ticketId
  if (pathname.startsWith('/maintenance/')) {
    const ticketId = pathname.split('/')[2];
    const ticket = maintenanceTickets.find((m) => m.id === ticketId);
    const prop = properties.find((p) => p.id === ticket?.propertyId);
    const unit = units.find((u) => u.id === ticket?.unitId);
    const activeTenancy = unit
      ? tenancies.find((ten) => ten.unitId === unit.id && ten.status !== 'ended')
      : undefined;
    const tenant = activeTenancy
      ? tenants.find((x) => x.id === activeTenancy.primaryTenantId)
      : undefined;
    const labelParts = [ticket?.ticketNumber, prop?.name, unit?.unitNumber].filter(Boolean);
    return {
      category: 'maintenance_detail',
      ticketId: ticket?.id,
      propertyId: prop?.id || ticket?.propertyId,
      unitId: unit?.id || ticket?.unitId,
      tenancyId: activeTenancy?.id,
      tenantId: tenant?.id,
      estimatedRepairCostCents: ticket?.actualCostCents || ticket?.estimatedCostCents,
      contextLabel: labelParts.join(' · '),
    };
  }

  // 12. Maintenance Board: /maintenance
  if (pathname === '/maintenance') {
    return { category: 'maintenance' };
  }

  // 13. Communication Center: /communications
  if (pathname.startsWith('/communications')) {
    const qTenantId = params.get('tenantId') || undefined;
    const tenant = qTenantId ? tenants.find((x) => x.id === qTenantId) : undefined;
    const tenancy = tenant
      ? tenancies.find((ten) => ten.primaryTenantId === tenant.id && ten.status !== 'ended')
      : undefined;
    return {
      category: 'communications',
      tenantId: tenant?.id,
      tenancyId: tenancy?.id,
      propertyId: tenancy?.propertyId,
      unitId: tenancy?.unitId,
      overdueBalanceCents: computeTenancyUnpaidCents(tenancy?.id),
      contextLabel: tenant?.fullName,
    };
  }

  if (pathname.startsWith('/documents')) {
    return { category: 'documents' };
  }
  if (pathname.startsWith('/financials')) {
    return { category: 'financials' };
  }
  if (pathname.startsWith('/reports')) {
    return { category: 'reports' };
  }

  return { category: 'other' };
}

export interface ContextualQuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  targetTab?: QuickAddTab;
  targetRoute?: string;
  presetMode?: 'issue_receipt' | 'rent_reminder';
}

export interface ContextualQuickActionMenuConfig {
  menuTitle: string;
  menuSubtitle: string;
  contextLabel?: string;
  items: ContextualQuickActionItem[];
}

export function getContextualQuickActionsForScreen(
  context: ActiveScreenContext,
  activeRole: RoleType,
  ca: ContextualQuickActionStrings
): ContextualQuickActionMenuConfig {
  // Unauthorized / Tenant accounts do not receive landlord-only Quick Actions
  if (activeRole === 'unauthenticated' || activeRole === 'tenant') {
    return {
      menuTitle: ca.menus.generalTitle,
      menuSubtitle: ca.menus.generalSubtitle,
      items: [],
    };
  }

  switch (context.category) {
    case 'home':
      return {
        menuTitle: ca.menus.homeTitle,
        menuSubtitle: ca.menus.homeSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'home-add-property',
            title: ca.actions.addPropertyTitle,
            subtitle: ca.actions.addPropertySub,
            icon: Home,
            targetTab: 'property',
          },
          {
            id: 'home-add-tenant',
            title: ca.actions.addTenantTitle,
            subtitle: ca.actions.addTenantSub,
            icon: UserPlus,
            targetTab: 'tenant',
          },
          {
            id: 'home-record-payment',
            title: ca.actions.recordPaymentTitle,
            subtitle: ca.actions.recordPaymentSub,
            icon: CreditCard,
            targetTab: 'payment',
          },
          {
            id: 'home-create-maintenance',
            title: ca.actions.createMaintenanceTitle,
            subtitle: ca.actions.createMaintenanceSub,
            icon: Wrench,
            targetTab: 'maintenance',
          },
        ],
      };

    case 'properties':
      return {
        menuTitle: ca.menus.propertiesTitle,
        menuSubtitle: ca.menus.propertiesSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'props-add-property',
            title: ca.actions.addPropertyTitle,
            subtitle: ca.actions.addPropertySub,
            icon: Home,
            targetTab: 'property',
          },
          {
            id: 'props-add-unit',
            title: ca.actions.addUnitTitle,
            subtitle: ca.actions.addUnitSub,
            icon: Building2,
            targetTab: 'unit',
          },
          {
            id: 'props-assign-tenant',
            title: ca.actions.assignTenantUnitTitle,
            subtitle: ca.actions.assignTenantUnitSub,
            icon: UserCheck,
            targetTab: 'tenancy',
          },
          {
            id: 'props-view-records',
            title: ca.actions.viewPropertyRecordsTitle,
            subtitle: ca.actions.viewPropertyRecordsSub,
            icon: Folder,
            targetRoute: '/documents',
          },
        ],
      };

    case 'property_detail':
      return {
        menuTitle: ca.menus.propertiesTitle,
        menuSubtitle: ca.menus.propertiesSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'prop-detail-add-unit',
            title: ca.actions.addUnitTitle,
            subtitle: ca.actions.addUnitSub,
            icon: Building2,
            targetTab: 'unit',
          },
          {
            id: 'prop-detail-assign-tenant',
            title: ca.actions.assignTenantUnitTitle,
            subtitle: ca.actions.assignTenantUnitSub,
            icon: UserCheck,
            targetTab: 'tenancy',
          },
          {
            id: 'prop-detail-maintenance',
            title: ca.actions.createMaintenanceTitle,
            subtitle: ca.actions.createMaintenanceSub,
            icon: Wrench,
            targetTab: 'maintenance',
          },
          {
            id: 'prop-detail-expense',
            title: ca.actions.addExpenseTitle,
            subtitle: ca.actions.addExpenseSub,
            icon: Layers,
            targetTab: 'expense',
          },
          {
            id: 'prop-detail-view-records',
            title: ca.actions.viewPropertyRecordsTitle,
            subtitle: ca.actions.viewPropertyRecordsSub,
            icon: Folder,
            targetRoute: '/documents',
          },
        ],
      };

    case 'unit_detail':
      return {
        menuTitle: ca.menus.propertiesTitle,
        menuSubtitle: ca.menus.propertiesSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'unit-detail-assign-tenant',
            title: ca.actions.assignTenantUnitTitle,
            subtitle: ca.actions.assignTenantUnitSub,
            icon: UserCheck,
            targetTab: 'tenancy',
          },
          {
            id: 'unit-detail-maintenance',
            title: ca.actions.createMaintenanceTitle,
            subtitle: ca.actions.createMaintenanceSub,
            icon: Wrench,
            targetTab: 'maintenance',
          },
          {
            id: 'unit-detail-payment',
            title: ca.actions.recordTenantPaymentTitle,
            subtitle: ca.actions.recordTenantPaymentSub,
            icon: CreditCard,
            targetTab: 'payment',
          },
          {
            id: 'unit-detail-add-unit',
            title: ca.actions.addUnitTitle,
            subtitle: ca.actions.addUnitSub,
            icon: Building2,
            targetTab: 'unit',
          },
        ],
      };

    case 'tenants':
    case 'tenant_detail':
    case 'tenancies':
    case 'tenancy_detail':
      return {
        menuTitle: ca.menus.tenantsTitle,
        menuSubtitle: ca.menus.tenantsSubtitle,
        contextLabel: context.contextLabel,
        items:
          context.category === 'tenant_detail' || context.category === 'tenancy_detail'
            ? [
                {
                  id: 'ten-record-payment',
                  title: ca.actions.recordTenantPaymentTitle,
                  subtitle: ca.actions.recordTenantPaymentSub,
                  icon: CreditCard,
                  targetTab: 'payment',
                },
                {
                  id: 'ten-send-reminder',
                  title: ca.actions.sendReminderTitle,
                  subtitle: ca.actions.sendReminderSub,
                  icon: Send,
                  targetTab: 'notice',
                  presetMode: 'rent_reminder',
                },
                {
                  id: 'ten-create-tenancy',
                  title: ca.actions.createTenancyTitle,
                  subtitle: ca.actions.createTenancySub,
                  icon: FileText,
                  targetTab: 'tenancy',
                },
                {
                  id: 'ten-view-ledger',
                  title: ca.actions.viewTenantLedgerTitle,
                  subtitle: ca.actions.viewTenantLedgerSub,
                  icon: Layers,
                  targetRoute: context.tenancyId
                    ? `/ledger?tenancyId=${encodeURIComponent(context.tenancyId)}`
                    : '/ledger',
                },
                {
                  id: 'ten-add-tenant',
                  title: ca.actions.addTenantTitle,
                  subtitle: ca.actions.addTenantSub,
                  icon: UserPlus,
                  targetTab: 'tenant',
                },
              ]
            : [
                {
                  id: 'ten-add-tenant',
                  title: ca.actions.addTenantTitle,
                  subtitle: ca.actions.addTenantSub,
                  icon: UserPlus,
                  targetTab: 'tenant',
                },
                {
                  id: 'ten-create-tenancy',
                  title: ca.actions.createTenancyTitle,
                  subtitle: ca.actions.createTenancySub,
                  icon: FileText,
                  targetTab: 'tenancy',
                },
                {
                  id: 'ten-record-payment',
                  title: ca.actions.recordTenantPaymentTitle,
                  subtitle: ca.actions.recordTenantPaymentSub,
                  icon: CreditCard,
                  targetTab: 'payment',
                },
                {
                  id: 'ten-send-reminder',
                  title: ca.actions.sendReminderTitle,
                  subtitle: ca.actions.sendReminderSub,
                  icon: Send,
                  targetTab: 'notice',
                  presetMode: 'rent_reminder',
                },
                {
                  id: 'ten-view-ledger',
                  title: ca.actions.viewTenantLedgerTitle,
                  subtitle: ca.actions.viewTenantLedgerSub,
                  icon: Layers,
                  targetRoute: '/ledger',
                },
              ],
      };

    case 'payments':
    case 'ledger':
      return {
        menuTitle: ca.menus.paymentsTitle,
        menuSubtitle: ca.menus.paymentsSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'pay-record-payment',
            title: ca.actions.recordPaymentTitle,
            subtitle: ca.actions.recordPaymentSub,
            icon: Plus,
            targetTab: 'payment',
          },
          {
            id: 'pay-issue-receipt',
            title: ca.actions.issueReceiptTitle,
            subtitle: ca.actions.issueReceiptSub,
            icon: FileText,
            targetTab: 'payment',
            presetMode: 'issue_receipt',
          },
          {
            id: 'pay-view-outstanding',
            title: ca.actions.viewOutstandingRentTitle,
            subtitle: ca.actions.viewOutstandingRentSub,
            icon: AlertTriangle,
            targetRoute: '/receipts?tab=overdue',
          },
          {
            id: 'pay-view-statements',
            title: ca.actions.viewStatementsTitle,
            subtitle: ca.actions.viewStatementsSub,
            icon: ReceiptIcon,
            targetRoute: '/receipts?tab=statements',
          },
          {
            id: 'pay-export-records',
            title: ca.actions.exportPaymentRecordsTitle,
            subtitle: ca.actions.exportPaymentRecordsSub,
            icon: FileSpreadsheet,
            targetRoute: '/reports',
          },
        ],
      };

    case 'maintenance':
    case 'maintenance_detail':
      return {
        menuTitle: ca.menus.maintenanceTitle,
        menuSubtitle: ca.menus.maintenanceSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'maint-create-ticket',
            title: ca.actions.createMaintenanceTitle,
            subtitle: ca.actions.createMaintenanceSub,
            icon: Wrench,
            targetTab: 'maintenance',
          },
          {
            id: 'maint-add-expense',
            title: ca.actions.addExpenseTitle,
            subtitle: ca.actions.addExpenseSub,
            icon: Layers,
            targetTab: 'expense',
          },
          {
            id: 'maint-send-notice',
            title: ca.actions.sendReminderTitle,
            subtitle: ca.actions.sendReminderSub,
            icon: Send,
            targetTab: 'notice',
          },
        ],
      };

    default:
      return {
        menuTitle: ca.menus.generalTitle,
        menuSubtitle: ca.menus.generalSubtitle,
        contextLabel: context.contextLabel,
        items: [
          {
            id: 'gen-add-property',
            title: ca.actions.addPropertyTitle,
            subtitle: ca.actions.addPropertySub,
            icon: Home,
            targetTab: 'property',
          },
          {
            id: 'gen-add-tenant',
            title: ca.actions.addTenantTitle,
            subtitle: ca.actions.addTenantSub,
            icon: UserPlus,
            targetTab: 'tenant',
          },
          {
            id: 'gen-record-payment',
            title: ca.actions.recordPaymentTitle,
            subtitle: ca.actions.recordPaymentSub,
            icon: CreditCard,
            targetTab: 'payment',
          },
          {
            id: 'gen-create-maintenance',
            title: ca.actions.createMaintenanceTitle,
            subtitle: ca.actions.createMaintenanceSub,
            icon: Wrench,
            targetTab: 'maintenance',
          },
        ],
      };
  }
}
