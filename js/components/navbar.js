import { getAuthContext, logout } from '../../services/authService.js'

const PUBLIC_PAGES = [
  { id: 'main', href: 'index.html', label: 'Начало', icon: 'bi-house' },
]

const AUTH_PAGES = [
  { id: 'profile', href: 'profile.html', label: 'Профил', icon: 'bi-person' },
  { id: 'skillForm', href: 'skill-form.html', label: 'Добави умение', icon: 'bi-plus-circle' },
  { id: 'swapRequests', href: 'swap-requests.html', label: 'Заявки', icon: 'bi-arrow-left-right' },
]

const ADMIN_PAGE = {
  id: 'admin',
  href: 'admin.html',
  label: 'Админ',
  icon: 'bi-shield-lock',
}

function renderNavItem(page, activePage) {
  return `
    <li class="nav-item">
      <a class="nav-link${activePage === page.id ? ' active' : ''}" href="${page.href}">
        <i class="bi ${page.icon} me-1"></i>${page.label}
      </a>
    </li>
  `
}

function renderGuestActions(activePage) {
  return `
    <li class="nav-item">
      <a class="nav-link${activePage === 'login' ? ' active' : ''}" href="login.html">
        <i class="bi bi-box-arrow-in-right me-1"></i>Вход
      </a>
    </li>
    <li class="nav-item">
      <a class="btn btn-primary btn-sm ms-lg-2 mt-2 mt-lg-0${activePage === 'register' ? ' active' : ''}" href="register.html">
        Регистрация
      </a>
    </li>
  `
}

function renderUserActions(auth, activePage) {
  const displayName = auth.profile?.username || auth.user?.email || 'Профил'
  const avatar = auth.profile?.avatar_url

  return `
    <li class="nav-item dropdown">
      <a
        class="nav-link dropdown-toggle d-flex align-items-center gap-2${activePage === 'profile' ? ' active' : ''}"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        ${
          avatar
            ? `<img src="${avatar}" alt="" class="rounded-circle" width="28" height="28" style="object-fit: cover;">`
            : '<i class="bi bi-person-circle"></i>'
        }
        <span>${displayName}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li>
          <a class="dropdown-item" href="profile.html">
            <i class="bi bi-person me-2"></i>Моят профил
          </a>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <button type="button" class="dropdown-item text-danger" data-logout>
            <i class="bi bi-box-arrow-right me-2"></i>Изход
          </button>
        </li>
      </ul>
    </li>
  `
}

export function renderNavbar(activePage = '', auth = { isAuthenticated: false, isAdmin: false }) {
  const pages = [...PUBLIC_PAGES]

  if (auth.isAuthenticated) {
    pages.push(...AUTH_PAGES)
    if (auth.isAdmin) pages.push(ADMIN_PAGE)
  }

  const navLinks = pages.map((page) => renderNavItem(page, activePage)).join('')
  const authActions = auth.isAuthenticated
    ? renderUserActions(auth, activePage)
    : renderGuestActions(activePage)

  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div class="container">
        <a class="navbar-brand text-primary" href="index.html">
          <i class="bi bi-lightning-charge-fill me-1"></i>SkillSwap
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Превключи навигацията"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navLinks}
          </ul>
          <ul class="navbar-nav ms-auto align-items-lg-center">
            ${authActions}
          </ul>
        </div>
      </div>
    </nav>
  `
}

export async function initNavbar(activePage = '') {
  const container = document.getElementById('navbar')
  if (!container) return null

  const auth = await getAuthContext()
  container.innerHTML = renderNavbar(activePage, auth)

  const logoutButton = container.querySelector('[data-logout]')
  logoutButton?.addEventListener('click', async (event) => {
    event.preventDefault()

    try {
      await logout()
      window.location.href = 'index.html'
    } catch (error) {
      console.error('Logout failed:', error)
      alert('Изходът не бе успешен. Опитайте отново.')
    }
  })

  return auth
}
