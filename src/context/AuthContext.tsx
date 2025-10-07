'use client'

import React, { createContext, useContext } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthState } from '@/hooks/useAuth'

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ user: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ user: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  isAuthenticated: boolean
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}