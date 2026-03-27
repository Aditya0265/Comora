// ─── Firebase initialisation ──────────────────────────────────────────────────
// Fill in VITE_FIREBASE_* vars in .env when you are ready to switch.
// Nothing in this file is active until you swap AuthContext in App.jsx.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missingKeys.length > 0) {
  console.warn('[Firebase] Missing env vars:', missingKeys.join(', '))
}

const firebaseApp = initializeApp(firebaseConfig)

export const firebaseAuth    = getAuth(firebaseApp)
export const firebaseDB      = getFirestore(firebaseApp)
export const firebaseStorage = getStorage(firebaseApp)
export default firebaseApp
