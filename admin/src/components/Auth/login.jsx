import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import axios from 'axios';
import { CloudinaryFile } from '@cloudinary/url-gen/index';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const navigate = useNavigate();

  const handleEmailSubmit = (e) => {
    e.preventDefault();

    if (email !== '') {
      setPasswordVisible(true)
    } else {
      setError('Please enter a valid email address.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let result = await axios.post('http://localhost:5000/user/login', {
        email,
        password,
      });
      console.log('alhamudulillah', result.data);
      const { token, user } = result.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('user', user);

      if (user.type === 'admin') {                    
        navigate('/Dashboard');
      } 
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <div className="loginContainer">
       
        <form
          className="loginForm"
          onSubmit={passwordVisible ? handleLogin : handleEmailSubmit}
        >
          <h2 className="loginTitle">Sign In</h2>
          <div className="login-link">
            <p>
              <span className="admin-text">
                Admin Portal Access Only
              </span>
            </p>
          </div>

          {!passwordVisible && (
            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="formInput"
              />
            </div>
          )}

          {passwordVisible && (
            <div className="form-group visible">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="formInput passwordInput"
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="loginButton">
            {passwordVisible ? 'Login' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}