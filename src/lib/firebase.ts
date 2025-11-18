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
 * Upload a license image to Firebase Storage
 * @param file - The image file to upload
 * @param pilotId - The pilot's ID
 * @param licenseType - Type of license ('pilot' or 'instructor')
 * @returns The download URL of the uploaded image
 */
export async function uploadLicenseImage(
  file: File,
  pilotId: string,
  licenseType: 'pilot' | 'instructor'
): Promise<string> {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `license-images/${pilotId}/${licenseType}-${timestamp}-${sanitizedFileName}`
    
    // Create storage reference
    const storageRef = ref(storage, storagePath)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading license image:', error)
    throw new Error('Failed to upload license image')
  }
}

/**
 * Delete a license image from Firebase Storage
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteLicenseImage(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl) return
    
    // Extract storage path from URL
    const storagePath = imageUrl.split('/o/')[1]?.split('?')[0]
    if (!storagePath) return
    
    const decodedPath = decodeURIComponent(storagePath)
    const storageRef = ref(storage, decodedPath)
    
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting license image:', error)
    // Don't throw error - deletion failure shouldn't block other operations
  }
}

export default app
