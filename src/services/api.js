const API_BASE = '/api'
// In dev, use backend origin for uploads so request hits the API server directly (avoids proxy 404)
const API_ORIGIN = typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_ORIGIN ?? (import.meta.env?.DEV ? 'http://localhost:3001' : ''))

function getToken() {
  return localStorage.getItem('bikrans_token')
}

async function request(endpoint, options = {}) {
  const base = API_ORIGIN ? `${API_ORIGIN}${API_BASE}` : API_BASE
  const url = `${base}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message = data.error || data.message || res.statusText || 'Request failed'
    throw new Error(message)
  }
  return data
}

export const slidersApi = {
  getPublic: () => request('/sliders'),
}

export const themeApi = {
  getHeader: () => request('/theme/header'),
  getFooter: () => request('/theme/footer'),
}

export const publicApi = {
  getProjects: () => request('/public/projects'),
  getPresentationQuizzes: () => request('/public/presentation-quizzes'),
  getPolls: () => request('/public/polls'),
  getPoll: (id) => request(`/public/polls/${id}`),
  getExternalVideos: () => request('/public/external-videos'),
  getPresentationAudio: () => request('/public/presentation-audio'),
  getTimeline: (id) => request(`/public/timelines/${id}`),
  getPublicSeminars: () => request('/public/seminars'),
  getVirtualSeminarStatus: (token, seminarId) => {
    const params = new URLSearchParams()
    if (token) params.set('token', token)
    if (seminarId) params.set('seminar', String(seminarId))
    const q = params.toString() ? `?${params.toString()}` : ''
    return request(`/public/virtual-seminar-status${q}`)
  },
  registerVirtualSeminar: ({ name, phone, seminar_id }) =>
    request('/public/virtual-seminar-register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, ...(seminar_id != null && { seminar_id }) }),
    }),
  getVirtualSeminarTimeline: (token, seminarId) => {
    const params = new URLSearchParams()
    if (token) params.set('token', token)
    if (seminarId) params.set('seminar', String(seminarId))
    const q = params.toString() ? `?${params.toString()}` : ''
    return request(`/public/virtual-seminar-timeline${q}`)
  },
  sendVirtualSeminarHeartbeat: (sessionId) =>
    request('/public/virtual-seminar-viewer', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  leaveVirtualSeminar: (sessionId) =>
    request('/public/virtual-seminar-viewer-leave', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  leaveVirtualSeminarBeacon: (sessionId) => {
    const base = API_ORIGIN ? `${API_ORIGIN}${API_BASE}` : API_BASE
    const url = `${base}/public/virtual-seminar-viewer-leave`
    const blob = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' })
    return navigator.sendBeacon?.(url, blob) ?? false
  },
  getVirtualSeminarViewerCount: () => request('/public/virtual-seminar-viewer-count'),
  votePoll: (pollId, body) =>
    request(`/public/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getQuizCorrectResponders: (quizId) =>
    request(`/public/presentation-quizzes/${quizId}/correct-responders`),
  submitQuizAnswer: (quizId, body) =>
    request(`/public/presentation-quizzes/${quizId}/answer`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAudioTracks: () => request('/public/audio'),
  logAudioPlay: (id, source = 'other') =>
    request(`/public/audio/${id}/play`, {
      method: 'POST',
      body: JSON.stringify({ source }),
    }),
  getFrames: () => request('/public/frames'),
  processVideo: async (videoFile, audioId, frameId) => {
    const fd = new FormData()
    fd.append('video', videoFile)
    fd.append('audioId', String(audioId))
    fd.append('frameId', String(frameId))
    const res = await fetch(`${API_BASE}/public/video/process`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'ভিডিও প্রসেস ব্যর্থ')
    }
    return res.blob()
  },
}

export const landingApi = {
  getPublic: () => request('/public/landing'),
}

