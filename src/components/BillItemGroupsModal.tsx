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
  HelpCircle,
  FolderPlus
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

  const groupNameRef = useRef<HTMLInputElement | null>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

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

  // Live Auto-Conversion preview as user types (identical to Item Name column)
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

  // Known item pool for autocomplete (from shortcuts, raw items in current bill + control panel conversions)
  const itemSuggestionsPool = useMemo(() => {
    const list: { display: string; value: string; isShortcut?: boolean }[] = [];
    const seenValues = new Set<string>();

    // 1. Active Shortcuts from shortcut rules (e.g. 2 -> 1/2 D, bfp -> B.F.P)
    const shortcuts = getActiveShortcuts();
    if (shortcuts && shortcuts.length > 0) {
      shortcuts.forEach(sc => {
        const conv = (sc.conversion || '').trim();
        const scCode = (sc.shortcut || '').trim();
        if (conv && !seenValues.has(conv.toLowerCase())) {
          seenValues.add(conv.toLowerCase());
          if (scCode) {
            list.push({ display: `${scCode} ➔ ${conv}`, value: conv, isShortcut: true });
          } else {
            list.push({ display: conv, value: conv });
          }
        }
      });
    }

    // 2. Raw Items currently present in this bill
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
        if (conv && !seenValues.has(conv.toLowerCase())) {
          seenValues.add(conv.toLowerCase());
          list.push({ display: conv, value: conv });
        }
      });
    }

    return list;
  }, [rawItems]);

  const filteredItemSuggestions = useMemo(() => {
    const query = itemInput.trim().toLowerCase();
    if (!query) return [];
    return itemSuggestionsPool
      .filter(item => 
        (item.display.toLowerCase().includes(query) || item.value.toLowerCase().includes(query)) &&
        !currentItems.includes(item.value)
      )
      .slice(0, 10);
  }, [itemInput, itemSuggestionsPool, currentItems]);

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

  // Keyboard shortcut: Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      return;
    }
    setCurrentItems(prev => [...prev, it]);
    setItemInput('');
    setShowItemSuggestions(false);
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
    groupNameRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setGroupNameInput('');
    setTargetColumn('qty');
    setCurrentItems([]);
    setItemInput('');
  };

  const handleSaveCurrentGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const gName = groupNameInput.trim().toUpperCase();
    if (!gName) {
      onToast('Group / Mould Name required', 'warning');
      groupNameRef.current?.focus();
      return;
    }
    if (currentItems.length === 0) {
      onToast('At least 1 item name must be added to the group', 'warning');
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
      onToast(`Updated Group "${gName}"!`, 'success');
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
      onToast(`Added Group "${gName}" (${currentItems.length} items)!`, 'success');
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
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="anim-scale-up"
        style={{
          width: '780px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #27272a',
            backgroundColor: '#0c0a09',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Boxes size={18} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.2px' }}>
                  Bill #{billToken} — Item Groups (Mould Groups)
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    padding: '1px 7px',
                    borderRadius: '4px'
                  }}
                >
                  Active Bill Only
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a1a1aa' }}>
                Is bill ke specific items ka group banayein. Ctrl+G par in items ki value chune hue column se sum hokar Right Panel me aayegi.
              </p>
            </div>
          </div>

          <Tooltip title="Close (Esc)" side="bottom">
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
                color: '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={14} style={{ color: '#ffffff' }} />
            </button>
          </Tooltip>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card: Add / Edit Form */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: '#121215',
              border: '1px solid #27272a',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderPlus size={14} style={{ color: '#ffffff' }} />
                {editingGroupId ? 'Edit Item Group' : 'Create New Item Group'}
              </span>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Inputs Row: Group Name + Target Column */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 500, color: '#a1a1aa' }}>
                  Group Name / Mould Name (Summary me kya dikhega)
                </label>
                <input
                  ref={groupNameRef}
                  type="text"
                  placeholder="e.g. SPECIAL DOOR FRAME, HEAVY SECTION..."
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      itemInputRef.current?.focus();
                    }
                  }}
                  style={{
                    height: '32px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    background: '#09090b',
                    color: '#f4f4f5',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 500, color: '#a1a1aa' }}>
                  Calculate From Column (Kis column ka sum lena hai)
                </label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    background: '#09090b',
                    color: '#ffffff',
                    fontSize: '12.5px',
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
            </div>

            {/* Add Items Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 500, color: '#a1a1aa' }}>
                  Add Item Names into this Group (Fast entry with conversion autocomplete)
                </label>
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} style={{ color: '#10b981' }} />
                  Conversion Mode Active
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={itemInputRef}
                    type="text"
                    placeholder="Type Item Name or Code (e.g. 2, cm, bfp, 201) and press Enter..."
                    value={itemInput}
                    onChange={(e) => {
                      setItemInput(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' && resolvedPreview) {
                        e.preventDefault();
                        setItemInput(resolvedPreview + ' ');
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredItemSuggestions.length > 0 && (
                          itemInput.trim().toLowerCase() === filteredItemSuggestions[0].value.toLowerCase() ||
                          filteredItemSuggestions[0].display.toLowerCase().startsWith(itemInput.trim().toLowerCase() + ' ')
                        )) {
                          handleAddItem(filteredItemSuggestions[0].value);
                        } else {
                          handleAddItem();
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                      background: '#09090b',
                      color: '#f4f4f5',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />

                  {resolvedPreview && (
                    <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>Auto-Converts:</span>
                      <strong style={{ color: '#ffffff', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                        {resolvedPreview}
                      </strong>
                      <span style={{ color: '#71717a', fontSize: '11px' }}>(Press Enter to add, or Space to expand)</span>
                    </div>
                  )}

                  {/* Autocomplete Dropdown */}
                  {showItemSuggestions && filteredItemSuggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        borderRadius: '6px',
                        background: '#121215',
                        border: '1px solid #27272a',
                        padding: '4px',
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.9)',
                        zIndex: 100,
                        maxHeight: '160px',
                        overflowY: 'auto'
                      }}
                    >
                      {filteredItemSuggestions.map((sug) => (
                        <div
                          key={sug.display}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddItem(sug.value);
                          }}
                          style={{
                            padding: '5px 8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#f4f4f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#27272a';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <span>{sug.display}</span>
                          {sug.isShortcut ? (
                            <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                              Shortcut
                            </span>
                          ) : (
                            <span style={{ fontSize: '10.5px', color: '#71717a' }}>+ Add</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} style={{ color: '#ffffff' }} />
                  Add
                </button>
              </div>

              {/* Chips of added items */}
              <div
                style={{
                  minHeight: '36px',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  alignItems: 'center'
                }}
              >
                {currentItems.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic' }}>
                    No items added yet. Type above to add items to this group.
                  </span>
                ) : (
                  currentItems.map(it => (
                    <span
                      key={it}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        color: '#f4f4f5'
                      }}
                    >
                      {it}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={`Remove ${it}`}
                      >
                        <X size={11} style={{ color: '#ffffff' }} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleSaveCurrentGroup}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#09090b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={14} style={{ color: '#09090b' }} />
                {editingGroupId ? 'Update Group' : 'Save Group'}
              </button>
            </div>
          </div>

          {/* List of Defined Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                Defined Groups for Bill #{billToken} ({groups.length})
              </span>
            </div>

            {groups.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '1px dashed #27272a',
                  color: '#71717a',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Boxes size={28} style={{ color: '#ffffff', opacity: 0.5 }} />
                <span>Is bill ke liye abhi koi item group nahi bana hai.</span>
                <span style={{ fontSize: '11.5px', color: '#52525b' }}>
                  Upar form se group banayein, ya Left Grid me items select karke right click karein aur <strong>"Make Item Group"</strong> chunein.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groups.map((g) => {
                  const isEditingThis = editingGroupId === g.id;
                  const colObj = columnOptions.find(c => c.field === g.targetColumn);
                  const label = colObj ? colObj.label : (g.targetColumnLabel || g.targetColumn);

                  return (
                    <div
                      key={g.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isEditingThis ? 'rgba(56, 189, 248, 0.08)' : '#121215',
                        border: isEditingThis ? '1px solid #38bdf8' : '1px solid #27272a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#f4f4f5' }}>
                            {g.groupName}
                          </span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: '#ffffff',
                              background: '#27272a',
                              border: '1px solid #3f3f46',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            Sum from: {label}
                          </span>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>
                            ({g.itemNames.length} items)
                          </span>
                        </div>

                        {/* Chips preview */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {g.itemNames.map(it => (
                            <span
                              key={it}
                              style={{
                                fontSize: '10.5px',
                                color: '#a1a1aa',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '1px 5px',
                                borderRadius: '3px'
                              }}
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <Tooltip title="Edit Group" side="bottom">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(g)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #27272a',
                              background: '#18181b',
                              color: '#f4f4f5',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit3 size={12} style={{ color: '#ffffff' }} />
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
                              border: '1px solid #27272a',
                              background: '#18181b',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={12} style={{ color: '#ef4444' }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #27272a',
            backgroundColor: '#0c0a09',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#71717a' }}>
            <Sparkles size={13} style={{ color: '#ffffff' }} />
            <span>Ctrl+G dabane par in groups ke items right summary panel me calculate ho jayenge.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: '32px',
              padding: '0 16px',
              borderRadius: '6px',
              border: '1px solid #27272a',
              background: '#18181b',
              color: '#f4f4f5',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
