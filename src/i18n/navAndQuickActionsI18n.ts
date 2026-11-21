import type { SupportedLanguageCode } from './translations';

export interface SidebarNavigationStrings {
  groups: {
    overview: string;
    propertyManagement: string;
    finance: string;
    communication: string;
    documentsData: string;
    accountSupport: string;
  };
  items: {
    dashboardHome: string;
    financialDashboard: string;
    reportsExports: string;
    propertiesUnits: string;
    tenants: string;
    tenanciesLeases: string;
    maintenanceBoard: string;
    rentLedger: string;
    paymentsReceipts: string;
    statements: string;
    deposits: string;
    communicationCenter: string;
    remindersNotices: string;
    documents: string;
    backupRestore: string;
    tenantPortalView: string;
    subscriptionBilling: string;
    settingsAppearance: string;
    languagePreferences: string;
    welcomeGuide: string;
    helpSupport: string;
    signInRoleState: string;
  };
  aria: {
    toggleGroup: string;
    currentScreenBadge: string;
    navigationDrawerLabel: string;
  };
}

export interface ContextualQuickActionStrings {
  menus: {
    homeTitle: string;
    homeSubtitle: string;
    propertiesTitle: string;
    propertiesSubtitle: string;
    tenantsTitle: string;
    tenantsSubtitle: string;
    paymentsTitle: string;
    paymentsSubtitle: string;
    maintenanceTitle: string;
    maintenanceSubtitle: string;
    generalTitle: string;
    generalSubtitle: string;
  };
  actions: {
    addPropertyTitle: string;
    addPropertySub: string;
    addUnitTitle: string;
    addUnitSub: string;
    assignTenantUnitTitle: string;
    assignTenantUnitSub: string;
    viewPropertyRecordsTitle: string;
    viewPropertyRecordsSub: string;
    addTenantTitle: string;
    addTenantSub: string;
    createTenancyTitle: string;
    createTenancySub: string;
    recordTenantPaymentTitle: string;
    recordTenantPaymentSub: string;
    sendReminderTitle: string;
    sendReminderSub: string;
    viewTenantLedgerTitle: string;
    viewTenantLedgerSub: string;
    recordPaymentTitle: string;
    recordPaymentSub: string;
    issueReceiptTitle: string;
    issueReceiptSub: string;
    viewOutstandingRentTitle: string;
    viewOutstandingRentSub: string;
    viewStatementsTitle: string;
    viewStatementsSub: string;
    exportPaymentRecordsTitle: string;
    exportPaymentRecordsSub: string;
    createMaintenanceTitle: string;
    createMaintenanceSub: string;
    addExpenseTitle: string;
    addExpenseSub: string;
  };
  context: {
    activeContextPrefix: string;
    selectPropertyPrompt: string;
    selectUnitPrompt: string;
    selectTenantPrompt: string;
    selectTenancyPrompt: string;
    optionalUnitNone: string;
    confirmPropertyRequired: string;
    confirmUnitAndTenantRequired: string;
    confirmTenantRequired: string;
    confirmTenancyRequired: string;
    depositsFilterBannerTitle: string;
    depositsFilterBannerSub: string;
    showAllLedgerBtn: string;
  };
}

export const SIDEBAR_NAV_TRANSLATIONS: Record<
  SupportedLanguageCode,
  SidebarNavigationStrings
