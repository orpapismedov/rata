'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface LicenseImageModalProps {
  isOpen: boolean
  onClose: () => void
  pilotLicenseUrl?: string
  instructorLicenseUrl?: string
  pilotName: string
}

export default function LicenseImageModal({
  isOpen,
  onClose,
  pilotLicenseUrl,
  instructorLicenseUrl,
  pilotName
}: LicenseImageModalProps) {
  if (!isOpen) return null

  const hasImages = pilotLicenseUrl || instructorLicenseUrl
  if (!hasImages) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 
                       bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 
                       flex flex-col max-w-6xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                רישיונות - {pilotName}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="סגור"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className={`grid gap-6 ${pilotLicenseUrl && instructorLicenseUrl ? 'md:grid-cols-2' : 'grid-cols-1 place-items-center'}`}>
                
                {/* Pilot License Image */}
                {pilotLicenseUrl && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
                      רישיון מטיס
                    </h3>
                    <div className="relative group">
                      <img
                        src={pilotLicenseUrl}
                        alt="רישיון מטיס"
                        className="w-full h-auto rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700
                                   hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300
                                   max-h-[60vh] object-contain bg-gray-50 dark:bg-gray-900"
                      />
                      <a
                        href={pilotLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 
                                   rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 
                                   transition-opacity duration-200"
                      >
                        פתח בטאב חדש
                      </a>
                    </div>
                  </div>
                )}

                {/* Instructor License Image */}
                {instructorLicenseUrl && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
                      רישיון מדריך
                    </h3>
                    <div className="relative group">
                      <img
                        src={instructorLicenseUrl}
                        alt="רישיון מדריך"
                        className="w-full h-auto rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700
                                   hover:border-green-500 dark:hover:border-green-400 transition-all duration-300
                                   max-h-[60vh] object-contain bg-gray-50 dark:bg-gray-900"
                      />
                      <a
                        href={instructorLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 
                                   rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 
                                   transition-opacity duration-200"
                      >
                        פתח בטאב חדש
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                           text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                סגור
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
