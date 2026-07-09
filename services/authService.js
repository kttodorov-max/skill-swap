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

export async function getAuthContext() {
  const session = await getSession()

  if (!session?.user) {
    return {
      session: null,
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    }
  }

  const [profile, role] = await Promise.all([
    getProfile(session.user.id),
    getUserRole(session.user.id),
  ])

  return {
    session,
    user: session.user,
    profile,
    role,
    isAuthenticated: true,
    isAdmin: role === 'admin',
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) throw error
}

export async function waitForProfile(userId, maxAttempts = 6) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const profile = await getProfile(userId)
    if (profile) return profile
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  return null
}

export async function register({ email, password, username, fullName = '' }) {
  const data = await signUp({ email, password, username, fullName })

  if (data.user && data.session) {
    const profile = await waitForProfile(data.user.id)
    return { ...data, profile }
  }

  return data
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

export async function login({ email, password }) {
  return signIn({ email, password })
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function logout() {
  await signOut()
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
