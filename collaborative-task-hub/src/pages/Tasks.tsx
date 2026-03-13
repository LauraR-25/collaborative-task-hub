import React from 'react';
import './Tasks.css';
import data from '../data.json';

const Tasks = () => {
  return (
    <div className="tasks-container">
      <header className="tasks-header">
        <h1>TaskFlow</h1>
        <div className="user-info">👤 Juan Pérez</div>
      </header>
      <div className="tasks-actions">
        <input
          type="text"
          placeholder="🔍 Buscar tareas..."
          className="search-input"
        />
        <button className="new-task-button">➕ Nueva Tarea</button>
      </div>
      <div className="tasks-grid">
        {data.projects.map((project) => (
          <div key={project.id} className="task-card">
            <h2>{project.name}</h2>
            <p>{project.tasks} tareas</p>
            <p>{project.members} miembros</p>
            <p>Última: {project.lastUpdate}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;