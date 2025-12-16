import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
    const navigate = useNavigate();
    const [typedText, setTypedText] = useState('');

    const projectInfo = JSON.stringify({
        project: "Smart Travel Planner",
        version: "1.0.0",
        developer: "Ved",
        status: "Online",
        stack: {
            frontend: "React 19 + Vite",
            backend: "Node.js + Express",
            database: "MongoDB"
        },
        features: [
            "💰 Expense Tracking & Charts",
            "🔐 Secure JWT Authentication",
            "🌍 Interactive Trip Management",
            "📱 Clean & Minimal UI"
        ]
    }, null, 4);

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < projectInfo.length) {
                setTypedText(projectInfo.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 10); // Typing speed
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="home-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff',
            color: '#24292e',
            fontFamily: 'var(--font-mono)'
        }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>TripPlanner.exe</h1>

            <div className="code-window" style={{
                width: '90%',
                maxWidth: '800px',
                background: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid #e1e4e8',
                overflow: 'hidden'
            }}>
                <div className="window-header" style={{
                    background: '#f6f8fa',
                    padding: '10px 15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid #e1e4e8'
                }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', border: '1px solid #e0443e' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', border: '1px solid #dea123' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', border: '1px solid #1aab29' }}></div>
                    <span style={{ marginLeft: '15px', color: '#586069', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>~/smart-travel/info.json</span>
                </div>
                <div className="window-content" style={{
                    padding: '24px',
                    overflowX: 'auto',
                    background: '#ffffff'
                }}>
                    <pre style={{ margin: 0 }}>
                        <code style={{ color: '#24292e', fontSize: '14px', lineHeight: '1.6' }}>
                            {typedText}
                            <span className="cursor" style={{ borderRight: '2px solid #24292e', animation: 'blink 1s step-end infinite' }}></span>
                        </code>
                    </pre>
                </div>
            </div>

            <div className="cta-section" style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '12px 30px',
                        background: 'white',
                        border: '1px solid #0366d6',
                        color: '#0366d6',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        transition: 'all 0.2s',
                        borderRadius: '6px'
                    }}
                    onMouseOver={e => {
                        e.target.style.background = '#f1f8ff';
                    }}
                    onMouseOut={e => {
                        e.target.style.background = 'white';
                    }}
                >
                    &gt; Execute Login
                </button>
                <button
                    onClick={() => navigate('/signup')}
                    style={{
                        padding: '12px 30px',
                        background: '#2ea44f',
                        border: '1px solid rgba(27,31,35,0.15)',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        boxShadow: '0 1px 0 rgba(27,31,35,0.1)'
                    }}
                >
                    &gt; Initialize User
                </button>
            </div>

            <style>{`
                @keyframes blink { 0% { border-color: transparent } 50% { border-color: #24292e } }
            `}</style>
        </div>
    );
}
