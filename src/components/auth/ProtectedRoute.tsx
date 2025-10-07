'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  requireAuth?: boolean
  title?: string
  description?: string
  showModal?: boolean
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true,
  title = "Authentication Required",
  description = "Please sign in to access this page.",
  showModal = true
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated && showModal) {
      setShowAuthModal(true)
    }
  }, [loading, requireAuth, isAuthenticated, showModal])

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If auth is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <>
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                {showModal ? 'The sign-in dialog will open automatically.' : 'Please sign in to continue.'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {showModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)}
            title={title}
            description={description}
          />
        )}
      </>
    )
  }

  // User is authenticated or auth is not required
  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}