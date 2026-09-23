import React, { useState } from 'react';
import type { BillHeader } from '../types';
import { AppleTrafficLights } from './AppleTrafficLights';
import { Plus, Check, ChevronDown, Calendar } from 'lucide-react';

interface Props {
  header: BillHeader;
  onChange: (updated: Partial<BillHeader>) => void;
  onCloseApp: () => void;
  onAddNewParty: (name: string) => void;
}

const COMMON_PARTIES = [
  'Shree Balaji Traders & Co.',
  'Apex Industrial Moldings Pvt Ltd',
  'Gupta Electro-Mechanical Works',
  'Shiv Shakti Engineering',
  'Precision Die & Tools Corp',
  'Mahaveer Enterprises',
  'Om Sai Tech Industries',
  'Supertech Electro India Ltd'
];

const DOC_TYPES = ['SALE BILL', 'PURCHASE BILL', 'TAX INVOICE', 'ESTIMATE', 'CHALLAN'];
const TYPE_SELECTIONS = ['RETAIL', 'WHOLESALE', 'JOB WORK', 'INTER-STATE', 'EXPORT'];

export const AppleHeader: React.FC<Props> = ({ header, onChange, onCloseApp, onAddNewParty }) => {
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [partyList, setPartyList] = useState<string[]>(COMMON_PARTIES);

  const filteredParties = partyList.filter(p => 
    p.toLowerCase().includes(header.partyName.toLowerCase())
  );

  const handleQuickAdd = () => {
    const entered = header.partyName.trim();
    if (entered && !partyList.includes(entered)) {
      setPartyList(prev => [entered, ...prev]);
      onAddNewParty(entered);
      setShowPartySuggestions(false);
    }
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '10px 16px', 
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <AppleTrafficLights onClose={onCloseApp} />

        {/* Document Type Dropdown */}
        <div style={{ position: 'relative', width: '130px' }}>
          <select
            className="apple-select"
            style={{ width: '100%', paddingRight: '22px', fontWeight: 600, color: '#38bdf8' }}
            value={header.docType}
            onChange={(e) => onChange({ docType: e.target.value })}
          >
            {DOC_TYPES.map(t => (
              <option key={t} value={t} style={{ background: '#161b22', color: '#ffffff' }}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a1a1aa' }} />
        </div>

        {/* Party Name Search Box with Quick Add (+) Button */}
        <div style={{ position: 'relative', flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="apple-input"
              placeholder="Search or Enter Party..."
              value={header.partyName}
              onFocus={() => setShowPartySuggestions(true)}
              onBlur={() => setTimeout(() => setShowPartySuggestions(false), 240)}
              onChange={(e) => onChange({ partyName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
              style={{ width: '100%', fontWeight: 500 }}
            />

            {showPartySuggestions && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'rgba(20, 24, 32, 0.96)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '7px',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.5)',
                  zIndex: 99999999,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                {filteredParties.map((party) => (
                  <div
                    key={party}
                    onClick={() => {
                      onChange({ partyName: party });
                      setShowPartySuggestions(false);
                    }}
                    style={{
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 113, 227, 0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{party}</span>
                    {header.partyName === party && <Check size={12} color="#34c759" />}
                  </div>
                ))}

                {/* If Party Not Found or Typed New */}
                {header.partyName.trim() && !filteredParties.includes(header.partyName.trim()) && (
                  <div
                    onClick={handleQuickAdd}
                    style={{
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      background: 'rgba(0, 113, 227, 0.15)',
                      color: '#38bdf8',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 113, 227, 0.35)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 113, 227, 0.15)'}
                  >
                    <Plus size={13} />
                    <span>Add "{header.partyName.trim()}" as New Party</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Quick Add (+) Button next to search box */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="apple-box-btn"
            style={{ width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0 }}
            title="Add Party (+)"
          >
            <span className="box-tooltip-right">Add Party (+)</span>
            <Plus size={14} />
          </button>
        </div>

        {/* Type Selection Dropdown */}
        <div style={{ position: 'relative', width: '110px' }}>
          <select
            className="apple-select"
            style={{ width: '100%', paddingRight: '20px' }}
            value={header.typeSelection}
            onChange={(e) => onChange({ typeSelection: e.target.value })}
          >
            {TYPE_SELECTIONS.map(ts => (
              <option key={ts} value={ts} style={{ background: '#161b22', color: '#ffffff' }}>
                {ts}
              </option>
            ))}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a1a1aa' }} />
        </div>

        {/* Vehicle No Input */}
        <div style={{ width: '130px' }}>
          <input
            type="text"
            className="apple-input"
            placeholder="Vehicle No..."
            value={header.vehicleNo}
            onChange={(e) => onChange({ vehicleNo: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Polished Apple Date Picker */}
        <div style={{ position: 'relative', width: '135px' }}>
          <input
            type="date"
            className="apple-input"
            value={header.date}
            onChange={(e) => onChange({ date: e.target.value })}
            style={{ 
              width: '100%', 
              cursor: 'pointer', 
              colorScheme: 'dark', 
              paddingLeft: '28px',
              fontWeight: 500
            }}
          />
          <Calendar 
            size={13} 
            style={{ 
              position: 'absolute', 
              left: '9px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#38bdf8', 
              pointerEvents: 'none' 
            }} 
          />
        </div>
      </div>

      {/* Red Token Badge */}
      <div className="apple-token-badge">
        <span>#{header.tokenNo}</span>
      </div>
    </div>
  );
};
