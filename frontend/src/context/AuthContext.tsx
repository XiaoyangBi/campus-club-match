import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasSupabaseEnv, supabase } from '../lib/supabaseClient'

type AuthContextValue = {
  isAuthEnabled: boolean
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  session: Session | null
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(hasSupabaseEnv)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthEnabled: hasSupabaseEnv,
      isLoading,
      isAuthenticated: hasSupabaseEnv ? Boolean(user) : true,
      user,
      session,
      async signInWithPassword(email: string, password: string) {
        if (!supabase) {
          return
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          throw error
        }
      },
      async signUpWithPassword(email: string, password: string) {
        if (!supabase) {
          return { requiresEmailConfirmation: false }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          throw error
        }

        return {
          requiresEmailConfirmation: !data.session,
        }
      },
      async signOut() {
        if (!supabase) {
          return
        }

        const { error } = await supabase.auth.signOut()
        if (error) {
          throw error
        }
      },
    }),
    [isLoading, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
