import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

export interface ManagerEmail {
  id: string
  name: string
  email: string
  position: string
  createdAt: Date
}

export interface ManagerEmailInput {
  name: string
  email: string
  position: string
}

const COLLECTION_NAME = 'managerEmails'

export async function getManagerEmails(): Promise<ManagerEmail[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const managerEmails: ManagerEmail[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      managerEmails.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        position: data.position || '',
        createdAt: data.createdAt?.toDate() || new Date()
      })
    })
    
    return managerEmails
  } catch (error) {
    console.error('Error getting manager emails:', error)
    throw new Error('Failed to fetch manager emails')
  }
}

export async function addManagerEmail(managerData: ManagerEmailInput): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...managerData,
      createdAt: serverTimestamp()
    })
    
    console.log('Manager email added with ID: ', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding manager email:', error)
    throw new Error('Failed to add manager email')
  }
}

export async function updateManagerEmail(id: string, managerData: ManagerEmailInput): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...managerData,
      updatedAt: serverTimestamp()
    })
    
    console.log('Manager email updated: ', id)
  } catch (error) {
    console.error('Error updating manager email:', error)
    throw new Error('Failed to update manager email')
  }
}

export async function deleteManagerEmail(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
    console.log('Manager email deleted: ', id)
  } catch (error) {
    console.error('Error deleting manager email:', error)
    throw new Error('Failed to delete manager email')
  }
}

// Function to get all manager email addresses for sending notifications
export async function getManagerEmailAddresses(): Promise<string[]> {
  try {
    const managerEmails = await getManagerEmails()
    return managerEmails.map(manager => manager.email)
  } catch (error) {
    console.error('Error getting manager email addresses:', error)
    return []
  }
}
