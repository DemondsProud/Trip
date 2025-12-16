import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';
import '../../index.css'; // Corrected path
import './AdminDashboard.css'; // New custom CSS

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, trips: 0, partnerships: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:5005/api/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-title-section">
                    <div className="admin-avatar">
                        A
                    </div>
                    <div className="admin-title">
                        <h1>Admin Portal</h1>
                        <p>System Overview & Management</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="sign-out-btn"
                >
                    Sign Out
                </button>
            </header>

            <main className="admin-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">👥</div>
                            <span className="stat-trend">+{stats.trends?.users || 0}% this week</span>
                        </div>
                        <h3>Total Users</h3>
                        <p className="stat-value">{loading ? "..." : stats.users}</p>
                        <p className="stat-desc">Active registered accounts</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">✈️</div>
                            <span className="stat-trend">+{stats.trends?.trips || 0}% this week</span>
                        </div>
                        <h3>Total Trips</h3>
                        <p className="stat-value">{loading ? "..." : stats.trips}</p>
                        <p className="stat-desc">Itineraries generated</p>
                    </div>
                </div>

                {/* Dashboard Content Grid */}
                <div className="dashboard-grid">
                    <div className="glass-panel">
                        <h3 className="panel-title">
                            <span className="dot" style={{ background: '#d73a49' }}></span>
                            System Health
                        </h3>
                        <div className="health-list">
                            <div className="health-item">
                                <div className="health-label">
                                    <span className="status-dot" style={{ background: '#2ea44f' }}></span>
                                    <span>API Status</span>
                                </div>
                                <span className="status-text" style={{ color: '#2ea44f' }}>
                                    {stats.systemHealth?.api || 'Unknown'}
                                </span>
                            </div>
                            <div className="health-item">
                                <div className="health-label">
                                    <span className="status-dot" style={{
                                        background: stats.systemHealth?.db === 'Connected' ? '#2ea44f' : '#d73a49'
                                    }}></span>
                                    <span>Database</span>
                                </div>
                                <span className="status-text" style={{
                                    color: stats.systemHealth?.db === 'Connected' ? '#2ea44f' : '#d73a49'
                                }}>
                                    {stats.systemHealth?.db || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
