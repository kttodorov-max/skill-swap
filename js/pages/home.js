import '../app.js'
import { Modal } from 'bootstrap'
import { initNavbar, refreshNavbar } from '../components/navbar.js'
import { renderSkillCard } from '../components/skillCard.js'
import { fetchCategories, fetchSkills, fetchUserSkills } from '../../services/skillsService.js'
import { createSwapRequest } from '../../services/swapService.js'
import { renderEmpty, renderLoading, setButtonLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const skillsList = document.getElementById('skills-list')
const filterSearch = document.getElementById('filter-search')
const filterType = document.getElementById('filter-type')
const filterCategory = document.getElementById('filter-category')
const swapModalEl = document.getElementById('swapModal')
const swapForm = document.getElementById('swap-form')
const swapTargetInfo = document.getElementById('swap-target-info')
const offeredSkillSelect = document.getElementById('offered-skill')
const swapSubmitBtn = document.getElementById('swap-submit-btn')
const heroActions = document.getElementById('hero-actions')

let auth = null
let skillsCache = []
let swapModal = null
let selectedTargetSkill = null
let searchTimeout = null

const authState = await initNavbar('main')
auth = authState

if (auth?.isAuthenticated) {
  heroActions.innerHTML = `
    <a href="skill-form.html" class="btn btn-primary btn-lg">
      <i class="bi bi-plus-circle me-1"></i> Add Skill
    </a>
    <a href="swap-requests.html" class="btn btn-outline-primary btn-lg">
      <i class="bi bi-arrow-left-right me-1"></i> My Requests
    </a>
  `
}

swapModal = Modal.getOrCreateInstance(swapModalEl)

async function loadCategories() {
  const categories = await fetchCategories()
  filterCategory.innerHTML =
    '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')
}

async function loadSkills() {
  skillsList.innerHTML = renderLoading()

  try {
    const skills = await fetchSkills({
      type: filterType.value || undefined,
      categoryId: filterCategory.value || undefined,
      search: filterSearch.value.trim() || undefined,
    })

    skillsCache = skills
    renderSkills(skills)
  } catch (error) {
    skillsList.innerHTML = renderEmpty('Failed to load skills.', 'bi-exclamation-circle')
    showToast(getErrorMessage(error), 'danger')
  }
}

function renderSkills(skills) {
  if (!skills.length) {
    skillsList.innerHTML = renderEmpty('No skills found.', 'bi-search')
    return
  }

  skillsList.innerHTML = skills
    .map((skill) =>
      renderSkillCard(skill, {
        showSwapButton: true,
        currentUserId: auth?.user?.id,
      })
    )
    .join('')

  skillsList.querySelectorAll('[data-swap-skill]').forEach((button) => {
    button.addEventListener('click', () => openSwapModal(button.dataset.swapSkill))
  })
}

async function openSwapModal(skillId) {
  if (!auth?.isAuthenticated) {
    window.location.href = `login.html?redirect=${encodeURIComponent('index.html')}`
    return
  }

  selectedTargetSkill = skillsCache.find((s) => s.id === skillId)
  if (!selectedTargetSkill) return

  if (selectedTargetSkill.user_id === auth.user.id) {
    showToast('You cannot propose a swap for your own skill.', 'warning')
    return
  }

  try {
    const mySkills = await fetchUserSkills(auth.user.id)
    const teachSkills = mySkills.filter((s) => s.type === 'teach' && s.is_active)

    if (!teachSkills.length) {
      showToast('Add an "I Teach" skill before proposing a swap.', 'warning')
      return
    }

    offeredSkillSelect.innerHTML = teachSkills
      .map((s) => `<option value="${s.id}">${s.title}</option>`)
      .join('')

    swapTargetInfo.textContent = `You want to learn: "${selectedTargetSkill.title}" from ${selectedTargetSkill.profiles?.username || 'user'}`
    swapModal.show()
  } catch (error) {
    showToast(getErrorMessage(error), 'danger')
  }
}

filterType.addEventListener('change', loadSkills)
filterCategory.addEventListener('change', loadSkills)
filterSearch.addEventListener('input', () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadSkills, 300)
})

swapForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!selectedTargetSkill) return

  setButtonLoading(swapSubmitBtn, true, 'Sending...')

  try {
    await createSwapRequest({
      requester_id: auth.user.id,
      recipient_id: selectedTargetSkill.user_id,
      offered_skill_id: offeredSkillSelect.value,
      requested_skill_id: selectedTargetSkill.id,
      message: document.getElementById('swap-message').value.trim() || null,
    })

    swapModal.hide()
    swapForm.reset()
    showToast('Swap request sent!', 'success')
    await refreshNavbar()
  } catch (error) {
    showToast(getErrorMessage(error), 'danger')
  } finally {
    setButtonLoading(swapSubmitBtn, false)
  }
})

await loadCategories()
await loadSkills()
