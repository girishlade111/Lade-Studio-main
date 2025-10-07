import { supabase } from '@/lib/supabase'
import type { UserAddress, UserAddressInsert, UserAddressUpdate } from '@/types/database'

/**
 * Get all addresses for the current user
 */
export async function getUserAddresses(): Promise<{ 
  data: UserAddress[] | null; 
  error: Error | null 
}> {
  try {
    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { data: addresses, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get user's default address
 */
export async function getUserDefaultAddress(): Promise<{ 
  data: UserAddress | null; 
  error: Error | null 
}> {
  try {
    const { data: address, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('is_default', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No default address found
        return { data: null, error: null }
      }
      throw new Error(error.message)
    }

    return { data: address, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Create a new address for the user
 */
export async function createUserAddress(
  addressData: Omit<UserAddressInsert, 'user_id'>
): Promise<{ data: UserAddress | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const newAddress: UserAddressInsert = {
      ...addressData,
      user_id: user.id
    }

    const { data: address, error } = await (supabase as any)
      .from('user_addresses')
      .insert(newAddress)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: address, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Update an existing address
 */
export async function updateUserAddress(
  addressId: string,
  updates: Omit<UserAddressUpdate, 'user_id' | 'id'>
): Promise<{ data: UserAddress | null; error: Error | null }> {
  try {
    const { data: address, error } = await (supabase as any)
      .from('user_addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: address, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Delete an address
 */
export async function deleteUserAddress(addressId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Set an address as default (and unset others)
 */
export async function setDefaultAddress(addressId: string): Promise<{ 
  data: UserAddress | null; 
  error: Error | null 
}> {
  try {
    const { data: address, error } = await (supabase as any)
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: address, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get address by ID
 */
export async function getAddressById(addressId: string): Promise<{ 
  data: UserAddress | null; 
  error: Error | null 
}> {
  try {
    const { data: address, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw new Error(error.message)
    }

    return { data: address, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}