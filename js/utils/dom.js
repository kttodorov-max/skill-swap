export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text ?? ''
  return div.innerHTML
}

export function showAlert(container, message, type = 'danger') {
  if (!container) return

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `
}

export function clearAlert(container) {
  if (container) container.innerHTML = ''
}

export function setButtonLoading(button, isLoading, loadingText = 'Зареждане...') {
  if (!button) return

  if (isLoading) {
    button.dataset.originalText = button.innerHTML
    button.disabled = true
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`
    return
  }

  button.disabled = false
  button.innerHTML = button.dataset.originalText || button.innerHTML
}

export function renderLoading(colClass = 'col-12') {
  return `
    <div class="${colClass} text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Зареждане...</span>
      </div>
      <p class="text-muted mt-2 mb-0">Зареждане...</p>
    </div>
  `
}

export function renderEmpty(message, icon = 'bi-inbox') {
  return `
    <div class="col-12">
      <div class="text-center py-5 text-muted">
        <i class="bi ${icon} display-4 d-block mb-3"></i>
        <p class="mb-0">${escapeHtml(message)}</p>
      </div>
    </div>
  `
}

let toastContainer = null

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
    toastContainer.style.zIndex = '1080'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function showToast(message, type = 'success') {
  const typeClass = {
    success: 'text-bg-success',
    danger: 'text-bg-danger',
    info: 'text-bg-primary',
    warning: 'text-bg-warning',
  }[type] || 'text-bg-primary'

  const container = getToastContainer()
  const id = `toast-${Date.now()}`
  container.insertAdjacentHTML(
    'beforeend',
    `
      <div id="${id}" class="toast align-items-center ${typeClass} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${escapeHtml(message)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `
  )

  const element = document.getElementById(id)
  const toast = window.bootstrap.Toast.getOrCreateInstance(element, { delay: 4000 })
  toast.show()
  element.addEventListener('hidden.bs.toast', () => element.remove())
}
