import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import TripList from './Trips/TripList';
import './Auth.css';

export default function Dashboard() {
  const navigate = useNavigate();


  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="main-content">
        <div className="section-header-row">
          <h1 className="page-title">Your Adventures</h1>

        </div>
        <TripList />
      </main>
    </div>
  );
}
