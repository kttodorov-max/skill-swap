import '../app.js'
import {
  fetchCategories,
  fetchSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} from '../../services/skillsService.js'
import { uploadSkillImage } from '../../services/storageService.js'
import { initProtectedPage } from '../utils/guards.js'
import { showAlert, clearAlert, setButtonLoading, showToast } from '../utils/dom.js'
import { validateSkillTitle } from '../utils/validation.js'
import { getErrorMessage } from '../utils/errors.js'

const session = await initProtectedPage('skillForm')
if (session) {
  const userId = session.user.id
  const params = new URLSearchParams(window.location.search)
  const skillId = params.get('id')
  const isEdit = Boolean(skillId)

  const form = document.getElementById('skill-form')
  const alertBox = document.getElementById('form-alert')
  const submitBtn = document.getElementById('skill-submit-btn')
  const deleteBtn = document.getElementById('skill-delete-btn')
  const pageTitle = document.getElementById('page-title')
  const activeWrapper = document.getElementById('active-wrapper')
  const imagePreview = document.getElementById('image-preview')
  const categorySelect = document.getElementById('category')

  let existingSkill = null
  let pendingImageFile = null

  if (isEdit) {
    pageTitle.innerHTML = '<i class="bi bi-pencil text-primary"></i> Редакция на умение'
    activeWrapper.classList.remove('d-none')
    deleteBtn.classList.remove('d-none')
  }

  async function loadCategories() {
    const categories = await fetchCategories()
    categorySelect.innerHTML =
      '<option value="">Без категория</option>' +
      categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')
  }

  async function loadSkill() {
    if (!isEdit) return

    existingSkill = await fetchSkillById(skillId)

    if (!existingSkill || existingSkill.user_id !== userId) {
      showAlert(alertBox, 'Умението не е намерено или нямате достъп.', 'danger')
      form.classList.add('d-none')
      return
    }

    document.getElementById('title').value = existingSkill.title
    document.getElementById('description').value = existingSkill.description || ''
    document.getElementById('type').value = existingSkill.type
    document.getElementById('category').value = existingSkill.category_id || ''
    document.getElementById('is-active').checked = existingSkill.is_active

    if (existingSkill.image_url) {
      imagePreview.innerHTML = `<img src="${existingSkill.image_url}" class="img-fluid rounded" style="max-height:200px" alt="">`
    }
  }

  document.getElementById('image').addEventListener('change', (event) => {
    pendingImageFile = event.target.files?.[0] || null
    if (pendingImageFile) {
      imagePreview.innerHTML = `<img src="${URL.createObjectURL(pendingImageFile)}" class="img-fluid rounded" style="max-height:200px" alt="">`
    }
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearAlert(alertBox)

    const title = document.getElementById('title').value.trim()
    const titleError = validateSkillTitle(title)
    form.title.classList.toggle('is-invalid', !!titleError)

    if (titleError) {
      showAlert(alertBox, titleError, 'warning')
      return
    }

    setButtonLoading(submitBtn, true, 'Запазване...')

    try {
      const skillData = {
        title,
        description: document.getElementById('description').value.trim() || null,
        type: document.getElementById('type').value,
        category_id: document.getElementById('category').value || null,
        user_id: userId,
      }

      if (isEdit) {
        skillData.is_active = document.getElementById('is-active').checked
      }

      let savedSkill

      if (isEdit) {
        savedSkill = await updateSkill(skillId, skillData)
      } else {
        savedSkill = await createSkill(skillData)
      }

      if (pendingImageFile) {
        const imageUrl = await uploadSkillImage(userId, pendingImageFile, savedSkill.id)
        savedSkill = await updateSkill(savedSkill.id, { image_url: imageUrl })
      }

      showToast(isEdit ? 'Умението е обновено.' : 'Умението е добавено.', 'success')
      setTimeout(() => {
        window.location.href = 'profile.html'
      }, 800)
    } catch (error) {
      showAlert(alertBox, getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(submitBtn, false)
    }
  })

  deleteBtn.addEventListener('click', async () => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това умение?')) return

    try {
      await deleteSkill(skillId)
      showToast('Умението е изтрито.', 'success')
      setTimeout(() => {
        window.location.href = 'profile.html'
      }, 800)
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  })

  await loadCategories()
  await loadSkill()
}
