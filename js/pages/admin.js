import '../app.js'
import {
  fetchAllProfiles,
  fetchAllSkills,
  fetchAllCategories,
  updateUserRole,
  adminDeleteSkill,
  createCategory,
  deleteCategory,
  adminDeleteProfile,
} from '../../services/adminService.js'
import { initProtectedPage, requireAdmin } from '../utils/guards.js'
import { escapeHtml, renderLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const session = await initProtectedPage('admin', requireAdmin)
if (session) {
  const usersBody = document.getElementById('admin-users-body')
  const skillsBody = document.getElementById('admin-skills-body')
  const categoriesBody = document.getElementById('admin-categories-body')
  const categoryForm = document.getElementById('category-form')

  async function loadUsers() {
    usersBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">${renderLoading().replace(/<div class="col-12[^"]*">/, '<div>').replace('</div>\n', '')}</td></tr>`

    try {
      const profiles = await fetchAllProfiles()

      if (!profiles.length) {
        usersBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Няма потребители.</td></tr>'
        return
      }

      usersBody.innerHTML = profiles
        .map((profile) => {
          const roleData = profile.user_roles
          const role = Array.isArray(roleData) ? roleData[0]?.role : roleData?.role
          const currentRole = role || 'user'
          return `
            <tr>
              <td>
                <strong>${escapeHtml(profile.username)}</strong>
                ${profile.full_name ? `<br><small class="text-muted">${escapeHtml(profile.full_name)}</small>` : ''}
              </td>
              <td>${escapeHtml(profile.location || '—')}</td>
              <td>
                <select class="form-select form-select-sm" data-role-user="${profile.id}">
                  <option value="user" ${currentRole === 'user' ? 'selected' : ''}>user</option>
                  <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>admin</option>
                </select>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" data-delete-user="${profile.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `
        })
        .join('')

      usersBody.querySelectorAll('[data-role-user]').forEach((select) => {
        select.addEventListener('change', async () => {
          try {
            await updateUserRole(select.dataset.roleUser, select.value)
            showToast('Ролята е обновена.', 'success')
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })

      usersBody.querySelectorAll('[data-delete-user]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Сигурни ли сте? Това ще изтрие потребителя и всички негови данни.')) return
          try {
            await adminDeleteProfile(button.dataset.deleteUser)
            showToast('Потребителят е изтрит.', 'success')
            await loadUsers()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      usersBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Грешка при зареждане.</td></tr>'
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function loadSkills() {
    skillsBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Зареждане...</td></tr>`

    try {
      const skills = await fetchAllSkills()

      if (!skills.length) {
        skillsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Няма умения.</td></tr>'
        return
      }

      skillsBody.innerHTML = skills
        .map(
          (skill) => `
          <tr>
            <td>${escapeHtml(skill.title)}</td>
            <td>${escapeHtml(skill.profiles?.username || '—')}</td>
            <td><span class="badge bg-${skill.type === 'teach' ? 'success' : 'info'}">${skill.type}</span></td>
            <td>${skill.is_active ? '<span class="text-success">Активно</span>' : '<span class="text-muted">Скрито</span>'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" data-delete-skill="${skill.id}">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `
        )
        .join('')

      skillsBody.querySelectorAll('[data-delete-skill]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Изтриване на умение?')) return
          try {
            await adminDeleteSkill(button.dataset.deleteSkill)
            showToast('Умението е изтрито.', 'success')
            await loadSkills()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      skillsBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Грешка при зареждане.</td></tr>'
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function loadCategories() {
    categoriesBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Зареждане...</td></tr>'

    try {
      const categories = await fetchAllCategories()

      categoriesBody.innerHTML = categories
        .map(
          (cat) => `
          <tr>
            <td>${escapeHtml(cat.name)}</td>
            <td><code>${escapeHtml(cat.slug)}</code></td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" data-delete-category="${cat.id}">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `
        )
        .join('')

      categoriesBody.querySelectorAll('[data-delete-category]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Изтриване на категория?')) return
          try {
            await deleteCategory(button.dataset.deleteCategory)
            showToast('Категорията е изтрита.', 'success')
            await loadCategories()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      categoriesBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Грешка при зареждане.</td></tr>'
      showToast(getErrorMessage(error), 'danger')
    }
  }

  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const name = document.getElementById('category-name').value.trim()
    const slug = document.getElementById('category-slug').value.trim().toLowerCase()

    if (!name || !slug) return

    try {
      await createCategory({ name, slug })
      categoryForm.reset()
      showToast('Категорията е добавена.', 'success')
      await loadCategories()
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  })

  await Promise.all([loadUsers(), loadSkills(), loadCategories()])
}
