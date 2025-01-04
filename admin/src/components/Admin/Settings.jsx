import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    emailNotifications: true,
    language: 'en',
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your admin dashboard preferences</p>
      </div>

      <div className="settings-section">
        <h3>General Settings</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <label>Dark Mode</label>
              <span className="setting-description">Switch between light and dark themes</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Language</label>
              <span className="setting-description">Select your preferred language</span>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <label>Push Notifications</label>
              <span className="setting-description">Receive push notifications for important updates</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Email Notifications</label>
              <span className="setting-description">Receive email notifications for important updates</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Security</h3>
        <div className="settings-group">
          <button className="change-password-btn">
            Change Password
          </button>
          <button className="enable-2fa-btn">
            Enable Two-Factor Authentication
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
