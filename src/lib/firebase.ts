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
 * Upload a license image - compresses and converts to base64 data URL
 * @param file - The image file to upload
 * @param pilotId - The pilot's ID (not used in base64 approach)
 * @param licenseType - Type of license ('pilot' or 'instructor')
 * @returns The base64 data URL of the compressed image
 */
export async function uploadLicenseImage(
  file: File,
  pilotId: string,
  licenseType: 'pilot' | 'instructor'
): Promise<string> {
  try {
    // Compress image before converting to base64
    // Using 0.5 quality and 800px max to ensure we stay well under 1MB limit
    // Even with base64 encoding overhead (~33% increase), this keeps us safe
    const compressedFile = await compressImage(file, 0.5, 800) // 50% quality, max 800px
    
    // Convert compressed file to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        console.log(`Image compressed: ${Math.round(result.length / 1024)}KB`)
        resolve(result)
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(compressedFile)
    })
  } catch (error) {
    console.error('Error converting license image:', error)
    throw new Error('Failed to process license image')
  }
}

/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @param quality - Compression quality (0-1)
 * @param maxWidth - Maximum width in pixels
 * @returns Compressed image as Blob
 */
async function compressImage(file: File, quality: number = 0.7, maxWidth: number = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Resize if image is too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert canvas to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Create a new File from the blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            
            console.log(`Original: ${Math.round(file.size / 1024)}KB → Compressed: ${Math.round(compressedFile.size / 1024)}KB`)
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
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
