import { supabase } from './supabaseClient.js'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error
  return data.session
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) throw error
  return data.user
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.role ?? null
}

export async function isAdmin(userId) {
  const id = userId ?? (await getCurrentUser())?.id
  if (!id) return false

  const role = await getUserRole(id)
  return role === 'admin'
}

export async function signUp({ email, password, username, fullName = '' }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
