import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import { seedSampleData } from './db/sampleData';
import { AppShell } from './components/AppShell';
import { QuickAddModal, type QuickAddTab } from './components/QuickAddModal';
import { AkaraiKeyboard } from './keyboard/AkaraiKeyboard';
import { resolveAssetUrl } from './utils/assetUrl';
import {
  DashboardScreen,
  SignInAccountStateScreen,
  WelcomeOnboardingScreen,
} from './pages/DashboardAndOnboarding';
import {
  PropertyDetailScreen,
  PropertyDirectoryScreen,
  UnitDetailScreen,
} from './pages/PropertiesAndUnits';
import {
  TenanciesScreen,
  TenancyDetailScreen,
  TenantDirectoryScreen,
  TenantProfileScreen,
} from './pages/TenantsAndTenancies';
import {
  ReceiptDetailScreen,
  ReceiptsScreen,
  RecordPaymentScreen,
  RentLedgerScreen,
} from './pages/LedgerPaymentsReceipts';
import {
  CommunicationCenterScreen,
  DocumentsScreen,
  MaintenanceBoardScreen,
  MaintenanceTicketDetailScreen,
} from './pages/CommsMaintenanceDocs';
import {
  BackupAndRestoreScreen,
  FinancialDashboardScreen,
  HelpAndSupportScreen,
  LanguageScreen,
  ReportsAndExportsScreen,
  SettingsAndAccessScreen,
  SubscriptionAndBillingScreen,
  TenantPortalScreen,
} from './pages/FinancialsReportsSettingsBackupPortal';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<QuickAddTab>('menu');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    seedSampleData(false)
      .then(() => setInitialized(true))
      .catch(() => setInitialized(true));
  }, []);

  const settings = useLiveQuery(() => db.applicationSettings.get('settings-default'), []);
  const ownerEntities = useLiveQuery(() => db.ownerEntities.toArray(), []) || [];
  const portfolios = useLiveQuery(() => db.portfolios.toArray(), []) || [];
  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
  const units = useLiveQuery(() => db.units.toArray(), []) || [];
  const tenants = useLiveQuery(() => db.tenantProfiles.toArray(), []) || [];
  const identityEvidences = useLiveQuery(() => db.identityEvidences.toArray(), []) || [];
  const consentRecords = useLiveQuery(() => db.consentRecords.toArray(), []) || [];
  const tenancies = useLiveQuery(() => db.tenancies.toArray(), []) || [];
  const participants = useLiveQuery(() => db.tenancyParticipants.toArray(), []) || [];
  const leaseVersions = useLiveQuery(() => db.leaseVersions.toArray(), []) || [];
  const charges = useLiveQuery(() => db.charges.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const adjustments = useLiveQuery(() => db.ledgerAdjustments.toArray(), []) || [];
  const deposits = useLiveQuery(() => db.depositLiabilities.toArray(), []) || [];
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const maintenanceTickets = useLiveQuery(() => db.maintenanceTickets.toArray(), []) || [];
  const maintenanceEvents = useLiveQuery(() => db.maintenanceEvents.toArray(), []) || [];
  const documents = useLiveQuery(() => db.documents.toArray(), []) || [];
  const messageLogs = useLiveQuery(() => db.messageLogs.toArray(), []) || [];
  const syncOperations = useLiveQuery(() => db.syncOperations.toArray(), []) || [];
  const auditEvents = useLiveQuery(() => db.auditEvents.toArray(), []) || [];

  useEffect(() => {
    const applyResolvedTheme = (pref: 'light' | 'dark' | 'system') => {
      try {
        localStorage.setItem('landlordos_theme_pref', pref);
      } catch {
        // ignore
      }
      const systemDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = pref === 'dark' || (pref === 'system' && systemDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Ensure existing browser sessions without an explicit saved theme default to dark mode as per visual reference
    let savedPref: 'light' | 'dark' | 'system' | null = null;
    try {
      savedPref = localStorage.getItem('landlordos_theme_pref') as 'light' | 'dark' | 'system' | null;
    } catch {
      savedPref = null;
    }

    if (!savedPref && settings && settings.theme === 'light') {
      db.applicationSettings.update('settings-default', { theme: 'dark' });
      applyResolvedTheme('dark');
      return;
    }

    const activePref = settings?.theme || savedPref || 'dark';
    applyResolvedTheme(activePref);

    if (activePref === 'system' && typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyResolvedTheme('system');
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [settings?.theme]);

  const handleOpenQuickAdd = (tab: QuickAddTab = 'menu') => {
    setQuickAddTab(tab);
    setQuickAddOpen(true);
  };

  const handleNotify = (msg: string) => {
    setToastMessage(msg);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFFFFF] dark:bg-black text-[#0B1B3B] dark:text-white">
        <img
          src={resolveAssetUrl('akarai-symbol.png')}
          alt="Akarai"
          className="w-14 h-14 object-contain rounded-[14px]"
        />
        <div className="text-xs font-mono text-[#626A78] dark:text-[#98A1B2]">
          Initializing Akarai Local IndexedDB Engine...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell
        settings={settings}
        properties={properties}
        units={units}
        tenants={tenants}
        tenancies={tenancies}
        charges={charges}
        receipts={receipts}
        maintenanceTickets={maintenanceTickets}
        syncOperations={syncOperations}
        onOpenQuickAdd={handleOpenQuickAdd}
        toastMessage={toastMessage}
        onDismissToast={() => setToastMessage(null)}
      >
        <Routes>
          <Route
            path="/"
            element={
              <DashboardScreen
                settings={settings}
                properties={properties}
                units={units}
                tenants={tenants}
                tenancies={tenancies}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                receipts={receipts}
                expenses={expenses}
                maintenanceTickets={maintenanceTickets}
                syncOperations={syncOperations}
                onOpenQuickAdd={handleOpenQuickAdd}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardScreen
                settings={settings}
                properties={properties}
                units={units}
                tenants={tenants}
                tenancies={tenancies}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                receipts={receipts}
                expenses={expenses}
                maintenanceTickets={maintenanceTickets}
                syncOperations={syncOperations}
                onOpenQuickAdd={handleOpenQuickAdd}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/onboarding"
            element={<WelcomeOnboardingScreen settings={settings} onNotify={handleNotify} />}
          />
          <Route
            path="/account"
            element={
              <SignInAccountStateScreen
                settings={settings}
                tenants={tenants}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/properties"
            element={
              <PropertyDirectoryScreen
                settings={settings}
                ownerEntities={ownerEntities}
                portfolios={portfolios}
                properties={properties}
                units={units}
                tenancies={tenancies}
                charges={charges}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/properties/:propertyId"
            element={
              <PropertyDetailScreen
                properties={properties}
                units={units}
                tenancies={tenancies}
                tenants={tenants}
                expenses={expenses}
                maintenanceTickets={maintenanceTickets}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/units/:unitId"
            element={
              <UnitDetailScreen
                properties={properties}
                units={units}
                tenancies={tenancies}
                tenants={tenants}
                charges={charges}
                maintenanceTickets={maintenanceTickets}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/tenants"
            element={
              <TenantDirectoryScreen
                tenants={tenants}
                tenancies={tenancies}
                units={units}
                properties={properties}
                charges={charges}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/tenants/:tenantId"
            element={
              <TenantProfileScreen
                tenants={tenants}
                tenancies={tenancies}
                units={units}
                identityEvidences={identityEvidences}
                consentRecords={consentRecords}
                messageLogs={messageLogs}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/tenancies"
            element={
              <TenanciesScreen
                tenancies={tenancies}
                tenants={tenants}
                units={units}
                properties={properties}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/tenancies/:tenancyId"
            element={
              <TenancyDetailScreen
                tenancies={tenancies}
                tenants={tenants}
                units={units}
                properties={properties}
                participants={participants}
                leaseVersions={leaseVersions}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/ledger"
            element={
              <RentLedgerScreen
                tenancies={tenancies}
                tenants={tenants}
                units={units}
                properties={properties}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/payments/new"
            element={
              <RecordPaymentScreen
                tenancies={tenancies}
                tenants={tenants}
                units={units}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/receipts"
            element={
              <ReceiptsScreen
                receipts={receipts}
                payments={payments}
                charges={charges}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/payments"
            element={
              <ReceiptsScreen
                receipts={receipts}
                payments={payments}
                charges={charges}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/receipts/:receiptId"
            element={<ReceiptDetailScreen receipts={receipts} payments={payments} />}
          />
          <Route
            path="/communications"
            element={
              <CommunicationCenterScreen
                tenants={tenants}
                tenancies={tenancies}
                units={units}
                properties={properties}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                messageLogs={messageLogs}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/maintenance"
            element={
              <MaintenanceBoardScreen
                maintenanceTickets={maintenanceTickets}
                properties={properties}
                units={units}
                onOpenQuickAdd={handleOpenQuickAdd}
              />
            }
          />
          <Route
            path="/maintenance/:ticketId"
            element={
              <MaintenanceTicketDetailScreen
                maintenanceTickets={maintenanceTickets}
                maintenanceEvents={maintenanceEvents}
                properties={properties}
                units={units}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/documents"
            element={
              <DocumentsScreen
                documents={documents}
                properties={properties}
                tenants={tenants}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/financials"
            element={
              <FinancialDashboardScreen
                properties={properties}
                units={units}
                tenancies={tenancies}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                expenses={expenses}
              />
            }
          />
          <Route
            path="/reports"
            element={<ReportsAndExportsScreen onNotify={handleNotify} />}
          />
          <Route
            path="/settings"
            element={
              <SettingsAndAccessScreen
                settings={settings}
                syncOperations={syncOperations}
                auditEvents={auditEvents}
                onNotify={handleNotify}
              />
            }
          />
          <Route
            path="/backup"
            element={<BackupAndRestoreScreen settings={settings} onNotify={handleNotify} />}
          />
          <Route
            path="/language"
            element={<LanguageScreen onNotify={handleNotify} />}
          />
          <Route
            path="/subscription"
            element={<SubscriptionAndBillingScreen onNotify={handleNotify} />}
          />
          <Route
            path="/help"
            element={<HelpAndSupportScreen />}
          />
          <Route
            path="/tenant-portal"
            element={
              <TenantPortalScreen
                settings={settings}
                tenants={tenants}
                tenancies={tenancies}
                units={units}
                properties={properties}
                charges={charges}
                payments={payments}
                adjustments={adjustments}
                deposits={deposits}
                receipts={receipts}
                maintenanceTickets={maintenanceTickets}
                messageLogs={messageLogs}
                onNotify={handleNotify}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <QuickAddModal
          isOpen={quickAddOpen}
          initialTab={quickAddTab}
          onClose={() => setQuickAddOpen(false)}
          properties={properties}
          units={units}
          tenants={tenants}
          tenancies={tenancies}
          charges={charges}
          maintenanceTickets={maintenanceTickets}
          activeRole={settings?.activeRole || 'owner'}
          onSuccess={handleNotify}
        />

        <AkaraiKeyboard onNotify={handleNotify} />
      </AppShell>
    </BrowserRouter>
  );
}
