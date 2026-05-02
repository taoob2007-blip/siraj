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

export interface RFQFormData {
  title: string
  description: string
  fields: RFQField[]
  suppliers: Supplier[]
}
