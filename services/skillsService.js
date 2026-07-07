import { supabase } from './supabaseClient.js'

const SKILL_SELECT = `
  *,
  profiles (username, full_name, avatar_url),
  categories (name, slug)
`

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function fetchSkills({ type, categoryId, search, limit = 50 } = {}) {
  let query = supabase
    .from('skills')
    .select(SKILL_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('type', type)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchSkillById(skillId) {
  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_SELECT)
    .eq('id', skillId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchUserSkills(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createSkill(skill) {
  const { data, error } = await supabase
    .from('skills')
    .insert(skill)
    .select(SKILL_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateSkill(skillId, updates) {
  const { data, error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', skillId)
    .select(SKILL_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteSkill(skillId) {
  const { error } = await supabase.from('skills').delete().eq('id', skillId)
  if (error) throw error
}
