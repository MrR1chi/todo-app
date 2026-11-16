
const API_URL = 'https://demo2.z-bit.ee'

async function apiRequest(
  endpoint,
  method = 'GET',
  data = null,
  requiresAuth = true
) {
  const headers = {
    'Content-Type': 'application/json'
  }

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

  let result = null

  if (text) {
    try {
      result = JSON.parse(text)
    } catch {
      throw new Error('Invalid server response')
    }
  }

  if (!response.ok) {
    const error = new Error(
      result?.message ||
      `Request failed: ${response.status}`
    )

    error.status = response.status

    throw error
  }

  return result
}

export const todoApi = {
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
