import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyA3smogMFlRvFMSjJbJiB10_vwtMPiEzAg",
  authDomain: "rata-9e69e.firebaseapp.com",
  projectId: "rata-9e69e",
  storageBucket: "rata-9e69e.firebasestorage.app",
  messagingSenderId: "778749184463",
  appId: "1:778749184463:web:1513cc7e0c28fc5ec6eaba",
  measurementId: "G-3FSNE2C27M"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Initialize Analytics only on client side
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

/**
 * Upload a license image - converts to base64 data URL
 * @param file - The image file to upload
 * @param pilotId - The pilot's ID (not used in base64 approach)
 * @param licenseType - Type of license ('pilot' or 'instructor')
 * @returns The base64 data URL of the image
 */
export async function uploadLicenseImage(
  file: File,
  pilotId: string,
  licenseType: 'pilot' | 'instructor'
): Promise<string> {
  try {
    // Convert file to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(file)
    })
  } catch (error) {
    console.error('Error converting license image:', error)
    throw new Error('Failed to process license image')
  }
}

/**
 * Delete a license image - no-op for base64 data URLs
 * @param imageUrl - The URL of the image to delete (base64 data URL)
 */
export async function deleteLicenseImage(imageUrl: string): Promise<void> {
  // No deletion needed for base64 data URLs stored in Firestore
  // The image data is deleted when the document is updated/deleted
  return Promise.resolve()
}

export default app
