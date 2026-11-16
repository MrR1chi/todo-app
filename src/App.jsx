
import { useEffect, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  // Tasks
  const [tasks, setTasks] = useState([])
  const [token, setToken] = useState(
    sessionStorage.getItem('token') || ''
  )

  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  // Editing
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Deleting
  const [deletingId, setDeletingId] = useState(null)

  // Registration
  const [showRegister, setShowRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [password, setPassword] = useState('')
  const [registering, setRegistering] = useState(false)

  // Login
  const [showLogin, setShowLogin] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Get tasks from the server
  async function loadTasks() {
    setLoading(true)
    setError('')

    try {
      const data = await todoApi.getTasks()
      setTasks(data)
    } catch (err) {
      setError(err.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Automatically load tasks if token exists
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks()
    }
  }, [])

  // Save token manually (temporary feature)
  async function handleLoadTasks() {
    if (!token.trim()) {
      setError('Please enter your API token')
      return
    }

    sessionStorage.setItem('token', token.trim())
    setTasks([])
    await loadTasks()
  }

  // Switch between pages
  function openRegister() {
    setShowRegister(true)
    setShowLogin(false)
    setError('')
  }

  function openLogin() {
    setShowLogin(true)
    setShowRegister(false)
    setError('')
  }

  function openTasks() {
    setShowRegister(false)
    setShowLogin(false)
    setError('')
  }

  // Register new user
  async function handleRegister(event) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Username and password are required')
      return
    }

    setRegistering(true)
    setError('')

    try {
      const userData = {
        username: username.trim(),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        newPassword: password
      }

      const result = await todoApi.register(userData)

      if (!result?.access_token) {
        throw new Error(
          'Registration did not return a token'
        )
      }

      sessionStorage.setItem(
        'token',
        result.access_token
      )

      setToken(result.access_token)
      setTasks([])

      setUsername('')
      setFirstname('')
      setLastname('')
      setPassword('')

      openTasks()
      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  // Login to existing account
  async function handleLogin(event) {
    event.preventDefault()

    const usernameValue = loginUsername.trim()

    if (!usernameValue || !loginPassword) {
      setError('Please enter username and password')
      return
    }

    setLoggingIn(true)
    setError('')

    try {
      const result = await todoApi.login(
        usernameValue,
        loginPassword
      )

      if (!result?.access_token) {
        throw new Error('Login did not return a token')
      }

      // Save token of the logged-in user
      sessionStorage.setItem(
        'token',
        result.access_token
      )

      setToken(result.access_token)

      // Clear tasks from previous account
      setTasks([])
      setNewTask('')
      setEditingId(null)
      setEditTitle('')

      // Clear login form
      setLoginUsername('')
      setLoginPassword('')

      openTasks()

      // Load tasks of the logged-in user
      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  // Create task
  async function handleAddTask(event) {
    event.preventDefault()

    const title = newTask.trim()

    if (!title || adding) {
      return
    }

    if (!sessionStorage.getItem('token')) {
      setError('Please login first')
      return
    }

    setAdding(true)
    setError('')

    try {
      await todoApi.createTask(title)
      setNewTask('')
      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  // Toggle checkbox
  async function handleToggleTask(task) {
    if (
      updatingId !== null ||
      deletingId !== null ||
      savingEdit ||
      loading
    ) {
      return
    }

    setUpdatingId(task.id)
    setError('')

    try {
      await todoApi.updateTask(task.id, {
        marked_as_done: !task.marked_as_done
      })

      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // Start editing
  function handleStartEdit(task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setError('')
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingId(null)
    setEditTitle('')
  }

  // Save edited task
  async function handleSaveEdit(event) {
    event.preventDefault()

    const title = editTitle.trim()

    if (!title || editingId === null || savingEdit) {
      return
    }

    setSavingEdit(true)
    setError('')

    try {
      await todoApi.updateTask(editingId, {
        title
      })

      await loadTasks()
      setEditingId(null)
      setEditTitle('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete task
  async function handleDeleteTask(task) {
    if (
      deletingId !== null ||
      updatingId !== null ||
      savingEdit ||
      loading
    ) {
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(task.id)
    setError('')

    try {
      await todoApi.deleteTask(task.id)
      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const completedCount = tasks.filter(
    (task) => task.marked_as_done
  ).length

  return (
    <div className="todo-container">
      <h1>My ToDo List</h1>

      <div className="auth-switch">
        <button
          type="button"
          onClick={openTasks}
        >
          Tasks
        </button>

        <button
          type="button"
          onClick={openLogin}
        >
          Login
        </button>

        <button
          type="button"
          onClick={openRegister}
        >
          Register
        </button>
      </div>

      {showLogin ? (
        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <h2>Login</h2>

          <label htmlFor="loginUsername">
            Username
          </label>
          <input
            id="loginUsername"
            type="text"
            value={loginUsername}
            maxLength={64}
            required
            onChange={(e) =>
              setLoginUsername(e.target.value)
            }
          />

          <label htmlFor="loginPassword">
            Password
          </label>
          <input
            id="loginPassword"
            type="password"
            value={loginPassword}
            required
            onChange={(e) =>
              setLoginPassword(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={
              loggingIn ||
              !loginUsername.trim() ||
              !loginPassword
            }
          >
            {loggingIn ? 'Logging in...' : 'Login'}
          </button>

          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="text-btn"
              onClick={openRegister}
            >
              Register
            </button>
          </p>
        </form>
      ) : showRegister ? (
        <form
          className="register-form"
          onSubmit={handleRegister}
        >
          <h2>Register</h2>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            maxLength={64}
            required
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <label htmlFor="firstname">
            First name
          </label>
          <input
            id="firstname"
            type="text"
            value={firstname}
            onChange={(e) =>
              setFirstname(e.target.value)
            }
          />

          <label htmlFor="lastname">
            Last name
          </label>
          <input
            id="lastname"
            type="text"
            value={lastname}
            onChange={(e) =>
              setLastname(e.target.value)
            }
          />

          <label htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            required
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={
              registering ||
              !username.trim() ||
              !password
            }
          >
            {registering
              ? 'Registering...'
              : 'Register'}
          </button>
        </form>
      ) : (
        <>
          <div className="token-form">
            <input
              type="password"
              placeholder="Enter your API token"
              value={token}
              onChange={(e) =>
                setToken(e.target.value)
              }
            />

            <button onClick={handleLoadTasks}>
              Load Tasks
            </button>
          </div>

          <form
            className="todo-form"
            onSubmit={handleAddTask}
          >
            <input
              type="text"
              placeholder="Enter a new task..."
              value={newTask}
              maxLength={255}
              onChange={(e) =>
                setNewTask(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={adding || !newTask.trim()}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>

          <p className="task-counter">
            Completed: {completedCount} / {tasks.length}
          </p>

          {loading && <p>Loading tasks...</p>}

          {!loading && !error && tasks.length === 0 && (
            <p>No tasks found.</p>
          )}

          <div className="todo-list">
            {tasks.map((task) => (
              <div
                className="todo-item"
                key={task.id}
              >
                {editingId === task.id ? (
                  <form
                    className="edit-form"
                    onSubmit={handleSaveEdit}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      maxLength={255}
                      disabled={savingEdit}
                      onChange={(e) =>
                        setEditTitle(e.target.value)
                      }
                    />

                    <button
                      type="submit"
                      className="save-btn"
                      disabled={
                        savingEdit || !editTitle.trim()
                      }
                    >
                      {savingEdit
                        ? 'Saving...'
                        : 'Save'}
                    </button>

                    <button
                      type="button"
                      className="cancel-btn"
                      disabled={savingEdit}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={Boolean(
                        task.marked_as_done
                      )}
                      disabled={
                        updatingId !== null ||
                        deletingId !== null ||
                        savingEdit ||
                        loading
                      }
                      onChange={() =>
                        handleToggleTask(task)
                      }
                    />

                    <span
                      className={
                        task.marked_as_done
                          ? 'completed'
                          : ''
                      }
                    >
                      {task.title}
                    </span>

                    <button
                      className="edit-btn"
                      disabled={
                        editingId !== null ||
                        updatingId !== null ||
                        deletingId !== null ||
                        loading
                      }
                      onClick={() =>
                        handleStartEdit(task)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      disabled={
                        deletingId !== null ||
                        updatingId !== null ||
                        savingEdit ||
                        editingId !== null ||
                        loading
                      }
                      onClick={() =>
                        handleDeleteTask(task)
                      }
                    >
                      {deletingId === task.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default App
