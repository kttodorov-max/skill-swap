import { escapeHtml } from '../utils/dom.js'

const TYPE_BADGES = {
  teach: { class: 'bg-success', label: 'Преподавам', icon: 'bi-mortarboard' },
  learn: { class: 'bg-info text-dark', label: 'Търся', icon: 'bi-search' },
}

export function renderSkillCard(skill, options = {}) {
  const {
    showSwapButton = false,
    showOwnerActions = false,
    currentUserId = null,
  } = options

  const profile = skill.profiles || {}
  const category = skill.categories
  const badge = TYPE_BADGES[skill.type] || TYPE_BADGES.teach
  const isOwner = currentUserId && skill.user_id === currentUserId

  const imageHtml = skill.image_url
    ? `<img src="${escapeHtml(skill.image_url)}" class="card-img-top skill-card-img" alt="">`
    : `<div class="skill-card-placeholder"><i class="bi bi-image"></i></div>`

  const swapButton =
    showSwapButton && !isOwner && skill.type === 'teach'
      ? `<button type="button" class="btn btn-sm btn-primary" data-swap-skill="${skill.id}">
           <i class="bi bi-arrow-left-right me-1"></i>Предложи обмен
         </button>`
      : ''

  const ownerActions = showOwnerActions
    ? `
      <a href="skill-form.html?id=${skill.id}" class="btn btn-sm btn-outline-primary">
        <i class="bi bi-pencil"></i>
      </a>
      <button type="button" class="btn btn-sm btn-outline-danger" data-delete-skill="${skill.id}">
        <i class="bi bi-trash"></i>
      </button>
    `
    : ''

  return `
    <div class="col-md-6 col-lg-4">
      <div class="card skill-card h-100 shadow-sm">
        ${imageHtml}
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <span class="badge ${badge.class}">
              <i class="bi ${badge.icon} me-1"></i>${badge.label}
            </span>
            ${category ? `<small class="text-muted">${escapeHtml(category.name)}</small>` : ''}
          </div>
          <h3 class="h5 card-title">${escapeHtml(skill.title)}</h3>
          <p class="card-text text-muted small flex-grow-1">
            ${escapeHtml(skill.description || 'Без описание.')}
          </p>
          <div class="d-flex align-items-center gap-2 mt-2 pt-2 border-top">
            ${
              profile.avatar_url
                ? `<img src="${escapeHtml(profile.avatar_url)}" class="rounded-circle" width="32" height="32" alt="" style="object-fit:cover">`
                : '<i class="bi bi-person-circle fs-4 text-muted"></i>'
            }
            <small class="text-muted">${escapeHtml(profile.username || 'Потребител')}</small>
          </div>
        </div>
        ${
          swapButton || ownerActions
            ? `<div class="card-footer bg-white border-top-0 d-flex gap-2">${swapButton}${ownerActions}</div>`
            : ''
        }
      </div>
    </div>
  `
}
