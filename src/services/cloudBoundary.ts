/**
 * Clean Cloud Boundary & Data-Access Abstraction Layer
 * Explicitly separates local IndexedDB prototype storage from future production integrations:
 * - Supabase PostgreSQL (Row-Level Security & server-enforced RBAC)
 * - Supabase Auth (OTP / Phone / Email authentication)
 * - Private Object Storage (Signed time-limited URLs for POPIA-protected lease & identity documents)
 * - Server-Side Functions (SMS Gateway & Automated Bank Feed Webhooks)
 *
 * CRITICAL PRINCIPLE: Never claim cloud data was synchronized, SMS delivered, or payment bank-verified
 * when running in local-only prototype mode.
 */

export interface CloudBoundaryStatus {
  mode: 'local_indexeddb_prototype';
  supabasePostgresConfigured: boolean;
  supabaseAuthConfigured: boolean;
  privateObjectStorageConfigured: boolean;
  smsGatewayConfigured: boolean;
  paymentProcessorConfigured: boolean;
  productionDisclaimers: string[];
}

export function getCloudBoundaryStatus(): CloudBoundaryStatus {
  const hasSupabaseUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  return {
    mode: 'local_indexeddb_prototype',
    supabasePostgresConfigured: hasSupabaseUrl && hasSupabaseAnonKey,
    supabaseAuthConfigured: hasSupabaseUrl && hasSupabaseAnonKey,
    privateObjectStorageConfigured: false,
    smsGatewayConfigured: false,
    paymentProcessorConfigured: false,
    productionDisclaimers: [
      'Local-Only Prototype: All records are persisted locally in your browser via IndexedDB (Dexie). No cloud synchronization occurs unless a live Supabase PostgreSQL backend is configured.',
      'Prototype Role Switcher: Switching between Owner, Manager, and Tenant roles in the top/settings bar is for prototype demonstration only and is not production cryptographic authorization.',
      'External Payments Only: Akarai records externally settled payments (Cash, EFT, ATM Deposit). Recording a payment does not independently verify bank settlement.',
      'Legal & POPIA Compliance: Agreement templates and data-handling workflows require review by a qualified South African legal practitioner before production deployment.',
    ],
  };
}
