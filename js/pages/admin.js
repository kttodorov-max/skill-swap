import '../app.js'
import { Modal } from 'bootstrap'
import {
  fetchAllProfiles,
  fetchAllSkills,
  fetchAllCategories,
  updateUserRole,
  adminDeleteSkill,
  createCategory,
  updateCategory,
  deleteCategory,
  adminDeleteProfile,
} from '../../services/adminService.js'
import { initProtectedPage, requireAdmin } from '../utils/guards.js'
import { escapeHtml, renderLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const session = await initProtectedPage('admin', requireAdmin)
if (session) {
  const currentUserId = session.user.id
  const usersBody = document.getElementById('admin-users-body')
  const skillsBody = document.getElementById('admin-skills-body')
  const categoriesBody = document.getElementById('admin-categories-body')
  const categoryForm = document.getElementById('category-form')
  const editCategoryForm = document.getElementById('edit-category-form')
  const editCategoryModalEl = document.getElementById('editCategoryModal')
  const editCategoryModal = Modal.getOrCreateInstance(editCategoryModalEl)

  let categoriesCache = []

  async function loadUsers() {
    usersBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">${renderLoading().replace(/<div class="col-12[^"]*">/, '<div>').replace('</div>\n', '')}</td></tr>`

    try {
      const profiles = await fetchAllProfiles()

      if (!profiles.length) {
        usersBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No users.</td></tr>'
        return
      }

      usersBody.innerHTML = profiles
        .map((profile) => {
          const roleData = profile.user_roles
          const role = Array.isArray(roleData) ? roleData[0]?.role : roleData?.role
          const currentRole = role || 'user'
          const isSelf = profile.id === currentUserId

          return `
            <tr>
              <td>
                <strong>${escapeHtml(profile.username)}</strong>
                ${isSelf ? '<span class="badge bg-secondary ms-1">You</span>' : ''}
                ${profile.full_name ? `<br><small class="text-muted">${escapeHtml(profile.full_name)}</small>` : ''}
              </td>
              <td>${escapeHtml(profile.location || '—')}</td>
              <td>
                <select class="form-select form-select-sm" data-role-user="${profile.id}" ${isSelf ? 'disabled' : ''}>
                  <option value="user" ${currentRole === 'user' ? 'selected' : ''}>user</option>
                  <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>admin</option>
                </select>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" data-delete-user="${profile.id}" ${isSelf ? 'disabled' : ''}>
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
            showToast('Role updated.', 'success')
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
            await loadUsers()
          }
        })
      })

      usersBody.querySelectorAll('[data-delete-user]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Are you sure? This will delete the user and all their data.')) return
          try {
            await adminDeleteProfile(button.dataset.deleteUser)
            showToast('User deleted.', 'success')
            await loadUsers()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      usersBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Failed to load users.</td></tr>'
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function loadSkills() {
    skillsBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>'

    try {
      const skills = await fetchAllSkills()

      if (!skills.length) {
        skillsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No skills.</td></tr>'
        return
      }

      skillsBody.innerHTML = skills
        .map(
          (skill) => `
          <tr>
            <td>${escapeHtml(skill.title)}</td>
            <td>${escapeHtml(skill.profiles?.username || '—')}</td>
            <td><span class="badge bg-${skill.type === 'teach' ? 'success' : 'info'}">${skill.type}</span></td>
            <td>${skill.is_active ? '<span class="text-success">Active</span>' : '<span class="text-muted">Hidden</span>'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" data-delete-skill="${skill.id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `
        )
        .join('')

      skillsBody.querySelectorAll('[data-delete-skill]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Delete this skill?')) return
          try {
            await adminDeleteSkill(button.dataset.deleteSkill)
            showToast('Skill deleted.', 'success')
            await loadSkills()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      skillsBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Failed to load skills.</td></tr>'
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function loadCategories() {
    categoriesBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Loading...</td></tr>'

    try {
      categoriesCache = await fetchAllCategories()

      if (!categoriesCache.length) {
        categoriesBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No categories.</td></tr>'
        return
      }

      categoriesBody.innerHTML = categoriesCache
        .map(
          (cat) => `
          <tr>
            <td>${escapeHtml(cat.name)}</td>
            <td><code>${escapeHtml(cat.slug)}</code></td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" data-edit-category="${cat.id}" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" data-delete-category="${cat.id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `
        )
        .join('')

      categoriesBody.querySelectorAll('[data-edit-category]').forEach((button) => {
        button.addEventListener('click', () => {
          const category = categoriesCache.find((item) => item.id === button.dataset.editCategory)
          if (!category) return

          document.getElementById('edit-category-id').value = category.id
          document.getElementById('edit-category-name').value = category.name
          document.getElementById('edit-category-slug').value = category.slug
          editCategoryModal.show()
        })
      })

      categoriesBody.querySelectorAll('[data-delete-category]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Delete this category?')) return
          try {
            await deleteCategory(button.dataset.deleteCategory)
            showToast('Category deleted.', 'success')
            await loadCategories()
          } catch (error) {
            showToast(getErrorMessage(error), 'danger')
          }
        })
      })
    } catch (error) {
      categoriesBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Failed to load categories.</td></tr>'
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
      showToast('Category added.', 'success')
      await loadCategories()
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  })

  editCategoryForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const categoryId = document.getElementById('edit-category-id').value
    const name = document.getElementById('edit-category-name').value.trim()
    const slug = document.getElementById('edit-category-slug').value.trim().toLowerCase()

    if (!categoryId || !name || !slug) return

    try {
      await updateCategory(categoryId, { name, slug })
      editCategoryModal.hide()
      showToast('Category updated.', 'success')
      await loadCategories()
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  })

  await Promise.all([loadUsers(), loadSkills(), loadCategories()])
}
