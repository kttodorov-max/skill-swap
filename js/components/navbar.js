export function renderNavbar(activePage = '') {
  const pages = [
    { id: 'main', href: 'index.html', label: 'Начало', icon: 'bi-house' },
    { id: 'profile', href: 'profile.html', label: 'Профил', icon: 'bi-person' },
    { id: 'skillForm', href: 'skill-form.html', label: 'Добави умение', icon: 'bi-plus-circle' },
    { id: 'swapRequests', href: 'swap-requests.html', label: 'Заявки', icon: 'bi-arrow-left-right' },
    { id: 'admin', href: 'admin.html', label: 'Админ', icon: 'bi-shield-lock' },
  ]

  const navLinks = pages
    .map(
      (page) => `
        <li class="nav-item">
          <a class="nav-link${activePage === page.id ? ' active' : ''}" href="${page.href}">
            <i class="bi ${page.icon} me-1"></i>${page.label}
          </a>
        </li>
      `
    )
    .join('')

  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div class="container">
        <a class="navbar-brand text-primary" href="index.html">
          <i class="bi bi-lightning-charge-fill me-1"></i>SkillSwap
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navLinks}
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link${activePage === 'login' ? ' active' : ''}" href="login.html">
                <i class="bi bi-box-arrow-in-right me-1"></i>Вход
              </a>
            </li>
            <li class="nav-item">
              <a class="btn btn-primary btn-sm ms-lg-2 mt-2 mt-lg-0" href="register.html">
                Регистрация
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
}
