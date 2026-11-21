import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  Download,
  Home,
  Languages,
  LogOut,
  Menu,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type {
  ApplicationSettings,
  Charge,
  MaintenanceTicket,
  Property,
  Receipt,
  RoleType,
  SyncOperation,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import { db } from '../db/database';
import type { QuickAddTab } from './QuickAddModal';
import { formatZAR } from '../utils/format';
import { resolveAssetUrl } from '../utils/assetUrl';
import { DSFAB, SUPPORTED_LANGUAGES, useLanguagePreference } from './DesignSystem';
import {
  getSidebarNavigationGroups,
  type SidebarGroupId,
} from '../config/navigationAndQuickActions';

interface AppShellProps {
  children: React.ReactNode;
  settings?: ApplicationSettings;
  properties: Property[];
  units: Unit[];
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  charges: Charge[];
  receipts: Receipt[];
  maintenanceTickets: MaintenanceTicket[];
  syncOperations: SyncOperation[];
  onOpenQuickAdd: (tab?: QuickAddTab) => void;
  toastMessage: string | null;
  onDismissToast: () => void;
}

/**
 * Approved Akarai Standalone Brand Symbol (Asset E: /akarai-symbol.png)
 */
export const LandlordOSLogoSymbol: React.FC<{ className?: string }> = ({
  className = 'w-[34px] h-[34px]',
}) => (
  <img
    src={resolveAssetUrl('akarai-symbol.png')}
    alt="Akarai symbol"
    className={`object-contain rounded-[9px] select-none ${className}`}
    draggable={false}
  />
);

/**
 * Approved Akarai Horizontal Brand Logo (Asset D: /akarai-logo-horizontal.png)
 */
export const AkaraiHorizontalBrandLogo: React.FC<{ className?: string }> = ({
  className = 'h-[40px] w-auto',
}) => (
  <div className="inline-flex items-center px-2.5 py-1 rounded-[12px] bg-[#FFFFFF] dark:bg-[#FFFFFF] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_1px_4px_rgba(11,27,59,0.06)]">
    <img
      src={resolveAssetUrl('akarai-logo-horizontal.png')}
      alt="Akarai — Property & Rent Management"
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  </div>
);

export const AppShell: React.FC<AppShellProps> = ({
  children,
  settings,
  properties,
  units,
  tenants,
  charges,
  receipts,
  maintenanceTickets,
  syncOperations,
  onOpenQuickAdd,
  toastMessage,
  onDismissToast,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { currentLanguage, selectLanguage, t, sidebarNav, contextualActions } =
    useLanguagePreference();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<SidebarGroupId, boolean>>({
    overview: true,
    propertyManagement: true,
    finance: false,
    communication: false,
    documentsData: false,
    accountSupport: true,
  });
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const activeRole: RoleType = settings?.activeRole || 'owner';
  const isPaymentsScreen =
    location.pathname === '/receipts' || location.pathname === '/payments';

  const sidebarGroups = getSidebarNavigationGroups(
    activeRole,
    sidebarNav,
    t.common.pro
  );

  // Auto-expand the sidebar group containing the current route when route changes or drawer opens
  useEffect(() => {
    const activeGroup = sidebarGroups.find((g) =>
      g.items.some((item) => item.isActive(location.pathname, location.search))
    );
    if (activeGroup) {
      setExpandedGroups((prev) =>
        prev[activeGroup.id] ? prev : { ...prev, [activeGroup.id]: true }
      );
    }
  }, [location.pathname, location.search, sidebarOpen]);

  // Escape key & Android hardware Back button handling for left navigation drawer
  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    // Push a lightweight history entry so Android back button closes the drawer without leaving the screen
    let pushedHistoryState = false;
    try {
      if (window.history.state?.akaraiDrawerOpen !== true) {
        window.history.pushState({ ...window.history.state, akaraiDrawerOpen: true }, '');
        pushedHistoryState = true;
      }
    } catch {
      // ignore history errors in restricted frames
    }

    const handlePopState = () => {
      pushedHistoryState = false;
      setSidebarOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (pushedHistoryState && window.history.state?.akaraiDrawerOpen === true) {
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [sidebarOpen]);

  const toggleGroup = (groupId: SidebarGroupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const switchRole = async (newRole: RoleType) => {
    if (!settings) return;
    await db.applicationSettings.update(settings.id, { activeRole: newRole });
    if (newRole === 'tenant') {
      navigate('/tenant-portal');
    } else if (newRole === 'unauthenticated') {
      navigate('/account');
    }
  };

  // Compute real notifications from overdue charges, open maintenance tickets, and financial conflicts
  const overdueCharges = charges.filter(
    (c) =>
      !c.isDeleted &&
      c.status !== 'reversed' &&
      c.status !== 'paid' &&
      c.status !== 'waived' &&
      (c.status === 'overdue' || c.dueDate < '2026-11-20')
  );
  const openTickets = maintenanceTickets.filter(
    (m) => m.status !== 'resolved' && m.status !== 'closed'
  );
  const unresolvedConflicts = syncOperations.filter(
    (s) => s.syncStatus === 'conflict_requires_reconciliation'
  );
  const totalNotificationsCount =
    overdueCharges.length + openTickets.length + unresolvedConflicts.length;

  // Global search filter
  const q = searchQuery.trim().toLowerCase();
  const matchedProperties = q
    ? properties.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.suburb.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      )
    : [];
  const matchedUnits = q
    ? units.filter(
        (u) => u.unitNumber.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
      )
    : [];
  const matchedTenants = q
    ? tenants.filter(
        (ten) =>
          ten.fullName.toLowerCase().includes(q) ||
          ten.tenantCode.toLowerCase().includes(q) ||
          (ten.provisionalIdentifier && ten.provisionalIdentifier.toLowerCase().includes(q))
      )
    : [];
  const matchedReceipts = q
    ? receipts.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(q) ||
          r.tenantName.toLowerCase().includes(q)
      )
    : [];
  const matchedTickets = q
    ? maintenanceTickets.filter(
        (m) =>
          m.ticketNumber.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
      )
    : [];

  // Bottom navigation active state helpers
  const isHomeActive =
    location.pathname === '/' || location.pathname === '/dashboard';
  const isPropertiesActive =
    location.pathname.startsWith('/properties') ||
    location.pathname.startsWith('/units');
  const isTenantsActive =
    location.pathname.startsWith('/tenants') || location.pathname.startsWith('/tenancies');
  const isPaymentsActive =
    location.pathname.startsWith('/receipts') ||
    location.pathname.startsWith('/ledger') ||
    location.pathname.startsWith('/payments');

  // Determine whether a nested operational screen needs the shared Contextual Quick Actions FAB
  const screensWithOwnFab = new Set([
    '/',
    '/dashboard',
    '/properties',
    '/tenants',
    '/receipts',
    '/payments',
    '/maintenance',
  ]);
  const screensWithoutFab = [
    '/payments/new',
    '/settings',
    '/language',
    '/subscription',
    '/help',
    '/backup',
    '/onboarding',
    '/account',
    '/tenant-portal',
  ];
  const shouldRenderNestedContextualFab =
    (activeRole === 'owner' || activeRole === 'manager') &&
    !screensWithOwnFab.has(location.pathname) &&
    !screensWithoutFab.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <div className="min-h-screen flex flex-col bg-[#EDF1F5] dark:bg-[#000000] text-[#111318] dark:text-[#FFFFFF] transition-colors duration-150">
      {/* Main Centered Mobile-First Application Frame (1:1 consistency across all pages) */}
      <div className="w-full max-w-[430px] mx-auto flex-1 flex flex-col min-w-0 pb-[96px]">
        {/* A. Authoritative Header: Left Hamburger Menu + Akarai Symbol & Wordmark; Right Search & Notification Bell */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2.5 px-4 pt-3.5 pb-2 bg-[#EDF1F5]/95 dark:bg-[#000000]/95 backdrop-blur-md">
          {/* Top-Left: Hamburger Menu Button + Akarai Standalone Symbol & Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="akarai-left-navigation-drawer"
              className="w-[38px] h-[38px] flex items-center justify-center rounded-[12px] bg-[#FFFFFF] dark:bg-[#191D23] border border-[#E6ECF3] dark:border-[#272C35] shadow-[0_2px_8px_rgba(17,19,24,0.06)] dark:shadow-none text-[#111318] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
              aria-label={t.appShell.openSidebarAria}
            >
              <Menu className="w-[19px] h-[19px] stroke-[2.1]" />
            </button>

            <Link
              to="/"
              aria-label="Akarai Home"
              className="flex items-center gap-2 whitespace-nowrap shrink-0 focus:outline-none"
            >
              <LandlordOSLogoSymbol className="w-[34px] h-[34px] shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="text-[20px] font-bold tracking-[-0.025em] text-[#0B1B3B] dark:text-[#FFFFFF]">
                  Akarai
                </span>
                <span className="text-[10.5px] font-bold tracking-[0.04em] text-[#0145F2] dark:text-[#8EC5FF] mt-[2px]">
                  — አካራይ —
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Search Icon, Notification Bell with Blue Dot, and Payments Profile Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-[38px] h-[38px] flex items-center justify-center rounded-full text-[#111318] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label={t.appShell.searchAria}
            >
              <Search className="w-[21px] h-[21px] stroke-[2.1]" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="w-[38px] h-[38px] flex items-center justify-center rounded-[12px] bg-[#FFFFFF] dark:bg-[#191D23] border border-[#E6ECF3] dark:border-[#272C35] shadow-[0_2px_8px_rgba(17,19,24,0.06)] dark:shadow-none text-[#111318] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
                aria-label={`${t.appShell.notificationsTitle} (${totalNotificationsCount})`}
              >
                <Bell className="w-[19px] h-[19px] stroke-[2]" />
                {totalNotificationsCount > 0 && (
                  <span
                    className="absolute top-[4px] right-[4px] w-[9px] h-[9px] rounded-full bg-[#0145F2]"
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-[20px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_12px_32px_rgba(17,19,24,0.14)] z-50 overflow-hidden text-xs">
                  <div className="px-4 py-3 border-b border-[#E6ECF3] dark:border-[#262B31] flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#111318] dark:text-[#FFFFFF]">
                      {t.appShell.notificationsTitle} ({totalNotificationsCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#626A78] dark:text-[#98A1B2] hover:text-[#111318] dark:hover:text-[#FFFFFF] font-medium"
                    >
                      {t.common.close}
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#EDF1F7] dark:divide-[#242932]">
                    {unresolvedConflicts.map((c) => (
                      <Link
                        key={c.id}
                        to="/settings"
                        onClick={() => setNotificationsOpen(false)}
                        className="block px-4 py-3 hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026]"
                      >
                        <div className="font-semibold text-[#D97706] dark:text-[#FFC24B] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {t.appShell.financialConflictTitle}
                        </div>
                        <p className="text-[#626A78] dark:text-[#98A1B2] mt-0.5 line-clamp-2">
                          {c.conflictReason}
                        </p>
                      </Link>
                    ))}
                    {overdueCharges.map((chg) => {
                      const rem = Math.max(
                        0,
                        chg.amountCents + chg.adjustedCents - chg.allocatedPaidCents
                      );
                      return (
                        <Link
                          key={chg.id}
                          to="/ledger"
                          onClick={() => setNotificationsOpen(false)}
                          className="block px-4 py-3 hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026]"
                        >
                          <div className="font-semibold text-[#E82C33] dark:text-[#FF5A5F]">
                            {t.appShell.overdueChargePrefix}: {formatZAR(rem)}
                          </div>
                          <div className="text-[#626A78] dark:text-[#98A1B2] mt-0.5">
                            {chg.description}
                          </div>
                        </Link>
                      );
                    })}
                    {openTickets.map((tkt) => (
                      <Link
                        key={tkt.id}
                        to={`/maintenance/${tkt.id}`}
                        onClick={() => setNotificationsOpen(false)}
                        className="block px-4 py-3 hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026]"
                      >
                        <div className="font-semibold text-[#111318] dark:text-[#FFFFFF]">
                          {t.appShell.maintenancePrefix} (
                          {t.domainLabels.maintenanceStatuses[tkt.status] || tkt.status}):{' '}
                          {tkt.title}
                        </div>
                        <div className="text-[#626A78] dark:text-[#98A1B2] mt-0.5">
                          {tkt.ticketNumber} · {t.appShell.priorityPrefix}: {tkt.priority}
                        </div>
                      </Link>
                    ))}
                    {totalNotificationsCount === 0 && (
                      <div className="px-4 py-6 text-center text-[#626A78] dark:text-[#98A1B2]">
                        {t.appShell.noNotifications}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isPaymentsScreen && (
              <Link
                to="/account"
                aria-label={sidebarNav.items.signInRoleState}
                className="w-[38px] h-[38px] rounded-full bg-[#E8EEF7] dark:bg-[#1F2530] border border-[#E0E7F1] dark:border-[#2A313D] flex items-center justify-center relative shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[19px] h-[19px] text-[#111318] dark:text-[#A0A8B8]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8.2" r="3.6" />
                  <path d="M5.2 19.2c0-3.1 3.1-5.2 6.8-5.2s6.8 2.1 6.8 5.2v.6H5.2v-.6Z" />
                </svg>
                <span
                  className="hidden dark:block absolute top-[7px] right-[6px] w-[4px] h-[4px] rounded-full bg-[#2E88FF]"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>
        </header>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mx-4 mt-2 p-3.5 rounded-[18px] bg-[#15181C] border border-[#262B31] text-[#FFFFFF] text-[13px] font-medium flex items-center justify-between shadow-lg">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={onDismissToast}
              className="ml-4 text-[#98A1B2] hover:text-[#FFFFFF]"
              aria-label={t.common.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 px-4 pt-1 pb-6 w-full">
          {activeRole === 'unauthenticated' &&
          location.pathname !== '/account' &&
          location.pathname !== '/onboarding' ? (
            <div className="p-6 rounded-[22px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] my-6 text-center space-y-4 shadow-[0_2px_10px_rgba(17,19,24,0.04)] dark:shadow-none">
              <div className="w-12 h-12 rounded-full bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-[18px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.appShell.unauthTitle}
              </h1>
              <p className="text-[13px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
                {t.appShell.unauthDesc}
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => switchRole('owner')}
                  className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[14px] font-semibold"
                >
                  {t.appShell.signInOwnerBtn}
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('tenant')}
                  className="min-h-[46px] px-5 py-2.5 rounded-full border border-[#D4DCE8] dark:border-[#2B313B] text-[14px] font-semibold text-[#111318] dark:text-[#FFFFFF]"
                >
                  {t.appShell.signInTenantBtn}
                </button>
              </div>
            </div>
          ) : (
            <>
              {children}
              {shouldRenderNestedContextualFab && (
                <DSFAB
                  onClick={() => onOpenQuickAdd('menu')}
                  ariaLabel={contextualActions.menus.generalTitle}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* G. Authoritative 4-Item Reference Bottom Navigation Pill Bar: Home, Properties, Tenants, Payments */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none pb-safe">
        <nav
          aria-label="Primary bottom navigation"
          className="pointer-events-auto max-w-[406px] mx-auto rounded-[32px] bg-[#F9FAFC] dark:bg-[#0D0E10] border border-[#E4E9F0] dark:border-[#222428] shadow-[0_6px_24px_rgba(17,19,24,0.08)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.8)] grid grid-cols-4 items-center h-[64px] px-2"
        >
          <Link
            to={activeRole === 'tenant' ? '/tenant-portal' : '/'}
            className={`relative h-full flex flex-col items-center justify-center transition-colors ${
              isHomeActive
                ? 'text-[#0145F2]'
                : 'text-[#111318] dark:text-[#FFFFFF] hover:text-[#0145F2]'
            }`}
          >
            {isHomeActive ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[21px] h-[21px]"
                aria-hidden="true"
              >
                <path d="M11.33 2.55a1 1 0 0 1 1.34 0l8 7.2A1 1 0 0 1 21 10.5V20a1.5 1.5 0 0 1-1.5 1.5H14v-6a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v6H4.5A1.5 1.5 0 0 1 3 20v-9.5a1 1 0 0 1 .33-.75l8-7.2Z" />
              </svg>
            ) : (
              <Home className="w-[21px] h-[21px] stroke-[2]" />
            )}
            <span
              className={`text-[11px] mt-1 tracking-[-0.01em] leading-none truncate max-w-[82px] ${
                isHomeActive
                  ? 'text-[#0145F2] font-semibold'
                  : 'text-[#4A505C] dark:text-[#A1A1AA] font-medium'
              }`}
            >
              {currentLanguage.navLabels.home}
            </span>
            {isHomeActive && (
              <span className="absolute bottom-[3px] w-[42px] h-[3px] rounded-full bg-[#0145F2]" />
            )}
          </Link>

          <Link
            to="/properties"
            className={`relative h-full flex flex-col items-center justify-center transition-colors ${
              isPropertiesActive
                ? 'text-[#0145F2]'
                : 'text-[#111318] dark:text-[#FFFFFF] hover:text-[#0145F2]'
            }`}
          >
            <Building2 className="w-[21px] h-[21px] stroke-[2]" />
            <span
              className={`text-[11px] mt-1 tracking-[-0.01em] leading-none truncate max-w-[86px] ${
                isPropertiesActive
                  ? 'text-[#0145F2] font-semibold'
                  : 'text-[#4A505C] dark:text-[#A1A1AA] font-medium'
              }`}
            >
              {currentLanguage.navLabels.properties}
            </span>
            {isPropertiesActive && (
              <span className="absolute bottom-[3px] w-[52px] h-[3px] rounded-full bg-[#0145F2]" />
            )}
          </Link>

          <Link
            to="/tenants"
            className={`relative h-full flex flex-col items-center justify-center transition-colors ${
              isTenantsActive
                ? 'text-[#0145F2]'
                : 'text-[#111318] dark:text-[#FFFFFF] hover:text-[#0145F2]'
            }`}
          >
            <Users className="w-[21px] h-[21px] stroke-[2]" />
            <span
              className={`text-[11px] mt-1 tracking-[-0.01em] leading-none truncate max-w-[86px] ${
                isTenantsActive
                  ? 'text-[#0145F2] font-semibold'
                  : 'text-[#4A505C] dark:text-[#A1A1AA] font-medium'
              }`}
            >
              {currentLanguage.navLabels.tenants}
            </span>
            {isTenantsActive && (
              <span className="absolute bottom-[3px] w-[48px] h-[3px] rounded-full bg-[#0145F2]" />
            )}
          </Link>

          <Link
            to="/receipts"
            className={`relative h-full flex flex-col items-center justify-center transition-colors ${
              isPaymentsActive
                ? 'text-[#0145F2]'
                : 'text-[#111318] dark:text-[#FFFFFF] hover:text-[#0145F2]'
            }`}
          >
            {isPaymentsActive ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-[22px] h-[22px] text-[#0145F2]"
                aria-hidden="true"
              >
                <rect
                  x="2.5"
                  y="4.5"
                  width="19"
                  height="15"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M2.5 8.5H21.5V10.5H2.5V8.5Z"
                  fill="currentColor"
                />
                <rect
                  x="5.5"
                  y="14"
                  width="4.5"
                  height="2"
                  rx="0.8"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <CreditCard className="w-[21px] h-[21px] stroke-[2]" />
            )}
            <span
              className={`text-[11px] mt-1 tracking-[-0.01em] leading-none truncate max-w-[86px] ${
                isPaymentsActive
                  ? 'text-[#0145F2] font-semibold'
                  : 'text-[#4A505C] dark:text-[#A1A1AA] font-medium'
              }`}
            >
              {currentLanguage.navLabels.payments}
            </span>
            {isPaymentsActive && (
              <span className="absolute bottom-[3px] w-[50px] h-[3px] rounded-full bg-[#0145F2]" />
            )}
          </Link>
        </nav>
      </div>

      {/* Left-Anchored Slide-In Navigation Drawer with Expandable Nested Groups */}
      <div
        className={`fixed inset-0 z-50 flex justify-start transition-opacity duration-200 motion-reduce:transition-none ${
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!sidebarOpen}
      >
        {/* Dimmed Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Left Drawer Surface */}
        <aside
          id="akarai-left-navigation-drawer"
          aria-label={sidebarNav.aria.navigationDrawerLabel}
          onClick={(e) => e.stopPropagation()}
          className={`relative z-10 w-[88vw] max-w-[356px] h-full bg-[#EDF1F5] dark:bg-[#0C0E10] text-[#111318] dark:text-[#FFFFFF] border-r border-[#E6ECF3] dark:border-[#22252A] flex flex-col overflow-y-auto px-4 pt-4 pb-8 shadow-2xl transform transition-transform duration-200 ease-out motion-reduce:transition-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header: Approved Akarai Horizontal Brand Logo & Close X */}
          <div className="flex items-center justify-between gap-2 pb-3.5">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              aria-label="Akarai — Property & Rent Management"
              className="flex items-center min-w-0 focus:outline-none"
            >
              <AkaraiHorizontalBrandLogo className="h-[38px] max-w-[228px] w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#111318] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label={t.appShell.closeSidebarAria}
            >
              <X className="w-[21px] h-[21px] stroke-[2]" />
            </button>
          </div>

          {/* Landlord Account Profile Card */}
          <Link
            to="/account"
            onClick={() => setSidebarOpen(false)}
            className="mt-1 p-3.5 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none flex items-center justify-between gap-3 hover:border-[#0145F2]/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[42px] h-[42px] rounded-full bg-[#DCEBFF] dark:bg-[#153462] flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[22px] h-[22px] text-[#0145F2] dark:text-[#5CA2FF]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8.2" r="3.6" />
                  <path d="M5.2 19.2c0-3.1 3.1-5.2 6.8-5.2s6.8 2.1 6.8 5.2v.6H5.2v-.6Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF] truncate">
                  {currentLanguage.uiStrings.sidebar.landlordAccount}
                </div>
                <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2] truncate mt-0.5">
                  {currentLanguage.uiStrings.sidebar.viewManageProfile}
                </div>
              </div>
            </div>
            <ChevronRight className="w-[18px] h-[18px] text-[#626A78] dark:text-[#8E96A4] stroke-[2] shrink-0" />
          </Link>

          {/* Expandable Nested Category Groups */}
          <div className="mt-4 space-y-3">
            {sidebarGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = !!expandedGroups[group.id];
              const hasActiveChild = group.items.some((item) =>
                item.isActive(location.pathname, location.search)
              );

              return (
                <div
                  key={group.id}
                  className={`rounded-[20px] bg-[#FFFFFF] dark:bg-[#15181C] border transition-colors overflow-hidden ${
                    hasActiveChild
                      ? 'border-[#0145F2]/40 dark:border-[#0145F2]/50 shadow-[0_2px_10px_rgba(1,69,242,0.06)]'
                      : 'border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none'
                  }`}
                >
                  {/* Group Header Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-[32px] h-[32px] rounded-[10px] flex items-center justify-center shrink-0 ${
                          hasActiveChild
                            ? 'bg-[#0145F2] text-[#FFFFFF]'
                            : 'bg-[#E7F0FF] dark:bg-[#1C2433] text-[#0145F2] dark:text-[#5CA2FF]'
                        }`}
                      >
                        <GroupIcon className="w-[17px] h-[17px] stroke-[2.1]" />
                      </div>
                      <span className="text-[14.5px] font-bold tracking-[-0.01em] text-[#111318] dark:text-[#FFFFFF] leading-snug break-words">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasActiveChild && !isExpanded && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#0145F2]"
                          aria-hidden="true"
                        />
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-[17px] h-[17px] text-[#626A78] dark:text-[#8E96A4] stroke-[2]" />
                      ) : (
                        <ChevronRight className="w-[17px] h-[17px] text-[#626A78] dark:text-[#8E96A4] stroke-[2]" />
                      )}
                    </div>
                  </button>

                  {/* Nested Group Items */}
                  {isExpanded && (
                    <div className="border-t border-[#EDF1F7] dark:border-[#242932] divide-y divide-[#EDF1F7] dark:divide-[#20252E] bg-[#FAFCFF] dark:bg-[#121519]">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = item.isActive(location.pathname, location.search);

                        if (item.isLanguageRow) {
                          return (
                            <div key={item.id}>
                              <button
                                type="button"
                                onClick={() => setLanguagePickerOpen((prev) => !prev)}
                                aria-expanded={languagePickerOpen}
                                className={`w-full pl-5 pr-4 py-3 flex items-center justify-between gap-3 transition-colors text-left ${
                                  active
                                    ? 'bg-[#E7F0FF]/80 dark:bg-[#16233B] text-[#0145F2] dark:text-[#68A2FF]'
                                    : 'hover:bg-[#F1F5FB] dark:hover:bg-[#1A1E24] text-[#111318] dark:text-[#E4E7EC]'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Languages className="w-[18px] h-[18px] text-[#0145F2] dark:text-[#5CA2FF] stroke-[2] shrink-0" />
                                  <span className="text-[13.5px] font-semibold tracking-[-0.01em] leading-snug break-words">
                                    {item.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[12px] font-semibold text-[#0145F2] dark:text-[#68A2FF]">
                                    {currentLanguage.englishName}
                                  </span>
                                  {languagePickerOpen ? (
                                    <ChevronDown className="w-[16px] h-[16px] text-[#626A78] dark:text-[#8E96A4] stroke-[2]" />
                                  ) : (
                                    <ChevronRight className="w-[16px] h-[16px] text-[#626A78] dark:text-[#8E96A4] stroke-[2]" />
                                  )}
                                </div>
                              </button>

                              {languagePickerOpen && (
                                <div
                                  role="radiogroup"
                                  aria-label={item.label}
                                  className="bg-[#F2F6FC] dark:bg-[#0E1014] border-t border-[#E6ECF3] dark:border-[#242932] p-2.5 space-y-1.5"
                                >
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {SUPPORTED_LANGUAGES.map((lang) => {
                                      const isSelected = lang.code === currentLanguage.code;
                                      return (
                                        <button
                                          key={lang.code}
                                          type="button"
                                          role="radio"
                                          aria-checked={isSelected}
                                          onClick={() => selectLanguage(lang.code)}
                                          className={`px-3 py-2 rounded-[14px] border text-left transition-colors flex items-center justify-between gap-1.5 ${
                                            isSelected
                                              ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.22)]'
                                              : 'bg-[#FFFFFF] dark:bg-[#171B22] text-[#111318] dark:text-[#E4E7EC] border-[#E6ECF3] dark:border-[#262B31] hover:border-[#0145F2]/50'
                                          }`}
                                        >
                                          <div className="min-w-0">
                                            <div className="text-[12.5px] font-bold leading-tight truncate">
                                              {lang.englishName}
                                            </div>
                                            <div
                                              className={`text-[11px] truncate mt-0.5 ${
                                                isSelected
                                                  ? 'text-white/85'
                                                  : 'text-[#0145F2] dark:text-[#68A2FF]'
                                              }`}
                                            >
                                              {lang.nativeName}
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <Link
                                    to="/language"
                                    onClick={() => setSidebarOpen(false)}
                                    className="block pt-1 text-center text-[11.5px] font-semibold text-[#0145F2] dark:text-[#68A2FF] hover:underline"
                                  >
                                    {t.appShell.fullLanguageDetailsLink}
                                  </Link>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.id}
                            to={item.to}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setSidebarOpen(false)}
                            className={`pl-5 pr-4 py-3 flex items-center justify-between gap-3 transition-colors relative ${
                              active
                                ? 'bg-[#E7F0FF]/90 dark:bg-[#16233B] text-[#0145F2] dark:text-[#68A2FF]'
                                : 'hover:bg-[#F1F5FB] dark:hover:bg-[#1A1E24] text-[#111318] dark:text-[#E4E7EC]'
                            }`}
                          >
                            {active && (
                              <span
                                className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full bg-[#0145F2]"
                                aria-hidden="true"
                              />
                            )}
                            <div className="flex items-center gap-3 min-w-0">
                              {item.badgeVariant === 'pro' ? (
                                <Crown className="w-[18px] h-[18px] text-[#F5A623] fill-[#F5A623] shrink-0" />
                              ) : (
                                <ItemIcon
                                  className={`w-[18px] h-[18px] stroke-[2] shrink-0 ${
                                    active
                                      ? 'text-[#0145F2] dark:text-[#68A2FF]'
                                      : 'text-[#0145F2] dark:text-[#5CA2FF]'
                                  }`}
                                />
                              )}
                              <span
                                className={`text-[13.5px] tracking-[-0.01em] leading-snug break-words ${
                                  active ? 'font-bold' : 'font-semibold'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badgeVariant === 'pro' && item.badgeText && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#FFC82C] text-[#111318] text-[11px] font-bold leading-tight">
                                  {item.badgeText}
                                </span>
                              )}
                              {item.badgeVariant === 'dot' && (
                                <span
                                  className="w-[8px] h-[8px] rounded-full bg-[#0145F2]"
                                  aria-hidden="true"
                                />
                              )}
                              {active ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[10.5px] font-bold">
                                  {sidebarNav.aria.currentScreenBadge}
                                </span>
                              ) : (
                                <ChevronRight className="w-[16px] h-[16px] text-[#626A78] dark:text-[#8E96A4] stroke-[2]" />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Install App Controls if installable */}
          {!isInstalled && (isInstallable || isIOS) && (
            <div className="mt-4">
              {isInstallable && (
                <button
                  type="button"
                  onClick={install}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-[18px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] dark:text-[#68A2FF] text-[13px] font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t.appShell.installAppBtn}
                </button>
              )}
              {isIOS && (
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowIOSGuide(true);
                  }}
                  className="w-full mt-2 min-h-[44px] px-4 py-2.5 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] text-[13px] font-semibold"
                >
                  {t.appShell.installIosBtn}
                </button>
              )}
            </div>
          )}

          {/* Log Out Button Card */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                switchRole('unauthenticated');
                setSidebarOpen(false);
              }}
              className="w-full px-4 py-3.5 rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_8px_rgba(17,19,24,0.03)] dark:shadow-none flex items-center gap-3.5 text-[#E82C33] dark:text-[#FF5A5F] hover:bg-[#FFE8E8]/50 dark:hover:bg-[#3A1619]/40 transition-colors"
            >
              <LogOut className="w-[20px] h-[20px] stroke-[2]" />
              <span className="text-[14.5px] font-bold tracking-[-0.01em]">
                {currentLanguage.uiStrings.sidebar.logOut}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-xs p-4 pt-14">
          <div className="w-full max-w-[406px] rounded-[24px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E6ECF3] dark:border-[#262B31]">
              <Search className="w-[18px] h-[18px] text-[#626A78] dark:text-[#98A1B2]" />
              <input
                type="text"
                autoFocus
                placeholder={t.appShell.searchModalPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-[14px] bg-transparent focus:outline-none text-[#111318] dark:text-[#FFFFFF] placeholder:text-[#707887] dark:placeholder:text-[#8A93A3]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="min-h-[34px] px-2.5 text-[13px] font-semibold text-[#0145F2]"
              >
                {t.common.close}
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
              {!q && (
                <p className="text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
                  {t.appShell.searchModalHint}
                </p>
              )}
              {q &&
                matchedProperties.length === 0 &&
                matchedUnits.length === 0 &&
                matchedTenants.length === 0 &&
                matchedReceipts.length === 0 &&
                matchedTickets.length === 0 && (
                  <p className="text-[#626A78] dark:text-[#98A1B2]">
                    {t.appShell.searchNoMatches}
                  </p>
                )}

              {matchedProperties.length > 0 && (
                <div>
                  <div className="font-bold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.appShell.searchSectionProperties}
                  </div>
                  {matchedProperties.map((p) => (
                    <Link
                      key={p.id}
                      to={`/properties/${p.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="block py-2 px-2.5 rounded-[12px] hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] font-medium"
                    >
                      {p.name} · {p.city}
                    </Link>
                  ))}
                </div>
              )}

              {matchedUnits.length > 0 && (
                <div>
                  <div className="font-bold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.appShell.searchSectionUnits}
                  </div>
                  {matchedUnits.map((u) => (
                    <Link
                      key={u.id}
                      to={`/units/${u.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="block py-2 px-2.5 rounded-[12px] hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] font-medium"
                    >
                      {u.unitNumber} — {u.name} ·{' '}
                      {u.status === 'occupied' ? t.common.occupied : t.common.vacant}
                    </Link>
                  ))}
                </div>
              )}

              {matchedTenants.length > 0 && (
                <div>
                  <div className="font-bold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.appShell.searchSectionTenants}
                  </div>
                  {matchedTenants.map((ten) => (
                    <Link
                      key={ten.id}
                      to={`/tenants/${ten.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="block py-2 px-2.5 rounded-[12px] hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] font-medium"
                    >
                      {ten.fullName} ({ten.tenantCode}) ·{' '}
                      {t.domainLabels.docStatuses[ten.documentationStatus] ||
                        ten.documentationStatus}
                    </Link>
                  ))}
                </div>
              )}

              {matchedReceipts.length > 0 && (
                <div>
                  <div className="font-bold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.appShell.searchSectionReceipts}
                  </div>
                  {matchedReceipts.map((r) => (
                    <Link
                      key={r.id}
                      to={`/receipts/${r.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="block py-2 px-2.5 rounded-[12px] hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] font-medium"
                    >
                      {r.receiptNumber} — {r.tenantName}
                    </Link>
                  ))}
                </div>
              )}

              {matchedTickets.length > 0 && (
                <div>
                  <div className="font-bold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.appShell.searchSectionMaintenance}
                  </div>
                  {matchedTickets.map((m) => (
                    <Link
                      key={m.id}
                      to={`/maintenance/${m.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="block py-2 px-2.5 rounded-[12px] hover:bg-[#F5F7FA] dark:hover:bg-[#1C2026] font-medium"
                    >
                      {m.ticketNumber} — {m.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guided Install Prompt */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-[#FFFFFF] dark:bg-[#15181C] p-6 border border-[#E6ECF3] dark:border-[#262B31]">
            <h3 className="text-[17px] font-bold">{t.appShell.iosModalTitle}</h3>
            <p className="mt-2 text-[13px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              {t.appShell.iosModalStep1}
              <br />
              {t.appShell.iosModalStep2}
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full min-h-[44px] rounded-full bg-[#0145F2] text-[#FFFFFF] text-[14px] font-semibold"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
