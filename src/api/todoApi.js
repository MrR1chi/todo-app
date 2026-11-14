
const API_URL = 'https://demo2.z-bit.ee';

async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = sessionStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  const text = await response.text();
  const result = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(result?.message || 'API request failed');
  }

  return result;
}

export const todoApi = {
  getTasks: () => apiRequest('/tasks'),

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
    apiRequest('/users', 'POST', userData),

  login: (username, password) =>
    apiRequest('/users/get-token', 'POST', {
      username,
      password
    })
};
