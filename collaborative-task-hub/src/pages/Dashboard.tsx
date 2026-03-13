import React from 'react';
import './Dashboard.css';
import data from '../data.json';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>TaskFlow</h1>
        <div className="user-info">👤 Juan Pérez</div>
      </header>
      <div className="dashboard-actions">
        <input
          type="text"
          placeholder="🔍 Buscar proyectos..."
          className="search-input"
        />
        <button className="new-project-button">➕ Nuevo Proyecto</button>
      </div>
      <div className="projects-grid">
        {data.projects.map((project) => (
          <div key={project.id} className="project-card">
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

export default Dashboard;