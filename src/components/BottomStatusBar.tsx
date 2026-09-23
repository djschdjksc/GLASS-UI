import React from 'react';
import { ShieldCheck, Cpu, Database, Calendar, Mic, Wifi } from 'lucide-react';

interface Props {
  voiceStatus?: string;
  financialYear?: string;
  hwid?: string;
}

export const BottomStatusBar: React.FC<Props> = ({
  voiceStatus = 'Standby',
  financialYear = '2026-2027 (Default)',
  hwid = 'A8F9-2026-X99B-8831'
}) => {
  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '5px 14px', 
        marginTop: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontSize: '10.5px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#a1a1aa',
        borderRadius: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: '#10b981', 
              boxShadow: '0 0 6px #10b981' 
            }} 
          />
          <ShieldCheck size={12} color="#34c759" />
          <span style={{ color: '#34c759', fontWeight: 600 }}>License Status: VALID</span>
        </div>

        <span style={{ color: '#3f3f46' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Cpu size={11} color="#818cf8" />
          <span>HWID: <strong style={{ color: '#e4e4e7' }}>{hwid}</strong></span>
        </div>

        <span style={{ color: '#3f3f46' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Database size={11} color="#38bdf8" />
          <span>DB: <strong style={{ color: '#38bdf8' }}>SQLite 3.42</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={11} color="#f59e0b" />
          <span>Financial Year: <strong style={{ color: '#fbbf24' }}>{financialYear}</strong></span>
        </div>

        <span style={{ color: '#3f3f46' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Mic size={11} color={voiceStatus === 'Speaking' ? '#ef4444' : '#a855f7'} />
          <span>Voice: <strong style={{ color: voiceStatus === 'Speaking' ? '#ef4444' : '#c084fc' }}>{voiceStatus}</strong></span>
        </div>

        <span style={{ color: '#3f3f46' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Wifi size={11} color="#10b981" />
          <span style={{ color: '#10b981' }}>Sync: Live</span>
        </div>
      </div>
    </div>
  );
};
