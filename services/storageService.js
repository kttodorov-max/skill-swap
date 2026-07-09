import { supabase } from './supabaseClient.js'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024
export const MAX_AVATAR_SIZE_MB = 2
export const MAX_SKILL_IMAGE_SIZE = 5 * 1024 * 1024
export const MAX_SKILL_IMAGE_SIZE_MB = 5

function validateImageFile(file, maxSize = MAX_FILE_SIZE) {
  if (!file) throw new Error('No file selected.')
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed.')
  }
  if (file.size > maxSize) {
    const limitMb = Math.round(maxSize / (1024 * 1024))
    throw new Error(`File must be up to ${limitMb} MB.`)
  }
}

function validateAvatarFile(file) {
  validateImageFile(file, MAX_AVATAR_SIZE)
}

function getFileExtension(file) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName

  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }

  return mimeMap[file.type] || 'jpg'
}

export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAvatar(userId, file) {
  validateAvatarFile(file)

  const extension = getFileExtension(file)
  const path = `${userId}/avatar.${extension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  return getPublicUrl('avatars', path)
}

export async function uploadSkillImage(userId, file, skillId = null) {
  validateImageFile(file, MAX_SKILL_IMAGE_SIZE)

  const extension = getFileExtension(file)
  const fileName = skillId ? `${skillId}.${extension}` : `${Date.now()}.${extension}`
  const path = `${userId}/${fileName}`

  const { error } = await supabase.storage
    .from('skill-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  return getPublicUrl('skill-images', path)
}

export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
