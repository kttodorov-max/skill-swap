import '../app.js'
import { Modal } from 'bootstrap'
import { initNavbar, refreshNavbar } from '../components/navbar.js'
import { fetchSkillById, fetchUserSkills } from '../../services/skillsService.js'
import { createSwapRequest } from '../../services/swapService.js'
import { escapeHtml, renderEmpty, setButtonLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const TYPE_BADGES = {
  teach: { class: 'bg-success', label: 'Преподавам', icon: 'bi-mortarboard' },
  learn: { class: 'bg-info text-dark', label: 'Търся', icon: 'bi-search' },
}

const contentEl = document.getElementById('skill-detail-content')
const breadcrumbTitle = document.getElementById('breadcrumb-title')
const swapModalEl = document.getElementById('swapModal')
const swapForm = document.getElementById('swap-form')
const swapTargetInfo = document.getElementById('swap-target-info')
const offeredSkillSelect = document.getElementById('offered-skill')
const swapSubmitBtn = document.getElementById('swap-submit-btn')

const params = new URLSearchParams(window.location.search)
const skillId = params.get('id')

let auth = null
let skill = null
let swapModal = null

const authState = await initNavbar('main')
auth = authState

if (!skillId) {
  contentEl.innerHTML = renderEmpty('Липсва идентификатор на умение.', 'bi-exclamation-circle')
} else {
  swapModal = Modal.getOrCreateInstance(swapModalEl)
  await loadSkill()
}

async function loadSkill() {
  try {
    skill = await fetchSkillById(skillId)

    if (!skill || !skill.is_active) {
      contentEl.innerHTML = renderEmpty('Умението не е намерено.', 'bi-search')
      return
    }

    document.title = `${skill.title} – SkillSwap`
    breadcrumbTitle.textContent = skill.title
    renderDetail()
  } catch (error) {
    contentEl.innerHTML = renderEmpty('Грешка при зареждане.', 'bi-exclamation-circle')
    showToast(getErrorMessage(error), 'danger')
  }
}

function renderDetail() {
  const profile = skill.profiles || {}
  const category = skill.categories
  const badge = TYPE_BADGES[skill.type] || TYPE_BADGES.teach
  const isOwner = auth?.user?.id === skill.user_id
  const canSwap = skill.type === 'teach' && !isOwner

  const imageHtml = skill.image_url
    ? `<img src="${escapeHtml(skill.image_url)}" class="img-fluid rounded skill-detail-img w-100" alt="">`
    : `<div class="skill-detail-placeholder rounded d-flex align-items-center justify-content-center">
         <i class="bi bi-image display-4 text-muted"></i>
       </div>`

  contentEl.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-5">
        ${imageHtml}
      </div>
      <div class="col-lg-7">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span class="badge ${badge.class}">
            <i class="bi ${badge.icon} me-1"></i>${badge.label}
          </span>
          ${category ? `<span class="badge bg-light text-dark border">${escapeHtml(category.name)}</span>` : ''}
        </div>
        <h1 class="h2 mb-3">${escapeHtml(skill.title)}</h1>
        <p class="text-muted">${escapeHtml(skill.description || 'Без описание.')}</p>
        <div class="d-flex align-items-center gap-3 mt-4 pt-3 border-top">
          ${
            profile.avatar_url
              ? `<img src="${escapeHtml(profile.avatar_url)}" class="rounded-circle" width="48" height="48" alt="" style="object-fit:cover">`
              : '<i class="bi bi-person-circle fs-1 text-muted"></i>'
          }
          <div>
            <div class="fw-semibold">${escapeHtml(profile.username || 'Потребител')}</div>
            ${profile.full_name ? `<div class="text-muted small">${escapeHtml(profile.full_name)}</div>` : ''}
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-4">
          ${
            canSwap
              ? `<button type="button" class="btn btn-primary" id="swap-open-btn">
                   <i class="bi bi-arrow-left-right me-1"></i>Предложи обмен
                 </button>`
              : ''
          }
          ${
            isOwner
              ? `<a href="skill-form.html?id=${skill.id}" class="btn btn-outline-primary">
                   <i class="bi bi-pencil me-1"></i>Редактирай
                 </a>`
              : ''
          }
          <a href="index.html" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i>Назад
          </a>
        </div>
      </div>
    </div>
  `

  document.getElementById('swap-open-btn')?.addEventListener('click', openSwapModal)
}

async function openSwapModal() {
  if (!auth?.isAuthenticated) {
    window.location.href = `login.html?redirect=${encodeURIComponent(`skill-detail.html?id=${skillId}`)}`
    return
  }

  if (skill.user_id === auth.user.id) {
    showToast('Не можете да предложите обмен на собствено умение.', 'warning')
    return
  }

  try {
    const mySkills = await fetchUserSkills(auth.user.id)
    const teachSkills = mySkills.filter((s) => s.type === 'teach' && s.is_active)

    if (!teachSkills.length) {
      showToast('Добавете умение от тип „Преподавам“, за да предложите обмен.', 'warning')
      return
    }

    offeredSkillSelect.innerHTML = teachSkills
      .map((s) => `<option value="${s.id}">${escapeHtml(s.title)}</option>`)
      .join('')

    swapTargetInfo.textContent = `Искате да научите: „${skill.title}" от ${skill.profiles?.username || 'потребител'}`
    swapModal.show()
  } catch (error) {
    showToast(getErrorMessage(error), 'danger')
  }
}

swapForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!skill) return

  setButtonLoading(swapSubmitBtn, true, 'Изпращане...')

  try {
    await createSwapRequest({
      requester_id: auth.user.id,
      recipient_id: skill.user_id,
      offered_skill_id: offeredSkillSelect.value,
      requested_skill_id: skill.id,
      message: document.getElementById('swap-message').value.trim() || null,
    })

    swapModal.hide()
    swapForm.reset()
    showToast('Заявката за обмен е изпратена!', 'success')
    await refreshNavbar()
  } catch (error) {
    showToast(getErrorMessage(error), 'danger')
  } finally {
    setButtonLoading(swapSubmitBtn, false)
  }
})
