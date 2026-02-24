import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Admin detection is now handled via Firebase Custom Claims
// See auth-context.tsx - isAdmin is derived from idTokenResult.claims.admin
// To set a user as admin, use the Firebase Admin SDK (e.g., via an API route):
//
//   import { adminAuth } from '@/lib/firebase-admin';
//   await adminAuth.setCustomUserClaims(uid, { admin: true });
