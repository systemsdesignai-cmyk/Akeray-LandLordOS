import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import {
  CONTEXTUAL_QUICK_ACTION_TRANSLATIONS,
  type ContextualQuickActionStrings,
  DICTIONARIES,
  type DeepTranslationDictionary,
  SIDEBAR_NAV_TRANSLATIONS,
  type SidebarNavigationStrings,
  TRANSLATION_COVERAGE_REPORT,
  tFormat,
} from '../i18n/translations';

export {
  TRANSLATION_COVERAGE_REPORT,
  tFormat,
  SIDEBAR_NAV_TRANSLATIONS,
  CONTEXTUAL_QUICK_ACTION_TRANSLATIONS,
};
export type {
  DeepTranslationDictionary,
  SidebarNavigationStrings,
  ContextualQuickActionStrings,
};

export type SupportedLanguageCode = 'en' | 'am' | 'ti' | 'om' | 'ktb' | 'hdy';

export interface LanguageUIStrings {
  greetingPrefix: string;
  homeSubtitle: string;
  overdueLabel: string;
  propertiesTitle: string;
  propertiesSubtitle: string;
  tenantsTitle: string;
  tenantsSubtitle: string;
  paymentsTitle: string;
  paymentsSubtitle: string;
  sidebar: {
    landlordAccount: string;
    viewManageProfile: string;
    operations: string;
    maintenance: string;
    noticesLetters: string;
    documents: string;
    reportsAnalytics: string;
    moreTools: string;
    accountSupport: string;
    subscriptionBilling: string;
    settings: string;
    language: string;
    helpSupport: string;
    logOut: string;
  };
}

