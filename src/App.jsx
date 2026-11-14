
import { useEffect, useState } from 'react'
import { todoApi } from './api/todoApi'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [token, setToken] = useState(
    sessionStorage.getItem('token') || ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      loadTasks()
    }
  }, [])

  async function handleLoadTasks() {
    if (!token.trim()) {
      setError('Please enter your API token')
      return
    }

    sessionStorage.setItem('token', token.trim())
    await loadTasks()
  }

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

      <div className="todo-form">
        <input
          type="text"
          placeholder="Enter a new task..."
        />
        <button disabled>Add</button>
      </div>

      {loading && <p>Loading tasks...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p>No tasks found.</p>
      )}

      <div className="todo-list">
        {tasks.map((task) => (
          <div className="todo-item" key={task.id}>
            <input
              type="checkbox"
              checked={task.marked_as_done}
              disabled
              readOnly
            />

            <span>{task.title}</span>

            <button className="delete-btn" disabled>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
