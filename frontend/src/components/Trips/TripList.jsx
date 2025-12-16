import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

export default function TripList() {
    const [trips, setTrips] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTrip, setNewTrip] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        notes: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const res = await axiosInstance.get('/trips');
                setTrips(res.data);
            } catch (error) {
                console.error('Error fetching trips:', error);
            }
        };

        fetchTrips();
    }, []);

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosInstance.post('/trips', newTrip);
            setTrips([...trips, res.data]);
            setShowModal(false);
            setNewTrip({ destination: '', startDate: '', endDate: '', notes: '' });
        } catch (error) {
            console.error('Error creating trip:', error);
        }
    };

    const handleDeleteTrip = async (e, tripId) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this trip?')) return;
        try {
            await axiosInstance.delete(`/trips/${tripId}`);
            setTrips(trips.filter(t => t._id !== tripId));
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    return (
        <div className="trip-list-container">
            {/* Header handled by Dashboard now or keep minimalistic */}

            <div className="section-header">
                <div></div> {/* Spacer for flex-between or just use flex-end */}
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    + New Trip
                </button>
            </div>

            <div className="trips-grid">
                {trips.length === 0 ? (
                    <div className="text-gray-400 col-span-full text-center py-10" style={{ color: '#586069' }}>
                        No trips yet. Initializing null state...
                        <br />
                        <button style={{ marginTop: '1rem' }} className="view-details" onClick={() => setShowModal(true)}>Create one now</button>
                    </div>
                ) : (
                    trips.slice().reverse().map(trip => (
                        <div key={trip._id} className="trip-card" onClick={() => navigate(`/trips/${trip._id}`)}>
                            <button
                                className="delete-trip-btn"
                                onClick={(e) => handleDeleteTrip(e, trip._id)}
                                title="Delete Trip"
                            >
                                ✕
                            </button>
                            <h3 className="trip-destination">{trip.destination}</h3>
                            <p className="trip-dates">
                                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                            </p>
                            <span className="view-details">View Itinerary →</span>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Plan to explore...</h3>
                        <form onSubmit={handleCreateTrip}>
                            <input
                                type="text"
                                placeholder="Where to?"
                                value={newTrip.destination}
                                onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })}
                                required
                            />
                            <div className="date-inputs">
                                <div>
                                    <label>Start</label>
                                    <input
                                        type="date"
                                        value={newTrip.startDate}
                                        onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>End</label>
                                    <input
                                        type="date"
                                        value={newTrip.endDate}
                                        onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Trip notes..."
                                value={newTrip.notes}
                                onChange={e => setNewTrip({ ...newTrip, notes: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Trip</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
