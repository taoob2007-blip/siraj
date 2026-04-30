export type ProjectType = 'construction' | 'medical' | 'tech' | 'general'

export interface ProjectTypeMeta {
  label: string
  icon: string
  focus: string
}

export const PROJECT_TYPE_META: Record<ProjectType, ProjectTypeMeta> = {
  construction: {
    label: 'Construction',
    icon: '🏗️',
    focus: 'Price 40% · Delivery 30% · Quality 30%',
  },
  medical: {
    label: 'Medical / Healthcare',
    icon: '🏥',
    focus: 'Quality 50% · Delivery 30% · Price 20%',
  },
  tech: {
    label: 'Technology',
    icon: '💻',
    focus: 'Delivery 40% · Price 30% · Quality 30%',
  },
  general: {
    label: 'General',
    icon: '📦',
    focus: 'Price 50% · Delivery 30% · Quality 20%',
  },
}

export function detectProjectType(title: string, description?: string | null): ProjectType {
  const text = (title + ' ' + (description ?? '')).toLowerCase()

  if (
    text.includes('اسمنت') ||
    text.includes('بناء') ||
    text.includes('construction') ||
    text.includes('cement') ||
    text.includes('concrete') ||
    text.includes('infrastructure')
  ) {
    return 'construction'
  }

  if (
    text.includes('طبي') ||
    text.includes('medical') ||
    text.includes('hospital') ||
    text.includes('clinic') ||
    text.includes('pharmaceutical') ||
    text.includes('healthcare')
  ) {
    return 'medical'
  }

  if (
    text.includes('برمجة') ||
    text.includes('software') ||
    text.includes('tech') ||
    text.includes('app') ||
    text.includes('system') ||
    text.includes('platform') ||
    text.includes('digital')
  ) {
    return 'tech'
  }

  return 'general'
}
