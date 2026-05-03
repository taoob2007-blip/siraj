export interface Attachment {
  path: string   // Supabase Storage object path
  name: string   // Original filename
  size: number   // Bytes
  type: string   // MIME type
}

export interface RFQField {
  id: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select'
  required: boolean
  unit?: string
  options?: string[]
}

export const DEFAULT_RFQ_FIELDS: RFQField[] = [
  { id: 'price', label: 'Price', type: 'number', required: true, unit: '$' },
  { id: 'delivery_days', label: 'Delivery Days', type: 'number', required: true, unit: 'days' },
]

export interface CreateRFQRequest {
  title: string
  description?: string
  fields: RFQField[]
  suppliers: Array<{
    name: string
    email: string
  }>
  attachments?: Attachment[]
}

export interface CreateRFQResponse {
  success: boolean
  rfq_id: string
  invites: Array<{
    supplier_email: string
    link: string
  }>
}

export interface Supplier {
  name: string
  email: string
}

// ── File Analysis Types ────────────────────────────────────────────────────────

export interface RFQAnalysis {
  requirements:  string[]
  quantities:    string[]
  missing_info:  string[]
  improvements:  string[]
  summary:       string
}

export interface SupplierAnalysis {
  risk_score:         number                           // 0–100
  risk_level:         'low' | 'medium' | 'high'
  red_flags:          string[]
  pricing_analysis:   string
  delivery_analysis:  string
  recommendation:     'accept' | 'negotiate' | 'reject'
  summary:            string
}

export type FileAnalysisMode = 'rfq' | 'supplier'

export interface FileAnalysisResult {
  mode:        FileAnalysisMode
  rfq?:        RFQAnalysis
  supplier?:   SupplierAnalysis
  analyzed_at: string
  file_name:   string
}

export interface RFQFormData {
  title: string
  description: string
  fields: RFQField[]
  suppliers: Supplier[]
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 'rfq' | 'contract' | 'system'

export interface NotificationItem {
  id:         string
  user_id:    string
  title:      string
  message:    string
  type:       NotificationType
  read:       boolean
  created_at: string
}

// ── Profile ───────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'free' | 'pro'

export interface Profile {
  id:                  string
  full_name:           string | null
  company:             string | null
  role:                string | null
  updated_at:          string | null
  subscription_status: SubscriptionStatus
}
