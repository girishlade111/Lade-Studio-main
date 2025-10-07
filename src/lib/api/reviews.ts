import { supabase } from '@/lib/supabase'
import type { Review, ReviewInsert } from '@/types/database'
import { supabaseReviewToLegacy } from '@/types'
import type { Review as LegacyReview } from '@/types'

/**
 * Check if the current user has purchased and received the product
 */
export async function canUserReviewProduct(productId: string): Promise<{ 
  canReview: boolean; 
  reason?: string; 
  error: Error | null 
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        canReview: false, 
        reason: 'You must be signed in to write a review', 
        error: null 
      }
    }

    // Get user's profile information (phone/name) to match with orders
    const userPhone = user.user_metadata?.phone || user.phone
    const userName = user.user_metadata?.name || user.email?.split('@')[0]
    
    if (!userPhone && !userName) {
      return { 
        canReview: false, 
        reason: 'Unable to verify purchase history. Please contact support.', 
        error: null 
      }
    }

    // Check if user has any delivered orders containing this product
    const { data: orders, error: ordersError } = await (supabase as any)
      .from('orders')
      .select(`
        id,
        status,
        customer_phone,
        customer_name,
        order_items!inner (
          product_id
        )
      `)
      .eq('status', 'Delivered')
      .eq('order_items.product_id', productId)

    if (ordersError) {
      throw new Error(ordersError.message)
    }

    if (!orders || orders.length === 0) {
      return { 
        canReview: false, 
        reason: 'You can only review products you have purchased and received', 
        error: null 
      }
    }

    // Check if any of the delivered orders match the user's phone or name
    const hasMatchingOrder = (orders as any[]).some((order: any) => 
      (userPhone && order.customer_phone === userPhone) ||
      (userName && order.customer_name === userName)
    )

    if (!hasMatchingOrder) {
      return { 
        canReview: false, 
        reason: 'You can only review products you have purchased and received', 
        error: null 
      }
    }

    // Check if user has reached the review limit (10 reviews per product)
    const userEmail = user.email
    const { data: existingReviews, error: reviewError } = await (supabase as any)
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .or(`author_name.eq.${userName},author_name.eq.${userEmail}`)

    if (reviewError) {
      throw new Error(reviewError.message)
    }

    if (existingReviews && existingReviews.length >= 10) {
      return { 
        canReview: false, 
        reason: 'You have reached the maximum limit of 10 reviews for this product', 
        error: null 
      }
    }

    return { canReview: true, error: null }
  } catch (error) {
    return { 
      canReview: false, 
      reason: 'Error checking review eligibility', 
      error: error as Error 
    }
  }
}

/**
 * Check if user can edit a specific review
 */
export async function canUserEditReview(reviewId: string): Promise<{ 
  canEdit: boolean; 
  reason?: string; 
  error: Error | null 
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        canEdit: false, 
        reason: 'You must be signed in to edit a review', 
        error: null 
      }
    }

    // Get the review to check ownership
    const { data: review, error: reviewError } = await (supabase as any)
      .from('reviews')
      .select('author_name, product_id')
      .eq('id', reviewId)
      .single()

    if (reviewError) {
      return { 
        canEdit: false, 
        reason: 'Review not found', 
        error: new Error(reviewError.message) 
      }
    }

    // Check if the user is the author of this review
    const userName = user.user_metadata?.name || user.email?.split('@')[0]
    const userEmail = user.email
    
    const isOwner = review.author_name === userName || review.author_name === userEmail
    
    if (!isOwner) {
      return { 
        canEdit: false, 
        reason: 'You can only edit your own reviews', 
        error: null 
      }
    }

    return { canEdit: true, error: null }
  } catch (error) {
    return { 
      canEdit: false, 
      reason: 'Error checking edit permission', 
      error: error as Error 
    }
  }
}

/**
 * Update a review (with ownership verification and image support)
 */
