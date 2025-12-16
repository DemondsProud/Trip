import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

import Navbar from '../Navbar';
import WeatherWidget from './WeatherWidget';

export default function ItineraryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [newItem, setNewItem] = useState({
        type: 'activity',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        cost: ''
    });
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');


    // Expense State
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'other'
    });

    // Booking / Search State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingType, setBookingType] = useState('flight'); // 'flight' or 'hotel'
    const [searchParams, setSearchParams] = useState({ from: '', to: '', location: '', date: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Reset search when modal opens/closes
    useEffect(() => {
        if (!showBookingModal) {
            setSearchResults([]);
            setSearchParams({ from: '', to: '', location: '', date: '' });
        }
    }, [showBookingModal]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            let url = '';
            let params = {};
            if (bookingType === 'flight') {
                url = '/search/flights';
                params = { from: searchParams.from, to: searchParams.to, date: searchParams.date };
            } else {
                url = '/search/hotels';
                params = { location: searchParams.location, date: searchParams.date };
            }

            const res = await axiosInstance.get(url, { params });
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search error:', error);
            alert('Failed to search. Ensure backend is running.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleBookItem = async (item) => {
        // Convert search result to itinerary item format
        const bookingItem = {
            type: bookingType, // 'flight' or 'hotel'
            title: item.title,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            location: item.location, // or construct from item
            cost: item.cost,
            booked: true // Auto-book for this mock
        };

        try {
            await axiosInstance.post(`/trips/${id}/item`, {
                dayId: selectedDayId,
                ...bookingItem
            });
            await fetchTrip();
            alert(`🎉 Booked: ${item.title}`);
            setShowBookingModal(false);
        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book item.');
        }
    };

    const fetchTrip = async () => {
        try {
            const res = await axiosInstance.get(`/trips/${id}`);
            setTrip(res.data);

            if (res.data.itinerary.length > 0 && !selectedDayId) {
                setSelectedDayId(res.data.itinerary[0]._id);
            }
        } catch (error) {
            console.error('Error fetching trip:', error);
        }
    };

    useEffect(() => {
        (async () => {
            await fetchTrip();
        })();
    }, [id]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/trips/${id}/item`, {
                dayId: selectedDayId,
                ...newItem,
                cost: Number(newItem.cost)
            });
            await fetchTrip();
            setShowItemModal(false);
            setNewItem({ type: 'activity', title: '', description: '', startTime: '', endTime: '', location: '', cost: '' });
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleBooking = async (dayId, itemId) => {
        try {
            await axiosInstance.patch(`/trips/${id}/days/${dayId}/items/${itemId}/book`);
            await fetchTrip();
            alert('🎉 Booking confirmed!');
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Failed to update booking status');
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/trips/${id}/share`, { email: shareEmail });
            await fetchTrip();
            alert('🎉 Trip shared successfully!');
            setShareEmail('');
            setShowShareModal(false);
        } catch (error) {
            console.error('Error sharing trip:', error);
            alert(error.response?.data?.message || 'Failed to share trip');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/trips/${id}/expenses`, {
                ...newExpense,
                amount: Number(newExpense.amount)
            });
            await fetchTrip();
            setNewExpense({ description: '', amount: '', category: 'other' });
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await axiosInstance.delete(`/trips/${id}/expenses/${expenseId}`);
            await fetchTrip();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    // Drag and Drop Logic
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, position) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = async (e) => {
        const selectedDay = trip.itinerary.find(d => d._id === selectedDayId);
        if (!selectedDay) return;

        const listCopy = [...selectedDay.items];
        const dragItemContent = listCopy[dragItem.current];

        // Remove from old position and insert at new position
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(dragOverItem.current, 0, dragItemContent);

        // Optimistic Update
        const updatedItinerary = trip.itinerary.map(day => {
            if (day._id === selectedDayId) {
                return { ...day, items: listCopy };
            }
            return day;
        });
        setTrip({ ...trip, itinerary: updatedItinerary });

        // Persist to Backend
        try {
            await axiosInstance.patch(`/trips/${id}/days/${selectedDayId}/reorder`, {
                newItems: listCopy
            });
        } catch (error) {
            console.error('Error reordering items:', error);
            // Revert on failure (optional but recommended)
            await fetchTrip();
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    // Calucalate Expense Stats
    const expenseStats = trip?.expenses?.reduce((acc, curr) => {
        acc.total += curr.amount;
        acc.byCategory[curr.category] = (acc.byCategory[curr.category] || 0) + curr.amount;
        return acc;
    }, { total: 0, byCategory: {} }) || { total: 0, byCategory: {} };

    const categoryColors = {
        food: '#d73a49',        // Red
        transport: '#2ea44f',   // Green
        accommodation: '#6f42c1', // Purple
        activity: '#0366d6',    // Blue
        other: '#6a737d'        // Gray
    };

    // Helper to generate conic-gradient string for Pie Chart
    const getPieChartGradient = () => {
        if (expenseStats.total === 0) return 'conic-gradient(#e1e4e8 0% 100%)';

        let currentDeg = 0;
        const segments = Object.entries(expenseStats.byCategory).map(([cat, amount]) => {
            const deg = (amount / expenseStats.total) * 360;
            const color = categoryColors[cat] || categoryColors.other;
            const segment = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            return segment;
        });
        return `conic-gradient(${segments.join(', ')})`;
    };

    const handlePrint = () => {
        window.print();
    };

    if (!trip) {
        // Skeleton Loading UI
        return (
            <div className="dashboard-layout">
                <Navbar />
                <div className="main-content skeleton-container">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-tabs"></div>
                    <div className="skeleton-content"></div>
                </div>
            </div>
        );
    }

    const selectedDay = trip.itinerary.find(d => d._id === selectedDayId);


    return (
        <div className="dashboard-layout">
            <Navbar />

            <div className="main-content">
                <header className="itinerary-header">
                    <div className="header-content">
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate('/dashboard')} className="view-details" style={{ fontSize: '1rem', border: 'none', background: 'none', padding: 0, textDecoration: 'none' }}>
                                ← Back to Dashboard
                            </button>
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                            {trip.destination}
                        </h1>
                        <p style={{ color: '#586069' }}>
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-3 no-print">
                        <button className="btn-secondary" onClick={() => { setBookingType('flight'); setShowBookingModal(true); }}>Book Flight ✈️</button>
                        <button className="btn-secondary" onClick={() => { setBookingType('hotel'); setShowBookingModal(true); }}>Book Hotel 🏨</button>
                        <button className="btn-secondary" onClick={() => setShowShareModal(true)}>Share Trip 👤</button>
                        <button className="btn-primary" onClick={handlePrint}>Download PDF 📄</button>
                    </div>
                </header>



                <div className="tabs no-print">
                    <button
                        className={`tab ${activeTab === 'itinerary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('itinerary')}
                    >
                        🗺️ Itinerary
                    </button>
                    <button
                        className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expenses')}
                    >
                        💰 Expenses
                    </button>
                    <button
                        className={`tab ${activeTab === 'weather' ? 'active' : ''}`}
                        onClick={() => setActiveTab('weather')}
                    >
                        ☀️ Weather
                    </button>
                </div>

                {/* Print Headers (Only visible on print) */}
                <div className="print-only-header">
                    <h1>{trip.destination} Itinerary</h1>
                    <p>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                </div>

                {activeTab === 'itinerary' && (
                    <div className="itinerary-layout">
                        {/* Sidebar - Days (Hide in Print if desired, or style differently) */}
                        <div className="days-sidebar no-print">
                            {trip.itinerary.map((day, index) => (
                                <div
                                    key={day._id}
                                    className={`day-selector ${selectedDayId === day._id ? 'active' : ''}`}
                                    onClick={() => setSelectedDayId(day._id)}
                                >
                                    <span className="day-number">Day {index + 1}</span>
                                    <span className="day-date">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>

                        {/* Main Content - Timeline */}
                        <div className="day-timeline">
                            {/* ... */}
                            <div className="timeline-header">
                                <h2>Day {trip.itinerary.findIndex(d => d._id === selectedDayId) + 1} Itinerary</h2>
                                <button className="btn-primary no-print" onClick={() => setShowItemModal(true)}>+ Add Activity</button>
                            </div>

                            <div className="timeline-items">
                                {selectedDay?.items.length === 0 ? (
                                    <div className="empty-state">No activities planned for this day yet.</div>
                                ) : (
                                    selectedDay.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`timeline-card type-${item.type}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, idx)}
                                            onDragEnter={(e) => handleDragEnter(e, idx)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDragEnd={handleDragEnd}
                                            style={{ cursor: 'move' }}
                                        >
                                            {/* ... card content ... */}
                                            <div className="time-col">
                                                <span className="start-time">{item.startTime}</span>
                                                {item.endTime && <span className="end-time">{item.endTime}</span>}
                                            </div>
                                            <div className="details-col">
                                                <span className={`tag ${item.type}`}>{item.type}</span>
                                                <h3>{item.title}</h3>
                                                {item.location && <p className="location">📍 {item.location}</p>}
                                                {item.description && <p className="description">{item.description}</p>}
                                            </div>
                                            <div className="cost-col">
                                                {item.cost > 0 && <span className="cost">${item.cost}</span>}
                                                {['flight', 'hotel'].includes(item.type) && (
                                                    <div className="booking-action no-print">
                                                        {item.booked ? (
                                                            <span className="badge-booked">✓ Booked</span>
                                                        ) : (
                                                            <button
                                                                className="btn-book"
                                                                onClick={() => handleBooking(selectedDayId, item._id)}
                                                            >
                                                                Book Now
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="expenses-container">
                        <div className="expense-overview-card">
                            <div className="chart-section">
                                <div
                                    className="pie-chart"
                                    style={{ background: getPieChartGradient() }}
                                >
                                    <div className="chart-center">
                                        <span className="total-label">Total</span>
                                        <span className="total-value">${expenseStats.total.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="stats-legend">
                                <h3>Spending Breakdown</h3>
                                <div className="legend-grid">
                                    {Object.entries(categoryColors).map(([cat, color]) => (
                                        <div key={cat} className="legend-item">
                                            <span className="color-dot" style={{ background: color }}></span>
                                            <span className="cat-name">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                                            <span className="cat-val">${(expenseStats.byCategory[cat] || 0).toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="expense-form-card no-print">
                            {/* ... form ... */}
                            <h4>Add New Expense</h4>
                            <form className="expense-form" onSubmit={handleAddExpense}>
                                <input
                                    type="text"
                                    placeholder="Description (e.g., Dinner)"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    required
                                />
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    <option value="food">🍔 Food</option>
                                    <option value="transport">🚕 Transport</option>
                                    <option value="accommodation">🏨 Hotel</option>
                                    <option value="activity">🎟️ Activity</option>
                                    <option value="other">📝 Other</option>
                                </select>
                                <button type="submit" className="btn-primary">Add Expense</button>
                            </form>
                        </div>

                        <div className="expense-list">
                            {trip.expenses && trip.expenses.length > 0 ? (
                                trip.expenses.slice().reverse().map(expense => (
                                    <div key={expense._id} className="expense-item">
                                        <div className="expense-info">
                                            <h4>{expense.description}</h4>
                                            <span className="category">{expense.category}</span>
                                            <span className="date">{new Date(expense.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="expense-actions no-print">
                                            <span className="expense-amount">-${expense.amount}</span>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteExpense(expense._id)}
                                                title="Delete Expense"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">No expenses recorded yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'weather' && (
                    <WeatherWidget
                        destination={trip.destination}
                        startDate={trip.startDate}
                        endDate={trip.endDate}
                    />
                )}


            </div>

            {showItemModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add to Itinerary</h3>
                        <form onSubmit={handleAddItem}>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                            >
                                <option value="activity">Activity</option>
                                <option value="hotel">Hotel</option>
                                <option value="transport">Transport</option>
                                <option value="flight">Flight</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Title (e.g., Visit Eiffel Tower)"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                            />

                            <div className="time-inputs">
                                <input
                                    type="time"
                                    value={newItem.startTime}
                                    onChange={e => setNewItem({ ...newItem, startTime: e.target.value })}
                                    required
                                />
                                <input
                                    type="time"
                                    value={newItem.endTime}
                                    onChange={e => setNewItem({ ...newItem, endTime: e.target.value })}
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Location"
                                value={newItem.location}
                                onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                            />

                            <input
                                type="number"
                                placeholder="Cost"
                                value={newItem.cost}
                                onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                            />

                            <textarea
                                placeholder="Notes..."
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowItemModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showShareModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Share Trip</h3>
                        <p>Invite friends to plan with you!</p>

                        {trip.sharedWith && trip.sharedWith.length > 0 && (
                            <div className="shared-list">
                                <h4>Shared with:</h4>
                                <ul>
                                    {trip.sharedWith.map(user => (
                                        <li key={user._id}>👤 {user.email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleShare}>
                            <input
                                type="email"
                                placeholder="Friend's Email"
                                value={shareEmail}
                                onChange={e => setShareEmail(e.target.value)}
                                required
                            />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowShareModal(false)}>Close</button>
                                <button type="submit" className="btn-primary">Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h3>Book {bookingType === 'flight' ? 'Flight ✈️' : 'Hotel 🏨'}</h3>

                        <form onSubmit={handleSearch} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <div className="date-inputs">
                                {bookingType === 'flight' ? (
                                    <>
                                        <input
                                            placeholder="From (e.g. NYC)"
                                            value={searchParams.from}
                                            onChange={e => setSearchParams({ ...searchParams, from: e.target.value })}
                                            required
                                        />
                                        <input
                                            placeholder="To (e.g. LON)"
                                            value={searchParams.to}
                                            onChange={e => setSearchParams({ ...searchParams, to: e.target.value })}
                                            required
                                        />
                                    </>
                                ) : (
                                    <input
                                        placeholder="City (e.g. Paris)"
                                        value={searchParams.location}
                                        onChange={e => setSearchParams({ ...searchParams, location: e.target.value })}
                                        required
                                        style={{ gridColumn: 'span 2' }}
                                    />
                                )}
                                <input
                                    type="date"
                                    value={searchParams.date}
                                    onChange={e => setSearchParams({ ...searchParams, date: e.target.value })}
                                    style={{ gridColumn: 'span 2' }}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={isSearching} style={{ width: '100%' }}>
                                {isSearching ? 'Searching...' : 'Search Availability'}
                            </button>
                        </form>

                        <div className="search-results" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {searchResults.length === 0 && !isSearching && <p>Type details and search...</p>}
                            {searchResults.map(item => (
                                <div key={item.id} className="timeline-card" style={{ marginBottom: '10px', gridTemplateColumns: '1fr auto' }}>
                                    <div className="details-col">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                        <small>{item.startTime} - {item.endTime}</small>
                                    </div>
                                    <div className="cost-col" style={{ textAlign: 'right' }}>
                                        <span className="cost" style={{ display: 'block', fontSize: '1.2rem' }}>${item.cost}</span>
                                        <button className="btn-book" onClick={() => handleBookItem(item)}>Book This</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowBookingModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
