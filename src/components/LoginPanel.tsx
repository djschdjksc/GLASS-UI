import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './LoginPanel.css';
import { getAuthConfig, isPasswordProtectionActive } from '../utils/authSecurity';
import { macAudio } from '../utils/macAudio';

export const LoginPanel = ({ onLogin }: { onLogin: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // If password protection is disabled or has no password, bypass login immediately!
  useEffect(() => {
    if (!isPasswordProtectionActive()) {
      onLogin();
    }
  }, [onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const conf = getAuthConfig();
    const expectedId = (conf.loginId || 'BillTrack.org').trim().toLowerCase();
    const expectedPass = conf.password;

    if (email.trim().toLowerCase() === expectedId && password === expectedPass) {
      sessionStorage.setItem('modern_session_unlocked', '1');
      macAudio.playSuccess();
      onLogin();
    } else {
      macAudio.playClick();
      setErrorMsg('Invalid ID or Password! Please try again.');
    }
  };

  return (
    <div 
      className="login-container" 
      style={{ 
        backgroundColor: '#0f172a',
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Lightweight CSS Aura Ambient Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <div className="glow-1" style={{ opacity: 0.5 }} />
        <div className="glow-2" style={{ opacity: 0.5 }} />
      </div>

      {/* Center: Login Form Floating */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <div 
          className="login-form-container"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '3rem',
            borderRadius: '1.5rem',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'auto', // Re-enable pointer events for the form
            width: '100%',
            maxWidth: '28rem'
          }}
        >
          
          <div>
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}>
              <AlertCircle size={16} color="#ef4444" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">ID</label>
                <div className="input-container">
                  <div className="input-icon">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    placeholder="BillTrack.org"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '0.25rem' }}>
                  <label className="form-label">Password</label>
                </div>
                <div className="input-container">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-button">
              Sign In
              <ArrowRight size={20} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
