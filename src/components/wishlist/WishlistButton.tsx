'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/context/wishlist-context'
import { useAuthContext } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  productId: string
  productName?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showText?: boolean
}

export function WishlistButton({ 
  productId, 
  productName = 'Product',
  size = 'md',
  variant = 'outline',
  className,
  showText = false
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuthContext()
  const { isInWishlist, toggleWishlist, loading } = useWishlist()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [localIsInWishlist, setLocalIsInWishlist] = useState(false)

  // Check initial wishlist status
  useEffect(() => {
    setLocalIsInWishlist(isInWishlist(productId))
  }, [productId, isInWishlist])

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if button is inside a link
    e.stopPropagation() // Prevent event bubbling
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your wishlist.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      await toggleWishlist(productId, productName)
      // Update local state after successful toggle
      setLocalIsInWishlist(!localIsInWishlist)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wishlist",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSize = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }[size]

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size]

  // Show loading state if either the context is loading or the button is processing
  const isProcessing = loading || isLoading

  return (
    <Button
      variant={variant}
      size={showText ? undefined : 'icon'}
      className={cn(showText ? '' : buttonSize, className)}
      onClick={handleToggleWishlist}
      disabled={isProcessing}
      title={localIsInWishlist ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
    >
      <Heart 
        className={cn(
          iconSize,
          localIsInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
          isProcessing && 'animate-pulse'
        )} 
      />
      {showText && (
        <span className="ml-2">
          {isProcessing 
            ? 'Updating...' 
            : localIsInWishlist 
              ? 'In Wishlist' 
              : 'Add to Wishlist'
          }
        </span>
      )}
    </Button>
  )
}