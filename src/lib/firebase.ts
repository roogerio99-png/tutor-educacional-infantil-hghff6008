import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import firebaseConfig from '../../firebase-applet-config.json'

// Initialize Firebase SDK
export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(firebaseApp)

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId: string | undefined
    email: string | null | undefined
    emailVerified: boolean | undefined
    isAnonymous: boolean | undefined
    tenantId: string | null | undefined
    providerInfo: {
      providerId: string
      displayName: string | null
      email: string | null
      photoUrl: string | null
    }[]
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  return errInfo
}

// Validate connection to Firestore at boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.')
    }
  }
}
void testConnection()

export interface FamilyWorkspaceDoc {
  ownerId: string
  email: string
  name: string
  payloadJson: string
  createdAt: string
  updatedAt: string
}

/**
 * Saves an authenticated family's workspace collections into Firestore `/families/{userId}`
 */
export async function syncFamilyWorkspaceToCloud(params: {
  ownerId: string
  email: string
  name: string
  payload: Record<string, unknown>
}): Promise<boolean> {
  const currentUser = auth.currentUser
  if (!currentUser || currentUser.uid !== params.ownerId) {
    return false
  }

  const docPath = `families/${params.ownerId}`
  const docRef = doc(db, 'families', params.ownerId)
  const now = new Date().toISOString()

  try {
    const existingSnap = await getDoc(docRef)
    const createdAt = existingSnap.exists()
      ? String(existingSnap.data()?.createdAt || now)
      : now

    const payloadJson = JSON.stringify(params.payload)
    // Respect 900KB Firestore document payload limit
    if (payloadJson.length > 890000) {
      return false
    }

    const record: FamilyWorkspaceDoc = {
      ownerId: params.ownerId,
      email: (params.email || currentUser.email || 'responsavel@lumi.ia').slice(0, 250),
      name: (params.name || currentUser.displayName || 'Responsável Lumi').slice(0, 115),
      payloadJson,
      createdAt,
      updatedAt: now,
    }

    await setDoc(docRef, record)
    return true
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath)
    return false
  }
}

/**
 * Loads an authenticated family's workspace collections from Firestore `/families/{userId}`
 */
export async function loadFamilyWorkspaceFromCloud(
  ownerId: string,
): Promise<Record<string, any> | null> {
  const currentUser = auth.currentUser
  if (!currentUser || currentUser.uid !== ownerId) {
    return null
  }

  const docPath = `families/${ownerId}`
  try {
    const snap = await getDoc(doc(db, 'families', ownerId))
    if (!snap.exists()) return null
    const data = snap.data() as FamilyWorkspaceDoc
    if (!data?.payloadJson) return null
    return JSON.parse(data.payloadJson)
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath)
    return null
  }
}

/**
 * Subscribes in real time to an authenticated family's workspace in Firestore
 */
export function subscribeFamilyWorkspace(
  ownerId: string,
  onUpdate: (payload: Record<string, any>, updatedAt: string) => void,
): () => void {
  const currentUser = auth.currentUser
  if (!currentUser || currentUser.uid !== ownerId) {
    return () => {}
  }

  const docPath = `families/${ownerId}`
  const docRef = doc(db, 'families', ownerId)
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return
      const data = snap.data() as FamilyWorkspaceDoc
      if (!data?.payloadJson) return
      try {
        const parsed = JSON.parse(data.payloadJson)
        onUpdate(parsed, data.updatedAt)
      } catch {
        // ignore invalid json
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath)
    },
  )
}

/**
 * Authenticates a parent with Google Popup via Firebase Auth
 */
export async function signInParentWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  type FirebaseUser,
}
