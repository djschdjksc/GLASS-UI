import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
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
  Minimize2
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
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

  useEffect(() => {
    try {
      localStorage.setItem('modern_chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // 2. Party Information
    if (q.includes('party') || q.includes('customer') || q.includes('vehicle')) {
      return `👤 **Party Information**\n\n` +
        `• **Party Name:** ${header.partyName || 'Not Set'}\n` +
        `• **Vehicle No:** ${header.vehicleNo || 'None specified'}\n` +
        `• **Billing Type:** ${header.typeSelection}\n` +
        `• **Document Type:** ${header.docType}\n` +
        `• **Token Number:** #${header.tokenNo}`;
    }

    // 3. Discount calculation
    if (q.includes('discount') || q.includes('cut') || q.includes('%')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const disc2 = finishedTotal * 0.02;
      const disc5 = finishedTotal * 0.05;
      const disc10 = finishedTotal * 0.10;

      return `💰 **Discount Calculations for Total ₹${finishedTotal.toLocaleString('en-IN')}**\n\n` +
        `• **2% Discount:** -₹${disc2.toFixed(2)} ➔ Net: ₹${(finishedTotal - disc2).toFixed(2)}\n` +
        `• **5% Discount:** -₹${disc5.toFixed(2)} ➔ Net: ₹${(finishedTotal - disc5).toFixed(2)}\n` +
        `• **10% Discount:** -₹${disc10.toFixed(2)} ➔ Net: ₹${(finishedTotal - disc10).toFixed(2)}`;
    }

    // 4. WhatsApp / SMS Memo
    if (q.includes('memo') || q.includes('whatsapp') || q.includes('share') || q.includes('slip')) {
      const finishedTotal = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      return `📝 **Ready-to-Copy Bill Memo**\n\n` +
        `*BILL ESTIMATE - MODERN SUMMARY*\n` +
        `Token: #${header.tokenNo}\n` +
        `Party: ${header.partyName}\n` +
        `Date: ${header.date}\n` +
        `Vehicle: ${header.vehicleNo || '-'}\n` +
        `--------------------\n` +
        finishedItems.map((f, i) => `${i + 1}. ${f.mould} x ${f.qty} = ₹${f.total}`).join('\n') +
        `\n--------------------\n` +
        `*TOTAL: ₹${finishedTotal.toLocaleString('en-IN')}*`;
    }

    // 5. Shortcuts
    if (q.includes('shortcut') || q.includes('key') || q.includes('help')) {
      return `⌨️ **Important Quick Shortcuts**\n\n` +
        `• **F1:** Help / Manual\n` +
        `• **F2:** Bill History (Sale, Sale Return, Order, Purchase)\n` +
        `• **F3:** Mould Price List & Live Search\n` +
        `• **F4:** Manage Conversions Tab\n` +
        `• **F8:** Save Current Bill to SQLite\n` +
        `• **F9:** Instant Summary Calculation\n` +
        `• **Ctrl + J:** Open / Close this Chat Panel\n` +
        `• **Ctrl + S:** Save Bill`;
    }

    // Default intelligent answer
    return `🤖 I noted your message: "${query}".\n\nIf you need quick numbers, try clicking the suggestions below or ask me to "calculate summary", "check party", or "generate bill memo".`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    macAudio.playClick();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Generate response after small realistic delay
    setTimeout(() => {
      macAudio.playSuccess();
      const replyText = generateAssistantResponse(text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 280);
  };

  const handleCopyText = (id: string, text: string) => {
    macAudio.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast?.('Message copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear chat history?')) {
      macAudio.playClick();
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'assistant',
          text: `Chat history cleared. How can I help you with Bill #${header.tokenNo}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div
      className="shadcn-chat-panel-container"
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        bottom: '12px',
        width: isExpanded ? '520px' : '380px',
        zIndex: 9999999,
        background: 'var(--popover, #11141d)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.14))',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'shadcnSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--panel-header, rgba(0, 0, 0, 0.25))',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Bot size={18} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                border: '1.5px solid #090d16'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground, #ffffff)' }}>
                Billing Assistant
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981'
                }}
              >
                LIVE
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground, #94a3b8)', display: 'block' }}>
              Token #{header.tokenNo || '1'} • {header.partyName || 'Cash Sale'}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleClearHistory}
            title="Clear Chat History"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
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
            title={isExpanded ? 'Narrow Panel' : 'Expand Panel'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
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
            title="Close Assistant (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Quick Prompt Suggestions Bar */}
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--secondary, rgba(255, 255, 255, 0.03))',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => handleSendMessage('Bill Summary')}
          className="shadcn-prompt-chip"
          style={{
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: '12px',
            background: 'var(--card, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            color: 'var(--foreground, #f8fafc)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FileText size={11} color="var(--primary, #38bdf8)" />
          <span>Bill Summary</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('Calculate Discount')}
          className="shadcn-prompt-chip"
          style={{
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: '12px',
            background: 'var(--card, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            color: 'var(--foreground, #f8fafc)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Calculator size={11} color="#34d399" />
          <span>Discount</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('Copy Bill Memo')}
          className="shadcn-prompt-chip"
          style={{
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: '12px',
            background: 'var(--card, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            color: 'var(--foreground, #f8fafc)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Copy size={11} color="#fbbf24" />
          <span>WhatsApp Memo</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('Shortcut Keys')}
          className="shadcn-prompt-chip"
          style={{
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: '12px',
            background: 'var(--card, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            color: 'var(--foreground, #f8fafc)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <HelpCircle size={11} color="#a78bfa" />
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map((m) => {
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
                  alignItems: 'flex-start',
                  gap: '6px',
                  maxWidth: '88%',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isUser ? 'var(--primary, #0ea5e9)' : 'var(--secondary, #27272a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {isUser ? <User size={13} color="#ffffff" /> : <Sparkles size={13} color="var(--primary, #38bdf8)" />}
                </div>

                {/* Message Bubble - Shadcn Card styling */}
                <div
                  style={{
                    position: 'relative',
                    padding: '8px 12px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isUser
                      ? 'var(--primary, #0ea5e9)'
                      : 'var(--card, rgba(255, 255, 255, 0.07))',
                    color: isUser ? '#ffffff' : 'var(--foreground, #f8fafc)',
                    border: isUser ? 'none' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {m.text}

                  {/* Copy button on assistant responses */}
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
                  fontSize: '9.5px',
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '10px 12px',
          background: 'var(--panel-header, rgba(0, 0, 0, 0.25))',
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
          placeholder="Ask assistant or type bill note..."
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
              ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
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
            flexShrink: 0
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
