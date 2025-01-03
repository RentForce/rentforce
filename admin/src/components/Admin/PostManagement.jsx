import { useState, useEffect } from 'react';
import './PostManagement.css';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function PostManagement({ onPageChange, onViewPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const fetchPosts = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:5000/admin/posts?page=${page}&limit=10&search=${searchTerm}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setPosts(data.posts || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage, search);
  }, [currentPage, search]);

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
      const response = await fetch(`http://localhost:5000/admin/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPosts(posts.filter(post => post.id !== postId));
        alert('Post deleted successfully');
      } else {
        console.error('Failed to delete post:', data.error);
        alert(`Failed to delete post: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      console.log('PostId:', postId);
      
      const data = { status: 'APPROVED' };
      console.log('Sending data:', data);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.put(
        `${API_URL}/admin/posts/${postId}/status`,
        data,
        config
      );
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, status: 'APPROVED' }
            : post
        ));
        alert('Post approved successfully');
        fetchPosts(currentPage, search);
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Failed to approve post: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRejectPost = async (postId, rejectionReason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/admin/posts/${postId}/status`,
        { 
          status: 'REJECTED',
          rejectionReason 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, status: 'REJECTED' }
            : post
        ));
        alert('Post rejected successfully');
        // Refresh the posts list
        fetchPosts(currentPage, search);
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert('Failed to reject post. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="post-management">
      <div className="post-management-header">
        <h2>Posts Management</h2>
        <input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
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
                  <td>{post.status}</td>
                  <td>
                    <button className="view-btn" onClick={() => handleView(post.id)}>View</button>
                    {post.status === 'PENDING' && (
                      <>
                        <button className="approve-btn" onClick={() => handleApprovePost(post.id)}>Approve</button>
                        <button className="reject-btn" onClick={() => handleRejectPost(post.id)}>Reject</button>
                      </>
                    )}
                    <button className="delete-btn" onClick={() => handleDelete(post.id)}>Delete</button>
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