export interface LanguageOption {
  code: SupportedLanguageCode;
  englishName: string;
  nativeName: string;
  shortBadge: string;
  script: 'Latin' | 'Ethiopic (Geʽez)';
  coverageStatus: 'Complete' | 'Complete (Technical Terms Flagged for Native Verification)';
  sampleGreeting: string;
  sampleRoleLabel: string;
  navLabels: {
    home: string;
    properties: string;
    tenants: string;
    payments: string;
  };
  uiStrings: LanguageUIStrings;
  t: DeepTranslationDictionary;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    shortBadge: 'EN',
    script: 'Latin',
    coverageStatus: 'Complete',
    sampleGreeting: 'Good evening, Abel',
    sampleRoleLabel: 'Property & Rent Management',
    navLabels: {
      home: 'Home',
      properties: 'Properties',
      tenants: 'Tenants',
      payments: 'Payments',
    },
    uiStrings: {
      greetingPrefix: 'Good evening,',
      homeSubtitle: "Here's your rental overview.",
      overdueLabel: 'Overdue',
      propertiesTitle: 'Properties',
      propertiesSubtitle: 'Manage your buildings, units and occupancy.',
      tenantsTitle: 'Tenants',
      tenantsSubtitle: 'Manage your tenants, leases and payments.',
      paymentsTitle: 'Payments',
      paymentsSubtitle: 'Track rent, record payments and manage balances.',
      sidebar: {
        landlordAccount: 'Landlord Account',
        viewManageProfile: 'View & manage your profile',
        operations: 'Operations',
        maintenance: 'Maintenance',
        noticesLetters: 'Notices & Letters',
        documents: 'Documents',
        reportsAnalytics: 'Reports & Analytics',
        moreTools: 'More Tools',
        accountSupport: 'Account & Support',
        subscriptionBilling: 'Subscription & Billing',
        settings: 'Settings',
        language: 'Language',
        helpSupport: 'Help & Support',
        logOut: 'Log Out',
      },
    },
    t: DICTIONARIES.en,
  },
  {
    code: 'am',
    englishName: 'Amharic',
    nativeName: 'አማርኛ',
    shortBadge: 'አማ',
    script: 'Ethiopic (Geʽez)',
    coverageStatus: 'Complete',
    sampleGreeting: 'እንደምን አመሹ፣ አቤል',
    sampleRoleLabel: 'የቤት እና የኪራይ አስተዳደር (አከራይ)',
    navLabels: {
      home: 'መነሻ',
      properties: 'ንብረቶች',
      tenants: 'ተከራዮች',
      payments: 'ክፍያዎች',
    },
    uiStrings: {
      greetingPrefix: 'እንደምን አመሹ፣',
      homeSubtitle: 'የኪራይ አጠቃላይ እይታዎ እዚህ አለ።',
      overdueLabel: 'ያለፈበት',
      propertiesTitle: 'ንብረቶች',
      propertiesSubtitle: 'ሕንፃዎችዎን፣ ክፍሎችዎን እና ይዞታዎን ያስተዳድሩ።',
      tenantsTitle: 'ተከራዮች',
      tenantsSubtitle: 'ተከራዮችዎን፣ ውሎችዎን እና ክፍያዎችዎን ያስተዳድሩ።',
      paymentsTitle: 'ክፍያዎች',
      paymentsSubtitle: 'ኪራይ ይከታተሉ፣ ክፍያዎችን ይመዝግቡ እና ቀሪ ሂሳብ ያስተዳድሩ።',
      sidebar: {
        landlordAccount: 'የአከራይ መለያ',
        viewManageProfile: 'መገለጫዎን ይመልከቱ እና ያስተዳድሩ',
        operations: 'ኦፕሬሽኖች',
        maintenance: 'ጥገና',
        noticesLetters: 'ማስታወቂያዎች እና ደብዳቤዎች',
        documents: 'ሰነዶች',
        reportsAnalytics: 'ሪፖርቶች እና ትንታኔዎች',
        moreTools: 'ተጨማሪ መሣሪያዎች',
        accountSupport: 'መለያ እና ድጋፍ',
        subscriptionBilling: 'ምዝገባ እና ክፍያ',
        settings: 'ቅንብሮች',
        language: 'ቋንቋ',
        helpSupport: 'እገዛ እና ድጋፍ',
        logOut: 'ውጣ',
      },
    },
    t: DICTIONARIES.am,
  },
  {
    code: 'ti',
    englishName: 'Tigrinya',
    nativeName: 'ትግርኛ',
    shortBadge: 'ትግ',
    script: 'Ethiopic (Geʽez)',
    coverageStatus: 'Complete',
    sampleGreeting: 'ከመይ ኣምሲኹም፣ ኣቤል',
    sampleRoleLabel: 'ምሕደራ ንብረትን ክራይን',
    navLabels: {
      home: 'መበገሲ',
      properties: 'ንብረታት',
      tenants: 'ተኻረይቲ',
      payments: 'ክፍሊታት',
    },
    uiStrings: {
      greetingPrefix: 'ከመይ ኣምሲኹም፣',
      homeSubtitle: 'ሓፈሻዊ ኩነታት ክራይኩም ኣብዚ ኣሎ።',
      overdueLabel: 'ዝሓለፎ',
      propertiesTitle: 'ንብረታት',
      propertiesSubtitle: 'ህንፃታት፣ ክፍልታትን ትሕዝቶን ኣመሓድሩ።',
      tenantsTitle: 'ተኻረይቲ',
      tenantsSubtitle: 'ተኻረይቲ፣ ውዕላትን ክፍሊታትን ኣመሓድሩ።',
      paymentsTitle: 'ክፍሊታት',
      paymentsSubtitle: 'ክራይ ተኸታተሉ፣ ክፍሊት መዝግቡን ሒሳብ ኣመሓድሩን።',
      sidebar: {
        landlordAccount: 'ሕሳብ ኣካራይ',
        viewManageProfile: 'ፕሮፋይልኩም ርኣዩን ኣመሓድሩን',
        operations: 'ስርሒታት',
        maintenance: 'ጽገና',
        noticesLetters: 'ምልክታታትን ደብዳቤታትን',
        documents: 'ሰነዳት',
        reportsAnalytics: 'ጸብጻባትን ትንተናን',
        moreTools: 'ተወሰኽቲ መሳርሒታት',
        accountSupport: 'ሕሳብን ደገፍን',
        subscriptionBilling: 'ምዝገባን ክፍሊትን',
        settings: 'ቅጥዕታት',
        language: 'ቋንቋ',
        helpSupport: 'ሓገዝን ደገፍን',
        logOut: 'ውጻእ',
      },
    },
    t: DICTIONARIES.ti,
  },
  {
    code: 'om',
    englishName: 'Oromo',
    nativeName: 'Afaan Oromoo',
    shortBadge: 'OR',
    script: 'Latin',
    coverageStatus: 'Complete',
    sampleGreeting: 'Akkam bultan, Abel',
    sampleRoleLabel: 'Bulchiinsa Qabeenyaa fi Kiraa',
    navLabels: {
      home: 'Mana',
      properties: 'Qabeenya',
      tenants: 'Kireeffattoota',
      payments: 'Kaffaltii',
    },
    uiStrings: {
      greetingPrefix: 'Akkam bultan,',
      homeSubtitle: 'Cuunfaa kiraa keessanii kunooti.',
      overdueLabel: 'Yeroon Darbe',
      propertiesTitle: 'Qabeenya',
      propertiesSubtitle: 'Gamoowwan, kutaawwan fi qabiyyee keessan bulchaa.',
      tenantsTitle: 'Kireeffattoota',
      tenantsSubtitle: 'Kireeffattoota, waliigaltee fi kaffaltii bulchaa.',
      paymentsTitle: 'Kaffaltii',
      paymentsSubtitle: 'Kiraa hordofaa, kaffaltii galmeessaa fi haftee bulchaa.',
      sidebar: {
        landlordAccount: 'Herrega Abbaa Manaa',
        viewManageProfile: 'Piroofaayilii keessan ilaalaa fi bulchaa',
        operations: 'Hojiiwwan',
        maintenance: 'Suphaa',
        noticesLetters: 'Beeksisa fi Xalayaa',
        documents: 'Galmeewwan',
        reportsAnalytics: 'Gabaasa fi Xiinxala',
        moreTools: 'Meeshaalee Dabalataa',
        accountSupport: 'Herrega fi Deeggarsa',
        subscriptionBilling: 'Maamilummaa fi Kaffaltii',
        settings: 'Qindaa’ina',
        language: 'Afaan',
        helpSupport: 'Gargaarsa fi Deeggarsa',
        logOut: 'Ba’i',
      },
    },
    t: DICTIONARIES.om,
  },
  {
    code: 'ktb',
    englishName: 'Kambaata',
    nativeName: 'Kambaatissa',
    shortBadge: 'KT',
    script: 'Latin',
    coverageStatus: 'Complete (Technical Terms Flagged for Native Verification)',
    sampleGreeting: 'Xumaan galte, Abel',
    sampleRoleLabel: 'Minii kee Kiraa Gashsha',
    navLabels: {
      home: 'Mine',
      properties: 'Qabeenna',
      tenants: 'Kirayitoota',
      payments: 'Baxxanchuwwa',
    },
    uiStrings: {
      greetingPrefix: 'Xumaan galte,',
      homeSubtitle: 'Kiraa ke’nne xaphphu la’ishsha.',
      overdueLabel: 'Woktii Sa’ee',
      propertiesTitle: 'Qabeenna',
      propertiesSubtitle: 'Minne, kifiluwwanna amadama gashshi.',
      tenantsTitle: 'Kirayitoota',
      tenantsSubtitle: 'Kirayitoota, woliigaltinanna baxxancha gashshi.',
      paymentsTitle: 'Baxxanchuwwa',
      paymentsSubtitle: 'Kiraa hordofi, baxxancha borossinna gattota gashshi.',
      sidebar: {
        landlordAccount: 'Qabeenni Anna Herrega',
        viewManageProfile: 'Piroofaayilii ke’nne la’i',
        operations: 'Hojiiwwa',
        maintenance: 'Suupha',
        noticesLetters: 'Beeksishsha & Woraqatuwwa',
        documents: 'Sanaduwwa',
        reportsAnalytics: 'Gabaasanna La’ishsha',
        moreTools: 'Ledote Meeshuwwa',
        accountSupport: 'Herrega & Deeggarsa',
        subscriptionBilling: 'Karooranna Baxxancha',
        settings: 'Qixxaawo',
        language: 'Afoo',
        helpSupport: 'Kaa’lonna Deeggarsa',
        logOut: 'Fuli',
      },
    },
    t: DICTIONARIES.ktb,
  },
  {
    code: 'hdy',
    englishName: 'Hadiyya',
    nativeName: 'Hadiyyisa',
    shortBadge: 'HD',
    script: 'Latin',
    coverageStatus: 'Complete (Technical Terms Flagged for Native Verification)',
    sampleGreeting: 'Danin soodite, Abel',
    sampleRoleLabel: 'Minee kee Kiraa Gashsha',
    navLabels: {
      home: 'Mine',
      properties: 'Qabeenna',
      tenants: 'Kiraayitoota',
      payments: 'Baxxanchuwwa',
    },
    uiStrings: {
      greetingPrefix: 'Danin soodite,',
      homeSubtitle: 'Ki’nne kiraa xaphphi moo’ishsha.',
      overdueLabel: 'Ammane Sa’ukko',
      propertiesTitle: 'Qabeenna',
      propertiesSubtitle: 'Minne, kifiluwwanna amadama gashshi.',
      tenantsTitle: 'Kiraayitoota',
      tenantsSubtitle: 'Kiraayitoota, woliigaltinanna baxxancha gashshi.',
      paymentsTitle: 'Baxxanchuwwa',
      paymentsSubtitle: 'Kiraa hordofi, baxxancha kitabinna gattota gashshi.',
      sidebar: {
        landlordAccount: 'Qabeenni Anna Herrega',
        viewManageProfile: 'Piroofaayilii ki’nne moo’i',
        operations: 'Hojiiwwa',
        maintenance: 'Suupha',
        noticesLetters: 'Beeksishsha & Woraqatuwwa',
        documents: 'Sanaduwwa',
        reportsAnalytics: 'Gabaasanna Moo’ishsha',
        moreTools: 'Ledote Meeshuwwa',
        accountSupport: 'Herrega & Deeggarsa',
        subscriptionBilling: 'Karooranna Baxxancha',
        settings: 'Qixxaawo',
        language: 'Afoo',
        helpSupport: 'Kaa’lonna Deeggarsa',
        logOut: 'Fuli',
      },
    },
    t: DICTIONARIES.hdy,
  },
];

