'use client'

import { useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'

export function useProtectedAction() {
  const { isAuthenticated } = useAuthContext()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const executeProtectedAction = (action: () => void, requireAuth: boolean = true) => {
    if (requireAuth && !isAuthenticated) {
      setShowAuthModal(true)
      return false
    }
    
    action()
    return true
  }

  return {
    executeProtectedAction,
    showAuthModal,
    setShowAuthModal,
    isAuthenticated
  }
}