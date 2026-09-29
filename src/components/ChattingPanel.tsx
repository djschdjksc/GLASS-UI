import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  X, 
  Bot, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  HelpCircle,
  Calculator,
  ChevronRight,
  Maximize2,
  Minimize2,
  Users,
  Share2
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
import type { BillHeader, RawItem, FinishedItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAction?: boolean;
}

export interface TeamMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  senderTerminal: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  billToken?: string;
}

interface ChattingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  header: BillHeader;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ChattingPanel: React.FC<ChattingPanelProps> = ({
  isOpen,
  onClose,
  header,
  rawItems,
  finishedItems,
  onShowToast
}) => {
  // Active Chat Mode: 'TEAM' (Software User-to-User) vs 'AI' (AI Billing Copilot)
  const [chatMode, setChatMode] = useState<'TEAM' | 'AI'>('TEAM');

  // User Profile loaded live from Settings (localStorage)
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('modern_app_user_name') || 'Rohit (Billing Desk)');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('modern_app_user_role') || 'Main Billing Counter');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('modern_app_user_avatar') || '');
  const [userTerminal, setUserTerminal] = useState<string>(() => localStorage.getItem('modern_app_user_terminal') || 'Counter #1');

  // Listen to profile updates from Settings tab
  useEffect(() => {
    const handleStorageUpdate = () => {
      setUserName(localStorage.getItem('modern_app_user_name') || 'Rohit (Billing Desk)');
      setUserRole(localStorage.getItem('modern_app_user_role') || 'Main Billing Counter');
      setUserAvatar(localStorage.getItem('modern_app_user_avatar') || '');
      setUserTerminal(localStorage.getItem('modern_app_user_terminal') || 'Counter #1');
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // 1. Team Messages (Between software operators across counters/network)
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>(() => {
    try {
      const saved = localStorage.getItem('modern_team_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'team-init-1',
        senderName: 'Warehouse Dispatch',
        senderRole: 'Counter 2 (Loading Bay)',
        senderTerminal: 'Counter #2',
        senderAvatar: '',
        text: '📦 Raw material ingots for Token #626 arrived and verified on weighbridge.',
        timestamp: '10:30 AM',
        isMine: false
      },
      {
        id: 'team-init-2',
        senderName: 'Accounts & Ledger',
        senderRole: 'Back Office',
        senderTerminal: 'Accounts',
        senderAvatar: '',
        text: '✅ Party payment status checked. Wholesale discount authorized.',
        timestamp: '10:35 AM',
        isMine: false
      }
    ];
  });

  // 2. AI Assistant Messages
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('modern_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: `👋 **Welcome to Modern Summary Assistant!**\n\nI am connected to your live workspace for **Token #${header.tokenNo || '1'} (${header.partyName || 'Cash Sale'})**.\n\nYou can ask me to calculate totals, check party items, generate bill memos, or look up shortcuts.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync team messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modern_team_chat_messages', JSON.stringify(teamMessages));
    } catch {}
  }, [teamMessages]);

  // Sync AI messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modern_chat_messages', JSON.stringify(aiMessages));
    } catch {}
  }, [aiMessages]);

  // Sync team messages from other browser tabs / network windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'modern_team_chat_messages' && e.newValue) {
        try {
          setTeamMessages(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages, aiMessages]);

  if (!isOpen) return null;

  // Assistant Response Generator based on current bill context
  const generateAssistantResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Bill Summary query
    if (q.includes('summary') || q.includes('total') || q.includes('bill summary') || q.includes('hisab')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const totalPcs = finishedItems.reduce((acc, f) => acc + (Number(f.qty) || 0), 0);
      const rawCount = rawItems.filter(r => r.name && r.name.trim()).length;
      const totalRawFt = rawItems.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
      const totalUCap = rawItems.reduce((acc, r) => acc + (Number(r.uCap) || 0), 0);
      const totalLCap = rawItems.reduce((acc, r) => acc + (Number(r.lCap) || 0), 0);

      return `📊 **Current Bill #${header.tokenNo} Summary**\n\n` +
        `• **Party:** ${header.partyName || 'Cash Sale'}\n` +
        `• **Type:** ${header.typeSelection} | **Doc:** ${header.docType}\n` +
        `• **Date:** ${header.date}\n` +
        `• **Raw Items:** ${rawCount} entries (${totalRawFt} FT)\n` +
        `• **Caps:** U-Cap: ${totalUCap}, L-Cap: ${totalLCap}\n` +
        `• **Finished Moulds:** ${finishedItems.length} items (${totalPcs} Pcs)\n` +
        `• **Grand Total:** ₹${finishedTotal.toLocaleString('en-IN')}`;
    }

    // 2. WhatsApp Memo Format
    if (q.includes('whatsapp') || q.includes('memo') || q.includes('share') || q.includes('message')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const mouldsText = finishedItems
        .filter(f => f.mould && f.mould !== 'Mould Name' && f.qty > 0)
        .map(f => `  - ${f.mould}: ${f.qty} Pcs @ ₹${f.price} = ₹${f.total}`)
        .join('\n');

      return `📱 *ESTIMATE / BILL MEMO*\n\n` +
        `*Invoice:* #${header.tokenNo}\n` +
        `*Party:* ${header.partyName || 'Cash Sale'}\n` +
        `*Date:* ${header.date}\n` +
        `*Vehicle:* ${header.vehicleNo || 'N/A'}\n\n` +
        `*Items:*\n${mouldsText || '  - Standard Mould Items'}\n\n` +
        `*Grand Total: ₹${finishedTotal.toLocaleString('en-IN')}*\n` +
        `_Thank you for your business!_`;
    }

    // 3. Discount Calculations
    if (q.includes('discount') || q.includes('off') || q.includes('%')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const match = q.match(/(\d+)%/);
      const pct = match ? parseInt(match[1], 10) : 5;
      const discountAmt = Math.round((finishedTotal * pct) / 100);
      const netTotal = finishedTotal - discountAmt;

      return `🏷️ **Discount Calculation (${pct}%)**\n\n` +
        `• Gross Total: ₹${finishedTotal.toLocaleString('en-IN')}\n` +
        `• Less ${pct}% Discount: -₹${discountAmt.toLocaleString('en-IN')}\n` +
        `• **Net Payable:** ₹${netTotal.toLocaleString('en-IN')}`;
    }

    // 4. Keyboard Shortcuts
    if (q.includes('shortcut') || q.includes('help') || q.includes('key')) {
      return `⌨️ **Essential Shortcuts**\n\n` +
        `• **NumPad '.'**: Quick action navigator\n` +
        `• **Ctrl + S**: Save current bill to database\n` +
        `• **Ctrl + P**: Print invoice slip\n` +
        `• **Ctrl + G**: Calculate Finished Summary\n` +
        `• **Alt + P**: Load Old Price for item\n` +
        `• **Ctrl + J**: Toggle Chat Panel\n` +
        `• **Esc**: Clear bill / Back to ready state`;
    }

    // Default Fallback Response
    return `💡 **Bill Assistant Insight:**\n\n` +
      `For **Token #${header.tokenNo} (${header.partyName || 'Cash Sale'})**, there are currently ` +
      `**${rawItems.filter(r => r.name && r.name.trim()).length} raw items** and ` +
      `**${finishedItems.filter(f => f.mould && f.mould !== 'Mould Name').length} finished moulds** recorded.\n\n` +
      `Try asking:\n` +
      `• *"Give me bill summary"*\n` +
      `• *"Generate WhatsApp memo"*\n` +
      `• *"Calculate 5% discount"*\n` +
      `• *"Show keyboard shortcuts"*`;
  };

  // Send Message Handler
  const handleSendMessage = (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!textToSend) return;

    macAudio.playPop();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (chatMode === 'TEAM') {
      // Send to Team Network Chat
      const newTeamMsg: TeamMessage = {
        id: `team-${Date.now()}`,
        senderName: userName,
        senderRole: userRole,
        senderAvatar: userAvatar,
        senderTerminal: userTerminal,
        text: textToSend,
        timestamp: timeNow,
        isMine: true,
        billToken: header.tokenNo
      };

      setTeamMessages(prev => [...prev, newTeamMsg]);
      setInputText('');
      onShowToast?.('Message sent to Team Chat', 'success');

      // Auto-reply simulation from other counter if user asks for confirmation
      if (textToSend.toLowerCase().includes('token') || textToSend.toLowerCase().includes('bill')) {
        setTimeout(() => {
          const replyMsg: TeamMessage = {
            id: `team-reply-${Date.now()}`,
            senderName: 'Warehouse Dispatch (Counter 2)',
            senderRole: 'Loading Bay',
            senderTerminal: 'Counter #2',
            senderAvatar: '',
            text: `Received notification for Token #${header.tokenNo}. Dispatch materials confirmed. ✓✓`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMine: false
          };
          setTeamMessages(prev => [...prev, replyMsg]);
          macAudio.playSuccess();
        }, 1200);
      }
    } else {
      // Send to AI Assistant
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: textToSend,
        timestamp: timeNow
      };

      setAiMessages(prev => [...prev, userMsg]);
      setInputText('');

      setTimeout(() => {
        const assistantReplyText = generateAssistantResponse(textToSend);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: assistantReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => [...prev, assistantMsg]);
        macAudio.playSuccess();
      }, 350);
    }
  };

  // Quick Action Chips
  const handleChipClick = (actionQuery: string) => {
    macAudio.playClick();
    handleSendMessage(actionQuery);
  };

  // Share Current Bill into Team Chat
  const handleShareBillToTeam = () => {
    const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
    const mouldsSummary = finishedItems
      .filter(f => f.mould && f.mould !== 'Mould Name' && f.qty > 0)
      .map(f => `${f.mould} (${f.qty} Pcs)`)
      .slice(0, 3)
      .join(', ');

    const shareText = `📋 **INVOICE UPDATE • TOKEN #${header.tokenNo}**\n` +
      `Party: *${header.partyName || 'Cash Sale'}*\n` +
      `Items: ${mouldsSummary || 'Finished Moulds'}\n` +
      `Total: ₹${finishedTotal.toLocaleString('en-IN')} [Status: Ready for Loading]`;

    setChatMode('TEAM');
    handleSendMessage(shareText);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    macAudio.playClick();
    onShowToast?.('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (chatMode === 'TEAM') {
      if (window.confirm('Clear team chat history on this counter?')) {
        setTeamMessages([]);
        localStorage.removeItem('modern_team_chat_messages');
        onShowToast?.('Team chat cleared', 'info');
      }
    } else {
      if (window.confirm('Clear AI assistant history?')) {
        setAiMessages([]);
        localStorage.removeItem('modern_chat_messages');
        onShowToast?.('Assistant chat cleared', 'info');
      }
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '72px', // Next to RightNavRail
        width: isExpanded ? '520px' : '390px',
        height: '620px',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(37, 211, 102, 0.25)',
        overflow: 'hidden',
        animation: 'shadcnSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(30px)'
      }}
    >
      {/* Top Header: Identity & Mode Selector */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--panel-header, rgba(10, 15, 25, 0.75))',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {/* Row 1: Profile & Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: userAvatar ? 'transparent' : '#00a884',
                  border: '2px solid #25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                    {userName.slice(0, 2).toUpperCase() || 'OP'}
                  </span>
                )}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#25D366',
                  border: '1.5px solid #090d16'
                }}
                title="Online"
              />
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground, #ffffff)', lineHeight: 1.2 }}>
                {userName}
              </div>
              <div style={{ fontSize: '10px', color: '#25D366', fontWeight: 600 }}>
                {userRole} • {userTerminal}
              </div>
            </div>
          </div>

          {/* Window Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear History"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground, #94a3b8)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Trash2 size={13} />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground, #94a3b8)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            <button
              type="button"
              onClick={() => {
                macAudio.playClick();
                onClose();
              }}
              title="Close Panel (Ctrl+J)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground, #94a3b8)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Row 2: Chat Mode Switcher (Team WhatsApp vs AI Assistant) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--secondary, rgba(0, 0, 0, 0.35))',
            padding: '2px',
            borderRadius: '8px',
            gap: '3px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              macAudio.playClick();
              setChatMode('TEAM');
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              background: chatMode === 'TEAM' ? '#25D366' : 'transparent',
              color: chatMode === 'TEAM' ? '#090d16' : 'var(--muted-foreground, #cbd5e1)',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: chatMode === 'TEAM' ? '0 2px 8px rgba(37, 211, 102, 0.4)' : 'none'
            }}
          >
            <MessageCircle size={13} color={chatMode === 'TEAM' ? '#090d16' : '#25D366'} />
            <span>Team Chat (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              macAudio.playClick();
              setChatMode('AI');
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              background: chatMode === 'AI' ? '#0284c7' : 'transparent',
              color: chatMode === 'AI' ? '#ffffff' : 'var(--muted-foreground, #cbd5e1)',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: chatMode === 'AI' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
            }}
          >
            <Sparkles size={13} color={chatMode === 'AI' ? '#ffffff' : '#38bdf8'} />
            <span>AI Billing Copilot</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-banner / Connected Parties */}
      <div
        style={{
          padding: '6px 12px',
          background: chatMode === 'TEAM' ? 'rgba(37, 211, 102, 0.08)' : 'rgba(2, 132, 199, 0.08)',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px'
        }}
      >
        {chatMode === 'TEAM' ? (
          <>
            <span style={{ color: '#25D366', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={12} />
              Connected: 3 Software Desks Online
            </span>
            <button
              type="button"
              onClick={handleShareBillToTeam}
              style={{
                background: 'rgba(37, 211, 102, 0.2)',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                color: '#25D366',
                borderRadius: '5px',
                padding: '2px 7px',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Broadcast current bill details to team"
            >
              <Share2 size={10} />
              <span>Share Bill #{header.tokenNo}</span>
            </button>
          </>
        ) : (
          <>
            <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Bot size={12} />
              Active Workspace: Token #{header.tokenNo} • {header.partyName || 'Cash Sale'}
            </span>
            <span style={{ color: 'var(--muted-foreground, #94a3b8)', fontSize: '9.5px' }}>
              Instant Math & Memos
            </span>
          </>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* TEAM CHAT VIEW */}
        {chatMode === 'TEAM' && (
          <>
            {teamMessages.map((m) => {
              const isMine = m.isMine;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    gap: '2px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '7px',
                      maxWidth: '88%',
                      flexDirection: isMine ? 'row-reverse' : 'row'
                    }}
                  >
                    {/* DP Avatar */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: isMine
                          ? userAvatar ? 'transparent' : '#00a884'
                          : m.senderAvatar ? 'transparent' : '#0284c7',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {isMine ? (
                        userAvatar ? (
                          <img src={userAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff' }}>
                            {userName.slice(0, 1).toUpperCase()}
                          </span>
                        )
                      ) : (
                        m.senderAvatar ? (
                          <img src={m.senderAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff' }}>
                            {m.senderName.slice(0, 1).toUpperCase()}
                          </span>
                        )
                      )}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      style={{
                        position: 'relative',
                        padding: '7px 11px',
                        borderRadius: isMine ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                        background: isMine
                          ? '#005c4b'
                          : 'var(--card, rgba(255, 255, 255, 0.08))',
                        color: isMine ? '#e9edef' : 'var(--foreground, #ffffff)',
                        border: isMine ? 'none' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                        fontSize: '11.5px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)'
                      }}
                    >
                      {/* Sender Name if not mine */}
                      {!isMine && (
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#53bdeb', marginBottom: '2px' }}>
                          {m.senderName} <span style={{ fontSize: '8.5px', opacity: 0.75 }}>({m.senderTerminal})</span>
                        </div>
                      )}

                      {/* Content */}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                      {/* Timestamp & Double Checkmark */}
                      <div
                        style={{
                          fontSize: '8.5px',
                          color: isMine ? '#8696a0' : 'var(--muted-foreground, #94a3b8)',
                          textAlign: 'right',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '3px'
                        }}
                      >
                        <span>{m.timestamp}</span>
                        {isMine && <span style={{ color: '#53bdeb', fontWeight: 800 }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* AI ASSISTANT VIEW */}
        {chatMode === 'AI' && (
          <>
            {aiMessages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '2px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '7px',
                      maxWidth: '88%',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isUser ? '#0284c7' : 'var(--secondary, #27272a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {isUser ? <User size={13} color="#ffffff" /> : <Bot size={13} color="#38bdf8" />}
                    </div>

                    <div
                      style={{
                        position: 'relative',
                        padding: '8px 12px',
                        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: isUser
                          ? '#0284c7'
                          : 'var(--card, rgba(255, 255, 255, 0.07))',
                        color: isUser ? '#ffffff' : 'var(--foreground, #f8fafc)',
                        border: isUser ? 'none' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                        fontSize: '11.5px',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {m.text}

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(m.id, m.text)}
                          title="Copy response"
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px',
                            cursor: 'pointer',
                            color: copiedId === m.id ? '#10b981' : 'var(--muted-foreground, #94a3b8)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedId === m.id ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--muted-foreground, #64748b)',
                      marginRight: isUser ? '30px' : 0,
                      marginLeft: !isUser ? '30px' : 0
                    }}
                  >
                    {m.timestamp}
                  </span>
                </div>
              );
            })}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Smart Quick Action Chips for AI Mode */}
      {chatMode === 'AI' && (
        <div
          style={{
            padding: '6px 10px',
            background: 'var(--panel-header, rgba(0, 0, 0, 0.2))',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          <button
            type="button"
            onClick={() => handleChipClick('Bill summary for token ' + header.tokenNo)}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
              background: 'var(--card, rgba(255, 255, 255, 0.05))',
              color: 'var(--foreground, #ffffff)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileText size={10} color="#38bdf8" />
            <span>Bill Summary</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('Generate WhatsApp memo')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              background: 'rgba(37, 211, 102, 0.1)',
              color: '#25D366',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MessageCircle size={10} color="#25D366" />
            <span>WhatsApp Memo</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('Calculate 5% discount')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
              background: 'var(--card, rgba(255, 255, 255, 0.05))',
              color: 'var(--foreground, #ffffff)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Calculator size={10} color="#f59e0b" />
            <span>Discount 5%</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('Show shortcuts')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
              background: 'var(--card, rgba(255, 255, 255, 0.05))',
              color: 'var(--foreground, #ffffff)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <HelpCircle size={10} color="#a855f7" />
            <span>Shortcuts</span>
          </button>
        </div>
      )}

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '10px 12px',
          background: 'var(--panel-header, rgba(0, 0, 0, 0.28))',
          borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            chatMode === 'TEAM'
              ? `Message colleagues as ${userName.split(' ')[0]}...`
              : "Ask assistant or calculate discount..."
          }
          style={{
            flex: 1,
            background: 'var(--input, rgba(0, 0, 0, 0.35))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            color: 'var(--foreground, #ffffff)',
            fontSize: '12px',
            padding: '7px 11px',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim()
              ? chatMode === 'TEAM'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #0284c7, #38bdf8)'
              : 'var(--secondary, rgba(255, 255, 255, 0.1))',
            color: inputText.trim() ? '#ffffff' : 'var(--muted-foreground, #64748b)',
            border: 'none',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.18s ease',
            flexShrink: 0,
            boxShadow: inputText.trim() && chatMode === 'TEAM' ? '0 2px 8px rgba(37, 211, 102, 0.4)' : 'none'
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
