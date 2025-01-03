import { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingManagement.css';

const API_URL = 'http://localhost:5000';

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchBookings = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/admin/bookings?page=${page}&limit=10&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setBookings(response.data.bookings || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        throw new Error(response.data.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage, search);
  }, [currentPage, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // The date is already in YYYY-MM-DD format from the server
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'status-badge confirmed';
      case 'pending':
        return 'status-badge pending';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="booking-management">
      <div className="booking-management-header">
        <h2>Bookings Management</h2>
        <div className="search-container">
          <input
            type="search"
            placeholder="Search bookings..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="bookings-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Tenant</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.post.title}</td>
                  <td>{`${booking.user.firstName} ${booking.user.lastName}`}</td>
                  <td>{formatDate(booking.startDate)}</td>
                  <td>{formatDate(booking.endDate)}</td>
                  <td>
                    <span className={getStatusBadgeClass(booking.status)}>
                      {booking.status}
                    </span>
                  </td>
                  <td>${booking.totalAmount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-bookings">No bookings found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}

export default BookingManagement;
