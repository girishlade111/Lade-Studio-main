'use client'

import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
      } else {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData?: { name?: string }) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('rate limit')) {
        errorMessage = 'Too many signup attempts. Please try again later.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message.includes('exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { user: null, error }
    }

    return { user: data.user, error: null }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in. Check your inbox for the confirmation email.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many login attempts. Please try again later.';
      }
      
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { user: null, error }
    }

    return { user: data.user, error: null }
  }

  // Sign out
  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
    }
    
    return { error }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    setAuthState(prev => ({ ...prev, loading: false }))
    
    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('rate limit')) {
        errorMessage = 'Too many password reset requests. Please try again later.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setAuthState(prev => ({ ...prev, error: errorMessage }))
      return { error }
    }

    return { error: null }
  }

  // Update password
  const updatePassword = async (password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.updateUser({ password })

    setAuthState(prev => ({ ...prev, loading: false }))
    
    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      
      setAuthState(prev => ({ ...prev, error: errorMessage }))
      return { error }
    }

    return { error: null }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!authState.user,
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  }
}