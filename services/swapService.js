import { supabase } from './supabaseClient.js'

const SWAP_SELECT = `
  *,
  requester:profiles!swap_requests_requester_id_fkey (id, username, full_name, avatar_url, contact_info),
  recipient:profiles!swap_requests_recipient_id_fkey (id, username, full_name, avatar_url, contact_info),
  offered_skill:skills!swap_requests_offered_skill_id_fkey (id, title, type),
  requested_skill:skills!swap_requests_requested_skill_id_fkey (id, title, type)
`

export async function fetchMySwapRequests(userId) {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchIncomingRequests(userId) {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchOutgoingRequests(userId) {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('requester_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createSwapRequest(request) {
  const { data, error } = await supabase
    .from('swap_requests')
    .insert(request)
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateSwapRequestStatus(requestId, status) {
  const { data, error } = await supabase
    .from('swap_requests')
    .update({ status })
    .eq('id', requestId)
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteSwapRequest(requestId) {
  const { error } = await supabase.from('swap_requests').delete().eq('id', requestId)
  if (error) throw error
}

export async function countPendingIncoming(userId) {
  const { count, error } = await supabase
    .from('swap_requests')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('status', 'pending')

  if (error) throw error
  return count || 0
}