> = {
  en: {
    groups: {
      overview: 'Overview',
      propertyManagement: 'Property Management',
      finance: 'Finance',
      communication: 'Communication',
      documentsData: 'Documents & Data',
      accountSupport: 'Account & Support',
    },
    items: {
      dashboardHome: 'Dashboard / Home',
      financialDashboard: 'Financial Dashboard',
      reportsExports: 'Reports & Exports',
      propertiesUnits: 'Properties & Units',
      tenants: 'Tenants',
      tenanciesLeases: 'Tenancies & Leases',
      maintenanceBoard: 'Maintenance Board',
      rentLedger: 'Rent Ledger',
      paymentsReceipts: 'Payments & Receipts',
      statements: 'Statements',
      deposits: 'Deposits',
      communicationCenter: 'Communication Center',
      remindersNotices: 'Reminders & Notices',
      documents: 'Documents',
      backupRestore: 'Backup & Restore',
      tenantPortalView: 'Tenant Portal View',
      subscriptionBilling: 'Subscription & Billing',
      settingsAppearance: 'Settings & Appearance',
      languagePreferences: 'Language Preferences',
      welcomeGuide: 'Welcome & Guide',
      helpSupport: 'Help & Support',
      signInRoleState: 'Sign-In & Role State',
    },
    aria: {
      toggleGroup: 'Toggle navigation category',
      currentScreenBadge: 'Active',
      navigationDrawerLabel: 'Main application navigation drawer',
    },
  },
  am: {
    groups: {
      overview: 'አጠቃላይ እይታ',
      propertyManagement: 'የንብረት አስተዳደር',
      finance: 'ፋይናንስ እና ሂሳብ',
      communication: 'ግንኙነት እና ማስታወቂያ',
      documentsData: 'ሰነዶች እና መረጃ',
      accountSupport: 'መለያ እና ድጋፍ',
    },
    items: {
      dashboardHome: 'ዳሽቦርድ / መነሻ',
      financialDashboard: 'የፋይናንስ ዳሽቦርድ',
      reportsExports: 'ሪፖርቶች እና ኤክስፖርት',
      propertiesUnits: 'ንብረቶች እና ክፍሎች',
      tenants: 'ተከራዮች',
      tenanciesLeases: 'የኪራይ ውሎች እና ስምምነቶች',
      maintenanceBoard: 'የጥገና ሰሌዳ',
      rentLedger: 'የኪራይ መዝገብ',
      paymentsReceipts: 'ክፍያዎች እና ደረሰኞች',
      statements: 'የሂሳብ መግለጫዎች',
      deposits: 'ተቀማጭ ገንዘቦች (Deposits)',
      communicationCenter: 'የመልዕክት ማዕከል',
      remindersNotices: 'ማስታወሻዎች እና ማስታወቂያዎች',
      documents: 'ሰነዶች',
      backupRestore: 'ምትኬ እና መልሶ ማግኛ',
      tenantPortalView: 'የተከራይ ፖርታል እይታ',
      subscriptionBilling: 'ምዝገባ እና ክፍያ',
      settingsAppearance: 'ቅንብሮች እና ገጽታ',
      languagePreferences: 'የቋንቋ ምርጫዎች',
      welcomeGuide: 'እንኳን ደህና መጡ እና መመሪያ',
      helpSupport: 'እገዛ እና ድጋፍ',
      signInRoleState: 'የመግቢያ እና የሚና ሁኔታ',
    },
    aria: {
      toggleGroup: 'የአሰሳ ምድብ ክፈት ወይም ዝጋ',
      currentScreenBadge: 'ንቁ',
      navigationDrawerLabel: 'ዋና የመተግበሪያ አሰሳ ምናሌ',
    },
  },
  ti: {
    groups: {
      overview: 'ሓፈሻዊ ትዕዝብቲ',
      propertyManagement: 'ምሕደራ ንብረት',
      finance: 'ፋይናንስን ሒሳብን',
      communication: 'ርክብን ምልክታን',
      documentsData: 'ሰነዳትን ዳታን',
      accountSupport: 'ሕሳብን ደገፍን',
    },
    items: {
      dashboardHome: 'ዳሽቦርድ / መበገሲ',
      financialDashboard: 'ዳሽቦርድ ፋይናንስ',
      reportsExports: 'ጸብጻባትን ሰደድን',
      propertiesUnits: 'ንብረታትን ክፍልታትን',
      tenants: 'ተኻረይቲ',
      tenanciesLeases: 'ውዕላትን ስምምዓትን ክራይ',
      maintenanceBoard: 'ሰሌዳ ጽገና',
      rentLedger: 'መዝገብ ክራይ',
      paymentsReceipts: 'ክፍሊታትን ደረሰኛታትን',
      statements: 'መግለጺታት ሒሳብ',
      deposits: 'ትሕጃታት (Deposits)',
      communicationCenter: 'ማእከል ርክብ',
      remindersNotices: 'መዘኻኸሪታትን ምልክታታትን',
      documents: 'ሰነዳት',
      backupRestore: 'ቅዳሕን ምምላስን',
      tenantPortalView: 'ገጽ ተኻራዪ (Portal)',
      subscriptionBilling: 'ምዝገባን ክፍሊትን',
      settingsAppearance: 'ቅጥዕታትን ትርኢትን',
      languagePreferences: 'ምርጫታት ቋንቋ',
      welcomeGuide: 'እንቋዕ ብደሓን መጻእኩምን መምርሒን',
      helpSupport: 'ሓገዝን ደገፍን',
      signInRoleState: 'ኩነታት መእተውን ተራን',
    },
    aria: {
      toggleGroup: 'ምድብ ኣሰሳ ክፈት ወይ ዕጸው',
      currentScreenBadge: 'ንጡፍ',
      navigationDrawerLabel: 'ቀንዲ መምርሒ ዝርዝር መተግበሪ',
    },
  },
  om: {
    groups: {
      overview: 'Cuunfaa Waliigalaa',
      propertyManagement: 'Bulchiinsa Qabeenyaa',
      finance: 'Faayinaansii fi Herrega',
      communication: 'Qunnamtii fi Beeksisa',
      documentsData: 'Sanadootaa fi Deetaa',
      accountSupport: 'Herrega fi Deeggarsa',
    },
    items: {
      dashboardHome: 'Daashboordii / Mana',
      financialDashboard: 'Daashboordii Faayinaansii',
      reportsExports: 'Gabaasaa fi Ergaa Alaa',
      propertiesUnits: 'Qabeenyaa fi Kutaalee',
      tenants: 'Kireeffattoota',
      tenanciesLeases: 'Waliigalteewwan Kiraa',
      maintenanceBoard: 'Gabatee Suphaa',
      rentLedger: 'Galmee Herrega Kiraa',
      paymentsReceipts: 'Kaffaltii fi Nagaheewwan',
      statements: 'Ibsa Herregaa',
      deposits: 'Qabdiiwwan (Deposits)',
      communicationCenter: 'Giddugala Qunnamtii',
      remindersNotices: 'Yaadachiisaa fi Beeksisa',
      documents: 'Sanadoota',
      backupRestore: 'Kuusaa fi Deebisuu',
      tenantPortalView: 'Fuula Kireeffataa',
      subscriptionBilling: 'Maamilummaa fi Kaffaltii',
      settingsAppearance: 'Qindaa’inaa fi Bifa',
      languagePreferences: 'Filannoo Afaanii',
      welcomeGuide: 'Baga Nagaan Dhuftan & Qajeelfama',
      helpSupport: 'Gargaarsa fi Deeggarsa',
      signInRoleState: 'Haala Seensaa fi Gahee',
    },
    aria: {
      toggleGroup: 'Ramaddii baafataa bani ykn cufi',
      currentScreenBadge: 'Ammaa',
      navigationDrawerLabel: 'Baafata guddaa appii',
    },
  },
  ktb: {
    groups: {
      overview: 'Woliigala La’ishsha',
      propertyManagement: 'Qabeenna Gashshimmata',
      finance: 'Miila & Herrega',
      communication: 'Xaadooshshanna Beeksishsha',
      documentsData: 'Sanaduwwanna Deeta',
      accountSupport: 'Herrega & Deeggarsa',
    },
    items: {
      dashboardHome: 'Daashboordii / Mine',
      financialDashboard: 'Miila Daashboordii',
      reportsExports: 'Gabaasanna Soyishsha',
      propertiesUnits: 'Qabeennanna Kifiluwwa',
      tenants: 'Kirayitoota',
      tenanciesLeases: 'Kiray Woliigaltinuwwa',
      maintenanceBoard: 'Suupha Gabatee',
      rentLedger: 'Kiray Herrega Borossa',
      paymentsReceipts: 'Baxxanchuwwanna Nagaheewwa',
      statements: 'Herrega Xawishsha',
      deposits: 'Qabdiiwwa (Deposits)',
      communicationCenter: 'Xaadooshshi Mereero',
      remindersNotices: 'Qaaggishshanna Beeksishsha',
      documents: 'Sanaduwwa',
      backupRestore: 'Maaxanna Galchishsha',
      tenantPortalView: 'Kirayita Fuula',
      subscriptionBilling: 'Karooranna Baxxancha',
      settingsAppearance: 'Qixxaawo & Leellishsha',
      languagePreferences: 'Afoo Doorishsha',
      welcomeGuide: 'Keerihu Waal & Kaa’lishsha',
      helpSupport: 'Kaa’lonna Deeggarsa',
      signInRoleState: 'Eebba & Gahee Duuha',
    },
    aria: {
      toggleGroup: 'Baafata gosa fani woy cufi',
      currentScreenBadge: 'Xa',
      navigationDrawerLabel: 'Woliigala appii baafata',
    },
  },
  hdy: {
    groups: {
      overview: 'Woliigala Moo’ishsha',
      propertyManagement: 'Qabeenna Gashshimmata',
      finance: 'Miila & Herrega',
      communication: 'Xaadooshshanna Beeksishsha',
      documentsData: 'Sanaduwwanna Deeta',
      accountSupport: 'Herrega & Deeggarsa',
    },
    items: {
      dashboardHome: 'Daashboordii / Mine',
      financialDashboard: 'Miila Daashboordii',
      reportsExports: 'Gabaasanna Soyishsha',
      propertiesUnits: 'Qabeennanna Kifiluwwa',
      tenants: 'Kiraayitoota',
      tenanciesLeases: 'Kiraay Woliigaltinuwwa',
      maintenanceBoard: 'Suupha Gabatee',
      rentLedger: 'Kiraay Herrega Kitaba',
      paymentsReceipts: 'Baxxanchuwwanna Nagaheewwa',
      statements: 'Herrega Caakkishsha',
      deposits: 'Qabdiiwwa (Deposits)',
      communicationCenter: 'Xaadooshshi Mereero',
      remindersNotices: 'Qaaggishshanna Beeksishsha',
      documents: 'Sanaduwwa',
      backupRestore: 'Maaxanna Galchishsha',
      tenantPortalView: 'Kiraayita Fuula',
      subscriptionBilling: 'Karooranna Baxxancha',
      settingsAppearance: 'Qixxaawo & Leellishsha',
      languagePreferences: 'Afoo Doorishsha',
      welcomeGuide: 'Keerihu Waar & Kaa’lishsha',
      helpSupport: 'Kaa’lonna Deeggarsa',
      signInRoleState: 'Eebba & Gahee Duuha',
    },
    aria: {
      toggleGroup: 'Baafata gosa fani woy cufi',
      currentScreenBadge: 'Kaba',
      navigationDrawerLabel: 'Woliigala appii baafata',
    },
  },
};

