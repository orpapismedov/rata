import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
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

export default app
