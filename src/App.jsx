
import { useEffect, useRef, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  // Authentication
  const [sessionStatus, setSessionStatus] = useState(
    sessionStorage.getItem('token')
      ? 'checking'
      : 'guest'
  )

  const [view, setView] = useState('login')
  const [error, setError] = useState('')
  const sessionVersion = useRef(0)

  // Tasks
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // Editing
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Deleting
  const [deletingId, setDeletingId] = useState(null)

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
    savingEdit ||
    deletingId !== null

  // Clear local authentication
  function clearSession() {
    sessionVersion.current += 1

    sessionStorage.removeItem('token')
    setSessionStatus('guest')

    setTasks([])
    setNewTask('')
    setEditingId(null)
    setEditTitle('')
    setView('login')
  }

  // Handle server errors
  function handleApiError(err) {
    if (err.status === 401) {
      clearSession()
      setError('Session expired. Please login again.')
    } else {
      setError(err.message)
    }
  }

  // Get tasks and validate the current session
  async function loadTasks(verifySession = false) {
    const currentSession = sessionVersion.current

    setLoading(true)
    setError('')

    if (verifySession) {
      setSessionStatus('checking')
    }

    try {
      const data = await todoApi.getTasks()

      if (currentSession !== sessionVersion.current) {
        return
      }

      setTasks(data)
      setSessionStatus('authenticated')
    } catch (err) {
      if (currentSession !== sessionVersion.current) {
        return
      }

      if (err.status === 401) {
        handleApiError(err)
      } else if (verifySession) {
        setSessionStatus('unverified')
        setError(err.message)
      } else {
        setError(err.message)
      }
    } finally {
      if (currentSession === sessionVersion.current) {
        setLoading(false)
      }
    }
  }

  // Restore the session when the page opens
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks(true)
    }
  }, [])

  // Navigation
  function openLogin() {
    setView('login')
    setError('')
  }

  function openRegister() {
    setView('register')
    setError('')
  }

  // Register
  async function handleRegister(event) {
    event.preventDefault()

    if (!username.trim() || !password || registering) {
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
        throw new Error('Registration did not return a token')
      }

      sessionVersion.current += 1
      sessionStorage.setItem('token', result.access_token)

      setTasks([])
      setNewTask('')
      setPassword('')

      setUsername('')
      setFirstname('')
      setLastname('')
      setView('login')

      await loadTasks(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  // Login
  async function handleLogin(event) {
    event.preventDefault()

    if (
      !loginUsername.trim() ||
      !loginPassword ||
      loggingIn
    ) {
      return
    }

    setLoggingIn(true)
    setError('')

    try {
      const result = await todoApi.login(
        loginUsername.trim(),
        loginPassword
      )

      if (!result?.access_token) {
        throw new Error('Login did not return a token')
      }

      sessionVersion.current += 1
      sessionStorage.setItem('token', result.access_token)

      setTasks([])
      setNewTask('')
      setEditingId(null)
      setEditTitle('')

      setLoginUsername('')
      setLoginPassword('')

      await loadTasks(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  // Logout
  function handleLogout() {
    if (busy) {
      return
    }

    clearSession()

    setError('')
    setLoginUsername('')
    setLoginPassword('')
    setUsername('')
    setFirstname('')
    setLastname('')
    setPassword('')
  }

  // Create task
  async function handleAddTask(event) {
    event.preventDefault()

    const title = newTask.trim()

    if (!title || busy || !isLoggedIn) {
      return
    }

    setAdding(true)
    setError('')

    try {
      await todoApi.createTask(title)
      setNewTask('')
      await loadTasks()
    } catch (err) {
      handleApiError(err)
    } finally {
      setAdding(false)
    }
  }

  // Toggle checkbox
  async function handleToggleTask(task) {
    if (busy || !isLoggedIn) {
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
      handleApiError(err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Start editing
  function handleStartEdit(task) {
    if (busy) {
      return
    }

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

    if (!title || editingId === null || busy) {
      return
    }

    setSavingEdit(true)
    setError('')

    try {
      await todoApi.updateTask(editingId, { title })
      await loadTasks()

      if (sessionStorage.getItem('token')) {
        setEditingId(null)
        setEditTitle('')
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete task
  async function handleDeleteTask(task) {
    if (busy || editingId !== null) {
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
      handleApiError(err)
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

      {isLoggedIn ? (
        <div className="auth-switch">
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      ) : sessionStatus === 'guest' ? (
        <div className="auth-switch">
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
      ) : null}

      {sessionStatus === 'checking' && (
        <div className="session-message">
          <h2>Checking your session...</h2>
          <p>Please wait while we load your tasks.</p>
        </div>
      )}

      {sessionStatus === 'unverified' && (
        <div className="session-message">
          <h2>Connection problem</h2>
          <p>
            We could not verify your session.
            Your token is still saved.
          </p>

          <button
            type="button"
            onClick={() => loadTasks(true)}
            disabled={loading}
          >
            Retry
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={handleLogout}
          >
            Back to Login
          </button>
        </div>
      )}

      {sessionStatus === 'guest' && view === 'login' && (
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
      )}

      {sessionStatus === 'guest' && view === 'register' && (
        <form
          className="register-form"
          onSubmit={handleRegister}
        >
          <h2>Create Account</h2>

          <label htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            maxLength={64}
            value={username}
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
            {registering ? 'Registering...' : 'Register'}
          </button>
        </form>
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
              onChange={(e) =>
                setNewTask(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={busy || !newTask.trim()}
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
                      {savingEdit ? 'Saving...' : 'Save'}
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
                      disabled={busy}
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

      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default App
