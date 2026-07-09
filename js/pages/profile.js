import '../app.js'
import { renderSkillCard } from '../components/skillCard.js'
import { getProfile, updateProfile } from '../../services/authService.js'
import { fetchUserSkills, deleteSkill } from '../../services/skillsService.js'
import { uploadAvatar, MAX_AVATAR_SIZE } from '../../services/storageService.js'
import { initProtectedPage } from '../utils/guards.js'
import { renderEmpty, renderLoading, setButtonLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const session = await initProtectedPage('profile')
if (session) {
  const userId = session.user.id
  const profileForm = document.getElementById('profile-form')
  const avatarInput = document.getElementById('avatar-input')
  const avatarPreview = document.getElementById('avatar-preview')
  const mySkillsList = document.getElementById('my-skills-list')
  const saveBtn = document.getElementById('profile-save-btn')

  let currentProfile = null

  function renderAvatar(url) {
    avatarPreview.innerHTML = url
      ? `<img src="${url}" class="rounded-circle" width="120" height="120" alt="Avatar" style="object-fit:cover">`
      : '<i class="bi bi-person-circle display-1 text-muted"></i>'
  }

  async function loadProfile() {
    currentProfile = await getProfile(userId)
    if (!currentProfile) return

    document.getElementById('username').value = currentProfile.username || ''
    document.getElementById('full-name').value = currentProfile.full_name || ''
    document.getElementById('location').value = currentProfile.location || ''
    document.getElementById('bio').value = currentProfile.bio || ''
    renderAvatar(currentProfile.avatar_url)
  }

  async function loadMySkills() {
    mySkillsList.innerHTML = renderLoading()

    try {
      const skills = await fetchUserSkills(userId)

      if (!skills.length) {
        mySkillsList.innerHTML = renderEmpty('You have not added any skills yet.', 'bi-plus-circle')
        return
      }

      mySkillsList.innerHTML = skills
        .map((skill) => renderSkillCard(skill, { showOwnerActions: true, currentUserId: userId }))
        .join('')

      mySkillsList.querySelectorAll('[data-delete-skill]').forEach((button) => {
        button.addEventListener('click', () => handleDeleteSkill(button.dataset.deleteSkill))
      })
    } catch (error) {
      mySkillsList.innerHTML = renderEmpty('Failed to load skills.', 'bi-exclamation-circle')
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function handleDeleteSkill(skillId) {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      await deleteSkill(skillId)
      showToast('Skill deleted.', 'success')
      await loadMySkills()
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  }

  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files?.[0]
    if (!file) return

    if (file.size > MAX_AVATAR_SIZE) {
      showToast('Avatar must be up to 2 MB.', 'warning')
      avatarInput.value = ''
      return
    }

    try {
      setButtonLoading(saveBtn, true, 'Uploading...')
      const avatarUrl = await uploadAvatar(userId, file)
      await updateProfile(userId, { avatar_url: avatarUrl })
      renderAvatar(avatarUrl)
      showToast('Avatar updated.', 'success')
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(saveBtn, false)
      avatarInput.value = ''
    }
  })

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    setButtonLoading(saveBtn, true, 'Saving...')

    try {
      await updateProfile(userId, {
        full_name: document.getElementById('full-name').value.trim(),
        location: document.getElementById('location').value.trim(),
        bio: document.getElementById('bio').value.trim(),
      })
      showToast('Profile saved.', 'success')
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(saveBtn, false)
    }
  })

  await loadProfile()
  await loadMySkills()
}