export const authApi = {
  login: (identifier, password) => {
    const body = identifier.includes('@')
      ? { email: identifier, password }
      : { phone: identifier, password }
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  campaignRegister: (data) => request('/auth/campaign-register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkPhone: (phone) => request('/auth/check-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}

export const adminApi = {
  getDashboard: () => request('/admin/dashboard'),
  getUsers: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/admin/users${q ? '?' + q : ''}`)
  },
  createUser: (data) => request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id, data) => request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
  getAnalytics: () => request('/admin/analytics'),
  getSliders: () => request('/admin/sliders'),
  createSlider: async (formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/sliders`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create slider')
    }
    return data
  },
  updateSlider: async (id, formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/sliders/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update slider')
    }
    return data
  },
  deleteSlider: (id) => request(`/admin/sliders/${id}`, { method: 'DELETE' }),
  reorderSliders: (order) => request('/admin/sliders/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  }),

  // Theme management
  getHeaderSettings: () => request('/admin/theme/header'),
  updateHeaderSettings: (data) => request('/admin/theme/header', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateFooterVisibility: (showFooter) => request('/admin/theme/footer-visibility', {
    method: 'PUT',
    body: JSON.stringify({ show_footer: showFooter }),
  }),
  uploadLogo: async (formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/theme/header/logo`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload logo')
    }
    return data
  },
  getFooterItems: () => request('/admin/theme/footer'),
  createFooterItem: (data) => request('/admin/theme/footer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateFooterItem: (id, data) => request(`/admin/theme/footer/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteFooterItem: (id) => request(`/admin/theme/footer/${id}`, {
    method: 'DELETE',
  }),
  reorderFooterItems: (order) => request('/admin/theme/footer/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  }),
  getAdminBgVideo: () => request('/admin/theme/admin-bg-video'),
  updateAdminBgVideo: (data) => request('/admin/theme/admin-bg-video', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Task management
  getTasks: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/admin/tasks${q ? '?' + q : ''}`)
  },
  createTask: (data) => request('/admin/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTask: (id) => request(`/admin/tasks/${id}`),
  updateTask: (id, data) => request(`/admin/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTask: (id) => request(`/admin/tasks/${id}`, { method: 'DELETE' }),
  addTaskAttachment: async (taskId, formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload file')
    }
    return data
  },
  deleteTaskAttachment: (taskId, attachmentId) =>
    request(`/admin/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE' }),
  addTaskComment: (taskId, message) =>
    request(`/admin/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Landing page design
  getLandingServices: () => request('/admin/landing/services'),
  updateLandingServicesSettings: (data) => request('/admin/landing/services', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  uploadLandingServiceIcon: async (formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = API_ORIGIN ? `${API_ORIGIN}/api/admin/landing/services/upload` : `${API_BASE}/admin/landing/services/upload`
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Image upload failed')
    return data
  },
  createLandingServiceItem: (data) => request('/admin/landing/services/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateLandingServiceItem: (id, data) => request(`/admin/landing/services/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteLandingServiceItem: (id) => request(`/admin/landing/services/items/${id}`, { method: 'DELETE' }),
  reorderLandingServiceItems: (order) => request('/admin/landing/services/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  }),

  getLandingFeatures: () => request('/admin/landing/features'),
  updateLandingFeaturesSettings: (data) => request('/admin/landing/features', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  createLandingFeatureItem: (data) => request('/admin/landing/features/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateLandingFeatureItem: (id, data) => request(`/admin/landing/features/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteLandingFeatureItem: (id) => request(`/admin/landing/features/items/${id}`, { method: 'DELETE' }),
  reorderLandingFeatureItems: (order) => request('/admin/landing/features/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  }),

  getLandingCta: () => request('/admin/landing/cta'),
  updateLandingCta: (data) => request('/admin/landing/cta', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Project management
  getProjects: () => request('/admin/projects'),
  createProject: (data) => request('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProject: (id, data) => request(`/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProject: (id) => request(`/admin/projects/${id}`, { method: 'DELETE' }),

  // Audio / music management
  getAudioList: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/admin/audio${q ? '?' + q : ''}`)
  },
  createAudio: async (formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/audio`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to upload audio')
    return data
  },
  getAudio: (id) => request(`/admin/audio/${id}`),
  updateAudio: async (id, formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/audio/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to update audio')
    return data
  },
  deleteAudio: (id) => request(`/admin/audio/${id}`, { method: 'DELETE' }),

  // Frame management
  getFrameList: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/admin/frames${q ? '?' + q : ''}`)
  },
  createFrame: async (formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/frames`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to upload frame')
    return data
  },
  getFrame: (id) => request(`/admin/frames/${id}`),
  updateFrame: async (id, formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/admin/frames/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to update frame')
    return data
  },
  deleteFrame: (id) => request(`/admin/frames/${id}`, { method: 'DELETE' }),

  // Asset gallery (presentation management)
  getAssetGallery: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/admin/assets/gallery${q ? '?' + q : ''}`)
  },
  uploadAsset: async (formData) => {
    const token = getToken()
    const base = API_ORIGIN ? `${API_ORIGIN}/api` : API_BASE
    const res = await fetch(`${base}/admin/assets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'আপলোড ব্যর্থ')
    return data
  },

  // Presentation quizzes (presentation management)
  getPresentationQuizzes: () => request('/admin/presentation-quizzes'),
  getPresentationQuiz: (id) => request(`/admin/presentation-quizzes/${id}`),
  createPresentationQuiz: (data) =>
    request('/admin/presentation-quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePresentationQuiz: (id, data) =>
    request(`/admin/presentation-quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePresentationQuiz: (id) =>
    request(`/admin/presentation-quizzes/${id}`, { method: 'DELETE' }),
  reorderPresentationQuizzes: (order) =>
    request('/admin/presentation-quizzes/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order }),
    }),

  // Polls (presentation management)
  getPolls: () => request('/admin/polls'),
  getPoll: (id) => request(`/admin/polls/${id}`),
  createPoll: (data) =>
    request('/admin/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePoll: (id, data) =>
    request(`/admin/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePoll: (id) => request(`/admin/polls/${id}`, { method: 'DELETE' }),
  reorderPolls: (order) =>
    request('/admin/polls/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order }),
    }),

  // External videos (presentation management)
  getExternalVideos: () => request('/admin/external-videos'),
  getExternalVideo: (id) => request(`/admin/external-videos/${id}`),
  createExternalVideo: (data) =>
    request('/admin/external-videos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExternalVideo: (id, data) =>
    request(`/admin/external-videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExternalVideo: (id) =>
    request(`/admin/external-videos/${id}`, { method: 'DELETE' }),
  reorderExternalVideos: (order) =>
    request('/admin/external-videos/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order }),
    }),

  // Presentation audio (presentation management)
  getPresentationAudio: () => request('/admin/presentation-audio'),
  getPresentationAudioItem: (id) => request(`/admin/presentation-audio/${id}`),
  createPresentationAudio: async (formData) => {
    const token = getToken()
    const base = API_ORIGIN ? `${API_ORIGIN}/api` : API_BASE
    const res = await fetch(`${base}/admin/presentation-audio`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'অডিও আপলোড ব্যর্থ')
    return data
  },
  updatePresentationAudio: (id, data) =>
    request(`/admin/presentation-audio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePresentationAudio: (id) =>
    request(`/admin/presentation-audio/${id}`, { method: 'DELETE' }),
  reorderPresentationAudio: (order) =>
    request('/admin/presentation-audio/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order }),
    }),

  // Timelines (presentation management)
  getTimelines: () => request('/admin/timelines'),
  getTimeline: (id) => request(`/admin/timelines/${id}`),
  createTimeline: (data) =>
    request('/admin/timelines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTimeline: (id, data) =>
    request(`/admin/timelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTimeline: (id) => request(`/admin/timelines/${id}`, { method: 'DELETE' }),
  addTimelineFrame: (timelineId, data = {}) =>
    request(`/admin/timelines/${timelineId}/frames`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTimelineFrame: (timelineId, frameId, data) =>
    request(`/admin/timelines/${timelineId}/frames/${frameId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTimelineFrame: (timelineId, frameId) =>
    request(`/admin/timelines/${timelineId}/frames/${frameId}`, { method: 'DELETE' }),
  addTimelineFrameItem: (timelineId, frameId, itemType, itemRef) =>
    request(`/admin/timelines/${timelineId}/frames/${frameId}/items`, {
      method: 'POST',
      body: JSON.stringify({ item_type: itemType, item_ref: String(itemRef) }),
    }),
  updateTimelineFrameItem: (timelineId, frameId, itemId, data) =>
    request(`/admin/timelines/${timelineId}/frames/${frameId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTimelineFrameItem: (timelineId, frameId, itemId) =>
    request(`/admin/timelines/${timelineId}/frames/${frameId}/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Virtual seminar timeline (presentation management)
  getVirtualSeminarTimeline: () => request('/admin/virtual-seminar-timeline'),
  setVirtualSeminarTimeline: (timelineId) =>
    request('/admin/virtual-seminar-timeline', {
      method: 'PUT',
      body: JSON.stringify({ timeline_id: timelineId }),
    }),
  getSeminars: () => request('/admin/seminars'),
  createSeminar: (data) =>
    request('/admin/seminars', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSeminar: (id) => request(`/admin/seminars/${id}`),
  updateSeminar: (id, data) =>
    request(`/admin/seminars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadSeminarCover: async (id, file) => {
    const fd = new FormData()
    fd.append('cover', file)
    const base = API_ORIGIN ? `${API_ORIGIN}${API_BASE}` : API_BASE
    const url = `${base}/admin/seminars/${id}/cover`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || res.statusText)
    return data
  },
  getSeminarRegistrations: (id) => request(`/admin/seminars/${id}/registrations`),
  getSeminarStats: (id) => request(`/admin/seminars/${id}/stats`),

  // Role & Permission management
  getPermissions: () => request('/admin/permissions'),
  getRoles: () => request('/admin/roles'),
  createRole: (data) => request('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRole: (id, data) => request(`/admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteRole: (id) => request(`/admin/roles/${id}`, { method: 'DELETE' }),
  getRolePermissions: (id) => request(`/admin/roles/${id}/permissions`),
}

export const tasksApi = {
  getMyTasks: (params) => {
    const q = new URLSearchParams(params || {}).toString()
    return request(`/tasks/my-tasks${q ? '?' + q : ''}`)
  },
  getTask: (id) => request(`/tasks/${id}`),
  updateStatus: (id, status) =>
    request(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  addAttachment: async (taskId, formData) => {
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload file')
    }
    return data
  },
  getAttachments: (taskId) => request(`/tasks/${taskId}/attachments`),
  deleteAttachment: (taskId, attachmentId) =>
    request(`/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE' }),
  addComment: (taskId, message) =>
    request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  getComments: (taskId) => request(`/tasks/${taskId}/comments`),
}
