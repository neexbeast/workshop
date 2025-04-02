"use client"

import type React from "react"
import { createContext, useEffect, useState, useCallback } from "react"
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "./firebase-config"

export type UserRole = "admin" | "worker" | "client"

export interface User extends FirebaseUser {
  role: UserRole
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, role: UserRole) => Promise<User>
  signOut: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

const enhanceUserWithRole = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
  if (!firebaseUser) return null

  // Get the ID token result which includes custom claims
  const idTokenResult = await firebaseUser.getIdTokenResult()
  const role = (idTokenResult.claims.role as UserRole) || "client"

  return { ...firebaseUser, role } as User
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  signIn: async () => {
    throw new Error("AuthContext not initialized")
  },
  signUp: async () => {
    throw new Error("AuthContext not initialized")
  },
  signOut: async () => {
    throw new Error("AuthContext not initialized")
  },
  refreshToken: async () => {
    throw new Error("AuthContext not initialized")
  },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const refreshToken = useCallback(async () => {
    try {
      if (!firebaseUser) return null
      return await firebaseUser.getIdToken(true)
    } catch (err) {
      console.error("Token refresh error:", err)
      return null
    }
  }, [firebaseUser])

  useEffect(() => {
    console.log("Setting up auth state listener...")
    const unsubscribe = onAuthStateChanged(
      auth,
      async (newFirebaseUser) => {
        console.log("Auth state changed:", newFirebaseUser ? "User present" : "No user")
        setFirebaseUser(newFirebaseUser)
        const enhancedUser = await enhanceUserWithRole(newFirebaseUser)
        console.log("Enhanced user:", enhancedUser)
        setUser(enhancedUser)
        setLoading(false)
        setInitialized(true)
      },
      (error) => {
        console.error("Auth state change error:", error)
        setError(error.message)
        setLoading(false)
        setInitialized(true)
      }
    )

    return () => {
      console.log("Cleaning up auth state listener...")
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Attempting to sign in...")
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setFirebaseUser(userCredential.user)
      const userWithRole = await enhanceUserWithRole(userCredential.user)
      if (!userWithRole) throw new Error("Failed to enhance user with role")
      return userWithRole
    } catch (err) {
      console.error("Sign in error:", err)
      const error = err instanceof Error ? err.message : "Sign in failed"
      setError(error)
      throw new Error(error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Attempting to create new user...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      setFirebaseUser(userCredential.user)

      // Set custom claims via API
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to set user role")
      }

      // Force token refresh to get the new claims
      await userCredential.user.getIdToken(true)

      // Get the enhanced user with the new role
      const userWithRole = await enhanceUserWithRole(userCredential.user)
      if (!userWithRole) throw new Error("Failed to enhance user with role")
      return userWithRole
    } catch (err) {
      console.error("Sign up error:", err)
      const error = err instanceof Error ? err.message : "Sign up failed"
      setError(error)
      throw new Error(error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      setLoading(true)
      await firebaseSignOut(auth)
      setFirebaseUser(null)
      setUser(null)
    } catch (err) {
      console.error("Sign out error:", err)
      const error = err instanceof Error ? err.message : "Sign out failed"
      setError(error)
      throw new Error(error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything until the initial auth state is loaded
  if (!initialized) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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

