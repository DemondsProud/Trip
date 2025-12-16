import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reusing existing styles for consistency

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                SmartTravel
            </div>
            <div className="nav-user">
                {user.email && <span>{user.email}</span>}
                <button onClick={handleLogout} className="logout-btn-small">Logout</button>
            </div>
        </nav>
    );
}
