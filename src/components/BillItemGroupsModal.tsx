import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Layers, 
  Sparkles, 
  Columns, 
  FolderPlus,
  ArrowRight,
  Search,
  CornerDownLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import type { BillItemGroup, RawItem } from '../types';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import { resolveItemNameWithMode, getActiveShortcuts } from '../utils/itemExpansion';
import { Tooltip } from './ui/shadcn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  billToken: string | number;
  groups: BillItemGroup[];
  onSaveGroups: (groups: BillItemGroup[]) => void;
  dynamicCols: { field: string; label: string }[];
  rawItems: RawItem[];
  prefilledItemNames?: string[];
  onToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const BillItemGroupsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  billToken,
  groups,
  onSaveGroups,
  dynamicCols,
  rawItems,
  prefilledItemNames,
  onToast
}) => {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [targetColumn, setTargetColumn] = useState('qty');
  const [currentItems, setCurrentItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const groupNameRef = useRef<HTMLInputElement | null>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement | null>(null);

  // Available column options
  const columnOptions = useMemo(() => {
    const list: { field: string; label: string }[] = [
      { field: 'qty', label: 'QTY (10 FT)' },
      { field: 'uCap', label: 'U CAP' },
      { field: 'lCap', label: 'L CAP' }
    ];
    if (dynamicCols && dynamicCols.length > 0) {
      dynamicCols.forEach(dc => {
        list.push({ field: dc.field, label: dc.label || dc.field });
      });
    }
    return list;
  }, [dynamicCols]);

  // Live Auto-Conversion preview as user types (exact same logic as Item Name column)
  const resolvedPreview = useMemo(() => {
    const trimmed = itemInput.trim();
    if (!trimmed) return '';
    const prevItem = currentItems.length > 0 ? currentItems[currentItems.length - 1] : undefined;
    const { finalName } = resolveItemNameWithMode({
      rawVal: trimmed,
      rowIndex: currentItems.length,
      prevItemName: prevItem,
      autoConvert: true,
      autoItem: true,
      simpleMode: false
    });
    return (finalName && finalName.toLowerCase() !== trimmed.toLowerCase()) ? finalName : '';
  }, [itemInput, currentItems]);

  // Clean suggestion pool (filtered from internal __auto codes)
  const itemSuggestionsPool = useMemo(() => {
    const list: { display: string; value: string; scCode?: string; isShortcut?: boolean }[] = [];
    const seenValues = new Set<string>();

    // 1. Active Shortcuts from shortcut rules (e.g. 2 -> 1/2 D, bfp -> B.F.P)
    const shortcuts = getActiveShortcuts();
    if (shortcuts && shortcuts.length > 0) {
      shortcuts.forEach(sc => {
        const conv = (sc.conversion || '').trim();
        const scCode = (sc.shortcut || '').trim();
        // Ignore internal auto codes starting with __ or __auto_
        if (scCode.startsWith('__')) return;
        if (conv && !seenValues.has(conv.toLowerCase())) {
          seenValues.add(conv.toLowerCase());
          list.push({ 
            display: conv, 
            value: conv, 
            scCode: scCode || undefined, 
            isShortcut: Boolean(scCode) 
          });
        }
      });
    }

    // 2. Raw Items in current bill
    rawItems.forEach(r => {
      const n = (r.name || '').trim();
      if (n && !seenValues.has(n.toLowerCase())) {
        seenValues.add(n.toLowerCase());
        list.push({ display: n, value: n });
      }
    });

    // 3. SQLite Control Conversions
    if (SQLITE_CONTROL_CONVERSIONS && SQLITE_CONTROL_CONVERSIONS.length > 0) {
      SQLITE_CONTROL_CONVERSIONS.forEach((c: any) => {
        const conv = (c.conversion || '').trim();
        const scCode = (c.shortcut || '').trim();
        if (scCode.startsWith('__')) return;
        if (conv && !seenValues.has(conv.toLowerCase())) {
          seenValues.add(conv.toLowerCase());
          list.push({ display: conv, value: conv, scCode: scCode || undefined, isShortcut: Boolean(scCode) });
        }
      });
    }

    return list;
  }, [rawItems]);

  const filteredItemSuggestions = useMemo(() => {
    const query = itemInput.trim().toLowerCase();
    if (!query) return [];
    return itemSuggestionsPool
      .filter(item => {
        const matchesName = item.value.toLowerCase().includes(query);
        const matchesSc = item.scCode ? item.scCode.toLowerCase().startsWith(query) || item.scCode.toLowerCase().includes(query) : false;
        return (matchesName || matchesSc) && !currentItems.includes(item.value);
      })
      .slice(0, 8);
  }, [itemInput, itemSuggestionsPool, currentItems]);

  // Reset highlighted suggestion index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredItemSuggestions]);

  // On open or when prefilledItemNames change
  useEffect(() => {
    if (isOpen) {
      if (prefilledItemNames && prefilledItemNames.length > 0) {
        setEditingGroupId(null);
        setGroupNameInput('');
        setTargetColumn('qty');
        setCurrentItems([...prefilledItemNames]);
        setItemInput('');
        setTimeout(() => groupNameRef.current?.focus(), 80);
      } else {
        setEditingGroupId(null);
        setGroupNameInput('');
        setTargetColumn('qty');
        setCurrentItems([]);
        setItemInput('');
        setTimeout(() => groupNameRef.current?.focus(), 80);
      }
    }
  }, [isOpen, prefilledItemNames]);

  // Keyboard shortcut: Esc closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showItemSuggestions) {
          setShowItemSuggestions(false);
          return;
        }
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showItemSuggestions]);

  if (!isOpen) return null;

  const handleAddItem = (nameToAdd?: string) => {
    const raw = (nameToAdd || itemInput).trim();
    if (!raw) return;

    // Use exact same item name resolution as Item Name column (Auto-Convert & Auto-Item logic)
    const prevItem = currentItems.length > 0 ? currentItems[currentItems.length - 1] : undefined;
    const { finalName } = resolveItemNameWithMode({
      rawVal: raw,
      rowIndex: currentItems.length,
      prevItemName: prevItem,
      autoConvert: true,
      autoItem: true,
      simpleMode: false
    });

    const it = (finalName || raw).trim();
    if (!it) return;

    if (currentItems.includes(it)) {
      onToast(`Item "${it}" is already in this group`, 'info');
      setItemInput('');
      setShowItemSuggestions(false);
      return;
    }

    setCurrentItems(prev => [...prev, it]);
    setItemInput('');
    setShowItemSuggestions(false);
    setHighlightedIndex(-1);
    itemInputRef.current?.focus();
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setCurrentItems(prev => prev.filter(i => i !== itemToRemove));
  };

  const handleStartEdit = (g: BillItemGroup) => {
    setEditingGroupId(g.id);
    setGroupNameInput(g.groupName);
    setTargetColumn(g.targetColumn);
    setCurrentItems([...g.itemNames]);
    setItemInput('');
    setShowItemSuggestions(false);
    groupNameRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setGroupNameInput('');
    setTargetColumn('qty');
    setCurrentItems([]);
    setItemInput('');
    setShowItemSuggestions(false);
  };

  const handleSaveCurrentGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const gName = groupNameInput.trim().toUpperCase();
    if (!gName) {
      onToast('Group Name is required', 'warning');
      groupNameRef.current?.focus();
      return;
    }
    if (currentItems.length === 0) {
      onToast('Please add at least 1 item name to the group', 'warning');
      itemInputRef.current?.focus();
      return;
    }

    const colObj = columnOptions.find(c => c.field === targetColumn);
    const targetLabel = colObj ? colObj.label : targetColumn.toUpperCase();

    if (editingGroupId) {
      // Update existing
      const updated = groups.map(g => {
        if (g.id === editingGroupId) {
          return {
            ...g,
            groupName: gName,
            targetColumn,
            targetColumnLabel: targetLabel,
            itemNames: [...currentItems]
          };
        }
        return g;
      });
      onSaveGroups(updated);
      onToast(`Updated Group "${gName}"`, 'success');
      handleCancelEdit();
    } else {
      // Create new
      const newGroup: BillItemGroup = {
        id: `BIG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        groupName: gName,
        targetColumn,
        targetColumnLabel: targetLabel,
        itemNames: [...currentItems]
      };
      onSaveGroups([...groups, newGroup]);
      onToast(`Added Group "${gName}" (${currentItems.length} items)`, 'success');
      handleCancelEdit();
    }
  };

  const handleDeleteGroup = (groupId: string, name: string) => {
    const updated = groups.filter(g => g.id !== groupId);
    onSaveGroups(updated);
    if (editingGroupId === groupId) handleCancelEdit();
    onToast(`Deleted Group "${name}"`, 'info');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="anim-scale-up"
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '620px',
          maxHeight: '92vh',
          backgroundColor: '#0c0e14',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 21, 30, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
              }}
            >
              <Boxes size={20} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  Bill #{billToken} — Custom Item Groups
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '5px'
                  }}
                >
                  Mould Groups
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Group specific bill items to sum values into the Right Summary panel (Ctrl+G).
              </p>
            </div>
          </div>

          <Tooltip title="Close (Esc)" side="bottom">
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 2-Column Clean Workspace */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          
          {/* Left Column: Group Creator / Editor (48% width) */}
          <div
            style={{
              width: '460px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              background: 'rgba(15, 18, 25, 0.4)'
            }}
          >
            {/* Header of Left Form */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <FolderPlus size={15} style={{ color: '#38bdf8' }} />
                {editingGroupId ? 'Edit Group' : 'Create New Group'}
              </span>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Field: Group Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1' }}>
                Group Name / Mould Title
              </label>
              <input
                ref={groupNameRef}
                type="text"
                placeholder="e.g. SPECIAL DOOR, HEAVY SECTION..."
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    itemInputRef.current?.focus();
                  }
                }}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(0, 0, 0, 0.45)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              />
            </div>

            {/* Field: Target Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Columns size={13} style={{ color: '#94a3b8' }} />
                Calculate From Column
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#12151f',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {columnOptions.map(col => (
                  <option key={col.field} value={col.field}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field: Add Items Input (with conversion & autocomplete) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Tag size={13} style={{ color: '#94a3b8' }} />
                  Add Items to Group
                </label>
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <Sparkles size={11} />
                  Auto-Convert ON
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      ref={itemInputRef}
                      type="text"
                      placeholder="Type shortcut or name (e.g. 2, cm, bfp 154)..."
                      value={itemInput}
                      onChange={(e) => {
                        setItemInput(e.target.value);
                        setShowItemSuggestions(true);
                      }}
                      onFocus={() => setShowItemSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (filteredItemSuggestions.length > 0) {
                            setHighlightedIndex(prev => (prev < filteredItemSuggestions.length - 1 ? prev + 1 : 0));
                          }
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (filteredItemSuggestions.length > 0) {
                            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredItemSuggestions.length - 1));
                          }
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (highlightedIndex >= 0 && filteredItemSuggestions[highlightedIndex]) {
                            handleAddItem(filteredItemSuggestions[highlightedIndex].value);
                          } else {
                            handleAddItem();
                          }
                          return;
                        }
                        if (e.key === ' ' && resolvedPreview) {
                          e.preventDefault();
                          setItemInput(resolvedPreview + ' ');
                          return;
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(0, 0, 0, 0.45)',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#38bdf8';
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        // Allow click on suggestion
                        setTimeout(() => setShowItemSuggestions(false), 200);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    style={{
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                    }}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>

                {/* Live Auto-Convert Preview Badge */}
                {resolvedPreview && (
                  <div 
                    style={{ 
                      marginTop: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}
                  >
                    <span>Converts to:</span>
                    <span 
                      style={{ 
                        color: '#38bdf8', 
                        fontWeight: 600, 
                        background: 'rgba(56, 189, 248, 0.1)', 
                        padding: '1px 7px', 
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.2)'
                      }}
                    >
                      {resolvedPreview}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>↵ Enter to add</span>
                  </div>
                )}

                {/* Autocomplete Dropdown */}
                {showItemSuggestions && filteredItemSuggestions.length > 0 && (
                  <div
                    ref={suggestionsBoxRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: '58px',
                      marginTop: '4px',
                      borderRadius: '8px',
                      background: '#131620',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      padding: '4px',
                      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85)',
                      zIndex: 100,
                      maxHeight: '190px',
                      overflowY: 'auto'
                    }}
                  >
                    {filteredItemSuggestions.map((sug, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      return (
                        <div
                          key={sug.value + (sug.scCode || '')}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddItem(sug.value);
                          }}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: isHighlighted ? '#ffffff' : '#e2e8f0',
                            backgroundColor: isHighlighted ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background 0.1s ease'
                          }}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sug.scCode && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#38bdf8',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}
                              >
                                {sug.scCode}
                              </span>
                            )}
                            <span>{sug.value}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            ↵
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items Chips Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
                  Group Items ({currentItems.length})
                </span>
                {currentItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentItems([])}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: '80px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  alignContent: 'flex-start'
                }}
              >
                {currentItems.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                    Type an item name or shortcut above to add items.
                  </div>
                ) : (
                  currentItems.map(it => (
                    <span
                      key={it}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.22)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e0f2fe'
                      }}
                    >
                      {it}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '2px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                        title={`Remove ${it}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Save / Update Button */}
            <button
              type="button"
              onClick={handleSaveCurrentGroup}
              style={{
                height: '38px',
                borderRadius: '8px',
                border: 'none',
                background: editingGroupId 
                  ? 'linear-gradient(135deg, #0284c7, #2563eb)' 
                  : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Check size={16} />
              {editingGroupId ? 'Update Group' : 'Save Group'}
            </button>
          </div>

          {/* Right Column: Defined Groups List (52% width) */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} style={{ color: '#38bdf8' }} />
                Saved Groups for Bill #{billToken}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
              </span>
            </div>

            {groups.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  padding: '30px 20px',
                  color: '#64748b'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}
                >
                  <Boxes size={22} style={{ color: '#64748b' }} />
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#94a3b8' }}>
                  No Item Groups Created Yet
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '320px' }}>
                  Use the left form to build a group, or right-click rows in Left Grid and select <strong>Make Item Group</strong>.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.map((g) => {
                  const isEditingThis = editingGroupId === g.id;
                  const colObj = columnOptions.find(c => c.field === g.targetColumn);
                  const label = colObj ? colObj.label : (g.targetColumnLabel || g.targetColumn);

                  return (
                    <div
                      key={g.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isEditingThis 
                          ? 'rgba(56, 189, 248, 0.08)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isEditingThis 
                          ? '1px solid #38bdf8' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#f8fafc' }}>
                            {g.groupName}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '1px 7px',
                              borderRadius: '4px'
                            }}
                          >
                            {label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <Tooltip title="Edit Group" side="bottom">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(g)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#38bdf8';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#cbd5e1';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }}
                            >
                              <Edit3 size={13} />
                            </button>
                          </Tooltip>

                          <Tooltip title="Delete Group" side="bottom">
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(g.id, g.groupName)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                background: 'rgba(239, 68, 68, 0.06)',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Items Chips Preview */}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {g.itemNames.map(it => (
                          <span
                            key={it}
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sleek Bottom Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 21, 30, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <Sparkles size={14} style={{ color: '#38bdf8' }} />
            <span>Groups are active for this bill only. Press <strong>Ctrl+G</strong> on the grid to calculate.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: '34px',
              padding: '0 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
