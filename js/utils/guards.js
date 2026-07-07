import { getSession, isAdmin } from '../../services/authService.js'

export async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession()

  if (!session) {
    const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop())
    window.location.href = `${redirectTo}?redirect=${returnUrl}`
    return null
  }

  return session
}

export async function requireAdmin(redirectTo = 'index.html') {
  const session = await requireAuth()

  if (!session) return null

  const admin = await isAdmin()

  if (!admin) {
    window.location.href = redirectTo
    return null
  }

  return session
}

export async function redirectIfAuthenticated(redirectTo = 'index.html') {
  const session = await getSession()

  if (session) {
    window.location.href = redirectTo
    return true
  }

  return false
}
