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
import { supabase, getUserProfile } from '../services/supabaseClient';

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
  recipient?: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  billToken?: string;
  reactions?: Record<string, number>;
}

interface ChattingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  header: BillHeader;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenUserProfile?: () => void;
}

export const ChattingPanel: React.FC<ChattingPanelProps> = ({
  isOpen,
  onClose,
  header,
  rawItems,
  finishedItems,
  onShowToast,
  onOpenUserProfile
}) => {
  // Active Chat Mode: 'TEAM' (Software User-to-User) vs 'AI' (AI Billing Copilot)
  const [chatMode, setChatMode] = useState<'TEAM' | 'AI'>('TEAM');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('ALL');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const s = localStorage.getItem('modern_chat_reactions');
      if (s) return JSON.parse(s);
    } catch {}
    return {};
  });

  const handleToggleReaction = (msgId: string, emoji: string) => {
    try { macAudio.playPop(); } catch {}
    setReactionsMap((prev) => {
      const currentMsgReactions = { ...(prev[msgId] || {}) };
      currentMsgReactions[emoji] = (currentMsgReactions[emoji] || 0) + 1;
      const updated = { ...prev, [msgId]: currentMsgReactions };
      try {
        localStorage.setItem('modern_chat_reactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      supabase.channel('public:chat:reactions').send({
        type: 'broadcast',
        event: 'reaction',
        payload: { msgId, emoji, user: userName }
      });
    } catch (e) {
      console.warn('Reaction broadcast warning:', e);
    }
  };

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
  const [onlineUsers, setOnlineUsers] = useState<{ name: string; role: string; terminal: string; onlineAt: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Supabase Realtime Presence: Track who is active/online right now
  useEffect(() => {
    const profile = getUserProfile();
    const currentName = profile.name || userName || 'Operator';

    const presenceChannel = supabase.channel('online-team-presence', {
      config: {
        presence: {
          key: currentName
        }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const active: { name: string; role: string; terminal: string; onlineAt: string }[] = [];
        const seenNames = new Set<string>();

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.name && !seenNames.has(p.name)) {
              seenNames.add(p.name);
              active.push({
                name: p.name,
                role: p.role || 'Counter',
                terminal: p.terminal || '',
                onlineAt: p.onlineAt || new Date().toISOString()
              });
            }
          });
        });

        if (!seenNames.has(currentName)) {
          active.unshift({
            name: currentName,
            role: userRole,
            terminal: userTerminal,
            onlineAt: new Date().toISOString()
          });
        }

        setOnlineUsers(active);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            name: currentName,
            role: profile.role || userRole,
            terminal: profile.terminal || userTerminal,
            onlineAt: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userName, userRole, userTerminal]);

  // Fetch cloud team messages from Supabase & subscribe to realtime changes
  useEffect(() => {
    let channel: any = null;

    const initCloudChat = async () => {
      try {
        const { data, error } = await supabase
          .from('team_chat')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data && data.length > 0) {
          const currentProfile = getUserProfile();
          const cloudMessages: TeamMessage[] = data.map((row: any) => ({
            id: row.id,
            senderName: row.sender_name || 'Team Member',
            senderRole: row.sender_name === currentProfile.name ? currentProfile.role : 'Counter Operator',
            senderTerminal: '',
            text: row.message,
            timestamp: row.created_at
              ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now',
            isMine: row.sender_name === currentProfile.name,
            billToken: row.bill_ref_id || undefined
          }));
          setTeamMessages(cloudMessages);
        }

        // Realtime subscription on team_chat table
        channel = supabase
          .channel('public:team_chat:live')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'team_chat' },
            (payload: any) => {
              const row = payload.new;
              if (!row) return;
              const currentProfile = getUserProfile();
              const isMine = row.sender_name === currentProfile.name;

              const incoming: TeamMessage = {
                id: row.id,
                senderName: row.sender_name || 'Operator',
                senderRole: isMine ? currentProfile.role : 'Team Member',
                senderTerminal: '',
                text: row.message,
                timestamp: row.created_at
                  ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Now',
                isMine,
                billToken: row.bill_ref_id || undefined
              };

              setTeamMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, incoming];
              });

              if (!isMine) {
                try {
                  macAudio.playSuccess();
                } catch {}
                // Dispatch event so App.tsx can increment unread count
                window.dispatchEvent(new CustomEvent('team_chat_message_received', { detail: incoming }));
                onShowToast?.(`💬 ${row.sender_name}: ${row.message.slice(0, 30)}...`, 'info');
              }
            }
          )
          .subscribe();

        // Broadcast listener for live emoji reactions across devices
        supabase
          .channel('public:chat:reactions')
          .on('broadcast', { event: 'reaction' }, ({ payload }: any) => {
            if (payload && payload.msgId && payload.emoji) {
              setReactionsMap((prev) => {
                const currentMsg = { ...(prev[payload.msgId] || {}) };
                currentMsg[payload.emoji] = (currentMsg[payload.emoji] || 0) + 1;
                const next = { ...prev, [payload.msgId]: currentMsg };
                try {
                  localStorage.setItem('modern_chat_reactions', JSON.stringify(next));
                } catch {}
                return next;
              });
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase chat realtime init warning:', err);
      }
    };

    initCloudChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userName, onShowToast]);

  // Sync AI messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modern_chat_messages', JSON.stringify(aiMessages));
    } catch {}
  }, [aiMessages]);

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
      const msgId = crypto.randomUUID();
      const finalMsgText = (selectedRecipient !== 'ALL' && !textToSend.startsWith('@') && !textToSend.startsWith('[To:'))
        ? `[To: ${selectedRecipient.split(' ')[0]}] ${textToSend}`
        : textToSend;

      const newTeamMsg: TeamMessage = {
        id: msgId,
        senderName: userName,
        senderRole: userRole,
        senderAvatar: userAvatar,
        senderTerminal: userTerminal,
        recipient: selectedRecipient,
        text: finalMsgText,
        timestamp: timeNow,
        isMine: true,
        billToken: String(header.tokenNo || '')
      };

      setTeamMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, newTeamMsg];
      });
      setInputText('');
      onShowToast?.('Message sent to Team Chat', 'success');

      // Async write to Supabase team_chat table (broadcasts to all computers with exact same ID)
      supabase
        .from('team_chat')
        .insert({
          id: msgId,
          sender_name: userName || 'User',
          message: finalMsgText,
          bill_ref_id: String(header.tokenNo || '')
        })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase team_chat send error:', error.message);
          }
        });
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
          {/* User Profile Info - Clickable to open Profile & Sync Settings */}
          <div
            onClick={onOpenUserProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: onOpenUserProfile ? 'pointer' : 'default',
              padding: '2px 6px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.15s'
            }}
            title={onOpenUserProfile ? "Click to change Name, DP & Multi-Device Sync settings" : undefined}
          >
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
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground, #ffffff)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{userName}</span>
                {onOpenUserProfile && <span style={{ fontSize: '9px', opacity: 0.6 }}>⚙️</span>}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '75%' }}>
              {/* All Team (Group) Button */}
              <button
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  setSelectedRecipient('ALL');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: selectedRecipient === 'ALL' ? '#25D366' : 'rgba(255, 255, 255, 0.08)',
                  border: selectedRecipient === 'ALL' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: selectedRecipient === 'ALL' ? '#090d16' : '#cbd5e1',
                  fontSize: '10px',
                  fontWeight: selectedRecipient === 'ALL' ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedRecipient === 'ALL' ? '0 1px 6px rgba(37, 211, 102, 0.4)' : 'none'
                }}
              >
                <span>🌐 All Team</span>
              </button>

              {/* Online Users Pills */}
              {onlineUsers.map((u) => {
                const isMe = u.name === userName;
                const isSelected = selectedRecipient === u.name;
                const shortName = u.name.split(' ')[0];
                return (
                  <button
                    key={u.name}
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setSelectedRecipient(isSelected ? 'ALL' : u.name);
                    }}
                    title={`Click to chat directly with ${u.name} (${u.role})`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.35)'
                        : isMe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.08)',
                      border: isSelected
                        ? '1px solid #3b82f6'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#93c5fd' : '#e2e8f0',
                      fontSize: '10px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{shortName}</span>
                    {isMe && <span style={{ fontSize: '8px', opacity: 0.6 }}>(You)</span>}
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }} />
                  </button>
                );
              })}
            </div>
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
                gap: '4px',
                whiteSpace: 'nowrap'
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
            {(() => {
              const filteredList = teamMessages.filter((m) => {
                if (selectedRecipient === 'ALL') return true;
                const recShort = selectedRecipient.split(' ')[0].toLowerCase();
                const isFromRecipient = m.senderName.toLowerCase().includes(recShort);
                const isDirectToRecipient = m.isMine && (m.recipient === selectedRecipient || m.text.toLowerCase().includes(`to: ${recShort}`));
                const isDirectToMe = m.text.toLowerCase().includes(`to: ${userName.split(' ')[0].toLowerCase()}`) && m.senderName.toLowerCase().includes(recShort);
                return isFromRecipient || isDirectToRecipient || isDirectToMe;
              });

              if (filteredList.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted-foreground, #94a3b8)', fontSize: '12px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                    <div style={{ fontWeight: 700, color: 'var(--foreground, #ffffff)' }}>
                      {selectedRecipient === 'ALL'
                        ? 'No team messages yet'
                        : `No direct messages with ${selectedRecipient}`}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                      Neeche message likhein aur instant connect karein!
                    </div>
                  </div>
                );
              }

              return filteredList.map((m) => {
                const isMine = m.isMine;
                const isHovered = hoveredMsgId === m.id;
                const msgReactions = reactionsMap[m.id] || {};

                // Parse direct tag [To: User] if present
                let displayRecipientTag = '';
                let displayText = m.text;
                const directMatch = m.text.match(/^\[To:\s*([^\]]+)\]\s*(.*)/is);
                if (directMatch) {
                  displayRecipientTag = directMatch[1].trim();
                  displayText = directMatch[2].trim();
                }

                return (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredMsgId(m.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                      gap: '2px'
                    }}
                  >
                    {/* Quick WhatsApp-Style Emoji Reaction Floating Bar */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-28px',
                          [isMine ? 'right' : 'left']: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '3px 6px',
                          borderRadius: '16px',
                          background: 'rgba(15, 23, 42, 0.96)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.55)',
                          zIndex: 30,
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          animation: 'fadeIn 0.12s ease-out'
                        }}
                      >
                        {['👍', '❤️', '😂', '🔥', '👏', '🙏'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(m.id, emoji);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '13px',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              transition: 'transform 0.1s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                            title={`React ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

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

                        {/* Direct recipient badge if tagged */}
                        {displayRecipientTag && (
                          <div style={{ marginBottom: '3px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'rgba(59, 130, 246, 0.25)',
                                border: '1px solid rgba(59, 130, 246, 0.45)',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                                color: '#93c5fd'
                              }}
                            >
                              🎯 To: @{displayRecipientTag}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ whiteSpace: 'pre-wrap' }}>{displayText}</div>

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

                        {/* Reaction Badges */}
                        {Object.keys(msgReactions).length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexWrap: 'wrap',
                              marginTop: '4px',
                              paddingTop: '3px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            {Object.entries(msgReactions).map(([emoji, count]) => {
                              if (count <= 0) return null;
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(m.id, emoji)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.12)',
                                    border: '1px solid rgba(255, 255, 255, 0.18)',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    color: '#ffffff'
                                  }}
                                  title={`${count} reactions`}
                                >
                                  <span>{emoji}</span>
                                  <span style={{ fontSize: '9.5px', fontWeight: 700 }}>{count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
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

      {/* Recipient Targeting Bar when a specific user is selected */}
      {chatMode === 'TEAM' && selectedRecipient !== 'ALL' && (
        <div
          style={{
            padding: '5px 12px',
            background: 'rgba(59, 130, 246, 0.15)',
            borderTop: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#93c5fd'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒 Direct to:</span>
            <strong>@{selectedRecipient}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              macAudio.playClick();
              setSelectedRecipient('ALL');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Switch to All Team ✕
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