export async function updateProductReview(
  reviewId: string,
  rating: number,
  comment?: string,
  imageUrls?: string[]
): Promise<{ data: Review | null; error: Error | null }> {
  try {
    // First check if user can edit this review
    const { canEdit, reason, error: editError } = await canUserEditReview(reviewId)
    
    if (editError) {
      throw new Error(`Permission check failed: ${editError.message}`);
    }
    
    if (!canEdit) {
      throw new Error(reason || 'You are not authorized to edit this review');
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Validate comment length
    if (comment && comment.length > 1000) {
      throw new Error('Comment must be less than 1000 characters');
    }
    
    // Validate image URLs
    if (imageUrls && imageUrls.length > 5) {
      throw new Error('Maximum 5 images allowed');
    }
    
    // Validate image URL format
    if (imageUrls) {
      for (const url of imageUrls) {
        try {
          new URL(url);
        } catch {
          throw new Error('Invalid image URL provided');
        }
      }
    }

    const updateData = {
      rating,
      comment: comment || null,
      image_urls: imageUrls || []
    }

    const { data: review, error } = await (supabase as any)
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('constraint')) {
        errorMessage = 'Invalid data provided. Please check your input.';
      }
      
      throw new Error(errorMessage);
    }

    return { data: review, error: null }
  } catch (error) {
    console.error("Review update error:", error);
    return { data: null, error: error as Error }
  }
}

/**
 * Get user's reviews for a specific product (multiple reviews allowed)
 */
export async function getUserReviewsForProduct(productId: string): Promise<{ 
  data: Review[] | null; 
  error: Error | null 
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { data: null, error: new Error('You must be signed in') }
    }

    const userName = user.user_metadata?.name || user.email?.split('@')[0]
    const userEmail = user.email

    const { data: reviews, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .or(`author_name.eq.${userName},author_name.eq.${userEmail}`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { data: reviews || [], error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get user's review for a specific product (legacy - returns single review)
 */
export async function getUserReviewForProduct(productId: string): Promise<{ 
  data: Review | null; 
  error: Error | null 
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { data: null, error: new Error('You must be signed in') }
    }

    const userName = user.user_metadata?.name || user.email?.split('@')[0]
    const userEmail = user.email

    const { data: review, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .or(`author_name.eq.${userName},author_name.eq.${userEmail}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No review found
        return { data: null, error: null }
      }
      throw new Error(error.message)
    }

    return { data: review, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string): Promise<{ data: LegacyReview[] | null; error: Error | null }> {
  try {
    const { data: reviews, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    if (!reviews) {
      return { data: [], error: null }
    }

    // Convert to legacy format
    const legacyReviews = (reviews as any[]).map(supabaseReviewToLegacy)

    return { data: legacyReviews, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Add a review for a product (with purchase verification and image support)
 */
export async function addProductReview(
  productId: string,
  authorName: string,
  rating: number,
  comment?: string,
  imageUrls?: string[]
): Promise<{ data: Review | null; error: Error | null }> {
  try {
    // First check if user can review this product
    const { canReview, reason, error: eligibilityError } = await canUserReviewProduct(productId)
    
    if (eligibilityError) {
      throw eligibilityError
    }
    
    if (!canReview) {
      throw new Error(reason || 'You are not eligible to review this product')
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const reviewData: ReviewInsert = {
      product_id: productId,
      author_name: authorName,
      rating,
      comment: comment || null,
      image_urls: imageUrls || []
    }

    const { data: review, error } = await (supabase as any)
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: review, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get user's review count for a specific product
 */
export async function getUserReviewCount(productId: string): Promise<{ 
  data: { count: number; remaining: number } | null; 
  error: Error | null 
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { data: null, error: new Error('You must be signed in') }
    }

    const userName = user.user_metadata?.name || user.email?.split('@')[0]
    const userEmail = user.email

    const { data: reviews, error } = await (supabase as any)
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .or(`author_name.eq.${userName},author_name.eq.${userEmail}`)

    if (error) {
      throw new Error(error.message)
    }

    const count = reviews?.length || 0
    const remaining = Math.max(0, 10 - count)

    return { data: { count, remaining }, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get average rating for a product
 */
export async function getProductAverageRating(productId: string): Promise<{ 
  data: { average: number; count: number } | null; 
  error: Error | null 
}> {
  try {
    const { data: reviews, error } = await (supabase as any)
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)

    if (error) {
      throw new Error(error.message)
    }

    if (!reviews || reviews.length === 0) {
      return { data: { average: 0, count: 0 }, error: null }
    }

    const average = (reviews as any[]).reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    
    return { 
      data: { 
        average: Math.round(average * 10) / 10, // Round to 1 decimal place
        count: reviews.length 
      }, 
      error: null 
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Delete a review (Admin function or user who created it)
 */
export async function deleteReview(reviewId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await (supabase as any)
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}