import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

export interface Pilot {
  id?: string
  firstName: string
  lastName: string
  email: string
  rataCertification: 'IP' | 'EP' | 'BOTH'
  categories: string[]
  healthCertificateExpiry: Date
  isInstructor: boolean
  instructorLicenseExpiry?: Date
  restrictions: 'ללא' | 'שיגור והנצלה בלבד' | 'אחר'
  customRestrictions?: string
  createdAt: Date
  updatedAt?: Date
}

const COLLECTION_NAME = 'pilots'

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate()
  }
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000)
  }
  return new Date(timestamp as string | number | Date)
}

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date)
}

// Get all pilots from Firestore
export const getAllPilots = async (): Promise<Pilot[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        rataCertification: data.rataCertification,
        categories: data.categories || [data.category].filter(Boolean), // Handle backward compatibility
        healthCertificateExpiry: timestampToDate(data.healthCertificateExpiry),
        isInstructor: data.isInstructor,
        instructorLicenseExpiry: data.instructorLicenseExpiry ? timestampToDate(data.instructorLicenseExpiry) : undefined,
        restrictions: data.restrictions,
        customRestrictions: data.customRestrictions,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined
      } as Pilot
    })
  } catch (error) {
    console.error('Error fetching pilots:', error)
    throw error
  }
}

// Add a new pilot to Firestore
export const addPilot = async (pilot: Omit<Pilot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pilot> => {
  try {
    const pilotData = {
      firstName: pilot.firstName,
      lastName: pilot.lastName,
      email: pilot.email,
      rataCertification: pilot.rataCertification,
      categories: pilot.categories,
      healthCertificateExpiry: dateToTimestamp(pilot.healthCertificateExpiry),
      isInstructor: pilot.isInstructor,
      instructorLicenseExpiry: pilot.instructorLicenseExpiry ? dateToTimestamp(pilot.instructorLicenseExpiry) : null,
      restrictions: pilot.restrictions,
      customRestrictions: pilot.customRestrictions || '',
      createdAt: dateToTimestamp(new Date())
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), pilotData)
    
    return {
      id: docRef.id,
      ...pilot,
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Error adding pilot:', error)
    throw error
  }
}

// Update an existing pilot in Firestore
export const updatePilot = async (id: string, pilot: Omit<Pilot, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const pilotData = {
      firstName: pilot.firstName,
      lastName: pilot.lastName,
      email: pilot.email,
      rataCertification: pilot.rataCertification,
      categories: pilot.categories,
      healthCertificateExpiry: dateToTimestamp(pilot.healthCertificateExpiry),
      isInstructor: pilot.isInstructor,
      instructorLicenseExpiry: pilot.instructorLicenseExpiry ? dateToTimestamp(pilot.instructorLicenseExpiry) : null,
      restrictions: pilot.restrictions,
      customRestrictions: pilot.customRestrictions || '',
      updatedAt: dateToTimestamp(new Date())
    }

    await updateDoc(doc(db, COLLECTION_NAME, id), pilotData)
  } catch (error) {
    console.error('Error updating pilot:', error)
    throw error
  }
}

// Delete a pilot from Firestore
export const deletePilot = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
  } catch (error) {
    console.error('Error deleting pilot:', error)
    throw error
  }
}

// Initialize database with sample data (run this once)
export const initializeSampleData = async (): Promise<void> => {
  try {
    const samplePilots: Omit<Pilot, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        firstName: 'יוסי',
        lastName: 'כהן',
        email: 'yossi.cohen@example.com',
        rataCertification: 'IP',
        categories: ['כנף קבועה 25-2000 קג'],
        healthCertificateExpiry: new Date('2025-03-15'),
        isInstructor: true,
        instructorLicenseExpiry: new Date('2025-06-20'),
        restrictions: 'ללא'
      },
      {
        firstName: 'שרה',
        lastName: 'לוי',
        email: 'sara.levi@example.com',
        rataCertification: 'EP',
        categories: ['רחפן 0-25 קג'],
        healthCertificateExpiry: new Date('2025-02-10'),
        isInstructor: false,
        restrictions: 'ללא'
      },
      {
        firstName: 'דוד',
        lastName: 'אברהם',
        email: 'david.abraham@example.com',
        rataCertification: 'BOTH',
        categories: ['עילוי ממונע VTOL', 'כנף קבועה 25-2000 קג'],
        healthCertificateExpiry: new Date('2025-01-30'),
        isInstructor: true,
        instructorLicenseExpiry: new Date('2025-04-15'),
        restrictions: 'שיגור והנצלה בלבד'
      },
      {
        firstName: 'מיכל',
        lastName: 'ישראלי',
        email: 'michal.israeli@example.com',
        rataCertification: 'IP',
        categories: ['כנף קבועה דו מנועי 25-2000 קג', 'כנף קבועה 25-2000 קג'],
        healthCertificateExpiry: new Date('2024-12-01'),
        isInstructor: true,
        instructorLicenseExpiry: new Date('2024-11-15'),
        restrictions: 'ללא'
      },
      {
        firstName: 'אבי',
        lastName: 'שמש',
        email: 'avi.shemesh@example.com',
        rataCertification: 'EP',
        categories: ['רחפן 25-2000 קג', 'רחפן 0-25 קג'],
        healthCertificateExpiry: new Date('2025-08-20'),
        isInstructor: true,
        instructorLicenseExpiry: new Date('2025-08-10'),
        restrictions: 'ללא'
      }
    ]

    for (const pilot of samplePilots) {
      await addPilot(pilot)
    }
    
    console.log('Sample data initialized successfully!')
  } catch (error) {
    console.error('Error initializing sample data:', error)
    throw error
  }
}
