
import { useEffect, useRef, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  // Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(sessionStorage.getItem('token'))
  )

  const [view, setView] = useState('tasks')
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

  const busy =
    loading ||
    adding ||
    updatingId !== null ||
    savingEdit ||
    deletingId !== null

  // Get tasks from the API
  async function loadTasks() {
    const currentSession = sessionVersion.current

    setLoading(true)
    setError('')

    try {
      const data = await todoApi.getTasks()

      if (currentSession === sessionVersion.current) {
        setTasks(data)
      }
    } catch (err) {
      if (currentSession === sessionVersion.current) {
        setError(err.message)
        setTasks([])
      }
    } finally {
      if (currentSession === sessionVersion.current) {
        setLoading(false)
      }
    }
  }

  // Load tasks when opening the application
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks()
    }
  }, [])

  // Navigation
  function openRegister() {
    setView('register')
    setError('')
  }

  function openLogin() {
    setView('login')
    setError('')
  }

  function openTasks() {
    setView('tasks')
    setError('')
  }

  // Register a user
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
        throw new Error('Registration did not return a token')
      }

      sessionVersion.current += 1

      sessionStorage.setItem('token', result.access_token)
      setIsLoggedIn(true)
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

  // Login to an existing account
  async function handleLogin(event) {
    event.preventDefault()

    if (!loginUsername.trim() || !loginPassword) {
      setError('Please enter username and password')
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

      setIsLoggedIn(true)
      setTasks([])
      setNewTask('')
      setEditingId(null)
      setEditTitle('')

      setLoginUsername('')
      setLoginPassword('')

      openTasks()
      await loadTasks()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  // Logout from the current account
  function handleLogout() {
    if (busy || registering || loggingIn) {
      return
    }

    sessionVersion.current += 1

    // Remove authentication token
    sessionStorage.removeItem('token')

    // Reset authentication
    setIsLoggedIn(false)

    // Clear previous user's data
    setTasks([])
    setNewTask('')
    setEditingId(null)
    setEditTitle('')
    setError('')

    // Clear forms
    setLoginUsername('')
    setLoginPassword('')
    setUsername('')
    setFirstname('')
    setLastname('')
    setPassword('')

    // Show login screen
    setView('login')
  }

  // Create task
  async function handleAddTask(event) {
    event.preventDefault()

    const title = newTask.trim()

    if (!title || adding || !isLoggedIn) {
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

  // Mark task as completed or incomplete
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
      setError(err.message)
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
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Number of completed tasks
  const completedCount = tasks.filter(
    (task) => task.marked_as_done
  ).length

  return (
    <div className="todo-container">
      <h1>My ToDo List</h1>

      <div className="auth-switch">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={openTasks}
            >
              Tasks
            </button>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              disabled={busy}
            >
              Logout
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {!isLoggedIn && view === 'login' && (
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

      {!isLoggedIn && view === 'register' && (
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
      )}

      {!isLoggedIn && view === 'tasks' && (
        <div className="guest-message">
          <h2>Welcome!</h2>
          <p>
            Please login or register to manage your tasks.
          </p>
          <button onClick={openLogin}>Login</button>
        </div>
      )}

      {isLoggedIn && (
        <>
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
