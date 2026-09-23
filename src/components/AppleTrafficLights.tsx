import { macAudio } from '../utils/macAudio';
import React from 'react';
import { X, Minus, Plus } from 'lucide-react';

interface Props {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export const AppleTrafficLights: React.FC<Props> = ({ onClose, onMinimize, onMaximize }) => {
  return (
    <div className="traffic-lights-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
      <button 
        type="button" 
        title="Close" 
        onMouseEnter={() => macAudio.playHover()}
        onClick={() => { macAudio.playClick(); onClose?.(); }}
        className="traffic-light traffic-close"
        style={{ border: 'none', outline: 'none' }}
      >
        <X size={8} color="#4c0002" strokeWidth={3} />
      </button>
      <button 
        type="button" 
        title="Minimize" 
        onMouseEnter={() => macAudio.playHover()}
        onClick={() => { macAudio.playClick(); onMinimize?.(); }}
        className="traffic-light traffic-minimize"
        style={{ border: 'none', outline: 'none' }}
      >
        <Minus size={8} color="#5e3a00" strokeWidth={3} />
      </button>
      <button 
        type="button" 
        title="Expand" 
        onMouseEnter={() => macAudio.playHover()}
        onClick={() => { macAudio.playClick(); onMaximize?.(); }}
        className="traffic-light traffic-expand"
        style={{ border: 'none', outline: 'none' }}
      >
        <Plus size={8} color="#004d13" strokeWidth={3} />
      </button>
    </div>
  );
};
