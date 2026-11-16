
const API_URL = 'https://demo2.z-bit.ee'

// Universal function for HTTP requests
async function apiRequest(
  endpoint,
  method = 'GET',
  data = null,
  requiresAuth = true
) {
  const headers = {
    'Content-Type': 'application/json'
  }

  // Add token only for protected requests
  if (requiresAuth) {
    const token = sessionStorage.getItem('token')

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const options = {
    method,
    headers
  }

  if (data !== null) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    options
  )

  const text = await response.text()
  const result = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      result?.message ||
      `Request failed: ${response.status}`
    )
  }

  return result
}

export const todoApi = {
  // Tasks
  getTasks: () =>
    apiRequest('/tasks'),

  createTask: (title) =>
    apiRequest('/tasks', 'POST', {
      title,
      desc: ''
    }),

  updateTask: (id, data) =>
    apiRequest(`/tasks/${id}`, 'PUT', data),

  deleteTask: (id) =>
    apiRequest(`/tasks/${id}`, 'DELETE'),

  // Authentication
  register: (userData) =>
    apiRequest('/users', 'POST', userData, false),

  login: (username, password) =>
    apiRequest(
      '/users/get-token',
      'POST',
      { username, password },
      false
    )
}
