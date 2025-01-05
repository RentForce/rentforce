import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PostManagement.css';

const API_URL = 'http://localhost:5000';
const api = axios.create({ baseURL: API_URL });

function PostManagement({ onPageChange, onViewPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingPosts: 0,
    approvedPosts: 0,
    rejectedPosts: 0
  });

  const fetchPosts = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(
        `/admin/posts?page=${page}&limit=10&search=${searchTerm}`
      );
      
      if (response.status === 200) {
        setPosts(response.data.posts || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch posts:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/post-stats');
      if (response.status === 200) {
        setStats(response.data);
      } else {
        console.error('Failed to fetch post stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching post stats:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const refreshData = async () => {
    await Promise.all([
      fetchPosts(currentPage, search),
      fetchStats()
    ]);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleView = (postId) => {
    onViewPost(postId);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/admin/posts/${postId}`);
      refreshData();
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await api.put(`/admin/posts/${postId}/status`, { status: 'APPROVED' });
      refreshData();
      alert('Post approved successfully');
    } catch (error) {
      console.error('Error approving post:', error);
      alert(`Failed to approve post: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      await api.put(`/admin/posts/${postId}/status`, { status: 'REJECTED' });
      refreshData();
      alert('Post rejected successfully');
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert('Failed to reject post. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="post-management">
      <div className="dashboard-header">
        <h2>Post Management</h2>
      </div>

      <div className="stats-container">
        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-content">
            <h3>Total Posts</h3>
            <p>{stats.totalPosts}</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>Pending Posts</h3>
            <p>{stats.pendingPosts}</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>Approved Posts</h3>
            <p>{stats.approvedPosts}</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-content">
            <h3>Rejected Posts</h3>
            <p>{stats.rejectedPosts}</p>
          </div>
        </div>
      </div>

      <div className="post-management-header">
        <h2>Posts Management</h2>
        <div className="search-container">
          <i className="fas fa-search"></i>
          <input
            type="search"
            placeholder="Search posts..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="posts-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Location</th>
              <th>Price</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.title}</td>
                  <td>{post.location}</td>
                  <td>${post.price}</td>
                  <td>{post.category}</td>
                  <td>
                    <span className={`status-badge status-${post.status.toLowerCase()}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>
                    <div className="post-actions">
                      <button 
                        className="action-button view-button"
                        onClick={() => handleView(post.id)}
                        data-tooltip="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {post.status === 'PENDING' && (
                        <>
                          <button 
                            className="action-button approve-button"
                            onClick={() => handleApprovePost(post.id)}
                            data-tooltip="Approve Post"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="action-button reject-button"
                            onClick={() => handleRejectPost(post.id)}
                            data-tooltip="Reject Post"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      <button 
                        className="action-button delete-button"
                        onClick={() => handleDelete(post.id)}
                        data-tooltip="Delete Post"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-posts">No posts found</td>
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

export default PostManagement;