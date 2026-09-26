import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import './LoginPanel.css';

export const LoginPanel = ({ onLogin }: { onLogin: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'BillTrack.org' && password === 'Verma@99') {
      onLogin();
    } else {
      alert('Invalid ID or Password! Please try again.');
    }
  };

  return (
    <div 
      className="login-container" 
      style={{ 
        backgroundColor: '#e3e3e3',
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* 3D Model Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          width: '100%',
          height: '100%'
        }}
      >
        <div className="glow-1" />
        <div className="glow-2" />
        
        {/* @ts-ignore */}
        <spline-viewer logo-visibility="hidden" url="https://prod.spline.design/gdRg3rEPswIA6zJ5/scene.splinecode"></spline-viewer>
        
        {/* Hack to cover the Spline Logo with a color that matches the 3D scene background */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '400px',
            height: '150px',
            backgroundColor: '#e3e3e3', /* Light gray to match the Spline background */
            zIndex: 5,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Right side: Login Form Floating */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '8vw',
          pointerEvents: 'none' // Allow clicking through to 3D model if outside form
        }}
      >
        <div 
          className="login-form-container"
          style={{
            background: 'rgba(20, 20, 30, 0.35)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
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
