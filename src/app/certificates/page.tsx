'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Heart, 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Plane,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Certificate {
  id: string
  certificateNumber: string
  holderName: string
  issuedDate: string
  expiryDate: string
  status: 'valid' | 'expired' | 'expiring'
  issuingDoctor: string
  medicalFacility: string
  type: 'class1' | 'class2' | 'class3'
}

const mockCertificates: Certificate[] = [
  {
    id: '1',
    certificateNumber: 'MC-2024-001',
    holderName: 'John Smith',
    issuedDate: '2024-01-15',
    expiryDate: '2025-01-15',
    status: 'valid',
    issuingDoctor: 'Dr. Sarah Wilson',
    medicalFacility: 'Aviation Medical Center',
    type: 'class2'
  },
  {
    id: '2',
    certificateNumber: 'MC-2024-002',
    holderName: 'Sarah Johnson',
    issuedDate: '2024-02-20',
    expiryDate: '2025-02-20',
    status: 'valid',
    issuingDoctor: 'Dr. Michael Brown',
    medicalFacility: 'Central Medical Clinic',
    type: 'class1'
  },
  {
    id: '3',
    certificateNumber: 'MC-2023-015',
    holderName: 'Mike Brown',
    issuedDate: '2023-03-10',
    expiryDate: '2025-03-10',
    status: 'expiring',
    issuingDoctor: 'Dr. Emily Davis',
    medicalFacility: 'Aerospace Health Services',
    type: 'class3'
  }
]

export default function CertificatesPage() {
  const [certificates] = useState<Certificate[]>(mockCertificates)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expired' | 'expiring'>('all')

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.holderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.issuingDoctor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || certificate.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />
      case 'expiring':
        return <Calendar className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class1':
        return 'bg-red-100 text-red-800'
      case 'class2':
        return 'bg-yellow-100 text-yellow-800'
      case 'class3':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Plane className="h-8 w-8 text-black" />
                <span className="ml-2 text-xl font-bold text-black">UAV License Manager</span>
              </div>
            </div>
            
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/licenses" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Licenses
              </Link>
              <Link href="/certificates" className="text-black px-3 py-2 rounded-md text-sm font-medium">
                Certificates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black">Health Certificates</h1>
              <p className="text-gray-600 mt-1">Manage medical certificates for UAV pilots</p>
            </div>
            <button 
              onClick={() => console.log('Add certificate form')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'valid' | 'expired' | 'expiring')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="valid">Valid</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                </select>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Holder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issuing Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.map((certificate, index) => (
                    <motion.tr
                      key={certificate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Heart className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-black">{certificate.certificateNumber}</div>
                            <div className="text-sm text-gray-500">{certificate.medicalFacility}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1 bg-gray-50 rounded-full">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="ml-2">
                            <div className="text-sm text-black">{certificate.holderName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase',
                          getTypeColor(certificate.type)
                        )}>
                          {certificate.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{certificate.issuingDoctor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certificate.expiryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1',
                          getStatusColor(certificate.status)
                        )}>
                          {getStatusIcon(certificate.status)}
                          {certificate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                  <p className="text-2xl font-semibold text-black">{certificates.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valid Certificates</p>
                  <p className="text-2xl font-semibold text-black">
                    {certificates.filter(c => c.status === 'valid').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-semibold text-black">
                    {certificates.filter(c => c.status === 'expiring').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
