'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomDatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  maxYearsFromNow: number
  required?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

export default function CustomDatePicker({
  value,
  onChange,
  maxYearsFromNow,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'DD/MM/YYYY'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>()
  const [selectedMonth, setSelectedMonth] = useState<number>()
  const [selectedDay, setSelectedDay] = useState<number>()
  const containerRef = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + maxYearsFromNow

  // Hebrew month names
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]

  // Initialize from value
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedYear(date.getFullYear())
      setSelectedMonth(date.getMonth() + 1)
      setSelectedDay(date.getDate())
    } else {
      // Default to current date
      const today = new Date()
      setSelectedYear(today.getFullYear())
      setSelectedMonth(today.getMonth() + 1)
      setSelectedDay(today.getDate())
    }
  }, [value])

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // Format display value
  const getDisplayValue = () => {
    if (!value) return ''
    const date = new Date(value)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Handle date selection
  const handleDateSelect = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
      onChange(dateString)
      setIsOpen(false)
    }
  }

  // Generate year options
  const yearOptions = []
  for (let year = currentYear; year <= maxYear; year++) {
    yearOptions.push(year)
  }

  // Generate day options
  const dayOptions = []
  if (selectedYear && selectedMonth) {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth - 1)
    for (let day = 1; day <= daysInMonth; day++) {
      dayOptions.push(day)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all cursor-pointer flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
          ${className}
        `}
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {getDisplayValue() || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Custom Date Picker */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 p-4"
          >
            <div className="space-y-4">
              {/* Year Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">שנה</label>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר שנה</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">חודש</label>
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר חודש</option>
                  {hebrewMonths.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">יום</label>
                <select
                  value={selectedDay || ''}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  disabled={!selectedYear || !selectedMonth}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">בחר יום</option>
                  {dayOptions.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDateSelect}
                  disabled={!selectedYear || !selectedMonth || !selectedDay}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
                >
                  אישור
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
