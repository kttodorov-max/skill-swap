import { getSession, isAdmin } from '../../services/authService.js'

const PUBLIC_PAGES = new Set([
  'index.html',
  'login.html',
  'register.html',
  'skill-detail.html',
])

const ALLOWED_REDIRECTS = new Set([
  'index.html',
  'profile.html',
  'skill-form.html',
  'skill-detail.html',
  'swap-requests.html',
  'admin.html',
])

export function getCurrentPage() {
  const page = window.location.pathname.split('/').pop()
  return page || 'index.html'
}

export function getSafeRedirectUrl(param, fallback = 'index.html') {
  if (!param) return fallback

  const page = param.split('?')[0]
  if (ALLOWED_REDIRECTS.has(page)) return param
  return fallback
}

export function isProtectedPage(page = getCurrentPage()) {
  return !PUBLIC_PAGES.has(page)
}

export async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession()

  if (!session) {
    const returnUrl = encodeURIComponent(getCurrentPage())
    window.location.replace(`${redirectTo}?redirect=${returnUrl}`)
    return null
  }

  return session
}

export async function requireAdmin(redirectTo = 'index.html') {
  const session = await requireAuth()

  if (!session) return null

  const admin = await isAdmin()

  if (!admin) {
    window.location.replace(redirectTo)
    return null
  }

  return session
}

export async function redirectIfAuthenticated(redirectTo = 'index.html') {
  const session = await getSession()

  if (session) {
    const params = new URLSearchParams(window.location.search)
    const target = getSafeRedirectUrl(params.get('redirect'), redirectTo)
    window.location.replace(target)
    return true
  }

  return false
}

export async function initProtectedPage(activePage, guardFn = requireAuth) {
  const session = await guardFn()
  if (!session) return null

  const { initNavbar } = await import('../components/navbar.js')
  await initNavbar(activePage)
  return session
}
