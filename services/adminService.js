import { supabase } from './supabaseClient.js'

const PROFILE_SELECT = `
  *,
  user_roles (role)
`

const SKILL_SELECT = `
  *,
  profiles (username, full_name),
  categories (name)
`

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchAllSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from('user_roles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function adminDeleteSkill(skillId) {
  const { error } = await supabase.from('skills').delete().eq('id', skillId)
  if (error) throw error
}

export async function createCategory({ name, slug }) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)
  if (error) throw error
}

export async function adminDeleteProfile(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}
