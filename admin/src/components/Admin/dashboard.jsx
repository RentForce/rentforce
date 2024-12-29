import { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import PostManagement from './PostManagement';
import PostView from './PostView';
import './Dashboard.css';

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

  useEffect(() => {
    // Fetch dashboard data when component mounts
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts
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

      setDashboardData(prevData => ({
        ...prevData,
        totalUsers: usersData.count,
        totalBookings: bookingsData.count,
        totalPosts: postsData.count,
        pendingPosts: pendingPostsData.count,
        notifications: notificationsData.notifications || []
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setDashboardData(prevData => ({
        ...prevData,
        totalUsers: 0,
        totalBookings: 0,
        totalPosts: 0,
        pendingPosts: 0,
        notifications: []
      }));
    }
  };

  const handleViewPost = (postId) => {
    setSelectedPostId(postId);
    setCurrentPage('post-view');
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
      case 'post-view':
        return <PostView 
          postId={selectedPostId}
          onBack={() => setCurrentPage('posts')} 
        />;
      case 'dashboard':
        return (
          <>
            <section className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{dashboardData.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3>Total Bookings</h3>
                <p>{dashboardData.totalBookings}</p>
              </div>
              <div className="stat-card">
                <h3>Total Posts</h3>
                <p>{dashboardData.totalPosts}</p>
              </div>
              <div className="stat-card pending-posts">
                <h3>Pending Posts</h3>
                <p>{dashboardData.pendingPosts}</p>
              </div>
            </section>
          </>
        );
      default:
        return <div>Page under construction</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? '←' : '→'}
        </button>
        <nav className="sidebar-nav">
          <ul>
            <li className={currentPage === 'dashboard' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('dashboard')}>Dashboard</a>
            </li>
            <li className={currentPage === 'users' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('users')}>Users</a>
            </li>
            <li className={currentPage === 'posts' ? 'active' : ''}>
              <a onClick={() => setCurrentPage('posts')}>Posts</a>
            </li>
            <li><a onClick={() => setCurrentPage('bookings')}>Bookings</a></li>
            <li><a onClick={() => setCurrentPage('reports')}>Reports</a></li>
            <li><a onClick={() => setCurrentPage('settings')}>Settings</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-search">
            <input type="search" placeholder="Search..." />
          </div>
          <div className="header-profile">
            <div className="notifications">
              <span className="notification-badge">{dashboardData.notifications.length}</span>
              <i className="fas fa-bell"></i>
            </div>
            <div className="profile">
              <img src="/admin-avatar.png" alt="Admin" />
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Render the current page content */}
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
