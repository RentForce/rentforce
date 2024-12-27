import { useState, useEffect } from 'react';
import './PostView.css';
import { useParams, useNavigate } from 'react-router-dom';

function PostView({ postId, onBack }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:5000/admin/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        alert('Error loading post details');
        onBack();
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, onBack]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="post-view">
      <h2>{post.title}</h2>
      <div className="post-details">
        <p><strong>Location:</strong> {post.location}</p>
        <p><strong>Price:</strong> ${post.price}</p>
        <p><strong>Category:</strong> {post.category}</p>
        <p><strong>Description:</strong> {post.description}</p>
      </div>
      
      {post.images && post.images.length > 0 && (
        <div className="post-images">
          <h3>Images</h3>
          <div className="image-grid">
            {post.images.map((image, index) => (
              <img key={index} src={image.url} alt={`Post image ${index + 1}`} />
            ))}
          </div>
        </div>
      )}
      
      <button onClick={onBack}>Back to Posts</button>
    </div>
  );
}

export default PostView; 