export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

export interface License {
  id: string
  userId: string
  type: 'internal' | 'external'
  licenseNumber: string
  issuedDate: Date
  expiryDate: Date
  issuingAuthority: string
  status: 'active' | 'expired' | 'suspended'
  documentUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface HealthCertificate {
  id: string
  userId: string
  certificateNumber: string
  issuedDate: Date
  expiryDate: Date
  issuingDoctor: string
  medicalFacility: string
  status: 'valid' | 'expired' | 'revoked'
  documentUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'license_expiry' | 'certificate_expiry' | 'renewal_reminder'
  title: string
  message: string
  relatedDocumentId: string
  relatedDocumentType: 'license' | 'certificate'
  isRead: boolean
  scheduledDate: Date
  sentDate?: Date
  createdAt: Date
}

export interface Document {
  id: string
  userId: string
  relatedId: string
  relatedType: 'license' | 'certificate'
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  uploadedAt: Date
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'good'

export interface DashboardStats {
  totalLicenses: number
  activeLicenses: number
  expiredLicenses: number
  totalCertificates: number
  validCertificates: number
  expiredCertificates: number
  upcomingExpirations: number
  pendingNotifications: number
}
