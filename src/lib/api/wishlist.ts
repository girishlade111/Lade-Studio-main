import { supabase } from '@/lib/supabase'
import type { Wishlist, WishlistInsert } from '@/types/database'
import type { Product } from '@/types'

/**
 * Get user's wishlist with product details
 */
export async function getUserWishlist(): Promise<{ 
  data: (Wishlist & { products: Product })[] | null; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error('User must be authenticated to fetch wishlist')
    }

    // First get the wishlist items for the user
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (wishlistError) {
      throw new Error(wishlistError.message)
    }

    // If no wishlist items, return empty array
    if (!wishlistItems || wishlistItems.length === 0) {
      return { data: [], error: null }
    }

    // Get product IDs from wishlist items
    const productIds = wishlistItems.map(item => item.product_id)

    // Fetch products separately
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)

    if (productsError) {
      throw new Error(productsError.message)
    }

    // Combine wishlist items with product data
    const wishlistWithProducts = wishlistItems.map(wishlistItem => {
      const product = products.find(p => p.id === wishlistItem.product_id)
      return {
        ...wishlistItem,
        products: product || ({} as Product)
      }
    })

    return { data: wishlistWithProducts as any, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string): Promise<{ 
  data: Wishlist | null; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error('User must be authenticated to add items to wishlist')
    }

    const wishlistItem: WishlistInsert = {
      user_id: user.user.id,
      product_id: productId
    }

    const { data, error } = await (supabase as any)
      .from('wishlist')
      .insert(wishlistItem)
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate entry error
      if (error.code === '23505') {
        throw new Error('Product is already in your wishlist')
      }
      throw new Error(error.message)
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string): Promise<{ 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error('User must be authenticated to remove items from wishlist')
    }

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.user.id)
      .eq('product_id', productId)

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Toggle product in wishlist (add if not present, remove if present)
 */
export async function toggleWishlistItem(productId: string): Promise<{ 
  isInWishlist: boolean; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error('User must be authenticated to manage wishlist')
    }

    // Use the database function for atomic toggle operation
    const { data, error } = await (supabase as any).rpc('toggle_wishlist_item', {
      product_uuid: productId
    })

    if (error) {
      throw new Error(error.message)
    }

    return { isInWishlist: data, error: null }
  } catch (error) {
    return { isInWishlist: false, error: error as Error }
  }
}

/**
 * Check if product is in user's wishlist
 */
export async function isProductInWishlist(productId: string): Promise<{ 
  isInWishlist: boolean; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      return { isInWishlist: false, error: null }
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('product_id', productId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - not in wishlist
        return { isInWishlist: false, error: null }
      }
      throw new Error(error.message)
    }

    return { isInWishlist: !!data, error: null }
  } catch (error) {
    return { isInWishlist: false, error: error as Error }
  }
}

/**
 * Get wishlist count for user
 */
export async function getWishlistCount(): Promise<{ 
  count: number; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      return { count: 0, error: null }
    }

    const { count, error } = await supabase
      .from('wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user.id)

    if (error) {
      throw new Error(error.message)
    }

    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error: error as Error }
  }
}