"use client"

import type React from "react"
import { createContext, useEffect, useState, useCallback } from "react"
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import { auth } from "./firebase-config"

export type UserRole = "admin" | "worker" | "client"

export interface User extends FirebaseUser {
  role: UserRole
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, role: UserRole) => Promise<User>
  signOut: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

// Helper functions for role management
const getRoleFromDisplayName = (displayName: string | null): UserRole => {
  console.log("Getting role from displayName:", displayName)
  if (!displayName) return "client"

  // Format is expected to be "role:value"
  const parts = displayName.split(":")
  const rolePart = parts[0]
  console.log("Extracted role part:", rolePart)

  if (rolePart === "admin" || rolePart === "worker") {
    return rolePart
  }
  return "client"
}

const createDisplayNameWithRole = (role: UserRole): string => {
  return `${role}:user`
}

const enhanceUserWithRole = (firebaseUser: FirebaseUser): User => {
  const role = getRoleFromDisplayName(firebaseUser.displayName)
  return { ...firebaseUser, role } as User
}

// Default context value with actual implementations
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  signIn: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return enhanceUserWithRole(userCredential.user)
  },
  signUp: async (email: string, password: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, {
      displayName: createDisplayNameWithRole(role),
    })
    return { ...userCredential.user, role } as User
  },
  signOut: async () => {
    await firebaseSignOut(auth)
  },
  refreshToken: async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return null
    return await currentUser.getIdToken(true)
  },
}

export const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshToken = useCallback(async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return null
      return await currentUser.getIdToken(true)
    } catch (err) {
      console.error("Token refresh error:", err)
      return null
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("Auth state changed: User is signed in", firebaseUser)
          console.log("User display name:", firebaseUser.displayName)
          const userWithRole = enhanceUserWithRole(firebaseUser)
          console.log("Enhanced user with role:", userWithRole.role)
          setUser(userWithRole)
        } else {
          console.log("Auth state changed: User is signed out")
          setUser(null)
        }
      } catch (err) {
        console.error("Error in auth state change:", err)
        setError(err instanceof Error ? err.message : "Authentication error")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      console.log("Attempting to sign in...")
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Sign in successful")
      const userWithRole = enhanceUserWithRole(userCredential.user)
      return userWithRole
    } catch (err) {
      console.error("Sign in error:", err)
      const error = err instanceof Error ? err.message : "Sign in failed"
      setError(error)
      throw new Error(error)
    }
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      setError(null)
      console.log("Attempting to create new user...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      await updateProfile(userCredential.user, {
        displayName: createDisplayNameWithRole(role),
      })

      console.log("User created with role:", role)
      const userWithRole = { ...userCredential.user, role } as User
      return userWithRole
    } catch (err) {
      console.error("Sign up error:", err)
      const error = err instanceof Error ? err.message : "Sign up failed"
      setError(error)
      throw new Error(error)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      await firebaseSignOut(auth)
    } catch (err) {
      console.error("Sign out error:", err)
      const error = err instanceof Error ? err.message : "Sign out failed"
      setError(error)
      throw new Error(error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

