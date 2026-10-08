import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  ArrowUp, 
  Sparkles, 
  X, 
  Bot, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  HelpCircle,
  Calculator,
  Maximize2,
  Minimize2,
  Share2,
  Plus,
  Smile,
  CheckCheck,
  Search,
  Users,
  TrendingUp,
  Package,
  History,
  IndianRupee
} from 'lucide-react';
import { localDb } from '../services/db/localDb';
import type { BillRecord, PartyRecord } from '../services/db/schema';
import { macAudio } from '../utils/macAudio';
import type { BillHeader, RawItem, FinishedItem } from '../types';
import { supabase, getUserProfile } from '../services/supabaseClient';
import { getAvatarUrl, getDeterministicAvatarId } from '../utils/avatarUtils';
import { Tooltip } from './ui/shadcn';

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
  // Mode: 'TEAM' (Colleagues / Network) vs 'AI' (Apple Copilot)
  const [chatMode, setChatMode] = useState<'TEAM' | 'AI'>('TEAM');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('ALL');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [selectedPartyForQuery, setSelectedPartyForQuery] = useState<string>(header.partyName || '');
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [partySearchText, setPartySearchText] = useState('');

  useEffect(() => {
    if (header.partyName && header.partyName.trim()) {
      setSelectedPartyForQuery(header.partyName);
    }
  }, [header.partyName]);

  // User Profile loaded live from Settings (localStorage)
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('modern_app_user_name') || 'Rohit (Billing Desk)');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('modern_app_user_role') || 'Main Billing Counter');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('modern_app_user_avatar') || '');
  const [userAvatarId, setUserAvatarId] = useState<number>(() => {
    const profile = getUserProfile();
    return profile.avatarId || getDeterministicAvatarId(profile.name || 'User');
  });
  const [userTerminal, setUserTerminal] = useState<string>(() => localStorage.getItem('modern_app_user_terminal') || 'Counter #1');

  // Emoji Reactions Map
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

  // Listen to profile updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      const p = getUserProfile();
      setUserName(p.name || 'Rohit (Billing Desk)');
      setUserRole(p.role || 'Main Billing Counter');
      setUserAvatar(localStorage.getItem('modern_app_user_avatar') || '');
      setUserAvatarId(p.avatarId || getDeterministicAvatarId(p.name || 'User'));
      setUserTerminal(p.terminal || 'Counter #1');
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // 1. Team Messages
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>(() => {
    try {
      const saved = localStorage.getItem('modern_team_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'team-init-1',
        senderName: 'Warehouse Dispatch',
        senderRole: 'Loading Bay',
        senderTerminal: 'Counter #2',
        senderAvatar: '',
        text: `📦 Ingot inventory verified for Token #${header.tokenNo || '1'}. Ready for loading.`,
        timestamp: '10:30 AM',
        isMine: false
      },
      {
        id: 'team-init-2',
        senderName: 'Accounts & Ledger',
        senderRole: 'Back Office',
        senderTerminal: 'Accounts',
        senderAvatar: '',
        text: `✅ Party payment status cleared. Authorized for dispatch.`,
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
        text: `👋 **Welcome to Apple Copilot!**\n\nConnected to **Token #${header.tokenNo || '1'} (${header.partyName || 'Cash Sale'})**.\n\nAsk for instant bill totals, WhatsApp invoice memos, party item summaries, or discount math.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [onlineUsers, setOnlineUsers] = useState<{ name: string; role: string; terminal: string; avatarId?: number; onlineAt: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Supabase Realtime Presence
  useEffect(() => {
    const profile = getUserProfile();
    const currentName = profile.name || userName || 'Operator';

    const presenceChannel = supabase.channel('online-team-presence', {
      config: {
        presence: { key: currentName }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const active: { name: string; role: string; terminal: string; avatarId?: number; onlineAt: string }[] = [];
        const seenNames = new Set<string>();

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.name && !seenNames.has(p.name)) {
              seenNames.add(p.name);
              active.push({
                name: p.name,
                role: p.role || 'Counter',
                terminal: p.terminal || '',
                avatarId: p.avatarId,
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
            avatarId: userAvatarId,
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
            avatarId: profile.avatarId || userAvatarId,
            onlineAt: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userName, userRole, userTerminal]);

  // Fetch cloud team messages from Supabase
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

        // Realtime subscription
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
                try { macAudio.playSuccess(); } catch {}
                window.dispatchEvent(new CustomEvent('team_chat_message_received', { detail: incoming }));
                onShowToast?.(`💬 ${row.sender_name}: ${row.message.slice(0, 30)}...`, 'info');
              }
            }
          )
          .subscribe();

        // Broadcast listener for reactions
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
      if (channel) supabase.removeChannel(channel);
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

  // Assistant Response Generator
  const generateAssistantResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    // a) Party total
    if (q.includes('party total') || q.includes('kitna mal') || q.includes('kitni bill') || (q.includes('total') && !q.includes('summary') && !q.includes('discount'))) {
      if (!selectedPartyForQuery) return '❌ Please select a party first to check their total.';
      const bills = localDb.getBills().filter(b => b.party === selectedPartyForQuery);
      const totalAmount = bills.reduce((acc, b) => acc + (b.total || 0), 0);
      const paidCount = bills.filter(b => b.status === 'PAID').length;
      const pendingCount = bills.filter(b => b.status === 'PENDING').length;
      
      return `📊 **${selectedPartyForQuery} Ka Total**\n\n` +
        `• **Total Bills:** ${bills.length}\n` +
        `• **Grand Total:** ₹${totalAmount.toLocaleString('en-IN')}\n` +
        `• **Status:** ${paidCount} Paid, ${pendingCount} Pending`;
    }

    // b) Old rate
    if (q.includes('old rate') || q.includes('purana rate') || q.includes('last rate') || q === 'rate') {
      if (!selectedPartyForQuery) return '❌ Please select a party first to check old rates.';
      const bills = localDb.getBills().filter(b => b.party === selectedPartyForQuery).sort((a, b) => b.createdAt - a.createdAt);
      if (bills.length === 0) return `⚠️ No previous bills found for **${selectedPartyForQuery}**`;
      
      const lastBill = bills[0];
      const rates = lastBill.finishedItems
        .filter(f => f.mould && f.mould !== 'Mould Name')
        .map(f => `  • ${f.mould}: ₹${f.price}`)
        .join('\n');
        
      return `💰 **Purana Rate (${selectedPartyForQuery})**\n` +
        `_From Bill #${lastBill.token} (${lastBill.date})_\n\n` +
        (rates || '  • No standard items found in last bill');
    }

    // c) Last bill
    if (q.includes('last bill') || q.includes('pichli bill') || q.includes('pichla bill')) {
      if (!selectedPartyForQuery) return '❌ Please select a party first to check last bill.';
      const bills = localDb.getBills().filter(b => b.party === selectedPartyForQuery).sort((a, b) => b.createdAt - a.createdAt);
      if (bills.length === 0) return `⚠️ No previous bills found for **${selectedPartyForQuery}**`;
      
      const lastBill = bills[0];
      return `📋 **Pichli Bill Details**\n\n` +
        `• **Party:** ${lastBill.party}\n` +
        `• **Token:** #${lastBill.token} | **Date:** ${lastBill.date}\n` +
        `• **Items:** ${lastBill.finishedItems.length} finished moulds\n` +
        `• **Total:** ₹${(lastBill.total || 0).toLocaleString('en-IN')}\n` +
        `• **Status:** ${lastBill.status}`;
    }

    // d) Stock check
    if (q.includes('stock') || q.includes('mal') || q.includes('inventory')) {
      const stockItems = localDb.getStockItems();
      const lowStock = stockItems.filter(s => s.qty <= (s.minQty || 0) && s.qty > 0).length;
      const critical = stockItems.filter(s => s.qty <= 0).length;
      
      return `📦 **Current Stock Status**\n\n` +
        `• **Total Items:** ${stockItems.length}\n` +
        `• **Low Stock:** ${lowStock} items\n` +
        `• **Critical/Empty:** ${critical} items\n\n` +
        `_Press F8 to open full inventory tab_`;
    }

    // e) Party list
    if (q.includes('party list') || q.includes('parties') || (q.includes('party') && !q.includes('total'))) {
      const parties = localDb.getParties();
      const topParties = parties.slice(0, 5).map(p => `  • ${p.name} (${p.city || 'Local'}) - Bal: ₹${(p.balance || 0).toLocaleString('en-IN')}`).join('\n');
      
      return `👥 **Registered Parties (${parties.length})**\n\n` +
        `Top 5 list:\n` +
        (topParties || '  • No parties found') + 
        `\n\n_Use the + button to select a party_`;
    }

    // f) Item rate history
    if (q.includes('item rate') || q.includes('mould rate') || q.includes('item history')) {
      return `📈 **Item Rate Check**\n\n` +
        `Please open the 'Old Rates' tab to search price history across all bills and parties. You can press Alt+P for quick access.`;
    }

    if (q.includes('summary') || q.includes('hisab')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const totalPcs = finishedItems.reduce((acc, f) => acc + (Number(f.qty) || 0), 0);
      const rawCount = rawItems.filter(r => r.name && r.name.trim()).length;
      const totalRawFt = rawItems.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
      const totalUCap = rawItems.reduce((acc, r) => acc + (Number(r.uCap) || 0), 0);
      const totalLCap = rawItems.reduce((acc, r) => acc + (Number(r.lCap) || 0), 0);

      return `📊 **Bill #${header.tokenNo} Summary**\n\n` +
        `• **Party:** ${header.partyName || 'Cash Sale'}\n` +
        `• **Type:** ${header.typeSelection} | **Doc:** ${header.docType}\n` +
        `• **Raw Entries:** ${rawCount} items (${totalRawFt} FT) [Caps: U=${totalUCap}, L=${totalLCap}]\n` +
        `• **Finished Moulds:** ${finishedItems.length} items (${totalPcs} Pcs)\n` +
        `• **Grand Total:** ₹${finishedTotal.toLocaleString('en-IN')}`;
    }

    if (q.includes('whatsapp') || q.includes('memo') || q.includes('share')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const mouldsText = finishedItems
        .filter(f => f.mould && f.mould !== 'Mould Name' && f.qty > 0)
        .map(f => `  • ${f.mould}: ${f.qty} Pcs @ ₹${f.price} = ₹${f.total}`)
        .join('\n');

      return `📱 *ESTIMATE / BILL MEMO*\n\n` +
        `*Invoice:* #${header.tokenNo}\n` +
        `*Party:* ${header.partyName || 'Cash Sale'}\n` +
        `*Date:* ${header.date}\n` +
        `*Vehicle:* ${header.vehicleNo || 'N/A'}\n\n` +
        `*Items:*\n${mouldsText || '  • Standard Mould Items'}\n\n` +
        `*Grand Total: ₹${finishedTotal.toLocaleString('en-IN')}*\n` +
        `_Thank you for your business!_`;
    }

    if (q.includes('discount') || q.includes('off') || q.includes('%')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const match = q.match(/(\d+)%/);
      const pct = match ? parseInt(match[1], 10) : 5;
      const discountAmt = Math.round((finishedTotal * pct) / 100);
      const netTotal = finishedTotal - discountAmt;

      return `🏷️ **Discount (${pct}%)**\n\n` +
        `• Gross: ₹${finishedTotal.toLocaleString('en-IN')}\n` +
        `• Less ${pct}%: -₹${discountAmt.toLocaleString('en-IN')}\n` +
        `• **Net Payable:** ₹${netTotal.toLocaleString('en-IN')}`;
    }

    if (q.includes('shortcut') || q.includes('help') || q.includes('key')) {
      return `⌨️ **Essential Shortcuts**\n\n` +
        `• **NumPad '.'**: Quick Navigator\n` +
        `• **Ctrl + S**: Save Bill to SQLite\n` +
        `• **Ctrl + P**: Vector Laser Print\n` +
        `• **Ctrl + G**: Calculate Finished Summary\n` +
        `• **Alt + P**: Load Old Item Price\n` +
        `• **F8**: 5-Tab Stock Inventory\n` +
        `• **Ctrl + J**: Toggle Chat Panel\n` +
        `• **Esc**: Clear / Back`;
    }

    return `💡 **Copilot AI Assistant:**\n\n` +
      `Active Party Context: **${selectedPartyForQuery || 'None selected'}**\n\n` +
      `Try asking in English or Hindi:\n` +
      `• *"Party ka total"* (Total bills for selected party)\n` +
      `• *"Purana rate"* (Last bill's prices)\n` +
      `• *"Pichli bill"* (Details of last bill)\n` +
      `• *"Stock check"* (Current inventory)\n` +
      `• *"Party list"* (All registered parties)\n` +
      `• *"Bill summary"* (Current bill hisab)\n` +
      `• *"WhatsApp memo"* (Share format)`;
  };

  const handleSendMessage = (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!textToSend) return;

    try { macAudio.playPop(); } catch {}
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
        senderAvatar: String(userAvatarId || getDeterministicAvatarId(userName)),
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
      onShowToast?.('Sent to Team', 'success');

      supabase
        .from('team_chat')
        .insert({
          id: msgId,
          sender_name: userName || 'User',
          message: finalMsgText,
          bill_ref_id: String(header.tokenNo || '')
        })
        .then(({ error }) => {
          if (error) console.error('Supabase team_chat send error:', error.message);
        });
    } else {
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
        try { macAudio.playSuccess(); } catch {}
      }, 250);
    }
  };

  const handleShareBillToTeam = () => {
    const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
    const mouldsSummary = finishedItems
      .filter(f => f.mould && f.mould !== 'Mould Name' && f.qty > 0)
      .map(f => `${f.mould} (${f.qty} Pcs)`)
      .slice(0, 3)
      .join(', ');

    const shareText = `📋 **Token #${header.tokenNo} Update**\n` +
      `Party: *${header.partyName || 'Cash Sale'}*\n` +
      `Items: ${mouldsSummary || 'Moulds'}\n` +
      `Total: ₹${finishedTotal.toLocaleString('en-IN')}`;

    setChatMode('TEAM');
    handleSendMessage(shareText);
    setShowAttachMenu(false);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    try { macAudio.playClick(); } catch {}
    onShowToast?.('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleClearHistory = () => {
    if (chatMode === 'TEAM') {
      if (window.confirm('Clear team chat history on this counter?')) {
        setTeamMessages([]);
        localStorage.removeItem('modern_team_chat_messages');
        onShowToast?.('Team chat cleared', 'info');
      }
    } else {
      if (window.confirm('Clear Copilot history?')) {
        setAiMessages([]);
        localStorage.removeItem('modern_chat_messages');
        onShowToast?.('Assistant chat cleared', 'info');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '84px',
        width: isExpanded ? '540px' : '410px',
        height: isMinimized ? '56px' : '640px',
        maxHeight: 'calc(100vh - 48px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(45px) saturate(210%)',
        WebkitBackdropFilter: 'blur(45px) saturate(210%)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 32px 70px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.28)',
        overflow: 'hidden',
        transition: 'all 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ─── Apple Window Header ─── */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        {/* Left: Clear Chat History Icon */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Clear Chat History" side="bottom">
            <button
              type="button"
              onClick={handleClearHistory}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.45)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ff453a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
            >
              <Trash2 size={15} />
            </button>
          </Tooltip>
        </div>

        {/* Center: Apple Segmented Pill Slider */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.38)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              try { macAudio.playClick(); } catch {}
              setChatMode('TEAM');
            }}
            style={{
              padding: '4px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: chatMode === 'TEAM' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
              color: chatMode === 'TEAM' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: chatMode === 'TEAM' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
            }}
          >
            <MessageCircle size={12} color={chatMode === 'TEAM' ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} />
            <span>Team iMessage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              try { macAudio.playClick(); } catch {}
              setChatMode('AI');
            }}
            style={{
              padding: '4px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: chatMode === 'AI' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
              color: chatMode === 'AI' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: chatMode === 'AI' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
            }}
          >
            <Sparkles size={12} color={chatMode === 'AI' ? '#00F0FF' : 'rgba(255, 255, 255, 0.6)'} />
            <span>Copilot</span>
          </button>
        </div>

        {/* Right: Operator Badge & Window Controls (Moved from left to right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={onOpenUserProfile}
            title={`${userName} (${userTerminal}) • Click for Sync Profile`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: onOpenUserProfile ? 'pointer' : 'default',
              transition: 'background 0.15s ease'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(0, 122, 255, 0.2)',
                border: '1px solid rgba(0, 122, 255, 0.5)',
                boxShadow: '0 0 8px rgba(0, 122, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src={getAvatarUrl(userAvatarId, userName)}
                alt="DP"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ fontSize: '10.5px', color: '#e2e8f0', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName.split(' ')[0]}
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#34c759',
                boxShadow: '0 0 6px #34c759'
              }}
            />
          </div>

          {/* macOS Window Controls (Traffic Lights) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tooltip title="Minimize" side="bottom">
              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch {}
                  setIsMinimized(!isMinimized);
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffbd2e',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(255, 189, 46, 0.5)'
                }}
              />
            </Tooltip>
            <Tooltip title="Expand / Contract" side="bottom">
              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch {}
                  setIsExpanded(!isExpanded);
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#27c93f',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(39, 201, 63, 0.5)'
                }}
              />
            </Tooltip>
            <Tooltip title="Close (Ctrl+J)" side="bottom">
              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch {}
                  onClose();
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ff5f56',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(255, 95, 86, 0.5)'
                }}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* When Minimized: Hide body */}
      {!isMinimized && (
        <>
          {/* ─── Apple Sub-Ribbon / Presence Bar ─── */}
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.18)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              flexShrink: 0
            }}
          >
            {chatMode === 'TEAM' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
                {/* All Team Button */}
                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    setSelectedRecipient('ALL');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: selectedRecipient === 'ALL' ? '#007AFF' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🌐 All Team</span>
                </button>

                {/* Online Users */}
                {onlineUsers.map((u) => {
                  const isMe = u.name === userName;
                  const isSelected = selectedRecipient === u.name;
                  const shortName = u.name.split(' ')[0];
                  return (
                    <button
                      key={u.name}
                      type="button"
                      onClick={() => {
                        try { macAudio.playClick(); } catch {}
                        setSelectedRecipient(isSelected ? 'ALL' : u.name);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        background: isSelected ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                        border: isSelected ? '1px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '15px',
                          height: '15px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={getAvatarUrl(u.avatarId, u.name)}
                          alt={u.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <span>{shortName}</span>
                      {isMe && <span style={{ opacity: 0.5, fontSize: '9px' }}>(You)</span>}
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34c759' }} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00F0FF', display: 'flex', alignItems: 'center' }}>
                    <Bot size={13} />
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,240,255,0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.2)' }}>
                    <Users size={10} color="#00F0FF" />
                    <span style={{ color: '#00F0FF', fontWeight: 600, fontSize: '10px' }}>
                      {selectedPartyForQuery || 'Select Party'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPartySearch(!showPartySearch)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                  >
                    Change
                  </button>
                  {showPartySearch && (
                    <div style={{ position: 'absolute', top: '100%', left: '20px', marginTop: '4px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '200px', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search party..."
                          value={partySearchText}
                          onChange={(e) => setPartySearchText(e.target.value)}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {localDb.getParties().filter(p => p.name.toLowerCase().includes(partySearchText.toLowerCase())).map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedPartyForQuery(p.name); setShowPartySearch(false); setPartySearchText(''); }}
                            style={{ padding: '6px 8px', fontSize: '11px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }}>
                  AI Assistant
                </span>
              </div>
            )}
          </div>

          {/* ─── Messages Stream ─── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent'
            }}
          >
            {/* TEAM MESSAGES */}
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
                      <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255, 255, 255, 0.45)' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                          {selectedRecipient === 'ALL' ? 'No Team Messages Yet' : `No conversation with ${selectedRecipient}`}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                          Neeche message likhein aur instant send karein!
                        </div>
                      </div>
                    );
                  }

                  return filteredList.map((m) => {
                    const isMine = m.isMine;
                    const isHovered = hoveredMsgId === m.id;
                    const msgReactions = reactionsMap[m.id] || {};

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
                          gap: '3px'
                        }}
                      >
                        {/* Apple Floating Tapback Bar on Hover */}
                        {isHovered && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-32px',
                              [isMine ? 'right' : 'left']: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '4px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(30, 41, 59, 0.92)',
                              border: '1px solid rgba(255, 255, 255, 0.22)',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              zIndex: 40,
                              animation: 'shadcnSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                          >
                            {['❤️', '👍', '👎', '😂', '‼️', '🔥'].map((emoji) => (
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
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  padding: '2px 4px',
                                  borderRadius: '6px',
                                  transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.4)')}
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
                            alignItems: 'flex-end',
                            gap: '8px',
                            maxWidth: '85%',
                            flexDirection: isMine ? 'row-reverse' : 'row'
                          }}
                        >
                          {/* 3D Profile Avatar DP */}
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                              border: isMine ? '1.5px solid #007AFF' : '1.5px solid rgba(255, 255, 255, 0.2)',
                              background: 'rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={getAvatarUrl(
                                isMine ? userAvatarId : (m.senderAvatar || onlineUsers.find(u => u.name === m.senderName)?.avatarId),
                                isMine ? userName : m.senderName
                              )}
                              alt={m.senderName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/avatars/1.webp';
                              }}
                            />
                          </div>

                          {/* Authentic Apple iMessage Bubble */}
                          <div
                            style={{
                              position: 'relative',
                              padding: '10px 14px',
                              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              background: isMine
                                ? 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)'
                                : 'rgba(255, 255, 255, 0.09)',
                              color: '#ffffff',
                              border: isMine ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                              boxShadow: isMine
                                ? '0 4px 14px rgba(0, 122, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                : '0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                              fontSize: '12px',
                              lineHeight: '1.45',
                              wordBreak: 'break-word'
                            }}
                          >
                            {/* Sender Info for incoming */}
                            {!isMine && (
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '3px' }}>
                                {m.senderName}
                              </div>
                            )}

                            {/* Direct Tag Pill */}
                            {displayRecipientTag && (
                              <div style={{ marginBottom: '4px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: 'rgba(255, 255, 255, 0.18)',
                                    borderRadius: '6px',
                                    padding: '1px 6px',
                                    fontSize: '9.5px',
                                    fontWeight: 700
                                  }}
                                >
                                  @{displayRecipientTag}
                                </span>
                              </div>
                            )}

                            <div style={{ whiteSpace: 'pre-wrap' }}>{displayText}</div>

                            {/* Timestamp & Delivery */}
                            <div
                              style={{
                                fontSize: '9px',
                                color: isMine ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.45)',
                                textAlign: 'right',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '3px'
                              }}
                            >
                              <span>{m.timestamp}</span>
                              {isMine && <CheckCheck size={11} color="#ffffff" />}
                            </div>

                            {/* Reaction Badges on Corner */}
                            {Object.keys(msgReactions).length > 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '-9px',
                                  [isMine ? 'left' : 'right']: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  background: 'rgba(30, 41, 59, 0.95)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '9999px',
                                  padding: '1px 5px',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                                }}
                              >
                                {Object.entries(msgReactions).map(([emoji, count]) => {
                                  if (count <= 0) return null;
                                  return (
                                    <span key={emoji} style={{ fontSize: '10px' }}>
                                      {emoji} {count > 1 && <strong style={{ fontSize: '8.5px' }}>{count}</strong>}
                                    </span>
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

            {/* AI COPILOT MESSAGES */}
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
                        gap: '3px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '8px',
                          maxWidth: '85%',
                          flexDirection: isUser ? 'row-reverse' : 'row'
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isUser
                              ? 'linear-gradient(135deg, #007AFF, #5856D6)'
                              : 'linear-gradient(135deg, #00F0FF, #007AFF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '11px',
                            flexShrink: 0
                          }}
                        >
                          {isUser ? userName.charAt(0).toUpperCase() : <Sparkles size={12} color="#ffffff" />}
                        </div>

                        {/* Message Bubble */}
                        <div
                          style={{
                            position: 'relative',
                            padding: '10px 14px',
                            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isUser
                              ? 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)'
                              : 'rgba(2, 132, 199, 0.1)',
                            border: isUser ? 'none' : '1px solid rgba(56, 189, 248, 0.22)',
                            color: '#ffffff',
                            fontSize: '12px',
                            lineHeight: '1.45',
                            wordBreak: 'break-word',
                            boxShadow: isUser
                              ? '0 4px 14px rgba(0, 122, 255, 0.35)'
                              : '0 4px 14px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(m.id, m.text)}
                              title="Copy Answer"
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '6px',
                                padding: '3px 5px',
                                cursor: 'pointer',
                                color: copiedId === m.id ? '#34c759' : 'rgba(255, 255, 255, 0.6)'
                              }}
                            >
                              {copiedId === m.id ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          )}

                          <div
                            style={{
                              fontSize: '9px',
                              color: isUser ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.45)',
                              textAlign: 'right',
                              marginTop: '4px'
                            }}
                          >
                            {m.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Apple Action Pills (AI Mode) ─── */}
          {chatMode === 'AI' && (
            <div
              style={{
                padding: '6px 14px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                flexShrink: 0
              }}
            >
              {[
                { label: 'Party Total', query: 'Party total', icon: IndianRupee, color: '#00F0FF' },
                { label: 'Old Rate', query: 'Old rate', icon: History, color: '#ff9f0a' },
                { label: 'Last Bill', query: 'Last bill', icon: FileText, color: '#bf5af2' },
                { label: 'Stock Status', query: 'Stock check', icon: Package, color: '#ff453a' },
                { label: 'Bill Summary', query: `Bill summary for token ${header.tokenNo}`, icon: FileText, color: '#38bdf8' },
                { label: 'WhatsApp Memo', query: 'Generate WhatsApp memo', icon: MessageCircle, color: '#34c759' },
                { label: '5% Discount', query: 'Calculate 5% discount', icon: Calculator, color: '#ff9f0a' },
                { label: 'Shortcuts', query: 'Show shortcuts', icon: HelpCircle, color: '#bf5af2' }
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    handleSendMessage(pill.query);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                >
                  <pill.icon size={11} color={pill.color} />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ─── Apple Floating Input Capsule ─── */}
          <div style={{ position: 'relative', padding: '10px 14px', flexShrink: 0 }}>
            {/* Attachment Menu Popup */}
            {showAttachMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '60px',
                  left: '14px',
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  zIndex: 50,
                  minWidth: '200px',
                  animation: 'shadcnSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <button
                  type="button"
                  onClick={handleShareBillToTeam}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Share2 size={13} color="#007AFF" />
                  <span>Share Token #{header.tokenNo}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendMessage('Generate WhatsApp memo');
                    setShowAttachMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileText size={13} color="#34c759" />
                  <span>Insert Bill Memo</span>
                </button>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                
                <div style={{ padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Search size={11} color="rgba(255,255,255,0.5)" />
                    <input
                      type="text"
                      placeholder="Select Party Context..."
                      value={partySearchText}
                      onChange={(e) => setPartySearchText(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', outline: 'none', width: '100%' }}
                    />
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {localDb.getParties().filter(p => p.name.toLowerCase().includes(partySearchText.toLowerCase())).map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPartyForQuery(p.name); setShowAttachMenu(false); }}
                        style={{ padding: '6px 8px', fontSize: '10.5px', color: '#fff', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Users size={11} color="#ff9f0a" />
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.42)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '9999px',
                padding: '4px 6px 4px 10px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.25)',
                transition: 'border 0.2s ease'
              }}
            >
              {/* Apple Plus Button */}
              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch {}
                  setShowAttachMenu(!showAttachMenu);
                }}
                title="Attach Action"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: showAttachMenu ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  marginRight: '8px',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                <Plus size={14} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {/* Input text */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  chatMode === 'TEAM'
                    ? `iMessage • Token #${header.tokenNo || '1'}...`
                    : "Ask Copilot or calculate..."
                }
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 0'
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                title="Send Message (Enter)"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: inputText.trim()
                    ? '#007AFF'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: inputText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  flexShrink: 0,
                  marginLeft: '6px',
                  boxShadow: inputText.trim() ? '0 2px 8px rgba(0, 122, 255, 0.5)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <ArrowUp size={15} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
