import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeBanDropdown, setActiveBanDropdown] = useState(null);
  const [banDuration, setBanDuration] = useState(1);
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/users`, {
        params: {
          page,
          search: search || undefined
        }
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
      console.error('Error fetching users:', errorMessage);
      setError(errorMessage);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleBanUser = async (userId, duration) => {
    try {
      await api.post(`/admin/users/${userId}/ban`, { duration });
      await fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to ban user';
      console.error('Error banning user:', errorMessage);
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.')) {
      try {
        const response = await api.delete(`/admin/users/${userId}`);

        if (!response.ok) {
          const errorData = await response.data;
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Refresh the user list
        await fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
        console.error('Error deleting user:', errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handleEditUser = async (userId, updatedData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, updatedData);

      if (!response.ok) throw new Error('Failed to update user');
      
      await fetchUsers();
      setIsEditing(false);
      setSelectedUser(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user';
      console.error('Error updating user:', errorMessage);
      alert(errorMessage);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ban-dropdown')) {
        setActiveBanDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleBanModalOpen = (user) => {
    setUserToBan(user);
    setShowBanModal(true);
    setBanDuration(1);
  };

  const formatDuration = (days) => {
    if (days < 7) return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    if (days < 30) return `${Math.floor(days/7)} ${Math.floor(days/7) === 1 ? 'Week' : 'Weeks'}`;
    if (days < 365) return `${Math.floor(days/30)} ${Math.floor(days/30) === 1 ? 'Month' : 'Months'}`;
    return `${Math.floor(days/365)} ${Math.floor(days/365) === 1 ? 'Year' : 'Years'}`;
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="user-cell">
                  <div className="user-info">
                    <span>{`${user.firstName} ${user.lastName}`}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`user-type ${user.type}`}>
                    {user.type}
                  </span>
                </td>
                <td>
                  <span className={`user-status ${user.bannedUntil && new Date(user.bannedUntil) > new Date() ? 'banned' : 'active'}`}>
                    {user.bannedUntil && new Date(user.bannedUntil) > new Date()
                      ? `Banned until ${new Date(user.bannedUntil).toLocaleDateString()}`
                      : 'Active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn view" onClick={() => setSelectedUser(user)}>
                      <span>View</span>
                    </button>
                    <button className="action-btn edit" onClick={() => {
                      setSelectedUser(user);
                      setIsEditing(true);
                    }}>
                      <span>Edit</span>
                    </button>
                    <button 
                      className="action-btn ban"
                      onClick={() => handleBanModalOpen(user)}
                    >
                      <span>Ban</span>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button 
          className="pagination-btn"
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          className="pagination-btn"
          disabled={page === totalPages} 
          onClick={() => setPage(p => p + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* User Details/Edit Modal */}
      {selectedUser && (
        <div className="modal" onClick={() => {
          setSelectedUser(null);
          setIsEditing(false);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit User' : 'User Details'}</h3>
              <button className="close-btn" onClick={() => {
                setSelectedUser(null);
                setIsEditing(false);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            {isEditing ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleEditUser(selectedUser.id, {
                  firstName: e.target.firstName.value,
                  lastName: e.target.lastName.value,
                  email: e.target.email.value,
                  type: e.target.type.value
                });
              }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input name="firstName" defaultValue={selectedUser.firstName} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="lastName" defaultValue={selectedUser.lastName} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={selectedUser.email} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" defaultValue={selectedUser.type}>
                    <option value="guest">Guest</option>
                    <option value="host">Host</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" className="cancel-btn" onClick={() => {
                    setSelectedUser(null);
                    setIsEditing(false);
                  }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="user-details">
                <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Type:</strong> {selectedUser.type}</p>
                <p><strong>Status:</strong> {
                  selectedUser.bannedUntil && new Date(selectedUser.bannedUntil) > new Date()
                    ? `Banned until ${new Date(selectedUser.bannedUntil).toLocaleDateString()}`
                    : 'Active'
                }</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="modal ban-modal" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ban User</h3>
              <button className="close-btn" onClick={() => setShowBanModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ban-form">
              <div className="user-to-ban">
                <div className="user-avatar">
                  {userToBan?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <h4>{`${userToBan?.firstName} ${userToBan?.lastName}`}</h4>
                  <p>{userToBan?.email}</p>
                </div>
              </div>
              
              <div className="duration-selector">
                <label>Ban Duration: <span className="duration-display">{formatDuration(banDuration)}</span></label>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={banDuration}
                  onChange={(e) => setBanDuration(parseInt(e.target.value))}
                  className="duration-slider"
                />
                <div className="duration-marks">
                  <span>1d</span>
                  <span>1w</span>
                  <span>1m</span>
                  <span>1y</span>
                </div>
              </div>

              <div className="ban-reason">
                <label>Reason for ban:</label>
                <textarea
                  placeholder="Enter reason for banning this user..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="ban-confirm-btn"
                  onClick={() => {
                    handleBanUser(userToBan.id, banDuration);
                    setShowBanModal(false);
                  }}
                >
                  Confirm Ban
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowBanModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;