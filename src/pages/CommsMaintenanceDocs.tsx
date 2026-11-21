import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Wrench,
} from 'lucide-react';
import type {
  Charge,
  CommunicationChannel,
  DepositLiability,
  Document,
  DocumentCategory,
  LedgerAdjustment,
  MaintenanceEvent,
  MaintenanceStatus,
  MaintenanceTicket,
  MessageLog,
  Payment,
  Property,
  Tenancy,
  TenantProfile,
  Unit,
} from '../types/domain';
import {
  addDocumentRecord,
  computeTenancyLedgerSummary,
  logCommunicationEntry,
  updateMaintenanceTicketStatus,
} from '../services/domainService';
import {
  formatSADate,
  formatSADateTime,
  formatZAR,
  MAINTENANCE_STATUS_LABELS,
  parseZARToCents,
} from '../utils/format';
import type { QuickAddTab } from '../components/QuickAddModal';
import { db } from '../db/database';
import { resolveAssetUrl } from '../utils/assetUrl';
import {
  DSButton,
  DSCard,
  DSFAB,
  DSFilterPills,
  DSPageHeader,
  DSStatusBadge,
  useLanguagePreference,
} from '../components/DesignSystem';

export const CommunicationCenterScreen: React.FC<{
  tenants: TenantProfile[];
  tenancies: Tenancy[];
  units: Unit[];
  properties: Property[];
  charges: Charge[];
  payments: Payment[];
  adjustments: LedgerAdjustment[];
  deposits: DepositLiability[];
  messageLogs: MessageLog[];
  onNotify: (msg: string) => void;
}> = ({
  tenants,
  tenancies,
  units,
  properties,
  charges,
  payments,
  adjustments,
  deposits,
  messageLogs,
  onNotify,
}) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [searchParams] = useSearchParams();
  const initialTenantId = searchParams.get('tenantId') || tenants[0]?.id || '';
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'compose' | 'history'>(
    tabParam === 'history' ? 'history' : 'compose'
  );
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId);

  useEffect(() => {
    if (tabParam === 'history') {
      setActiveTab('history');
    } else if (tabParam === 'compose') {
      setActiveTab('compose');
    }
  }, [tabParam]);

  useEffect(() => {
    const tid = searchParams.get('tenantId');
    if (tid) {
      setSelectedTenantId(tid);
    }
  }, [searchParams]);
  const [templateType, setTemplateType] = useState<MessageLog['templateType']>('rent_reminder');
  const [channel, setChannel] = useState<CommunicationChannel>('whatsapp');
  const [customSubject, setCustomSubject] = useState('November 2026 Rent & Balance Reminder');
  const [customBody, setCustomBody] = useState('');

  const selectedTenant = tenants.find((x) => x.id === selectedTenantId) || tenants[0];
  const tenancy = tenancies.find((l) => l.primaryTenantId === selectedTenant?.id);
  const unit = units.find((u) => u.id === tenancy?.unitId);
  const summary = tenancy
    ? computeTenancyLedgerSummary(tenancy.id, charges, payments, adjustments, deposits)
    : undefined;

  const generatedTemplateText =
    customBody ||
    (templateType === 'rent_reminder'
      ? `Sawubona / Hello ${selectedTenant?.fullName || 'Tenant'}, reminder from Akarai regarding unit ${unit?.unitNumber || ''}. Your current balance is ${formatZAR(summary?.netBalanceDueCents || 0)}. Please use reference ${tenancy?.tenancyReference || ''} for EFT/ATM deposit or arrange cash receipt in person.`
      : templateType === 'payment_acknowledgement'
        ? `Thank you ${selectedTenant?.fullName || 'Tenant'}, we have recorded your recent payment for unit ${unit?.unitNumber || ''}. Remaining balance: ${formatZAR(summary?.netBalanceDueCents || 0)}.`
        : templateType === 'in_person_record'
          ? `Spoke in person with ${selectedTenant?.fullName || 'Tenant'} at unit ${unit?.unitNumber || ''} regarding tenancy ${tenancy?.tenancyReference || ''}.`
          : `Notice for ${selectedTenant?.fullName || 'Tenant'} (${unit?.unitNumber || ''}): Please contact management regarding your tenancy.`);

  const cleanPhone = (selectedTenant?.primaryPhone || selectedTenant?.alternativePhone || '').replace(
    /[^0-9]/g,
    ''
  );
  const whatsappDeepLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedTemplateText)}`
    : undefined;

  const handleLogMessage = async (status: MessageLog['deliveryStatus'], note: string) => {
    if (!selectedTenant) return;
    await logCommunicationEntry({
      tenantId: selectedTenant.id,
      tenancyId: tenancy?.id,
      propertyId: tenancy?.propertyId || properties[0]?.id,
      channel,
      templateType,
      subject: customSubject,
      body: generatedTemplateText,
      recipientContact:
        selectedTenant.primaryPhone || selectedTenant.alternativePhone || 'In-Person / Printed Slip',
      deliveryStatus: status,
      statusEvidenceNote: note,
    });
    onNotify(`${status}`);
  };

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.commsMaintDocs.noticesTitle}
        subtitle={t.commsMaintDocs.noticesSubtitle}
        backTo="/"
        backLabel={t.common.home}
      />

      <DSFilterPills
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'compose' | 'history')}
        options={[
          { id: 'compose', label: t.commsMaintDocs.tabCompose },
          { id: 'history', label: `${t.commsMaintDocs.tabAuditLog} (${messageLogs.length})` },
        ]}
      />

      {activeTab === 'compose' ? (
        <DSCard className="p-4 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center shrink-0">
              <MessageSquare className="w-[18px] h-[18px] stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.commsMaintDocs.prepareNoticeHeading}
              </h2>
              <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                {t.commsMaintDocs.prepareNoticeSub}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.selectTenantLabel}
              </label>
              <select
                value={selectedTenant?.id || ''}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setCustomBody('');
                }}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium focus:outline-none focus:border-[#0145F2]"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.fullName} ({tenant.hasSmartphone ? tenant.preferredChannel : t.commsMaintDocs.inPersonOnly})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {t.commsMaintDocs.channelLabel}
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium focus:outline-none focus:border-[#0145F2]"
                >
                  <option value="whatsapp">{t.quickActions.fields.channelWhatsapp}</option>
                  <option value="in_person">{t.quickActions.fields.channelInPerson}</option>
                  <option value="printed_notice">{t.quickActions.fields.channelInPerson}</option>
                  <option value="sms">{t.quickActions.fields.channelSms}</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {t.commsMaintDocs.templateLabel}
                </label>
                <select
                  value={templateType}
                  onChange={(e) => {
                    setTemplateType(e.target.value as MessageLog['templateType']);
                    setCustomBody('');
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium focus:outline-none focus:border-[#0145F2]"
                >
                  <option value="rent_reminder">{t.commsMaintDocs.templateRentReminder}</option>
                  <option value="payment_acknowledgement">{t.commsMaintDocs.templatePaymentAck}</option>
                  <option value="in_person_record">{t.commsMaintDocs.templateInPerson}</option>
                  <option value="maintenance_update">{t.commsMaintDocs.templateMaintUpdate}</option>
                  <option value="renewal_notice">{t.commsMaintDocs.templateRenewal}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.subjectTitleLabel}
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium focus:outline-none focus:border-[#0145F2]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.editableMessageLabel}
              </label>
              <textarea
                rows={4}
                value={generatedTemplateText}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full p-3.5 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] leading-relaxed focus:outline-none focus:border-[#0145F2]"
              />
            </div>

            {channel === 'sms' && (
              <div className="p-3 rounded-[14px] bg-[#FEF2D6] dark:bg-[#3A2B12] text-[#A96B00] dark:text-[#FFC24B] text-[12px]">
                <strong>{t.commsMaintDocs.smsUnconfiguredTitle}:</strong> {t.commsMaintDocs.smsUnconfiguredBody}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {channel === 'whatsapp' && whatsappDeepLink && (
                <a
                  href={whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleLogMessage(
                      'handed-off',
                      'Opened in external WhatsApp via wa.me deep link. Hand-off is not automatic proof of delivery.'
                    )
                  }
                  className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#0145F2] hover:bg-[#0039CC] text-[#FFFFFF] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.commsMaintDocs.openWhatsappBtn}
                </a>
              )}

              <DSButton
                type="button"
                variant="secondary"
                fullWidth
                icon={<Send className="w-4 h-4 text-[#0145F2]" />}
                onClick={() =>
                  handleLogMessage(
                    channel === 'in_person' || channel === 'printed_notice'
                      ? 'logged-offline'
                      : 'drafted',
                    channel === 'in_person' || channel === 'printed_notice'
                      ? 'Manually recorded offline/in-person interaction by landlord.'
                      : 'Saved as drafted message in local IndexedDB.'
                  )
                }
              >
                {channel === 'in_person' || channel === 'printed_notice'
                  ? t.commsMaintDocs.recordInPersonBtn
                  : t.commsMaintDocs.saveDraftBtn}
              </DSButton>
            </div>
          </div>
        </DSCard>
      ) : null}

      {/* Audit Log Timeline */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-[#111318] dark:text-[#FFFFFF]">
            {t.commsMaintDocs.recentNoticesLogsHeading}
          </h2>
          <span className="text-[12px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {messageLogs.length} {t.commsMaintDocs.entriesSuffix}
          </span>
        </div>

        {messageLogs.map((m) => {
          const tenant = tenants.find((x) => x.id === m.tenantId);
          return (
            <DSCard key={m.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                    {m.subject}
                  </div>
                  <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
                    {tenant?.fullName || 'Tenant'} · {m.channel.replace('_', ' ')}
                  </div>
                </div>
                <DSStatusBadge
                  variant={
                    m.deliveryStatus === 'handed-off' || m.deliveryStatus === 'logged-offline'
                      ? 'paid'
                      : 'draft'
                  }
                  label={m.deliveryStatus}
                />
              </div>
              <p className="text-[13px] text-[#111318] dark:text-[#E4E7EC] leading-relaxed">
                {m.body}
              </p>
              <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4] pt-0.5">
                {formatSADateTime(m.sentOrLoggedAt)} · {m.statusEvidenceNote}
              </div>
            </DSCard>
          );
        })}
      </div>
    </div>
  );
};

export const MaintenanceBoardScreen: React.FC<{
  maintenanceTickets: MaintenanceTicket[];
  properties: Property[];
  units: Unit[];
  onOpenQuickAdd: (tab: QuickAddTab) => void;
}> = ({ maintenanceTickets, properties, units, onOpenQuickAdd }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered =
    statusFilter === 'all'
      ? maintenanceTickets
      : maintenanceTickets.filter((m) => m.status === statusFilter);

  const openCount = maintenanceTickets.filter(
    (m) => m.status !== 'resolved' && m.status !== 'closed'
  ).length;
  const resolvedCount = maintenanceTickets.filter(
    (m) => m.status === 'resolved' || m.status === 'closed'
  ).length;

  return (
    <div className="space-y-3.5 pb-8">
      <DSPageHeader
        title={t.commsMaintDocs.maintTitle}
        subtitle={t.commsMaintDocs.maintSubtitle}
        backTo="/"
        backLabel={t.common.home}
        action={
          <button
            type="button"
            onClick={() => onOpenQuickAdd('maintenance')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[12.5px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t.commsMaintDocs.newTicketBtn}
          </button>
        }
      />

      <DSFilterPills
        activeId={statusFilter}
        onChange={setStatusFilter}
        options={[
          { id: 'all', label: t.common.all },
          { id: 'reported', label: t.domainLabels.maintenanceStatuses.reported || 'Reported' },
          { id: 'in-progress', label: t.domainLabels.maintenanceStatuses['in-progress'] || 'In Progress' },
          { id: 'awaiting-parts', label: t.domainLabels.maintenanceStatuses['awaiting-parts'] || 'Awaiting Parts' },
          { id: 'resolved', label: t.domainLabels.maintenanceStatuses.resolved || 'Resolved' },
        ]}
      />

      {/* 3-Column KPI Strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <DSCard className="p-3.5 flex flex-col items-center text-center">
          <Wrench className="w-[20px] h-[20px] text-[#0145F2] stroke-[2]" />
          <div className="text-[21px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1">
            {maintenanceTickets.length}
          </div>
          <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.commsMaintDocs.totalRequestsLabel}
          </div>
        </DSCard>

        <DSCard className="p-3.5 flex flex-col items-center text-center">
          <Wrench className="w-[20px] h-[20px] text-[#D97706] stroke-[2]" />
          <div className="text-[21px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1">
            {openCount}
          </div>
          <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.commsMaintDocs.openActiveLabel}
          </div>
        </DSCard>

        <DSCard className="p-3.5 flex flex-col items-center text-center">
          <Wrench className="w-[20px] h-[20px] text-[#0FA958] stroke-[2]" />
          <div className="text-[21px] font-bold tracking-[-0.02em] text-[#111318] dark:text-[#FFFFFF] mt-1">
            {resolvedCount}
          </div>
          <div className="text-[11px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.common.resolved}
          </div>
        </DSCard>
      </div>

      {/* Maintenance Tickets List */}
      <div className="space-y-2.5">
        {filtered.map((ticket) => {
          const prop = properties.find((p) => p.id === ticket.propertyId);
          const unit = units.find((u) => u.id === ticket.unitId);
          return (
            <Link
              key={ticket.id}
              to={`/maintenance/${ticket.id}`}
              className="block rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none overflow-hidden hover:border-[#0145F2]/40 transition-colors"
            >
              {ticket.photoUrls.length > 0 && (
                <div className="h-36 bg-[#E6ECF3] dark:bg-[#1C1F26] relative overflow-hidden">
                  <img
                    src={resolveAssetUrl(ticket.photoUrls[0])}
                    alt={ticket.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF] leading-snug">
                      {ticket.title}
                    </div>
                    <div className="text-[12.5px] text-[#626A78] dark:text-[#98A1B2] mt-0.5">
                      {unit ? `${unit.unitNumber}` : t.commsMaintDocs.commonAreaLabel} • {prop?.name || ''}
                    </div>
                  </div>
                  <DSStatusBadge
                    variant={
                      ticket.status === 'resolved' || ticket.status === 'closed'
                        ? 'paid'
                        : ticket.priority === 'urgent' || ticket.priority === 'high'
                          ? 'overdue'
                          : 'pending'
                    }
                    label={t.domainLabels.maintenanceStatuses[ticket.status] || MAINTENANCE_STATUS_LABELS[ticket.status] || ticket.status}
                  />
                </div>

                <p className="text-[13px] text-[#626A78] dark:text-[#98A1B2] line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>

                <div className="pt-1 flex items-center justify-between text-[12px] font-medium text-[#626A78] dark:text-[#98A1B2]">
                  <span>
                    {ticket.ticketNumber} · {t.commsMaintDocs.estPrefix} {formatZAR(ticket.estimatedCostCents)}
                  </span>
                  <span className="text-[#0145F2] font-semibold flex items-center gap-0.5">
                    {t.common.manage} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <DSFAB
        onClick={() => onOpenQuickAdd('menu')}
        ariaLabel={t.commsMaintDocs.newTicketBtn}
      />
    </div>
  );
};

export const MaintenanceTicketDetailScreen: React.FC<{
  maintenanceTickets: MaintenanceTicket[];
  maintenanceEvents: MaintenanceEvent[];
  properties: Property[];
  units: Unit[];
  onNotify: (msg: string) => void;
}> = ({ maintenanceTickets, maintenanceEvents, properties, units, onNotify }) => {
  const { t } = useLanguagePreference();
  const { ticketId } = useParams<{ ticketId: string }>();
  const ticket = maintenanceTickets.find((m) => m.id === ticketId) || maintenanceTickets[0];

  const [newStatus, setNewStatus] = useState<MaintenanceStatus>(ticket?.status || 'in-progress');
  const [contractor, setContractor] = useState(ticket?.assignedContractorName || '');
  const [actualCostRands, setActualCostRands] = useState(
    ticket ? (ticket.actualCostCents / 100).toFixed(2) : '0.00'
  );
  const [note, setNote] = useState('');
  const [recordExpense, setRecordExpense] = useState(false);

  if (!ticket) {
    return <div className="p-6">{t.commsMaintDocs.ticketNotFound}</div>;
  }

  const prop = properties.find((p) => p.id === ticket.propertyId);
  const unit = units.find((u) => u.id === ticket.unitId);
  const events = maintenanceEvents.filter((e) => e.ticketId === ticket.id);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMaintenanceTicketStatus({
      ticketId: ticket.id,
      newStatus,
      assignedContractorName: contractor,
      actualCostCents: parseZARToCents(actualCostRands),
      note: note || `Updated status to ${newStatus}`,
      completionNotes: note,
      recordAsExpense: recordExpense,
    });
    const statusLabel = t.domainLabels.maintenanceStatuses[newStatus] || MAINTENANCE_STATUS_LABELS[newStatus];
    onNotify(`${ticket.ticketNumber}: ${statusLabel}`);
    setNote('');
  };

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={ticket.title}
        subtitle={`${ticket.ticketNumber} · ${prop?.name || ''} ${unit ? `• ${unit.unitNumber}` : ''}`}
        backTo="/maintenance"
        backLabel={t.commsMaintDocs.maintTitle}
      />

      <DSCard className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#626A78] dark:text-[#98A1B2]">
            {t.commsMaintDocs.reportedByPrefix} {formatSADate(ticket.reportedDate)} · {ticket.reporterName}
          </span>
          <DSStatusBadge
            variant={
              ticket.status === 'resolved' || ticket.status === 'closed'
                ? 'paid'
                : ticket.priority === 'urgent'
                  ? 'overdue'
                  : 'pending'
            }
            label={t.domainLabels.maintenanceStatuses[ticket.status] || MAINTENANCE_STATUS_LABELS[ticket.status]}
          />
        </div>

        <p className="text-[13.5px] text-[#111318] dark:text-[#E4E7EC] leading-relaxed">
          {ticket.description}
        </p>

        {ticket.photoUrls.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-[12px] font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.commsMaintDocs.inspectionPhotoHeading}
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {ticket.photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="rounded-[14px] overflow-hidden border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] h-48 relative"
                >
                  <img
                    src={resolveAssetUrl(url)}
                    alt={`Maintenance evidence ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </DSCard>

      {/* Update Status & Cost Form */}
      <DSCard className="p-4 space-y-3.5">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#0145F2]" />
          {t.commsMaintDocs.updateTicketCostsHeading}
        </h2>
        <form onSubmit={handleUpdate} className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
              {t.common.status}
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium"
            >
              <option value="reported">{t.domainLabels.maintenanceStatuses.reported}</option>
              <option value="acknowledged">{t.domainLabels.maintenanceStatuses.acknowledged}</option>
              <option value="in-progress">{t.domainLabels.maintenanceStatuses['in-progress']}</option>
              <option value="awaiting-parts">{t.domainLabels.maintenanceStatuses['awaiting-parts']}</option>
              <option value="resolved">{t.domainLabels.maintenanceStatuses.resolved}</option>
              <option value="closed">{t.domainLabels.maintenanceStatuses.closed}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.contractorLabel}
              </label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-medium"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.actualCostZarLabel}
              </label>
              <input
                type="number"
                step="0.01"
                value={actualCostRands}
                onChange={(e) => setActualCostRands(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
              {t.commsMaintDocs.progressNoteLabel}
            </label>
            <textarea
              rows={3}
              placeholder={t.commsMaintDocs.progressNotePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 text-[12.5px] font-medium text-[#111318] dark:text-[#E4E7EC]">
            <input
              type="checkbox"
              checked={recordExpense}
              onChange={(e) => setRecordExpense(e.target.checked)}
              className="w-4 h-4 accent-[#0145F2]"
            />
            <span>{t.commsMaintDocs.logAsExpenseCheckbox}</span>
          </label>

          <DSButton type="submit" variant="primary" fullWidth>
            {t.commsMaintDocs.saveMaintUpdateBtn}
          </DSButton>
        </form>
      </DSCard>

      {/* Audit Timeline */}
      <DSCard className="p-4 space-y-2.5">
        <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
          {t.commsMaintDocs.statusTimelineHeading} ({events.length})
        </h2>
        <div className="divide-y divide-[#EDF1F7] dark:divide-[#242932] text-[12.5px]">
          {events.map((ev) => (
            <div key={ev.id} className="py-2.5 space-y-0.5">
              <div className="font-bold text-[#111318] dark:text-[#FFFFFF]">
                {t.domainLabels.maintenanceStatuses[ev.statusTo] || MAINTENANCE_STATUS_LABELS[ev.statusTo]} · {formatSADateTime(ev.eventTimestamp)}
              </div>
              <div className="text-[#626A78] dark:text-[#98A1B2]">{ev.note}</div>
              <div className="text-[11px] text-[#626A78] dark:text-[#8E96A4]">
                {t.commsMaintDocs.actorPrefix} {ev.actorName}
              </div>
            </div>
          ))}
        </div>
      </DSCard>
    </div>
  );
};

export const DocumentsScreen: React.FC<{
  documents: Document[];
  properties: Property[];
  tenants: TenantProfile[];
  onNotify: (msg: string) => void;
}> = ({ documents, properties, tenants, onNotify }) => {
  const { currentLanguage, t } = useLanguagePreference();
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('lease_agreement');
  const [propId, setPropId] = useState(properties[0]?.id || '');
  const [tenantId, setTenantId] = useState('');
  const [accessScope, setAccessScope] = useState<Document['accessScope']>('shared_with_tenant');
  const [notes, setNotes] = useState('');

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addDocumentRecord({
      title,
      category,
      propertyId: propId || undefined,
      tenantId: tenantId || undefined,
      accessScope,
      mimeType: 'application/pdf',
      fileSizeBytes: 112400,
      notes,
    });
    setTitle('');
    setNotes('');
    setShowAddForm(false);
    onNotify(t.commsMaintDocs.saveDocBtn);
  };

  const handleDeleteDoc = async (docId: string) => {
    await db.documents.delete(docId);
    onNotify(t.common.delete);
  };

  const filteredDocs =
    categoryFilter === 'all'
      ? documents
      : documents.filter((d) => d.category === categoryFilter);

  return (
    <div className="space-y-3.5 pb-6">
      <DSPageHeader
        title={t.commsMaintDocs.docsTitle}
        subtitle={t.commsMaintDocs.docsSubtitle}
        backTo="/"
        backLabel={t.common.home}
        action={
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[12.5px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? t.common.close : t.commsMaintDocs.addDocBtn}
          </button>
        }
      />

      <DSFilterPills
        activeId={categoryFilter}
        onChange={setCategoryFilter}
        options={[
          { id: 'all', label: `${t.common.all} (${documents.length})` },
          { id: 'lease_agreement', label: t.commsMaintDocs.tabLeases },
          { id: 'inspection_report', label: t.commsMaintDocs.tabInspections },
          { id: 'receipt', label: t.commsMaintDocs.tabReceipts },
          { id: 'photograph', label: t.commsMaintDocs.tabPhotos },
        ]}
      />

      {showAddForm && (
        <DSCard className="p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center">
              <Folder className="w-[18px] h-[18px]" />
            </div>
            <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.commsMaintDocs.registerDocHeading}
            </h2>
          </div>

          <form onSubmit={handleAddDoc} className="space-y-3 text-[13px]">
            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.commsMaintDocs.docTitleLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.commsMaintDocs.docTitlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {t.common.category}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
                >
                  <option value="lease_agreement">{t.commsMaintDocs.tabLeases}</option>
                  <option value="inspection_report">{t.commsMaintDocs.tabInspections}</option>
                  <option value="receipt">{t.commsMaintDocs.tabReceipts}</option>
                  <option value="photograph">{t.commsMaintDocs.tabPhotos}</option>
                  <option value="notice">{t.common.notice}</option>
                  <option value="expense_invoice">{t.common.expense}</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {currentLanguage.uiStrings.propertiesTitle}
                </label>
                <select
                  value={propId}
                  onChange={(e) => setPropId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {t.commsMaintDocs.linkedTenantLabel}
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
                >
                  <option value="">{t.commsMaintDocs.generalPropertyOption}</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                  {t.commsMaintDocs.accessScopeLabel}
                </label>
                <select
                  value={accessScope}
                  onChange={(e) => setAccessScope(e.target.value as Document['accessScope'])}
                  className="w-full min-h-[42px] px-3 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
                >
                  <option value="shared_with_tenant">{t.commsMaintDocs.scopeSharedTenant}</option>
                  <option value="owner_and_manager">{t.commsMaintDocs.scopeOwnerManager}</option>
                  <option value="owner_only">{t.commsMaintDocs.scopeOwnerOnly}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                {t.common.notes}
              </label>
              <input
                type="text"
                placeholder={t.commsMaintDocs.retentionNotesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#E6ECF3] dark:border-[#262B31] bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF]"
              />
            </div>

            <DSButton type="submit" variant="primary" fullWidth>
              {t.commsMaintDocs.saveDocBtn}
            </DSButton>
          </form>
        </DSCard>
      )}

      {/* Document Cards */}
      <div className="space-y-2.5">
        {filteredDocs.map((doc) => {
          const prop = properties.find((p) => p.id === doc.propertyId);
          const tenant = tenants.find((x) => x.id === doc.tenantId);
          return (
            <DSCard key={doc.id} className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center shrink-0">
                  {doc.category === 'photograph' ? (
                    <ImageIcon className="w-[19px] h-[19px] stroke-[2]" />
                  ) : (
                    <FileText className="w-[19px] h-[19px] stroke-[2]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-bold text-[#111318] dark:text-[#FFFFFF] truncate">
                    {doc.title}
                  </div>
                  <div className="text-[12px] text-[#626A78] dark:text-[#98A1B2] truncate mt-0.5">
                    {prop?.name || ''} {tenant ? `• ${tenant.fullName}` : ''} ·{' '}
                    {doc.category.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteDoc(doc.id)}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full text-[#626A78] dark:text-[#8E96A4] hover:text-[#E82C33] dark:hover:text-[#FF5A5F] hover:bg-[#FFE8E8]/50 transition-colors shrink-0"
                title={t.common.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </DSCard>
          );
        })}
      </div>
    </div>
  );
};