export const CONTEXTUAL_QUICK_ACTION_TRANSLATIONS: Record<
  SupportedLanguageCode,
  ContextualQuickActionStrings
> = {
  en: {
    menus: {
      homeTitle: 'Quick Actions (Home)',
      homeSubtitle: 'Create properties, tenants, rent payments or maintenance requests.',
      propertiesTitle: 'Quick Actions (Properties)',
      propertiesSubtitle: 'Add properties, units, assign tenants or inspect records.',
      tenantsTitle: 'Quick Actions (Tenants)',
      tenantsSubtitle: 'Add tenants, create leases, record payments or send reminders.',
      paymentsTitle: 'Quick Actions (Payments)',
      paymentsSubtitle: 'Record, manage and follow up on rent payments.',
      maintenanceTitle: 'Quick Actions (Maintenance)',
      maintenanceSubtitle: 'Log repair tickets, property expenses or tenant notices.',
      generalTitle: 'Quick Actions',
      generalSubtitle: 'Manage your properties, tenants and operations.',
    },
    actions: {
      addPropertyTitle: 'Add Property',
      addPropertySub: 'Create a new property or building',
      addUnitTitle: 'Add Unit',
      addUnitSub: 'Add a rentable flat, room, shop or bay',
      assignTenantUnitTitle: 'Assign Tenant to Unit',
      assignTenantUnitSub: 'Link a tenant to a unit with lease terms',
      viewPropertyRecordsTitle: 'View Property Records',
      viewPropertyRecordsSub: 'Open property documents, leases and inspection records',
      addTenantTitle: 'Add Tenant',
      addTenantSub: 'Register a new tenant profile and contact details',
      createTenancyTitle: 'Create Tenancy / Lease',
      createTenancySub: 'Set up monthly rent, deposit liability and due day',
      recordTenantPaymentTitle: 'Record Tenant Payment',
      recordTenantPaymentSub: 'Log cash, EFT or ATM rent received for a tenant',
      sendReminderTitle: 'Send Reminder',
      sendReminderSub: 'Remind a tenant about an upcoming or overdue balance',
      viewTenantLedgerTitle: 'View Tenant Ledger',
      viewTenantLedgerSub: 'Inspect charges, FIFO allocations and running balance',
      recordPaymentTitle: 'Record Payment',
      recordPaymentSub: 'Log a rent payment (cash, EFT or card)',
      issueReceiptTitle: 'Issue Receipt',
      issueReceiptSub: 'Generate and share an official numbered rent receipt',
      viewOutstandingRentTitle: 'View Outstanding Rent',
      viewOutstandingRentSub: 'Review overdue rent balances and arrears',
      viewStatementsTitle: 'View Statements',
      viewStatementsSub: 'Download or share official rent statements and receipts',
      exportPaymentRecordsTitle: 'Export Payment Records',
      exportPaymentRecordsSub: 'Download CSV payment and ledger spreadsheets',
      createMaintenanceTitle: 'Create Maintenance Request',
      createMaintenanceSub: 'Log and track a unit or property repair request',
      addExpenseTitle: 'Add Expense',
      addExpenseSub: 'Record a property expense (maintenance, utilities, rates)',
    },
    context: {
      activeContextPrefix: 'Context',
      selectPropertyPrompt: '— Select a property to confirm —',
      selectUnitPrompt: '— Select a unit to confirm —',
      selectTenantPrompt: '— Select a tenant to confirm —',
      selectTenancyPrompt: '— Select a tenancy / unit to confirm —',
      optionalUnitNone: 'General Property / Common Area',
      confirmPropertyRequired: 'Please select a specific property to continue.',
      confirmUnitAndTenantRequired: 'Please select both a specific unit and a tenant to confirm.',
      confirmTenantRequired: 'Please select a specific tenant to continue.',
      confirmTenancyRequired: 'Please select a specific tenancy to record this payment.',
      depositsFilterBannerTitle: 'Security Deposits Held (Liability Account View)',
      depositsFilterBannerSub:
        'Deposits are tracked separately per tenancy below and excluded from rental operating revenue.',
      showAllLedgerBtn: 'Standard View',
    },
  },
  am: {
    menus: {
      homeTitle: 'ፈጣን እርምጃዎች (መነሻ)',
      homeSubtitle: 'ንብረቶችን፣ ተከራዮችን፣ የኪራይ ክፍያዎችን ወይም የጥገና ጥያቄዎችን ይፍጠሩ።',
      propertiesTitle: 'ፈጣን እርምጃዎች (ንብረቶች)',
      propertiesSubtitle: 'ንብረቶችን እና ክፍሎችን ይጨምሩ፣ ተከራይ ይመድቡ ወይም መዝገቦችን ይመልከቱ።',
      tenantsTitle: 'ፈጣን እርምጃዎች (ተከራዮች)',
      tenantsSubtitle: 'ተከራዮችን ይጨምሩ፣ ውል ይፍጠሩ፣ ክፍያ ይመዝግቡ ወይም ማስታወሻ ይላኩ።',
      paymentsTitle: 'ፈጣን እርምጃዎች (ክፍያዎች)',
      paymentsSubtitle: 'የኪራይ ክፍያዎችን ይመዝግቡ፣ ያስተዳድሩ እና ይከታተሉ።',
      maintenanceTitle: 'ፈጣን እርምጃዎች (ጥገና)',
      maintenanceSubtitle: 'የጥገና ጥያቄዎችን፣ የንብረት ወጪዎችን ወይም ማስታወቂያዎችን ይመዝግቡ።',
      generalTitle: 'ፈጣን እርምጃዎች',
      generalSubtitle: 'ንብረቶችዎን፣ ተከራዮችዎን እና ስራዎችዎን ያስተዳድሩ።',
    },
    actions: {
      addPropertyTitle: 'ንብረት ጨምር',
      addPropertySub: 'አዲስ ንብረት ወይም ሕንፃ ይፍጠሩ',
      addUnitTitle: 'ክፍል ጨምር',
      addUnitSub: 'የሚከራይ አፓርታማ፣ ክፍል፣ ሱቅ ወይም ማቆሚያ ያክሉ',
      assignTenantUnitTitle: 'ተከራይ ለክፍል መድብ',
      assignTenantUnitSub: 'ተከራይን ከክፍል እና ከኪራይ ውል ጋር ያገናኙ',
      viewPropertyRecordsTitle: 'የንብረት መዝገቦችን ይመልከቱ',
      viewPropertyRecordsSub: 'የንብረት ሰነዶችን፣ ውሎችን እና የፍተሻ መዝገቦችን ይክፈቱ',
      addTenantTitle: 'ተከራይ ጨምር',
      addTenantSub: 'አዲስ የተከራይ መገለጫ እና ስልክ ይመዝግቡ',
      createTenancyTitle: 'የኪራይ ውል ፍጠር',
      createTenancySub: 'ወርሃዊ ኪራይ፣ ተቀማጭ ገንዘብ እና የክፍያ ቀን ያዘጋጁ',
      recordTenantPaymentTitle: 'የተከራይ ክፍያ መዝግብ',
      recordTenantPaymentSub: 'ከተከራይ የተቀበሉትን የጥሬ ገንዘብ ወይም የEFT ክፍያ ይመዝግቡ',
      sendReminderTitle: 'ማስታወሻ ላክ',
      sendReminderSub: 'ስለሚመጣው ወይም ስላለፈበት ቀሪ ሂሳብ ለተከራዩ ያስታውሱ',
      viewTenantLedgerTitle: 'የተከራይ መዝገብ ይመልከቱ',
      viewTenantLedgerSub: 'ክፍያዎችን፣ ቅናሾችን እና የተጣራ ቀሪ ሂሳብን ይመልከቱ',
      recordPaymentTitle: 'ክፍያ መዝግብ',
      recordPaymentSub: 'የኪራይ ክፍያ ይመዝግቡ (ጥሬ ገንዘብ፣ EFT ወይም ካርድ)',
      issueReceiptTitle: 'ደረሰኝ አውጣ',
      issueReceiptSub: 'ኦፊሴላዊ ቁጥር ያለው የኪራይ ደረሰኝ ያዘጋጁ እና ያጋሩ',
      viewOutstandingRentTitle: 'ያልተከፈለ ውዝፍ ኪራይ ይመልከቱ',
      viewOutstandingRentSub: 'ያለፈባቸውን የኪራይ እዳዎች እና ቀሪ ሂሳቦች ይገምግሙ',
      viewStatementsTitle: 'መግለጫዎችን ይመልከቱ',
      viewStatementsSub: 'ኦፊሴላዊ የኪራይ መግለጫዎችን እና ደረሰኞችን ያውርዱ ወይም ያጋሩ',
      exportPaymentRecordsTitle: 'የክፍያ መዝገቦችን ኤክስፖርት አድርግ',
      exportPaymentRecordsSub: 'የክፍያ እና የመዝገብ CSV ሰንጠረዦችን ያውርዱ',
      createMaintenanceTitle: 'የጥገና ጥያቄ ፍጠር',
      createMaintenanceSub: 'የክፍል ወይም የንብረት የጥገና ጥያቄ ይመዝግቡ እና ይከታተሉ',
      addExpenseTitle: 'ወጪ ጨምር',
      addExpenseSub: 'የንብረት ወጪ ይመዝግቡ (ጥገና፣ ውሃና መብራት፣ ግብር)',
    },
    context: {
      activeContextPrefix: 'አውድ',
      selectPropertyPrompt: '— ለማረጋገጥ ንብረት ይምረጡ —',
      selectUnitPrompt: '— ለማረጋገጥ ክፍል ይምረጡ —',
      selectTenantPrompt: '— ለማረጋገጥ ተከራይ ይምረጡ —',
      selectTenancyPrompt: '— ለማረጋገጥ የኪራይ ውል / ክፍል ይምረጡ —',
      optionalUnitNone: 'አጠቃላይ ንብረት / የጋራ ቦታ',
      confirmPropertyRequired: 'እባክዎ ለመቀጠል የተወሰነ ንብረት ይምረጡ።',
      confirmUnitAndTenantRequired: 'እባክዎ ለማረጋገጥ ክፍሉንም ተከራዩንም ይምረጡ።',
      confirmTenantRequired: 'እባክዎ ለመቀጠል የተወሰነ ተከራይ ይምረጡ።',
      confirmTenancyRequired: 'ይህንን ክፍያ ለመመዝገብ እባክዎ የኪራይ ውሉን ይምረጡ።',
      depositsFilterBannerTitle: 'የተያዙ የተቀማጭ ገንዘቦች ( የተጠያቂነት ሂሳብ እይታ)',
      depositsFilterBannerSub: 'ተቀማጭ ገንዘቦች በእያንዳንዱ ውል ስር ለብቻቸው የሚያዙ ሲሆን ከኪራይ ገቢ ጋር አይደመሩም።',
      showAllLedgerBtn: 'መደበኛ እይታ',
    },
  },
  ti: {
    menus: {
      homeTitle: 'ቅልጡፍ ስጉምትታት (መበገሲ)',
      homeSubtitle: 'ንብረታት፣ ተኻረይቲ፣ ክፍሊታት ክራይ ወይ ሕቶታት ጽገና ፍጠሩ።',
      propertiesTitle: 'ቅልጡፍ ስጉምትታት (ንብረታት)',
      propertiesSubtitle: 'ንብረታትን ክፍልታትን ወስኹ፣ ተኻራዪ መድቡ ወይ መዛግብቲ ርኣዩ።',
      tenantsTitle: 'ቅልጡፍ ስጉምትታት (ተኻረይቲ)',
      tenantsSubtitle: 'ተኻረይቲ ወስኹ፣ ውዕል ፍጠሩ፣ ክፍሊት መዝግቡ ወይ መዘኻኸሪ ስደዱ።',
      paymentsTitle: 'ቅልጡፍ ስጉምትታት (ክፍሊታት)',
      paymentsSubtitle: 'ክፍሊታት ክራይ መዝግቡ፣ ኣመሓድሩን ተኸታተሉን።',
      maintenanceTitle: 'ቅልጡፍ ስጉምትታት (ጽገና)',
      maintenanceSubtitle: 'ሕቶታት ጽገና፣ ወጻኢታት ንብረት ወይ ምልክታታት መዝግቡ።',
      generalTitle: 'ቅልጡፍ ስጉምትታት',
      generalSubtitle: 'ንብረታትኩም፣ ተኻረይትኹምን ስርሒታትኩምን ኣመሓድሩ።',
    },
    actions: {
      addPropertyTitle: 'ንብረት ወስኽ',
      addPropertySub: 'ሓድሽ ንብረት ወይ ህንፃ ፍጠር',
      addUnitTitle: 'ክፍሊ ወስኽ',
      addUnitSub: 'ዝካረ ኣፓርታማ፣ ክፍሊ፣ ዱካን ወይ መዕሸጊ ወስኽ',
      assignTenantUnitTitle: 'ተኻራዪ ንክፍሊ መድብ',
      assignTenantUnitSub: 'ተኻራዪ ምስ ክፍልን ውዕል ክራይን ኣተሓሕዝ',
      viewPropertyRecordsTitle: 'መዛግብቲ ንብረት ርኣይ',
      viewPropertyRecordsSub: 'ሰነዳት ንብረት፣ ውዕላትን መዛግብቲ ተፍቲሽን ክፈት',
      addTenantTitle: 'ተኻራዪ ወስኽ',
      addTenantSub: 'ሓድሽ ፕሮፋይል ተኻራዪን ስልክን መዝግብ',
      createTenancyTitle: 'ውዕል ክራይ ፍጠር',
      createTenancySub: 'ወርሓዊ ክራይ፣ ዕዳ ትሕጃን መዓልቲ ክፍሊትን ኣዳሉ',
      recordTenantPaymentTitle: 'ክፍሊት ተኻራዪ መዝግብ',
      recordTenantPaymentSub: 'ካብ ተኻራዪ ዝተቐበልኩሞ ጥረ ገንዘብ ወይ EFT መዝግቡ',
      sendReminderTitle: 'መዘኻኸሪ ስደድ',
      sendReminderSub: 'ብዛዕባ ዝመጽእ ወይ ዝሓለፎ ዕዳ ንተኻራዪ ኣዘኻኽር',
      viewTenantLedgerTitle: 'መዝገብ ተኻራዪ ርኣይ',
      viewTenantLedgerSub: 'ክፍሊታት፣ ምንካያትን ዝተረፈ ሒሳብን ተመልከት',
      recordPaymentTitle: 'ክፍሊት መዝግብ',
      recordPaymentSub: 'ክፍሊት ክራይ መዝግብ (ጥረ ገንዘብ፣ EFT ወይ ካርድ)',
      issueReceiptTitle: 'ደረሰኝ ኣውጽእ',
      issueReceiptSub: 'ወግዓዊ ቁጽሪ ዘለዎ ደረሰኝ ክራይ ኣዳሉን ኣካፍልን',
      viewOutstandingRentTitle: 'ዘይተኸፍለ ዕዳ ክራይ ርኣይ',
      viewOutstandingRentSub: 'ዝሓለፎም ክፍሊታት ክራይን ዝተረፈ ዕዳን ተመልከት',
      viewStatementsTitle: 'መግለጺታት ርኣይ',
      viewStatementsSub: 'ወግዓዊ መግለጺታት ክራይን ደረሰኛታትን ኣውርድ ወይ ኣካፍል',
      exportPaymentRecordsTitle: 'መዛግብቲ ክፍሊት ሰደድ (Export)',
      exportPaymentRecordsSub: 'ናይ ክፍሊትን መዝገብን CSV ፋይላት ኣውርድ',
      createMaintenanceTitle: 'ሕቶ ጽገና ፍጠር',
      createMaintenanceSub: 'ናይ ክፍሊ ወይ ንብረት ሕቶ ጽገና መዝግብን ተኸታተልን',
      addExpenseTitle: 'ወጻኢ ወስኽ',
      addExpenseSub: 'ወጻኢ ንብረት መዝግብ (ጽገና፣ ማይን መብራህትን፣ ግብሪ)',
    },
    context: {
      activeContextPrefix: 'ዓውዲ',
      selectPropertyPrompt: '— ንምርግጋጽ ንብረት ምረጹ —',
      selectUnitPrompt: '— ንምርግጋጽ ክፍሊ ምረጹ —',
      selectTenantPrompt: '— ንምርግጋጽ ተኻራዪ ምረጹ —',
      selectTenancyPrompt: '— ንምርግጋጽ ውዕል ክራይ / ክፍሊ ምረጹ —',
      optionalUnitNone: 'ሓፈሻዊ ንብረት / ናይ ሓባር ቦታ',
      confirmPropertyRequired: 'ንምቕጻል በጃኹም ንብረት ምረጹ።',
      confirmUnitAndTenantRequired: 'ንምርግጋጽ በጃኹም ክፍልን ተኻራዪን ምረጹ።',
      confirmTenantRequired: 'ንምቕጻል በጃኹም ተኻራዪ ምረጹ።',
      confirmTenancyRequired: 'ነዚ ክፍሊት ንምምዝጋብ በጃኹም ውዕል ክራይ ምረጹ።',
      depositsFilterBannerTitle: 'ዝተታሕዘ ትሕጃታት (ርእይቶ ሕሳብ ዕዳ)',
      depositsFilterBannerSub: 'ትሕጃታት ኣብ ትሕቲ ነፍሲ ወከፍ ውዕል ተፈልዮም ይተሓዙን ካብ ኣታዊ ክራይ ወጻኢ እዮምን።',
      showAllLedgerBtn: 'መደበኛ ርእይቶ',
    },
  },
  om: {
    menus: {
      homeTitle: 'Tarkaanfiiwwan Ariifachiisaa (Mana)',
      homeSubtitle: 'Qabeenya, kireeffattoota, kaffaltii kiraa ykn gaaffii suphaa uumi.',
      propertiesTitle: 'Tarkaanfiiwwan Ariifachiisaa (Qabeenya)',
      propertiesSubtitle: 'Qabeenyaa fi kutaalee dabali, kireeffataa ramadi ykn galmeewwan ilaali.',
      tenantsTitle: 'Tarkaanfiiwwan Ariifachiisaa (Kireeffattoota)',
      tenantsSubtitle: 'Kireeffataa dabali, waliigaltee uumi, kaffaltii galmeessi ykn yaadachiisa ergi.',
      paymentsTitle: 'Tarkaanfiiwwan Ariifachiisaa (Kaffaltii)',
      paymentsSubtitle: 'Kaffaltii kiraa galmeessi, bulchi, hordofi.',
      maintenanceTitle: 'Tarkaanfiiwwan Ariifachiisaa (Suphaa)',
      maintenanceSubtitle: 'Gaaffii suphaa, baasii qabeenyaa ykn beeksisa galmeessi.',
      generalTitle: 'Tarkaanfiiwwan Ariifachiisaa',
      generalSubtitle: 'Qabeenya, kireeffattootaa fi kaffaltiiwwan keessan bulchaa.',
    },
    actions: {
      addPropertyTitle: 'Qabeenya Dabali',
      addPropertySub: 'Gamoo, mana ykn qabeenya haaraa uumi',
      addUnitTitle: 'Kutaa Dabali',
      addUnitSub: 'Kutaa, mana, suuqii ykn bakka konkolaataa kireeffamu dabali',
      assignTenantUnitTitle: 'Kireeffataa Kutaaf Ramadi',
      assignTenantUnitSub: 'Kireeffataa kutaa fi waliigaltee kiraa waliin walqabsiisi',
      viewPropertyRecordsTitle: 'Galmeewwan Qabeenyaa Ilaali',
      viewPropertyRecordsSub: 'Sanadoota qabeenyaa, waliigalteewwanii fi galmee sakattoo bani',
      addTenantTitle: 'Kireeffataa Dabali',
      addTenantSub: 'Piroofaayilii fi qunnamtii kireeffataa haaraa galmeessi',
      createTenancyTitle: 'Waliigaltee Kiraa Uumi',
      createTenancySub: 'Kiraa ji’aa, idaa qabdii fi guyyaa kaffaltii qopheessi',
      recordTenantPaymentTitle: 'Kaffaltii Kireeffataa Galmeessi',
      recordTenantPaymentSub: 'Kaffaltii callaa, EFT ykn ATM kireeffataarraa fudhatame galmeessi',
      sendReminderTitle: 'Yaadachiisa Ergi',
      sendReminderSub: 'Waa’ee kiraa dhufuu ykn yeroon darbee kireeffataa yaadachiisi',
      viewTenantLedgerTitle: 'Galmee Herrega Kireeffataa Ilaali',
      viewTenantLedgerSub: 'Kiraa gaafatame, kaffaltii fi haftee herregaa sakatta’i',
      recordPaymentTitle: 'Kaffaltii Galmeessi',
      recordPaymentSub: 'Kaffaltii kiraa galmeessi (callaa, EFT ykn kaardii)',
      issueReceiptTitle: 'Nagahee Kenni',
      issueReceiptSub: 'Nagahee kiraa lakkoofsa idilee qabu uumiitii qoodi',
      viewOutstandingRentTitle: 'Kiraa Hin Kaffalamin Ilaali',
      viewOutstandingRentSub: 'Haftee kiraa yeroon darbee fi idaa irra deebi’ii ilaali',
      viewStatementsTitle: 'Ibsa Herregaa Ilaali',
      viewStatementsSub: 'Ibsa herrega kiraa fi nagaheewwan PDF buufadhu ykn qoodi',
      exportPaymentRecordsTitle: 'Galmeewwan Kaffaltii Alatti Ergi (CSV)',
      exportPaymentRecordsSub: 'Gabateewwan CSV kaffaltii fi galmee herregaa buufadhu',
      createMaintenanceTitle: 'Gaaffii Suphaa Uumi',
      createMaintenanceSub: 'Gaaffii suphaa kutaa ykn qabeenyaa galmeessiitii hordofi',
      addExpenseTitle: 'Baasii Dabali',
      addExpenseSub: 'Baasii qabeenyaa galmeessi (suphaa, bishaan, ibsaa, gibira)',
    },
    context: {
      activeContextPrefix: 'Haala Ammaa',
      selectPropertyPrompt: '— Mirkaneessuuf qabeenya filadhu —',
      selectUnitPrompt: '— Mirkaneessuuf kutaa filadhu —',
      selectTenantPrompt: '— Mirkaneessuuf kireeffataa filadhu —',
      selectTenancyPrompt: '— Mirkaneessuuf waliigaltee / kutaa filadhu —',
      optionalUnitNone: 'Qabeenya Waliigalaa / Bakka Waliinii',
      confirmPropertyRequired: 'Itti fufuuf maaloo qabeenya addaa filadhu.',
      confirmUnitAndTenantRequired: 'Mirkaneessuuf maaloo kutaa fi kireeffataa lamaanuu filadhu.',
      confirmTenantRequired: 'Itti fufuuf maaloo kireeffataa filadhu.',
      confirmTenancyRequired: 'Kaffaltii kana galmeessuuf maaloo waliigaltee kiraa filadhu.',
      depositsFilterBannerTitle: 'Qabdiiwwan Qabaman (Ilaalcha Herrega Idaa)',
      depositsFilterBannerSub:
        'Qabdiiwwan tokkoon tokkoon waliigaltee jalatti addatti qabamu; galii kiraatti hin makaman.',
      showAllLedgerBtn: 'Ilaalcha Idilee',
    },
  },
  ktb: {
    menus: {
      homeTitle: 'Rahisa Taakkattuwwa (Mine)',
      homeSubtitle: 'Qabeenna, kirayitoota, kiray baxxancha woy suupha xa’mmo qixxeessi.',
      propertiesTitle: 'Rahisa Taakkattuwwa (Qabeenna)',
      propertiesSubtitle: 'Qabeennanna kifiluwwa leddi, kirayitaドアi woy borossuwwa la’i.',
      tenantsTitle: 'Rahisa Taakkattuwwa (Kirayitoota)',
      tenantsSubtitle: 'Kirayita leddi, woliigaltina qixxeessi, baxxancha borossi woy qaaggishsha soyi.',
      paymentsTitle: 'Rahisa Taakkattuwwa (Baxxancha)',
      paymentsSubtitle: 'Kiray baxxancha borossi, gashshi, hordofi.',
      maintenanceTitle: 'Rahisa Taakkattuwwa (Suupha)',
      maintenanceSubtitle: 'Suupha xa’mmo, qabeenni baasii woy beeksisa borossi.',
      generalTitle: 'Rahisa Taakkattuwwa',
      generalSubtitle: 'Qabeenna, kirayitootanna baxxanchuwwakki gashshi.',
    },
    actions: {
      addPropertyTitle: 'Qabeenna Leddi',
      addPropertySub: 'Haaro gamoo, mine woy qabeenna qixxeessi',
      addUnitTitle: 'Kifile Leddi',
      addUnitSub: 'Kirayitano kifile, mine, suuqii woy makiina uurrishsha leddi',
      assignTenantUnitTitle: 'Kirayita Kifileha Ramadi',
      assignTenantUnitSub: 'Kirayita kifilenna kiray woliigaltina ledo xaadishi',
      viewPropertyRecordsTitle: 'Qabeenni Borossuwwa La’i',
      viewPropertyRecordsSub: 'Qabeenni sanaduwwa, woliigaltinanna la’ishsha borossa fani',
      addTenantTitle: 'Kirayita Leddi',
      addTenantSub: 'Haaro kirayita piroofaayiliinna bilbila borossi',
      createTenancyTitle: 'Kiray Woliigaltina Qixxeessi',
      createTenancySub: 'Agani kiraa, qabdii idaanna baxxanchi barra qixxeessi',
      recordTenantPaymentTitle: 'Kirayita Baxxancha Borossi',
      recordTenantPaymentSub: 'Kirayita widoonni adhamee anga miila woy EFT borossi',
      sendReminderTitle: 'Qaaggishsha Soyi',
      sendReminderSub: 'Kirayitaha waalano woy woktii sa’ee kiraa qaaggishi',
      viewTenantLedgerTitle: 'Kirayita Herrega Borossa La’i',
      viewTenantLedgerSub: 'Xa’mmamee kiraa, baxxanchanna gattota la’i',
      recordPaymentTitle: 'Baxxancha Borossi',
      recordPaymentSub: 'Kiray baxxancha borossi (anga miila, EFT woy kaardii)',
      issueReceiptTitle: 'Nagahee Aassi',
      issueReceiptSub: 'Idilee xigo afidhu kiray nagahee qixxeessiitii beehi',
      viewOutstandingRentTitle: 'Baxxamubee Gattote Kiraa La’i',
      viewOutstandingRentSub: 'Woktii sa’ee kiraa gattotanna idaa la’i',
      viewStatementsTitle: 'Herrega Xawishsha La’i',
      viewStatementsSub: 'Idilee kiray herrega xawishshanna PDF nagahee dirisi',
      exportPaymentRecordsTitle: 'Baxxanchi Borossa Soyi (CSV)',
      exportPaymentRecordsSub: 'Baxxanchanna herrega borossa CSV dirisi',
      createMaintenanceTitle: 'Suupha Xa’mmo Qixxeessi',
      createMaintenanceSub: 'Kifile woy qabeenni suupha xa’mmo borossiitii hordofi',
      addExpenseTitle: 'Baasii Leddi',
      addExpenseSub: 'Qabeenni baasii borossi (suupha, wo’o, caakkii)',
    },
    context: {
      activeContextPrefix: 'Xa Duuha',
      selectPropertyPrompt: '— Tophphishshate qabeenna doori —',
      selectUnitPrompt: '— Tophphishshate kifile doori —',
      selectTenantPrompt: '— Tophphishshate kirayita doori —',
      selectTenancyPrompt: '— Tophphishshate woliigaltina / kifile doori —',
      optionalUnitNone: 'Woliigala Qabeenna / Woliin Baado',
      confirmPropertyRequired: 'Aaggate qabeenna doori.',
      confirmUnitAndTenantRequired: 'Tophphishshate kifilenna kirayita lamanka doori.',
      confirmTenantRequired: 'Aaggate kirayita doori.',
      confirmTenancyRequired: 'Kanne baxxancha borossate kiray woliigaltina doori.',
      depositsFilterBannerTitle: 'Amadamee Qabdiiwwa (Idaa Herrega La’ishsha)',
      depositsFilterBannerSub:
        'Qabdiiwwi kulli woliigaltina woroon baxxamee amadamano; kiray eoo giddo xigamobee.',
      showAllLedgerBtn: 'Idilee La’ishsha',
    },
  },
  hdy: {
    menus: {
      homeTitle: 'Rahisa Taakkattuwwa (Mine)',
      homeSubtitle: 'Qabeenna, kiraayitoota, kiraay baxxancha woy suupha xa’mmo qixxeessi.',
      propertiesTitle: 'Rahisa Taakkattuwwa (Qabeenna)',
      propertiesSubtitle: 'Qabeennanna kifiluwwa leddi, kiraayita ramadi woy kitabuwwa moo’i.',
      tenantsTitle: 'Rahisa Taakkattuwwa (Kiraayitoota)',
      tenantsSubtitle: 'Kiraayita leddi, woliigaltina qixxeessi, baxxancha kitabi woy qaaggishsha soyi.',
      paymentsTitle: 'Rahisa Taakkattuwwa (Baxxancha)',
      paymentsSubtitle: 'Kiraay baxxancha kitabi, gashshi, hordofi.',
      maintenanceTitle: 'Rahisa Taakkattuwwa (Suupha)',
      maintenanceSubtitle: 'Suupha xa’mmo, qabeenni baasii woy beeksisa kitabi.',
      generalTitle: 'Rahisa Taakkattuwwa',
      generalSubtitle: 'Qabeenna, kiraayitootanna baxxanchuwwakki gashshi.',
    },
    actions: {
      addPropertyTitle: 'Qabeenna Leddi',
      addPropertySub: 'Haareyya gamoo, mine woy qabeenna qixxeessi',
      addUnitTitle: 'Kifile Leddi',
      addUnitSub: 'Kiraayitano kifile, mine, suuqii woy makiina uurrishsha leddi',
      assignTenantUnitTitle: 'Kiraayita Kifileha Ramadi',
      assignTenantUnitSub: 'Kiraayita kifilenna kiraay woliigaltina ledo xaadishi',
      viewPropertyRecordsTitle: 'Qabeenni Kitabuwwa Moo’i',
      viewPropertyRecordsSub: 'Qabeenni sanaduwwa, woliigaltinanna moo’ishsha kitaba fani',
      addTenantTitle: 'Kiraayita Leddi',
      addTenantSub: 'Haareyya kiraayita piroofaayiliinna bilbila kitabi',
      createTenancyTitle: 'Kiraay Woliigaltina Qixxeessi',
      createTenancySub: 'Agani kiraa, qabdii idaanna baxxanchi balla qixxeessi',
      recordTenantPaymentTitle: 'Kiraayita Baxxancha Kitabi',
      recordTenantPaymentSub: 'Kiraayita widoonni adhamukko anga miila woy EFT kitabi',
      sendReminderTitle: 'Qaaggishsha Soyi',
      sendReminderSub: 'Kiraayitaha waarookko woy ammane sa’ukko kiraa qaaggishi',
      viewTenantLedgerTitle: 'Kiraayita Herrega Kitaba Moo’i',
      viewTenantLedgerSub: 'Xa’mmamukko kiraa, baxxanchanna gattota moo’i',
      recordPaymentTitle: 'Baxxancha Kitabi',
      recordPaymentSub: 'Kiraay baxxancha kitabi (anga miila, EFT woy kaardii)',
      issueReceiptTitle: 'Nagahee Uwwi',
      issueReceiptSub: 'Idilee xigo afidhu kiraay nagahee qixxeessiitii beehi',
      viewOutstandingRentTitle: 'Baxxamubee Gattote Kiraa Moo’i',
      viewOutstandingRentSub: 'Ammane sa’ukko kiraa gattotanna idaa moo’i',
      viewStatementsTitle: 'Herrega Caakkishsha Moo’i',
      viewStatementsSub: 'Idilee kiraay herrega caakkishshanna PDF nagahee dirisi',
      exportPaymentRecordsTitle: 'Baxxanchi Kitaba Soyi (CSV)',
      exportPaymentRecordsSub: 'Baxxanchanna herrega kitaba CSV dirisi',
      createMaintenanceTitle: 'Suupha Xa’mmo Qixxeessi',
      createMaintenanceSub: 'Kifile woy qabeenni suupha xa’mmo kitabiitii hordofi',
      addExpenseTitle: 'Baasii Leddi',
      addExpenseSub: 'Qabeenni baasii kitabi (suupha, wo’o, caakkii)',
    },
    context: {
      activeContextPrefix: 'Kaba Duuha',
      selectPropertyPrompt: '— Tophphishshate qabeenna doori —',
      selectUnitPrompt: '— Tophphishshate kifile doori —',
      selectTenantPrompt: '— Tophphishshate kiraayita doori —',
      selectTenancyPrompt: '— Tophphishshate woliigaltina / kifile doori —',
      optionalUnitNone: 'Woliigala Qabeenna / Woliin Baado',
      confirmPropertyRequired: 'Aaggate qabeenna doori.',
      confirmUnitAndTenantRequired: 'Tophphishshate kifilenna kiraayita lamanka doori.',
      confirmTenantRequired: 'Aaggate kiraayita doori.',
      confirmTenancyRequired: 'Kanne baxxancha kitabate kiraay woliigaltina doori.',
      depositsFilterBannerTitle: 'Amadamukko Qabdiiwwa (Idaa Herrega Moo’ishsha)',
      depositsFilterBannerSub:
        'Qabdiiwwi hundam woliigaltina woroon baxxamukko amadamookko; kiraay eoo giddo xigamoobee.',
      showAllLedgerBtn: 'Idilee Moo’ishsha',
    },
  },
};
