import '../app.js'
import {
  fetchIncomingRequests,
  fetchOutgoingRequests,
  updateSwapRequestStatus,
} from '../../services/swapService.js'
import { initProtectedPage } from '../utils/guards.js'
import { refreshNavbar } from '../components/navbar.js'
import { escapeHtml, renderEmpty, renderLoading, showToast } from '../utils/dom.js'
import { getErrorMessage } from '../utils/errors.js'

const session = await initProtectedPage('swapRequests')
if (session) {
  const userId = session.user.id
  const incomingList = document.getElementById('incoming-list')
  const outgoingList = document.getElementById('outgoing-list')

  const STATUS_MAP = {
    pending: { class: 'warning', label: 'Pending' },
    accepted: { class: 'success', label: 'Accepted' },
    rejected: { class: 'danger', label: 'Rejected' },
    cancelled: { class: 'secondary', label: 'Cancelled' },
    completed: { class: 'primary', label: 'Completed' },
  }

  function renderRequestCard(request, type) {
    const status = STATUS_MAP[request.status] || STATUS_MAP.pending
    const otherUser = type === 'incoming' ? request.requester : request.recipient

    let actions = ''

    if (request.status === 'pending') {
      if (type === 'incoming') {
        actions = `
          <button class="btn btn-sm btn-success me-1" data-action="accept" data-id="${request.id}">
            <i class="bi bi-check-lg"></i> Accept
          </button>
          <button class="btn btn-sm btn-danger" data-action="reject" data-id="${request.id}">
            <i class="bi bi-x-lg"></i> Reject
          </button>
        `
      } else {
        actions = `
          <button class="btn btn-sm btn-outline-secondary" data-action="cancel" data-id="${request.id}">
            <i class="bi bi-x-circle"></i> Cancel
          </button>
        `
      }
    } else if (request.status === 'accepted') {
      actions = `
        <button class="btn btn-sm btn-outline-primary" data-action="complete" data-id="${request.id}">
          <i class="bi bi-check-circle"></i> Mark complete
        </button>
      `
    }

    const showContact = request.status === 'accepted' || request.status === 'completed'
    const contactHtml = showContact
      ? otherUser?.contact_info
        ? `
          <div class="alert alert-success py-2 px-3 small mb-0 mt-3">
            <i class="bi bi-person-lines-fill me-1"></i>
            <strong>Contact ${escapeHtml(otherUser.username)}:</strong>
            ${escapeHtml(otherUser.contact_info)}
          </div>
        `
        : `
          <div class="alert alert-warning py-2 px-3 small mb-0 mt-3">
            <i class="bi bi-exclamation-triangle me-1"></i>
            ${escapeHtml(otherUser?.username || 'User')} has not added contact info yet.
            Ask them to update their profile.
          </div>
        `
      : ''

    return `
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge bg-${status.class}">${status.label}</span>
              <small class="text-muted ms-2">${new Date(request.created_at).toLocaleDateString('en-US')}</small>
            </div>
            <div>${actions}</div>
          </div>
          <p class="mb-1">
            <strong>${type === 'incoming' ? 'From' : 'To'}:</strong>
            ${escapeHtml(otherUser?.username || 'User')}
          </p>
          <p class="mb-1 small">
            <i class="bi bi-arrow-right text-muted"></i>
            Offers: <strong>${escapeHtml(request.offered_skill?.title || '—')}</strong>
          </p>
          <p class="mb-1 small">
            <i class="bi bi-arrow-left text-muted"></i>
            Wants: <strong>${escapeHtml(request.requested_skill?.title || '—')}</strong>
          </p>
          ${request.message ? `<p class="text-muted small mb-0 mt-2 fst-italic">"${escapeHtml(request.message)}"</p>` : ''}
          ${contactHtml}
        </div>
      </div>
    `
  }

  function renderList(container, requests, type) {
    if (!requests.length) {
      container.innerHTML = `<div class="py-4">${renderEmpty('No requests.', 'bi-inbox').replace('col-12', '')}</div>`
      return
    }

    container.innerHTML = requests.map((r) => renderRequestCard(r, type)).join('')
    bindActions(container)
  }

  function bindActions(container) {
    container.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => handleAction(button.dataset.action, button.dataset.id))
    })
  }

  async function handleAction(action, requestId) {
    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
      cancel: 'cancelled',
      complete: 'completed',
    }

    const status = statusMap[action]
    if (!status) return

    try {
      if (action === 'cancel') {
        await updateSwapRequestStatus(requestId, status)
      } else {
        await updateSwapRequestStatus(requestId, status)
      }
      showToast(
        action === 'accept'
          ? 'Request accepted. Contact details are now visible to both parties.'
          : 'Request updated.',
        'success'
      )
      await loadRequests()
      await refreshNavbar()
    } catch (error) {
      showToast(getErrorMessage(error), 'danger')
    }
  }

  async function loadRequests() {
    incomingList.innerHTML = renderLoading().replace('col-12', '')
    outgoingList.innerHTML = renderLoading().replace('col-12', '')

    try {
      const [incoming, outgoing] = await Promise.all([
        fetchIncomingRequests(userId),
        fetchOutgoingRequests(userId),
      ])

      renderList(incomingList, incoming, 'incoming')
      renderList(outgoingList, outgoing, 'outgoing')
    } catch (error) {
      const errorHtml = `<div class="py-4">${renderEmpty('Failed to load requests.', 'bi-exclamation-circle').replace('col-12', '')}</div>`
      incomingList.innerHTML = errorHtml
      outgoingList.innerHTML = errorHtml
      showToast(getErrorMessage(error), 'danger')
    }
  }

  await loadRequests()
}
