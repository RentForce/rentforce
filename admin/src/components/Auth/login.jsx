import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import axios from 'axios';
import { CloudinaryFile } from '@cloudinary/url-gen/index';
import logo from '../../assets/logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  const handleSubmit = (e) => {
    if (passwordVisible) {
      handleLogin(e);
    } else {
      handleEmailSubmit(e);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{
      backgroundImage: `url('https://img.freepik.com/free-photo/armchair-green-living-room-with-copy-space_43614-910.jpg?t=st=1735828039~exp=1735831639~hmac=a3349d1792a7afab5cacd4772256703f18789d5101bb597f3eec8521c1adb631&w=996')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="loginContainer">
        <div className="logo-container">
          <img src={logo} alt="RentForce Logo" className="logo-image" />
        </div>
        <h2 className="loginTitle">Sign In</h2>
        <div className="login-link">
          <p>
            <span className="admin-text">
              Admin Portal Access Only
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              />
            </div>
          )}

          {passwordVisible && (
            <>
              <div className="form-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </>
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
