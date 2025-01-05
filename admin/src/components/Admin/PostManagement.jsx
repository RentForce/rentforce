import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PostManagement.css';
import Swal from 'sweetalert2';

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
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        background: '#ffffff',
        borderRadius: '12px',
        customClass: {
          title: 'swal-title',
          content: 'swal-text',
          confirmButton: 'swal-button',
          cancelButton: 'swal-button'
        }
      });

      if (result.isConfirmed) {
        await api.delete(`/admin/posts/${postId}`);
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Post has been deleted successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          borderRadius: '12px'
        });

        refreshData();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete the post. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3182ce',
        background: '#ffffff',
        borderRadius: '12px'
      });
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const result = await Swal.fire({
        title: 'Approve Post',
        text: 'Are you sure you want to approve this post?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#48bb78',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel',
        background: '#ffffff',
        borderRadius: '12px',
        customClass: {
          title: 'swal-title',
          content: 'swal-text',
          confirmButton: 'swal-button',
          cancelButton: 'swal-button'
        }
      });

      if (result.isConfirmed) {
        await api.put(`/admin/posts/${postId}/status`, { status: 'APPROVED' });
        
        await Swal.fire({
          title: 'Approved!',
          text: 'Post has been approved successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          borderRadius: '12px'
        });

        refreshData();
      }
    } catch (error) {
      console.error('Error approving post:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to approve the post. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3182ce',
        background: '#ffffff',
        borderRadius: '12px'
      });
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      const { value: rejectReason, isConfirmed } = await Swal.fire({
        title: 'Reject Post',
        input: 'textarea',
        inputLabel: 'Rejection Reason',
        inputPlaceholder: 'Enter the reason for rejection...',
        inputAttributes: {
          'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        background: '#ffffff',
        borderRadius: '12px',
        customClass: {
          title: 'swal-title',
          content: 'swal-text',
          confirmButton: 'swal-button',
          cancelButton: 'swal-button'
        },
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter a reason for rejection';
          }
        }
      });

      if (isConfirmed) {
        await api.put(`/admin/posts/${postId}/status`, { 
          status: 'REJECTED',
          reason: rejectReason 
        });
        
        await Swal.fire({
          title: 'Rejected!',
          text: 'Post has been rejected successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          borderRadius: '12px'
        });

        refreshData();
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to reject the post. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3182ce',
        background: '#ffffff',
        borderRadius: '12px'
      });
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
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {post.status === 'PENDING' && (
                        <>
                          <button 
                            className="action-button approve-button"
                            onClick={() => handleApprovePost(post.id)}
                            title="Approve Post"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="action-button reject-button"
                            onClick={() => handleRejectPost(post.id)}
                            title="Reject Post"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      <button 
                        className="action-button delete-button"
                        onClick={() => handleDelete(post.id)}
                        title="Delete Post"
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