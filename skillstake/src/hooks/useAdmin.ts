import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface AdminUser {
  id: string
  email: string
  username: string
  is_admin: boolean
  role: string
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAdmin(false)
          setAdminUser(null)
          setLoading(false)
          return
        }

        // Check if user is admin
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, email, username, is_admin, role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
          setAdminUser(null)
        } else {
          const isUserAdmin = userData?.is_admin === true
          setIsAdmin(isUserAdmin)
          setAdminUser(isUserAdmin ? userData : null)
        }
      } catch (err) {
        console.error('Error in useAdmin:', err)
        setIsAdmin(false)
        setAdminUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAdmin(false)
        setAdminUser(null)
      } else {
        checkAdminStatus()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { isAdmin, adminUser, loading }
}
