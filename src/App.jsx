
import './App.css'

function App() {
  const tasks = [
    { id: 1, title: 'Õppida Reacti', completed: false },
    { id: 2, title: 'Teha kodutöö', completed: true },
    { id: 3, title: 'Ühendada API', completed: false }
  ]

  return (
    <div className="todo-container">
      <h1>My ToDo List</h1>

      <div className="todo-form">
        <input
          type="text"
          placeholder="Enter a new task..."
        />
        <button>Add</button>
      </div>

      <div className="todo-list">
        {tasks.map((task) => (
          <div className="todo-item" key={task.id}>
            <input
              type="checkbox"
              defaultChecked={task.completed}
            />
            <span>{task.title}</span>
            <button className="delete-btn">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
