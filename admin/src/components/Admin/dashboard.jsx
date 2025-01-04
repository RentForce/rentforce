import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import PostManagement from './PostManagement';
import BookingManagement from './BookingManagement';
import PostView from './PostView';
import Settings from './Settings';
import './Dashboard.css';
import logo from '../../assets/logo.svg';

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalPosts: 0,
    pendingPosts: 0,
    notifications: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersResponse, bookingsResponse, postsResponse, pendingPostsResponse, notificationsResponse] = await Promise.all([
        fetch('http://localhost:5000/admin/user/count'),
        fetch('http://localhost:5000/admin/bookings/count'),
        fetch('http://localhost:5000/admin/posts/count'),
        fetch('http://localhost:5000/admin/posts/pending/count'),
        fetch('http://localhost:5000/admin/notifications/recent')
      ]);

      if (!usersResponse.ok || !bookingsResponse.ok || !postsResponse.ok) {
        throw new Error('One or more count requests failed');
      }

      const [usersData, bookingsData, postsData, pendingPostsData, notificationsData] = await Promise.all([
        usersResponse.json(),
        bookingsResponse.json(),
        postsResponse.json(),
        pendingPostsResponse.json(),
        notificationsResponse.ok ? notificationsResponse.json() : { notifications: [] }
      ]);

      setDashboardData({
        totalUsers: usersData.count,
        totalBookings: bookingsData.count,
        totalPosts: postsData.count,
        pendingPosts: pendingPostsData.count,
        notifications: notificationsData.notifications || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        totalUsers: 0,
        totalBookings: 0,
        totalPosts: 0,
        pendingPosts: 0,
        notifications: []
      });
    }
  };

  const handleViewPost = (postId) => {
    setSelectedPostId(postId);
    setCurrentPage('post-view');
  };

  const handleLogout = () => {
    // Clear all localStorage
    localStorage.clear();
    
    // Redirect to home page
    navigate('/');
  };

  const renderContent = () => {
    switch(currentPage) {
      case 'users':
        return <UserManagement />;
      case 'posts':
        return <PostManagement 
          onPageChange={setCurrentPage}
          onViewPost={handleViewPost}
        />;
      case 'bookings':
        return <BookingManagement />;
      case 'post-view':
        return <PostView 
          postId={selectedPostId}
          onBack={() => setCurrentPage('posts')} 
        />;
      case 'dashboard':
        return (
          <section className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="value">{dashboardData.totalUsers}</div>
            </div>
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <div className="value">{dashboardData.totalBookings}</div>
            </div>
            <div className="stat-card">
              <h3>Total Posts</h3>
              <div className="value">{dashboardData.totalPosts}</div>
            </div>
            <div className="stat-card pending-posts">
              <h3>Pending Posts</h3>
              <div className="value">{dashboardData.pendingPosts}</div>
            </div>
          </section>
        );
      case 'settings':
        return <Settings />;
      default:
        return <div>Page under construction</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="RentForce Logo" />
          <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <i className={`fas fa-${isSidebarOpen ? 'chevron-left' : 'chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={currentPage === 'dashboard' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('dashboard')}>
                <i className="fas fa-th-large"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className={currentPage === 'users' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('users')}>
                <i className="fas fa-users"></i>
                <span>Users</span>
              </a>
            </li>
            <li className={currentPage === 'posts' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('posts')}>
                <i className="fas fa-file-alt"></i>
                <span>Posts</span>
              </a>
            </li>
            <li className={currentPage === 'bookings' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('bookings')}>
                <i className="fas fa-calendar-check"></i>
                <span>Bookings</span>
              </a>
            </li>
            <li>
              <a onClick={() => setCurrentPage('reports')}>
                <i className="fas fa-chart-bar"></i>
                <span>Reports</span>
              </a>
            </li>
            <li>
              <a onClick={() => setCurrentPage('settings')}>
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </a>
            </li>
            <li className="logout">
              <a onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-search">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search..."
              aria-label="Search"
            />
          </div>
          <div className="header-profile">
            <div className="notifications">
              <i className="fas fa-bell"></i>
              {dashboardData.notifications.length > 0 && (
                <span className="notification-badge">
                  {dashboardData.notifications.length > 99 ? '99+' : dashboardData.notifications.length}
                </span>
              )}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
