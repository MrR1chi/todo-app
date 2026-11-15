
import { useEffect, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])

  const [token, setToken] = useState(
    sessionStorage.getItem('token') || ''
  )

  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  // States for editing a task
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Get all tasks from the server
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

  // Load tasks when the page opens
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks()
    }
  }, [])

  // Save token and load tasks
  async function handleLoadTasks() {
    if (!token.trim()) {
      setError('Please enter your API token')
      return
    }

    sessionStorage.setItem('token', token.trim())
    await loadTasks()
  }

  // Create a new task
  async function handleAddTask(event) {
    event.preventDefault()

    const title = newTask.trim()

    if (!title) {
      return
    }

    if (!sessionStorage.getItem('token')) {
      setError('Please enter your API token first')
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

  // Mark task as completed or not completed
  async function handleToggleTask(task) {
    if (updatingId !== null || savingEdit || loading) {
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

  // Start editing a task
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

  // Save edited task to the server
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
        title: title
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

  // Count completed tasks
  const completedCount = tasks.filter(
    (task) => task.marked_as_done
  ).length

  return (
    <div className="todo-container">
      <h1>My ToDo List</h1>

      <div className="token-form">
        <input
          type="password"
          placeholder="Enter your API token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
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
          onChange={(e) => setNewTask(e.target.value)}
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

      {error && <p className="error">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p>No tasks found.</p>
      )}

      <div className="todo-list">
        {tasks.map((task) => (
          <div className="todo-item" key={task.id}>
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
                  checked={Boolean(task.marked_as_done)}
                  disabled={
                    updatingId !== null ||
                    savingEdit ||
                    loading
                  }
                  onChange={() => handleToggleTask(task)}
                />

                <span
                  className={
                    task.marked_as_done ? 'completed' : ''
                  }
                >
                  {task.title}
                </span>

                <button
                  className="edit-btn"
                  disabled={
                    editingId !== null ||
                    updatingId !== null ||
                    loading
                  }
                  onClick={() => handleStartEdit(task)}
                >
                  Edit
                </button>

                <button className="delete-btn" disabled>
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
