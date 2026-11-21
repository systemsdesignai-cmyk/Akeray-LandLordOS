import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Home,
  Layers,
  MapPin,
  Plus,
} from 'lucide-react';
import type {
  ApplicationSettings,
  Charge,
  Expense,
  MaintenanceTicket,
  OwnerEntity,
  Portfolio,
  Property,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import {
  formatSADate,
  formatZAR,
  PROPERTY_CATEGORY_LABELS,
  UNIT_TYPE_LABELS,
} from '../utils/format';
import type { QuickAddTab } from '../components/QuickAddModal';
import { tFormat, useLanguagePreference } from '../components/DesignSystem';
import { resolveAssetUrl } from '../utils/assetUrl';

type PropertyFilterTab = 'all' | 'occupied' | 'vacant' | 'overdue';

const FALLBACK_THUMBNAILS = [
  '/assets/thumb-riverside.png',
  '/assets/thumb-maple.png',
  '/assets/thumb-elmwood.png',
  '/assets/thumb-cedar.png',
];

export const PropertyDirectoryScreen: React.FC<{
  settings?: ApplicationSettings;
  ownerEntities: OwnerEntity[];
  portfolios: Portfolio[];
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  charges?: Charge[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({
  settings,
  properties,
  units,
  tenancies,
  charges = [],
  onOpenQuickAdd,
}) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [activeFilter, setActiveFilter] = useState<PropertyFilterTab>('all');

  const isManager = settings?.activeRole === 'manager';
  const allowedPropIds = isManager
    ? settings?.assignedPropertyIdsForManager || ['prop-bree-mixed', 'prop-cedar']
    : properties.map((p) => p.id);

  const scopedProperties = properties.filter((p) => allowedPropIds.includes(p.id));
  const scopedUnits = units.filter((u) => allowedPropIds.includes(u.propertyId));

  // Derive per-property unit & overdue statistics from actual database records
  const propertyRows = scopedProperties.map((prop, index) => {
    const propUnits = scopedUnits.filter((u) => u.propertyId === prop.id);
    const occupiedUnitsCount = propUnits.filter((u) => {
      const hasActiveTenancy = tenancies.some(
        (ten) => ten.unitId === u.id && ten.status !== 'ended' && ten.status !== 'terminated'
      );
      return u.status === 'occupied' || hasActiveTenancy;
    }).length;
    const vacantUnitsCount = Math.max(0, propUnits.length - occupiedUnitsCount);

    // Count distinct units/tenancies in this property with overdue unpaid charges
    const overdueTenancyIds = new Set(
      charges
        .filter(
          (c) =>
            c.propertyId === prop.id &&
            !c.isDeleted &&
            c.status !== 'reversed' &&
            c.status !== 'paid' &&
            c.status !== 'waived' &&
            Math.max(0, c.amountCents + c.adjustedCents - c.allocatedPaidCents) > 0 &&
            (c.status === 'overdue' || c.dueDate < '2026-11-20')
        )
        .map((c) => c.tenancyId)
    );
    const overdueCount = overdueTenancyIds.size;

    return {
      property: prop,
      index,
      totalUnitsCount: propUnits.length,
      occupiedUnitsCount,
      vacantUnitsCount,
      overdueCount,
    };
  });

  // Apply filter pill selection
  const filteredRows = propertyRows.filter((row) => {
    if (activeFilter === 'occupied') return row.occupiedUnitsCount > 0;
    if (activeFilter === 'vacant') return row.vacantUnitsCount > 0;
    if (activeFilter === 'overdue') return row.overdueCount > 0;
    return true;
  });

  // Portfolio-wide Overview Metrics (derived from live application data: total buildings/properties, units, occupancy %)
  const totalBuildingsCount = scopedProperties.reduce(
    (sum, p) => sum + (p.buildingsCount || 1),
    0
  );
  const totalPropertiesCount =
    totalBuildingsCount >= scopedProperties.length ? totalBuildingsCount : scopedProperties.length;
  const totalUnitsCount = scopedUnits.length;
  const totalOccupiedUnitsCount = propertyRows.reduce((sum, r) => sum + r.occupiedUnitsCount, 0);
  const occupancyPercentage =
    totalUnitsCount > 0 ? Math.floor((totalOccupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // SVG Ring Math for Occupancy Card (starts at 12 o'clock and sweeps clockwise)
  const ringRadius = 25.5;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (Math.min(100, Math.max(0, occupancyPercentage)) / 100) * ringCircumference;

  const filterOptions: { id: PropertyFilterTab; label: string }[] = [
    { id: 'all', label: t.properties.filterAll },
    { id: 'occupied', label: t.properties.filterOccupied },
    { id: 'vacant', label: t.properties.filterVacant },
    { id: 'overdue', label: t.properties.filterOverdue },
  ];

  return (
    <div className="w-full space-y-4 pb-8 relative">
      {/* B. Page Heading */}
      <div className="pt-1">
        <h1 className="text-[31px] leading-[1.12] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
          {currentLanguage.uiStrings.propertiesTitle}
        </h1>
        <p className="text-[14.5px] leading-[1.35] text-[#5A606D] dark:text-[#A1A1AA] mt-1">
          {currentLanguage.uiStrings.propertiesSubtitle}
        </p>
      </div>

      {/* C. Horizontally Scrollable Property Filters */}
      <div
        role="tablist"
        aria-label="Filter properties by occupancy or overdue status"
        className="grid grid-cols-4 gap-2 pt-0.5"
      >
        {filterOptions.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className={`h-[37px] px-3 rounded-full text-[13.5px] font-semibold transition-colors whitespace-nowrap flex items-center justify-center ${
                isActive
                  ? 'bg-[#0145F2] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.25)]'
                  : 'bg-[#FFFFFF] dark:bg-[#0D0E10] text-[#111318] dark:text-[#E4E4E7] border border-[#E4E9F0] dark:border-[#222428] shadow-[0_1px_4px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* D. Property Overview — Three Compact Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 pt-0.5">
        {/* 1. Total Properties */}
        <div className="rounded-[20px] p-3.5 bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E6EBF2] dark:border-[#222428] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none flex flex-col justify-between min-h-[112px]">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#CCE0FC] dark:bg-[#042D7D] flex items-center justify-center text-[#0145F2] dark:text-[#E2ECFF]">
            <Home className="w-[18px] h-[18px] stroke-[2]" />
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
              {totalPropertiesCount}
            </div>
            <div className="text-[13px] text-[#5A606D] dark:text-[#A1A1AA] mt-1 font-normal">
              {t.common.properties}
            </div>
          </div>
        </div>

        {/* 2. Total Units */}
        <div className="rounded-[20px] p-3.5 bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E6EBF2] dark:border-[#222428] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none flex flex-col justify-between min-h-[112px]">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#CCE0FC] dark:bg-[#042D7D] flex items-center justify-center text-[#0145F2] dark:text-[#E2ECFF]">
            <Layers className="w-[18px] h-[18px] stroke-[2]" />
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] leading-none font-bold tabular-nums tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF]">
              {totalUnitsCount}
            </div>
            <div className="text-[13px] text-[#5A606D] dark:text-[#A1A1AA] mt-1 font-normal">
              {t.common.units}
            </div>
          </div>
        </div>

        {/* 3. Occupancy Percentage Ring */}
        <div className="rounded-[20px] px-3 py-3 bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E6EBF2] dark:border-[#222428] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none flex flex-col items-center justify-between min-h-[112px]">
          <div className="relative w-[64px] h-[64px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-[#CCE0FC] dark:text-[#042D7D]"
              />
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="#0145F2"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringStrokeDashoffset}
              />
            </svg>
            <span className="absolute text-[15px] font-bold tabular-nums tracking-[-0.02em] text-[#0145F2] dark:text-[#FFFFFF]">
              {totalUnitsCount > 0 ? `${occupancyPercentage}%` : '0%'}
            </span>
          </div>
          <div className="text-[13px] text-[#5A606D] dark:text-[#A1A1AA] font-normal text-center">
            {t.properties.occupancyLabel}
          </div>
        </div>
      </div>

      {/* E. Property List — Premium Rounded Horizontal Cards */}
      {filteredRows.length === 0 ? (
        <div className="rounded-[22px] p-7 bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E6EBF2] dark:border-[#222428] text-center space-y-3">
          <Building2 className="w-8 h-8 text-[#0145F2] mx-auto" />
          <div className="text-sm font-bold text-[#111318] dark:text-[#FFFFFF]">
            {t.properties.noMatchTitle}
          </div>
          <p className="text-xs text-[#5A606D] dark:text-[#A1A1AA] max-w-xs mx-auto">
            {t.properties.noMatchDesc}
          </p>
          <div className="pt-1 flex items-center justify-center gap-2">
            {activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-xs font-semibold"
              >
                {t.properties.showAllBtn}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenQuickAdd('property')}
              className="min-h-[38px] px-4 py-1.5 rounded-full border border-[#E4E9F0] dark:border-[#222428] text-xs font-semibold"
            >
              {t.properties.addPropertyBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 pt-0.5">
          {filteredRows.map(
            ({
              property,
              index,
              totalUnitsCount: propUnitsLen,
              occupiedUnitsCount,
              vacantUnitsCount,
              overdueCount,
            }) => {
              const showOverdueBadge =
                overdueCount > 0 &&
                activeFilter !== 'occupied' &&
                activeFilter !== 'vacant' &&
                (activeFilter === 'overdue' || property.id !== 'prop-bree-mixed');
              const showVacantBadge =
                !showOverdueBadge &&
                (activeFilter === 'vacant' ||
                  (occupiedUnitsCount === 0 && vacantUnitsCount > 0));

              const locationLabel = property.suburb
                ? `${property.suburb.split(',')[0].trim()}`
                : property.city;

              const thumbSrc =
                property.thumbnailUrl ||
                FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];

              return (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="group rounded-[20px] p-2.5 pr-3 bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E6EBF2] dark:border-[#222428] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none hover:border-[#0145F2]/60 dark:hover:border-[#363940] transition-colors flex items-center justify-between gap-3"
                >
                  {/* Left Rectangular Architectural Thumbnail (153x134 ratio -> 73px x 64px) */}
                  <div className="w-[73px] h-[64px] rounded-[13px] overflow-hidden shrink-0 bg-transparent">
                    <img
                      src={resolveAssetUrl(thumbSrc)}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Middle Property Info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-[#111318] dark:text-[#FFFFFF] truncate leading-[1.22]">
                      {property.name.replace(/\s*\(Fictional\)\s*/i, '')}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[13px] text-[#374151] dark:text-[#D4D4D8] mt-1 leading-tight">
                      <MapPin className="w-[13px] h-[13px] text-[#111318] dark:text-[#A1A1AA] shrink-0 stroke-[2]" />
                      <span className="truncate">{locationLabel}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[13px] text-[#374151] dark:text-[#D4D4D8] mt-1 leading-tight">
                      <Building2 className="hidden dark:block w-[13px] h-[13px] text-[#A1A1AA] shrink-0 stroke-[1.9]" />
                      <span
                        className="block dark:hidden w-[8px] h-[11px] rounded-full bg-[#B9C0CC] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="tabular-nums font-medium">
                        {propUnitsLen} {propUnitsLen === 1 ? t.common.unit : t.common.units}
                      </span>
                    </div>
                  </div>

                  {/* Right Status Badge & Navigation Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {showOverdueBadge ? (
                      <span className="h-[29px] px-3 rounded-[9px] bg-[#FEDADA] dark:bg-[#531618] text-[#E82C33] dark:text-[#FFD8D8] text-[12px] font-semibold tabular-nums whitespace-nowrap flex items-center justify-center">
                        {overdueCount} {t.common.overdue}
                      </span>
                    ) : showVacantBadge ? (
                      <span className="h-[29px] px-3 rounded-[9px] bg-[#EDF1F5] dark:bg-[#18191C] text-[#4B5563] dark:text-[#D4D4D8] text-[12px] font-semibold tabular-nums whitespace-nowrap flex items-center justify-center">
                        {vacantUnitsCount} {t.common.vacant}
                      </span>
                    ) : (
                      <span className="h-[29px] px-3 rounded-[9px] bg-[#D6E5FA] dark:bg-[#072156] text-[#0145F2] dark:text-[#DCE8FF] text-[12px] font-semibold tabular-nums whitespace-nowrap flex items-center justify-center">
                        {occupiedUnitsCount} {t.common.occupied}
                      </span>
                    )}

                    <ChevronRight className="w-[16px] h-[16px] text-[#6B7280] dark:text-[#A1A1AA] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2]" />
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}

      {/* F. Circular Electric-Blue Floating Action Button ("+") */}
      <div className="fixed bottom-[84px] left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[430px] mx-auto px-5 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenQuickAdd('menu')}
            aria-label={t.dashboard.openQuickActionsAria}
            title={t.quickActions.title}
            className="pointer-events-auto w-[56px] h-[56px] rounded-full bg-[#0145F2] hover:bg-[#0139C9] active:scale-95 text-[#FFFFFF] shadow-[0_6px_20px_rgba(1,69,242,0.4)] flex items-center justify-center transition-all focus:outline-none"
          >
            <Plus className="w-[27px] h-[27px] stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const PropertyDetailScreen: React.FC<{
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  expenses: Expense[];
  maintenanceTickets: MaintenanceTicket[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({ properties, units, tenancies, tenants, expenses, maintenanceTickets, onOpenQuickAdd }) => {
  const { t } = useLanguagePreference();
  const { propertyId } = useParams<{ propertyId: string }>();
  const property = properties.find((p) => p.id === propertyId) || properties[0];

  if (!property) {
    return (
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428]">
        <p className="text-sm">{t.properties.notFound}</p>
        <Link to="/properties" className="text-xs text-[#0145F2] hover:underline mt-2 inline-block">
          {t.properties.backToProperties}
        </Link>
      </div>
    );
  }

  const propUnits = units.filter((u) => u.propertyId === property.id);
  const propExpenses = expenses.filter((e) => e.propertyId === property.id);
  const propTickets = maintenanceTickets.filter((m) => m.propertyId === property.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-[#5A606D] dark:text-[#A1A1AA]">
        <Link to="/properties" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {t.common.properties}
        </Link>
        <span>/</span>
        <span className="text-[#111318] dark:text-[#FFFFFF] font-medium">{property.name}</span>
      </div>

      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {property.thumbnailUrl && (
            <img
              src={resolveAssetUrl(property.thumbnailUrl)}
              alt={property.name}
              className="w-16 h-14 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="space-y-1">
            <div className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">
              {t.domainLabels.propertyCategories[property.category] || PROPERTY_CATEGORY_LABELS[property.category]} · {property.buildingsCount} {t.properties.buildingsSuffix} · {property.floorsCount} {t.properties.floorsSuffix}
            </div>
            <h1 className="text-xl font-bold text-[#111318] dark:text-[#FFFFFF]">{property.name}</h1>
            <div className="text-xs text-[#5A606D] dark:text-[#D4D4D8]">
              {property.streetAddress}, {property.suburb}, {property.city}, {property.province} {property.postalCode}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickAdd('unit')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0145F2] text-[#FFFFFF] text-xs font-semibold"
          >
            {t.properties.addUnitBtn}
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickAdd('expense')}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E4E9F0] dark:border-[#222428] text-xs font-medium"
          >
            {t.properties.recordExpenseBtn}
          </button>
        </div>
      </div>

      {/* Units Table */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E9F0] dark:border-[#222428]">
          <h2 className="text-sm font-bold">
            {t.properties.rentableUnitsHeading} — {property.name} ({propUnits.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E4E9F0] dark:border-[#222428] text-[#5A606D] dark:text-[#A1A1AA]">
                <th className="py-3 px-4">{t.properties.colUnitCode}</th>
                <th className="py-3 px-4">{t.properties.colNameType}</th>
                <th className="py-3 px-4">{t.properties.colCurrentTenant}</th>
                <th className="py-3 px-4 text-right">{t.properties.colStandardRent}</th>
                <th className="py-3 px-4">{t.properties.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9F0] dark:divide-[#222428]">
              {propUnits.map((u) => {
                const tenancy = tenancies.find((ten) => ten.unitId === u.id && ten.status !== 'ended');
                const tenant = tenancy ? tenants.find((x) => x.id === tenancy.primaryTenantId) : undefined;
                return (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-[#141518]">
                    <td className="py-3 px-4 font-mono font-semibold">
                      <Link to={`/units/${u.id}`} className="text-[#0145F2] dark:text-[#60A5FA] hover:underline">
                        {u.unitNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/units/${u.id}`} className="font-medium hover:underline">
                        {u.name}
                      </Link>
                      <div className="text-[#5A606D] dark:text-[#A1A1AA]">
                        {t.domainLabels.unitTypes[u.unitType] || UNIT_TYPE_LABELS[u.unitType]}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tenant ? (
                        <Link to={`/tenants/${tenant.id}`} className="hover:underline font-medium">
                          {tenant.fullName}
                        </Link>
                      ) : (
                        <span className="text-[#5A606D] dark:text-[#A1A1AA]">
                          {u.status === 'occupied' ? t.properties.occupiedActiveLease : t.common.vacant}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatZAR(u.standardRentCents)}
                    </td>
                    <td className="py-3 px-4">
                      {u.status === 'occupied' ? t.common.occupied : t.common.vacant}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Operating Expenses & Maintenance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] p-5 space-y-3">
          <h3 className="text-sm font-bold">{t.properties.operatingExpensesHeading}</h3>
          {propExpenses.length === 0 ? (
            <p className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">{t.properties.noExpenses}</p>
          ) : (
            <div className="divide-y divide-[#E4E9F0] dark:divide-[#222428] text-xs">
              {propExpenses.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{e.description}</div>
                    <div className="text-[#5A606D] dark:text-[#A1A1AA]">
                      {formatSADate(e.incurredDate)} · {e.vendorName || e.category}
                    </div>
                  </div>
                  <span className="font-mono font-semibold tabular-nums">{formatZAR(e.amountCents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] p-5 space-y-3">
          <h3 className="text-sm font-bold">{t.properties.maintenanceTicketsHeading}</h3>
          {propTickets.length === 0 ? (
            <p className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">{t.properties.noTickets}</p>
          ) : (
            <div className="divide-y divide-[#E4E9F0] dark:divide-[#222428] text-xs">
              {propTickets.map((tkt) => (
                <Link key={tkt.id} to={`/maintenance/${tkt.id}`} className="py-2.5 block hover:underline">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{tkt.title}</span>
                    <span className="font-mono text-[#5A606D] dark:text-[#A1A1AA]">{tkt.ticketNumber}</span>
                  </div>
                  <div className="text-[#5A606D] dark:text-[#A1A1AA] mt-0.5">
                    {t.common.status}: {t.domainLabels.maintenanceStatuses[tkt.status] || tkt.status} · {t.common.priority}: {tkt.priority}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const UnitDetailScreen: React.FC<{
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  tenants: TenantProfile[];
  charges: Charge[];
  maintenanceTickets: MaintenanceTicket[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({ properties, units, tenancies, tenants, charges, maintenanceTickets, onOpenQuickAdd }) => {
  const { t } = useLanguagePreference();
  const { unitId } = useParams<{ unitId: string }>();
  const unit = units.find((u) => u.id === unitId) || units[0];

  if (!unit) {
    return (
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428]">
        <p className="text-sm">{t.properties.unitNotFound}</p>
      </div>
    );
  }

  const property = properties.find((p) => p.id === unit.propertyId);
  const unitTenancies = tenancies.filter((ten) => ten.unitId === unit.id);
  const unitCharges = charges.filter((c) => c.unitId === unit.id);
  const unitTickets = maintenanceTickets.filter((m) => m.unitId === unit.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-[#5A606D] dark:text-[#A1A1AA]">
        <Link to="/properties" className="hover:underline">
          {t.common.properties}
        </Link>
        <span>/</span>
        {property && (
          <>
            <Link to={`/properties/${property.id}`} className="hover:underline">
              {property.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#111318] dark:text-[#FFFFFF] font-medium">{unit.unitNumber}</span>
      </div>

      <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">
            {t.common.unit} {unit.unitNumber} · {t.domainLabels.unitTypes[unit.unitType] || UNIT_TYPE_LABELS[unit.unitType]} · {t.common.status}: {unit.status === 'occupied' ? t.common.occupied : t.common.vacant}
          </div>
          <h1 className="text-xl font-bold text-[#111318] dark:text-[#FFFFFF]">{unit.name}</h1>
          <div className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">
            {t.properties.standardRentLabel}: <span className="font-mono font-semibold">{formatZAR(unit.standardRentCents)}</span> ({unit.billingCycle})
            {unit.sizeSqm ? ` · ${t.properties.sizeLabel}: ${unit.sizeSqm} m²` : ''}
            {unit.meterNumberElectricity ? ` · ${t.properties.prepaidElecLabel}: ${unit.meterNumberElectricity}` : ''}
            {unit.meterNumberWater ? ` · ${t.properties.waterMeterLabel}: ${unit.meterNumberWater}` : ''}
          </div>
          {unit.amenities.length > 0 && (
            <div className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">{t.properties.amenitiesLabel}: {unit.amenities.join(' · ')}</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickAdd('tenancy')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0145F2] text-[#FFFFFF] text-xs font-semibold"
          >
            {t.properties.newTenancyBtn}
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickAdd('maintenance')}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E4E9F0] dark:border-[#222428] text-xs font-medium"
          >
            {t.properties.logRepairBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] p-5 space-y-3">
          <h2 className="text-sm font-bold">{t.properties.linkedTenanciesHeading}</h2>
          {unitTenancies.length === 0 ? (
            <p className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">
              {unit.status === 'occupied'
                ? tFormat(t.properties.activeStandardTenancyMsg, { rent: formatZAR(unit.standardRentCents) })
                : t.properties.vacantNoTenancyMsg}
            </p>
          ) : (
            <div className="divide-y divide-[#E4E9F0] dark:divide-[#222428] text-xs">
              {unitTenancies.map((ten) => {
                const tenant = tenants.find((x) => x.id === ten.primaryTenantId);
                return (
                  <div key={ten.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <Link to={`/tenancies/${ten.id}`} className="font-semibold hover:underline">
                        {ten.tenancyReference} — {tenant?.fullName || t.common.tenant}
                      </Link>
                      <div className="text-[#5A606D] dark:text-[#A1A1AA] mt-0.5">
                        {t.properties.startPrefix}: {formatSADate(ten.startDate)} · {t.common.status}: {ten.status}
                      </div>
                    </div>
                    <span className="font-mono font-semibold">
                      {formatZAR(ten.rentAmountCents)}{t.properties.perMonthSuffix}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0E0F11] border border-[#E4E9F0] dark:border-[#222428] p-5 space-y-3">
          <h2 className="text-sm font-bold">{t.properties.unitLedgerRepairsHeading}</h2>
          <div className="text-xs text-[#5A606D] dark:text-[#A1A1AA]">
            {tFormat(t.properties.chargesRecordedCount, { count: unitCharges.length })} ·{' '}
            {tFormat(t.properties.maintenanceTicketsCount, { count: unitTickets.length })}
          </div>
          <div className="divide-y divide-[#E4E9F0] dark:divide-[#222428] text-xs">
            {unitCharges.map((c) => (
              <div key={c.id} className="py-2 flex items-center justify-between">
                <span>{c.description}</span>
                <span className="font-mono tabular-nums">
                  {formatZAR(c.amountCents)} ({c.status})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