const LANGUAGE_STORAGE_KEY = 'landlordos_language_pref';
const LANGUAGE_EVENT_NAME = 'landlordos-language-change';

export function getSavedLanguageCode(): SupportedLanguageCode {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguageCode | null;
    if (raw && SUPPORTED_LANGUAGES.some((l) => l.code === raw)) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export function setSavedLanguageCode(code: SupportedLanguageCode): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
    }
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT_NAME, { detail: code }));
  } catch {
    // ignore storage errors
  }
}

export function useLanguagePreference(): {
  languageCode: SupportedLanguageCode;
  languageOption: LanguageOption;
  currentLanguage: LanguageOption;
  t: DeepTranslationDictionary;
  sidebarNav: SidebarNavigationStrings;
  contextualActions: ContextualQuickActionStrings;
  setLanguage: (code: SupportedLanguageCode) => void;
  selectLanguage: (code: SupportedLanguageCode) => void;
} {
  const [languageCode, setLanguageCodeState] = useState<SupportedLanguageCode>(() =>
    getSavedLanguageCode()
  );

  useEffect(() => {
    const handler = () => {
      setLanguageCodeState(getSavedLanguageCode());
    };
    window.addEventListener(LANGUAGE_EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const languageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === languageCode) || SUPPORTED_LANGUAGES[0];

  const setLanguage = (code: SupportedLanguageCode) => {
    setSavedLanguageCode(code);
    setLanguageCodeState(code);
  };

  return {
    languageCode,
    languageOption,
    currentLanguage: languageOption,
    t: languageOption.t,
    sidebarNav: SIDEBAR_NAV_TRANSLATIONS[languageOption.code],
    contextualActions: CONTEXTUAL_QUICK_ACTION_TRANSLATIONS[languageOption.code],
    setLanguage,
    selectLanguage: setLanguage,
  };
}

/**
 * 1. Standardized Buttons (UI Design System v2.0: Primary, Secondary, Outline, Destructive)
 */
export type DSButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive';

export const DSButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: DSButtonVariant;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
  }
> = ({
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  const sizeClass =
    size === 'sm'
      ? 'min-h-[36px] px-3.5 py-1.5 text-[12.5px]'
      : size === 'lg'
      ? 'min-h-[46px] px-5 py-2.5 text-[14.5px]'
      : 'min-h-[42px] px-4 py-2 text-[13.5px]';

  const variantClass =
    variant === 'primary'
      ? 'bg-[#0145F2] hover:bg-[#0039CC] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.22)]'
      : variant === 'secondary'
      ? 'bg-[#E8EEF8] dark:bg-[#1E242E] hover:bg-[#DCE6F7] dark:hover:bg-[#272E3B] text-[#111318] dark:text-[#FFFFFF] border border-[#DCE5F2] dark:border-[#2B3340]'
      : variant === 'outline'
      ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#111318] dark:text-[#FFFFFF] border border-[#111318]/40 dark:border-[#3A414E]'
      : 'bg-[#FDE2E4] dark:bg-[#3A191E] hover:bg-[#FBD0D4] dark:hover:bg-[#491E25] text-[#E5252A] dark:text-[#FF7A82] border border-[#F9C6CA] dark:border-[#55232B]';

  return (
    <button
      type={props.type || 'button'}
      className={`rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 ${sizeClass} ${variantClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

/**
 * 2. Standardized Status Badges (Paid, Overdue, Renewal, Pending, Draft)
 */
export type DSBadgeVariant = 'paid' | 'overdue' | 'renewal' | 'pending' | 'draft';

export const DSStatusBadge: React.FC<{
  variant: DSBadgeVariant;
  label?: string;
  className?: string;
}> = ({ variant, label, className = '' }) => {
  const { t } = useLanguagePreference();

  if (variant === 'paid') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-[2.5px] rounded-full text-[11.5px] font-semibold bg-[#D9F7E4] dark:bg-[#0D3820] text-[#059D23] dark:text-[#2CE058] ${className}`}
      >
        <CheckCircle2 className="w-[12px] h-[12px] stroke-[2.25]" />
        <span>{label || t.common.paid}</span>
      </span>
    );
  }
  if (variant === 'overdue') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-[2.5px] rounded-full text-[11.5px] font-semibold bg-[#FEE2E4] dark:bg-[#471D23] text-[#E5252A] dark:text-[#FF7A82] ${className}`}
      >
        <AlertTriangle className="w-[12px] h-[12px] stroke-[2.25]" />
        <span>{label || t.common.overdue}</span>
      </span>
    );
  }
  if (variant === 'renewal') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-[2.5px] rounded-full text-[11.5px] font-semibold bg-[#DCEBFF] dark:bg-[#0E3166] text-[#0145F2] dark:text-[#5CA2FF] ${className}`}
      >
        <Calendar className="w-[12px] h-[12px] stroke-[2.25]" />
        <span>{label || t.common.renewal}</span>
      </span>
    );
  }
  if (variant === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-[2.5px] rounded-full text-[11.5px] font-semibold bg-[#FEF3C7] dark:bg-[#3B2A0E] text-[#D97706] dark:text-[#FBBF24] ${className}`}
      >
        <Clock className="w-[12px] h-[12px] stroke-[2.25]" />
        <span>{label || t.common.pending}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-[2.5px] rounded-full text-[11.5px] font-semibold bg-[#E5E7EB] dark:bg-[#262B33] text-[#4B5563] dark:text-[#A1A1AA] ${className}`}
    >
      <Clock className="w-[12px] h-[12px] stroke-[2.25]" />
      <span>{label || t.common.draft}</span>
    </span>
  );
};

/**
 * 3. Standardized Filter Pills
 */
export function DSFilterPills<T extends string>({
  options,
  activeId,
  onChange,
  ariaLabel = 'Filter items',
  columns,
}: {
  options: { id: T; label: string }[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  columns?: 3 | 4;
}) {
  const layoutClass =
    columns === 4
      ? 'grid grid-cols-4 gap-2'
      : columns === 3
      ? 'grid grid-cols-3 gap-2'
      : 'flex items-center gap-2 overflow-x-auto no-scrollbar';

  return (
    <div role="tablist" aria-label={ariaLabel} className={`${layoutClass} pt-0.5`}>
      {options.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`h-[37px] px-3 rounded-full text-[13.5px] font-semibold transition-colors whitespace-nowrap flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-[#0145F2] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.25)]'
                : 'bg-[#FFFFFF] dark:bg-[#171A20] text-[#111318] dark:text-[#E5E7EB] border border-[#E4E9F0] dark:border-[#262B32] shadow-[0_1px_4px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4. Standardized Surface Card
 */
export const DSCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'alert';
  onClick?: () => void;
}> = ({ children, className = '', variant = 'default', onClick }) => {
  const surfaceClass =
    variant === 'alert'
      ? 'bg-[#FFEEF0] dark:bg-[#2A171B] border-[#FAD6DA] dark:border-[#462127]'
      : 'bg-[#FFFFFF] dark:bg-[#15181C] border-[#E6ECF3] dark:border-[#262B31]';

  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] border shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none ${surfaceClass} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * 5. Standardized Page Header with optional Back navigation
 */
export const DSPageHeader: React.FC<{
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, backTo, backLabel, action }) => {
  const { t } = useLanguagePreference();
  return (
    <div className="pt-1 space-y-1.5">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0145F2] dark:text-[#5CA2FF] hover:opacity-80"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.25]" />
          <span>{backLabel || t.common.back}</span>
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] sm:text-[31px] leading-[1.12] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] leading-[1.35] text-[#4B5563] dark:text-[#C4C9D1] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};

/**
 * 6. Standardized Search Input + Optional Filter Button
 */
export const DSSearchBar: React.FC<{
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onToggleFilter?: () => void;
  filterActive?: boolean;
}> = ({
  value,
  onChange,
  placeholder,
  onToggleFilter,
  filterActive = false,
}) => {
  const { t } = useLanguagePreference();
  return (
    <div className="flex items-center gap-2.5 pt-0.5">
      <div className="flex-1 h-[42px] rounded-full px-3.5 bg-[#EDF2F8] dark:bg-[#161A20] border border-[#E2E8F0] dark:border-[#262B32] flex items-center gap-2.5">
        <Search className="w-[17px] h-[17px] text-[#374151] dark:text-[#C4C9D1] stroke-[2] shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t.common.searchPlaceholder}
          className="w-full bg-transparent text-[13.5px] text-[#111318] dark:text-[#FFFFFF] placeholder:text-[#5A6270] dark:placeholder:text-[#B0B7C3] focus:outline-none"
        />
      </div>
      {onToggleFilter && (
        <button
          type="button"
          onClick={onToggleFilter}
          aria-label="Toggle filter options"
          className={`w-[42px] h-[42px] rounded-full flex items-center justify-center border transition-colors shrink-0 ${
            filterActive
              ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
              : 'bg-[#F9FBFE] dark:bg-[#161A20] text-[#0145F2] dark:text-[#D1D5DB] border-[#E4E9F0] dark:border-[#262B32]'
          }`}
        >
          <SlidersHorizontal className="w-[18px] h-[18px] stroke-[2]" />
        </button>
      )}
    </div>
  );
};

/**
 * 7. Standardized Settings / Menu Row
 */
export const DSSettingsRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  destructive?: boolean;
}> = ({
  icon,
  title,
  subtitle,
  rightContent,
  to,
  onClick,
  destructive = false,
}) => {
  const inner = (
    <>
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-6 h-6 flex items-center justify-center shrink-0 ${
            destructive
              ? 'text-[#E5252A] dark:text-[#FF5C64]'
              : 'text-[#0145F2] dark:text-[#2E88FF]'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div
            className={`text-[15px] font-semibold leading-snug truncate ${
              destructive
                ? 'text-[#E5252A] dark:text-[#FF5C64]'
                : 'text-[#111318] dark:text-[#FFFFFF]'
            }`}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-[12px] text-[#5A606D] dark:text-[#A1A1AA] truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {rightContent}
        {!destructive && (
          <ChevronRight className="w-[17px] h-[17px] text-[#4B5563] dark:text-[#9CA3AF] stroke-[2]" />
        )}
      </div>
    </>
  );

  const rowClass =
    'w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F4F7FB] dark:hover:bg-[#1E232B] transition-colors';

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {inner}
    </button>
  );
};

/**
 * 8. Standardized Floating Action Button
 */
export const DSFAB: React.FC<{
  onClick: () => void;
  ariaLabel?: string;
}> = ({ onClick, ariaLabel = 'Open Quick Actions' }) => (
  <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-30 flex justify-end">
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#0145F2] hover:bg-[#0039CC] active:scale-95 text-[#FFFFFF] shadow-[0_8px_22px_rgba(1,69,242,0.42)] flex items-center justify-center transition-all"
    >
      <Plus className="w-7 h-7 stroke-[2.25]" />
    </button>
  </div>
);
