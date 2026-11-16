
import { useEffect, useRef, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  // Authentication
  const [sessionStatus, setSessionStatus] = useState(
    sessionStorage.getItem('token') ? 'checking' : 'guest'
  )
  const [view, setView] = useState('login')
  const sessionVersion = useRef(0)

  // Messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Tasks
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Editing
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Registration
  const [username, setUsername] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [password, setPassword] = useState('')
  const [registering, setRegistering] = useState(false)

  // Login
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const isLoggedIn = sessionStatus === 'authenticated'

  const busy =
    loading ||
    adding ||
    updatingId !== null ||
    deletingId !== null ||
    savingEdit

  const completedCount = tasks.filter(
    task => task.marked_as_done
  ).length

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  function clearSession() {
    sessionVersion.current += 1
    sessionStorage.removeItem('token')

    setSessionStatus('guest')
    setView('login')
    setTasks([])
    setNewTask('')
    setEditingId(null)
    setEditTitle('')
    setPassword('')
    setLoginPassword('')
  }

  function handleApiError(err) {
    if (err.status === 401) {
      clearSession()
      setError('Session expired. Please login again.')
    } else {
      setError(err.message)
    }
  }

  // Fetch tasks and validate session
  async function loadTasks(verifySession = false) {
    const version = sessionVersion.current

    setLoading(true)
    setError('')

    if (verifySession) {
      setSessionStatus('checking')
    }

    try {
      const data = await todoApi.getTasks()

      if (version !== sessionVersion.current) {
        return false
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid task list received.')
      }

      setTasks(data)
      setSessionStatus('authenticated')
      return true
    } catch (err) {
      if (version !== sessionVersion.current) {
        return false
      }

      if (err.status === 401) {
        handleApiError(err)
      } else {
        setError(err.message)

        if (verifySession) {
          setSessionStatus('unverified')
        }
      }

      return false
    } finally {
      if (version === sessionVersion.current) {
        setLoading(false)
      }
    }
  }

  // Restore session after page refresh
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks(true)
    }
  }, [])

  // Navigation
  function openLogin() {
    setView('login')
    clearMessages()
  }

  function openRegister() {
    setView('register')
    clearMessages()
  }

  // Register new user
  async function handleRegister(event) {
    event.preventDefault()

    if (!username.trim() || !password || registering) {
      return
    }

    setRegistering(true)
    clearMessages()

    try {
      const result = await todoApi.register({
        username: username.trim(),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        newPassword: password
      })

      if (!result?.access_token) {
        throw new Error('Registration did not return a token.')
      }

      sessionVersion.current += 1
      sessionStorage.setItem('token', result.access_token)
      setTasks([])
      setPassword('')

      const loaded = await loadTasks(true)

      if (loaded) {
        setUsername('')
        setFirstname('')
        setLastname('')
        setSuccess('Account created successfully!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  // Login existing user
  async function handleLogin(event) {
    event.preventDefault()

    if (!loginUsername.trim() || !loginPassword || loggingIn) {
      return
    }

    setLoggingIn(true)
    clearMessages()

    try {
      const result = await todoApi.login(
        loginUsername.trim(),
        loginPassword
      )

      if (!result?.access_token) {
        throw new Error('Login did not return a token.')
      }

      sessionVersion.current += 1
      sessionStorage.setItem('token', result.access_token)

      setTasks([])
      setNewTask('')
      setEditingId(null)
      setEditTitle('')
      setLoginPassword('')

      const loaded = await loadTasks(true)

      if (loaded) {
        setLoginUsername('')
        setSuccess('Logged in successfully!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  // Logout
  function handleLogout() {
    if (busy) return

    clearSession()
    clearMessages()
    setSuccess('You have logged out.')
  }

  // Create task
  async function handleAddTask(event) {
    event.preventDefault()

    const title = newTask.trim()

    if (!title || busy || !isLoggedIn) return

    setAdding(true)
    clearMessages()

    try {
      await todoApi.createTask(title)
      setNewTask('')

      const loaded = await loadTasks()

      if (loaded) {
        setSuccess('Task added successfully!')
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setAdding(false)
    }
  }

  // Toggle completion
  async function handleToggleTask(task) {
    if (busy || !isLoggedIn) return

    setUpdatingId(task.id)
    clearMessages()

    try {
      await todoApi.updateTask(task.id, {
        marked_as_done: !task.marked_as_done
      })

      const loaded = await loadTasks()

      if (loaded) {
        setSuccess('Task status updated!')
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Start editing
  function handleStartEdit(task) {
    if (busy) return

    setEditingId(task.id)
    setEditTitle(task.title)
    clearMessages()
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingId(null)
    setEditTitle('')
  }

  // Save edited title
  async function handleSaveEdit(event) {
    event.preventDefault()

    const title = editTitle.trim()

    if (!title || editingId === null || busy) return

    setSavingEdit(true)
    clearMessages()

    try {
      await todoApi.updateTask(editingId, { title })

      const loaded = await loadTasks()

      if (loaded) {
        setEditingId(null)
        setEditTitle('')
        setSuccess('Task updated successfully!')
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete task
  async function handleDeleteTask(task) {
    if (busy || editingId !== null) return

    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    )

    if (!confirmed) return

    setDeletingId(task.id)
    clearMessages()

    try {
      await todoApi.deleteTask(task.id)

      const loaded = await loadTasks()

      if (loaded) {
        setSuccess('Task deleted successfully!')
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="todo-container">
      <header className="app-header">
        <h1>My ToDo List</h1>

        {isLoggedIn && (
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={busy}
          >
            Logout
          </button>
        )}
      </header>

      {sessionStatus === 'checking' && (
        <div className="session-message">
          <h2>Checking your session...</h2>
          <p>Loading your account and tasks.</p>
        </div>
      )}

      {sessionStatus === 'unverified' && (
        <div className="session-message">
          <h2>Connection problem</h2>
          <p>We couldn't verify your session.</p>

          <button
            onClick={() => loadTasks(true)}
            disabled={loading}
          >
            Retry
          </button>

          <button
            className="cancel-btn"
            onClick={handleLogout}
          >
            Back to Login
          </button>
        </div>
      )}

      {sessionStatus === 'guest' && (
        <>
          <div className="auth-switch">
            <button
              onClick={openLogin}
              className={
                view === 'login' ? 'active-tab' : ''
              }
            >
              Login
            </button>

            <button
              onClick={openRegister}
              className={
                view === 'register' ? 'active-tab' : ''
              }
            >
              Register
            </button>
          </div>

          {view === 'login' ? (
            <form
              className="login-form"
              onSubmit={handleLogin}
            >
              <h2>Welcome Back</h2>

              <label htmlFor="loginUsername">
                Username
              </label>
              <input
                id="loginUsername"
                type="text"
                value={loginUsername}
                maxLength={64}
                autoComplete="username"
                required
                onChange={e =>
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
                autoComplete="current-password"
                required
                onChange={e =>
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
            </form>
          ) : (
            <form
              className="register-form"
              onSubmit={handleRegister}
            >
              <h2>Create Account</h2>

              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                maxLength={64}
                autoComplete="username"
                required
                onChange={e => setUsername(e.target.value)}
              />

              <label htmlFor="firstname">
                First name
              </label>
              <input
                id="firstname"
                type="text"
                value={firstname}
                autoComplete="given-name"
                onChange={e => setFirstname(e.target.value)}
              />

              <label htmlFor="lastname">
                Last name
              </label>
              <input
                id="lastname"
                type="text"
                value={lastname}
                autoComplete="family-name"
                onChange={e => setLastname(e.target.value)}
              />

              <label htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="new-password"
                required
                onChange={e => setPassword(e.target.value)}
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
          )}
        </>
      )}

      {isLoggedIn && (
        <>
          <form
            className="todo-form"
            onSubmit={handleAddTask}
          >
            <input
              type="text"
              value={newTask}
              maxLength={255}
              placeholder="Enter a new task..."
              aria-label="New task title"
              onChange={e => setNewTask(e.target.value)}
            />

            <button
              type="submit"
              disabled={busy || !newTask.trim()}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>

          <div className="progress-section">
            <p className="task-counter">
              Completed: {completedCount} / {tasks.length}
            </p>

            <div
              className="progress-track"
              role="progressbar"
              aria-label="Completed tasks"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            className="refresh-btn"
            onClick={() => loadTasks()}
            disabled={busy}
          >
            Refresh tasks
          </button>

          {loading && <p>Loading tasks...</p>}

          {!loading && tasks.length === 0 && !error && (
            <p className="empty-message">
              No tasks yet. Add your first task!
            </p>
          )}

          <div className="todo-list">
            {tasks.map(task => (
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
                      aria-label="Edit task title"
                      disabled={savingEdit}
                      onChange={e =>
                        setEditTitle(e.target.value)
                      }
                    />

                    <button
                      className="save-btn"
                      type="submit"
                      disabled={
                        savingEdit || !editTitle.trim()
                      }
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      className="cancel-btn"
                      type="button"
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
                      disabled={busy}
                      aria-label={`Complete ${task.title}`}
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
                      type="button"
                      className="edit-btn"
                      disabled={
                        busy || editingId !== null
                      }
                      onClick={() =>
                        handleStartEdit(task)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      disabled={
                        busy || editingId !== null
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

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
    </div>
  )
}

export default App
