import React, { useState, useEffect } from 'react';
import { User, Shield, Terminal, Check, X, Tag, Sparkles } from 'lucide-react';
import { getUserProfile, setUserProfile, getUserPrefix } from '../services/supabaseClient';
import { getAvatarUrl, getAllAvatarIds, getDeterministicAvatarId } from '../utils/avatarUtils';
import { macAudio } from '../utils/macAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

export const UserIdentityModal: React.FC<Props> = ({ isOpen, onClose, isInitialSetup = false }) => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [isPrefixCustomized, setIsPrefixCustomized] = useState(false);
  const [role, setRole] = useState('Main Billing Counter');
  const [terminal, setTerminal] = useState('Counter #1');
  const [avatarId, setAvatarId] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      const current = getUserProfile();
      setName(current.name);
      setPrefix(current.prefix || getUserPrefix(current.name));
      setRole(current.role || 'Main Billing Counter');
      setTerminal(current.terminal || 'Counter #1');
      setIsPrefixCustomized(Boolean(current.prefix));
      setAvatarId(current.avatarId || getDeterministicAvatarId(current.name || 'User'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isPrefixCustomized) {
      setPrefix(getUserPrefix(val));
    }
    // If avatar was never explicitly set, update preview deterministically
    const current = getUserProfile();
    if (!current.avatarId) {
      setAvatarId(getDeterministicAvatarId(val));
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cleanPrefix = (prefix.trim() || getUserPrefix(trimmed)).toUpperCase().replace(/[^A-Z0-9]/g, '');
    setUserProfile({
      name: trimmed,
      prefix: cleanPrefix,
      role,
      terminal,
      avatarId,
      avatar: `/avatars/${avatarId}.webp`
    });
    try {
      macAudio.playSuccess();
    } catch {}
    onClose();
  };

  const roles = [
    'Main Billing Counter',
    'Warehouse / Godown',
    'Accounts & Dispatch',
    'Manager / Admin'
  ];

  const terminals = ['Counter #1', 'Counter #2', 'Godown PC', 'Laptop / Remote'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div
        style={{
          width: 'min(480px, 100%)',
          background: 'linear-gradient(145deg, rgba(28, 33, 44, 0.96), rgba(13, 16, 23, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          padding: '28px',
          color: '#ffffff',
          fontFamily: 'inherit'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
                User Profile & Multi-Device Sync
              </h3>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', margin: '3px 0 0 0' }}>
                Har counter/computer ka apna name aur unique bill format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Operator Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Aapka Naam / Operator Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Rohit (Office), Aman (Godown)..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
            />
          </div>

          {/* 3D Profile Avatar Picker */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={12} color="#38bdf8" /> Choose Profile Avatar / DP
              </label>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                Selected: #{avatarId}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px'
              }}
            >
              {/* Active Big Avatar Preview */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(0, 122, 255, 0.2)',
                  border: '2px solid #007AFF',
                  boxShadow: '0 0 14px rgba(0, 122, 255, 0.45)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={getAvatarUrl(avatarId, name)}
                  alt={`Avatar #${avatarId}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Scrollable Avatar Strip */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '4px 2px',
                  flex: 1,
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                }}
              >
                {getAllAvatarIds().map((id) => {
                  const isSelected = avatarId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setAvatarId(id);
                        try { macAudio.playClick(); } catch {}
                      }}
                      title={`Avatar #${id}`}
                      style={{
                        position: 'relative',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: isSelected ? '2px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: isSelected ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        padding: 0,
                        overflow: 'hidden',
                        transition: 'all 0.15s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 10px rgba(0, 122, 255, 0.6)' : 'none'
                      }}
                    >
                      <img
                        src={`/avatars/${id}.webp`}
                        alt={`#${id}`}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', margin: '4px 0 0 0' }}>
              Ye DP Chatting Panel aur Header me aapke profile ke sath sabhi counter par dikhai degi.
            </p>
          </div>

          {/* Unique Bill Prefix */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={12} color="#c084fc" />
                Unique Bill Prefix (No Clash)
              </label>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc', fontFamily: 'monospace' }}>
                Preview: {prefix ? `${prefix}-1, ${prefix}-2...` : 'BILL-1...'}
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. ROHIT, AMAN, POOJA..."
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value.toUpperCase());
                setIsPrefixCustomized(true);
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                borderRadius: '12px',
                padding: '9px 14px',
                fontSize: '12.5px',
                fontFamily: 'monospace',
                color: '#e9d5ff',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', margin: '4px 0 0 0' }}>
              Har user ka unique prefix hone se do computers ke bills kabhi takrayenge ya duplicate nahi honge.
            </p>
          </div>

          {/* Role / Department */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Shield size={12} color="#60a5fa" /> Role / Department
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {roles.map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminal / Machine */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Terminal size={12} color="#34d399" /> Terminal / Machine
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {terminals.map((t) => {
                const isSelected = terminal === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTerminal(t)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#6ee7b7' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              padding: '9px 22px',
              borderRadius: '12px',
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)'
            }}
          >
            <Check size={14} /> Connect & Save
          </button>
        </div>
      </div>
    </div>
  );
};
