import React, { useState, useEffect, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { Plus, Check, RotateCcw, Layers, Tag, FolderPlus, Folder, Trash2, Edit2, X, ArrowRightLeft, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';
import UnsavedChangesModal from './UnsavedChangesModal';
import { Select as ShadcnSelect, Tooltip, toast } from './ui/shadcn';
import { useItemMode } from '../context/ItemModeContext';
import { resolveItemNameWithMode } from '../utils/itemExpansion';

const DEFAULT_MAIN_COLS = { srNo: 35, mainGroup: 140, groupName: 200, sumCol: 85, items: 50 };
const DEFAULT_SUB_COLS  = { srNo: 40, itemName: 320 };

export interface SkipItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const SkipItemNameTab: React.FC<SkipItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const { autoConvert, autoItem, simpleMode, handleToggle } = useItemMode();

  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups,  setSubGroups]  = useState<SkipSubGroupSeed[]>([]);
  const [skipItems,  setSkipItems]  = useState<SkipItemSeed[]>([]);

  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [editingGroupId,      setEditingGroupId]       = useState<string | null>(null);
  const [selectedItemId,      setSelectedItemId]       = useState<string | null>(null);
  const [editingItemId,       setEditingItemId]        = useState<string | null>(null);
  const [internalSearch,      setInternalSearch]       = useState('');

  // Main Group Management Modal State
  const [isMainGroupModalOpen, setIsMainGroupModalOpen] = useState(false);
  const [newMainGroupName, setNewMainGroupName] = useState('');
  const [editingMainGroupId, setEditingMainGroupId] = useState<string | null>(null);
  const [editingMainGroupName, setEditingMainGroupName] = useState('');

  // Delete Confirmation Modal State (UnsavedChangesModal style)
  const [itemToDelete, setItemToDelete] = useState<SkipItemSeed | null>(null);
  const [subGroupToDelete, setSubGroupToDelete] = useState<SkipSubGroupSeed | null>(null);
  const [mainGroupToDelete, setMainGroupToDelete] = useState<SkipMainGroupSeed | null>(null);

  // Active Panel Navigation (subgroups or items)
  const [activePanel, setActivePanel] = useState<'subgroups' | 'items'>('items');

  const itemSearch = externalSearch !== undefined ? externalSearch : internalSearch;

  /* ─── seed / restore ─── */
  const purgeAndLoadPristineBackup = () => {
    try {
      ['billapp_skip_items','billapp_skip_sub_groups','billapp_skip_main_groups',
       'si_main_groups','si_sub_groups','si_items','si_skip_items']
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
    setSubGroups(SQLITE_SKIP_SUB_GROUPS);
    setSkipItems(SQLITE_SKIP_ITEMS);
    try {
      localStorage.setItem('billapp_skip_main_groups', JSON.stringify(SQLITE_SKIP_MAIN_GROUPS));
      localStorage.setItem('billapp_skip_sub_groups',  JSON.stringify(SQLITE_SKIP_SUB_GROUPS));
      localStorage.setItem('billapp_skip_items',       JSON.stringify(SQLITE_SKIP_ITEMS));
      localStorage.setItem('billapp_skip_version_v5',  'true');
    } catch {}
    if (SQLITE_SKIP_SUB_GROUPS.length > 0) setSelectedMainGroupId(SQLITE_SKIP_SUB_GROUPS[0].id);
    macAudio.playPop();
  };

  useEffect(() => {
    try {
      if (!localStorage.getItem('billapp_skip_version_v5')) { purgeAndLoadPristineBackup(); return; }
      const sm = localStorage.getItem('billapp_skip_main_groups');
      const ss = localStorage.getItem('billapp_skip_sub_groups');
      const si = localStorage.getItem('billapp_skip_items');
      if (sm && ss && si) {
        setMainGroups(JSON.parse(sm));
        let ls: SkipSubGroupSeed[] = JSON.parse(ss);
        let items: SkipItemSeed[] = JSON.parse(si);

        // One-time migration guard: only populate UV-(Digital) seeds once, never re-add if user deleted them
        const hasMigratedUv = localStorage.getItem('billapp_skip_uv_migrated_v1');
        if (!hasMigratedUv) {
          // Ensure UV-(Digital) subgroup exists
          let uvSub = ls.find(s => s.groupName?.trim().toLowerCase() === 'uv-(digital)');
          if (!uvSub) {
            uvSub = {
              id: 'sg-35',
              mainGroupId: 'mg-3',
              mainGroup: 'Digital',
              groupName: 'UV-(Digital)',
              sumColumn: 'QTY'
            };
            ls.push(uvSub);
            try { localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(ls)); } catch {}
          }

          // Ensure UV 2000 to UV 2044 items exist initially
          let itemsUpdated = false;
          const targetSubGroupId = uvSub.id;
          for (let n = 2000; n <= 2044; n++) {
            const prefix = `UV ${n}`;
            const exists = items.some(
              it => it.itemPrefix?.trim().toLowerCase() === prefix.toLowerCase() &&
                    (it.subGroupId === targetSubGroupId || it.groupName?.trim().toLowerCase() === 'uv-(digital)')
            );
            if (!exists) {
              items.push({
                id: `si-uv-${n}`,
                subGroupId: targetSubGroupId,
                mainGroup: uvSub.mainGroup || 'Digital',
                groupName: uvSub.groupName || 'UV-(Digital)',
                itemPrefix: prefix
              });
              itemsUpdated = true;
            }
          }

          if (itemsUpdated) {
            try { localStorage.setItem('billapp_skip_items', JSON.stringify(items)); } catch {}
          }
          try { localStorage.setItem('billapp_skip_uv_migrated_v1', 'true'); } catch {}
        }

        setSubGroups(ls);
        setSkipItems(items);
        if (ls.length > 0) setSelectedMainGroupId(prev => prev || ls[0].id);
      } else purgeAndLoadPristineBackup();
    } catch { purgeAndLoadPristineBackup(); }
  }, []);

  const saveMainGroups = (d: SkipMainGroupSeed[]) => {
    setMainGroups(d);
    try { localStorage.setItem('billapp_skip_main_groups', JSON.stringify(d)); } catch {}
  };

  const handleAddMainGroup = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (mainGroups.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      macAudio.playPop();
      toast.warning('Duplicate Group', `Main Group "${trimmed}" already exists!`);
      return null;
    }
    const newId = 'mg-' + Date.now();
    const next = [...mainGroups, { id: newId, name: trimmed }];
    saveMainGroups(next);
    macAudio.playSuccess();
    return newId;
  };

  const handleRenameMainGroup = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const oldMg = mainGroups.find(m => m.id === id);
    if (!oldMg || oldMg.name === trimmed) return;
    const oldName = oldMg.name;

    // Update mainGroups
    const nextMg = mainGroups.map(m => m.id === id ? { ...m, name: trimmed } : m);
    saveMainGroups(nextMg);

    // Cascade update subGroups
    const nextSg = subGroups.map(sg => {
      if (sg.mainGroupId === id || sg.mainGroup === oldName) {
        return { ...sg, mainGroup: trimmed, mainGroupId: id };
      }
      return sg;
    });
    saveSubGroups(nextSg);

    // Cascade update skipItems
    const nextItems = skipItems.map(it => {
      if (it.mainGroup === oldName) {
        return { ...it, mainGroup: trimmed };
      }
      return it;
    });
    saveSkipItems(nextItems);

    macAudio.playSuccess();
  };

  const promptDeleteMainGroup = (mg: SkipMainGroupSeed) => {
    macAudio.playPop();
    setMainGroupToDelete(mg);
  };

  const confirmDeleteMainGroup = () => {
    if (!mainGroupToDelete) return;
    const id = mainGroupToDelete.id;
    const target = mainGroupToDelete;
    const attachedSg = subGroups.filter(s => s.mainGroupId === id || s.mainGroup === target.name);
    if (attachedSg.length > 0) {
      const fallbackMg = mainGroups.find(m => m.id !== id)?.name || 'General';
      const fallbackId = mainGroups.find(m => m.id !== id)?.id || 'mg-1';
      const nextSg = subGroups.map(s => (s.mainGroupId === id || s.mainGroup === target.name) ? { ...s, mainGroup: fallbackMg, mainGroupId: fallbackId } : s);
      saveSubGroups(nextSg);
    }
    const nextMg = mainGroups.filter(m => m.id !== id);
    saveMainGroups(nextMg);
    macAudio.playSuccess();
    setMainGroupToDelete(null);
  };

  const saveSubGroups = (d: SkipSubGroupSeed[]) => {
    setSubGroups(d);
    try { localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(d)); } catch {}
  };
  const saveSkipItems = (updaterOrList: SkipItemSeed[] | ((prev: SkipItemSeed[]) => SkipItemSeed[])) => {
    setSkipItems(prev => {
      const next = typeof updaterOrList === 'function' ? updaterOrList(prev) : updaterOrList;
      try { localStorage.setItem('billapp_skip_items', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  /* ─── group handlers ─── */
  const handleSubGroupChange = (id: string, field: keyof SkipSubGroupSeed, value: any) => {
    saveSubGroups(subGroups.map(sg => {
      if (sg.id !== id) return sg;
      const next: SkipSubGroupSeed = { ...sg, [field]: value };
      if (field === 'mainGroup') {
        const mg = mainGroups.find(m => m.name === value || m.id === value);
        if (mg) next.mainGroupId = mg.id;
      }
      return next;
    }));
  };

  const handleAddSubGroup = () => {
    macAudio.playClick();
    const newId = 'sg-' + Date.now();
    const mg    = mainGroups[0];
    const newSg: SkipSubGroupSeed = {
      id: newId, mainGroupId: mg?.id || 'mg-1',
      mainGroup: mg?.name || 'General', groupName: 'NEW-GROUP', sumColumn: 'QTY'
    };
    const next = [newSg, ...subGroups];
    saveSubGroups(next);
    setSelectedMainGroupId(newId);
    setEditingGroupId(newId);
  };

  const promptDeleteSubGroup = (sg: SkipSubGroupSeed) => {
    macAudio.playPop();
    setSubGroupToDelete(sg);
  };

  const confirmDeleteSubGroup = () => {
    if (!subGroupToDelete) return;
    const delId = subGroupToDelete.id;

    const delIdx = subGroups.findIndex(s => s.id === delId);
    let nextActiveId: string | null = null;
    if (delIdx !== -1) {
      if (delIdx + 1 < subGroups.length) {
        nextActiveId = subGroups[delIdx + 1].id;
      } else if (delIdx - 1 >= 0) {
        nextActiveId = subGroups[delIdx - 1].id;
      }
    }

    const nextSubGroups = subGroups.filter(s => s.id !== delId);
    const nextItems = skipItems.filter(si => si.subGroupId !== delId && si.groupName !== subGroupToDelete.groupName);
    saveSubGroups(nextSubGroups);
    saveSkipItems(nextItems);
    macAudio.playSuccess();

    setSelectedMainGroupId(nextActiveId);
    setEditingGroupId(null);
    setSelectedItemId(null);
    setSubGroupToDelete(null);
  };

  const handleDeleteSubGroup = (id: string) => {
    const sg = subGroups.find(s => s.id === id);
    if (sg) promptDeleteSubGroup(sg);
  };

  /* ─── item handlers ─── */
  const handleItemChange = (id: string, v: string) =>
    saveSkipItems(prev => prev.map(si => si.id === id ? { ...si, itemPrefix: v } : si));

  const lastAddRef = useRef(0);

  const commitItemPrefix = (id: string, rawVal: string, idx: number) => {
    if (!rawVal || !rawVal.trim()) return rawVal;
    const prevItemPrefix = idx > 0 ? filteredItems[idx - 1]?.itemPrefix : undefined;
    const { finalName } = resolveItemNameWithMode({
      rawVal,
      rowIndex: idx,
      prevItemName: prevItemPrefix,
      autoConvert,
      autoItem,
      simpleMode
    });
    const toSave = finalName || rawVal;
    handleItemChange(id, toSave);
    return toSave;
  };

  const handleAddItem = () => {
    const now = Date.now();
    if (now - lastAddRef.current < 400) return; // Prevent double insertion on single Insert press
    lastAddRef.current = now;

    if (!selectedMainGroupId) return;
    macAudio.playClick();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const newId  = 'si-' + Date.now();
    const newItem: SkipItemSeed = {
      id: newId, subGroupId: selectedMainGroupId,
      mainGroup: curSub?.mainGroup || '', groupName: curSub?.groupName || '', itemPrefix: ''
    };
    saveSkipItems(prev => {
      if (selectedItemId) {
        const selIdx = prev.findIndex(si => si.id === selectedItemId);
        if (selIdx !== -1) {
          return [...prev.slice(0, selIdx + 1), newItem, ...prev.slice(selIdx + 1)];
        }
      }
      return [...prev, newItem];
    });
    setSelectedItemId(newId);
    setEditingItemId(newId);
  };

  const promptDeleteItem = (item: SkipItemSeed) => {
    macAudio.playPop();
    setItemToDelete(item);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    const delId = itemToDelete.id;

    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const currentGroupItems = curSub
      ? skipItems.filter(si =>
          si.subGroupId === curSub.id ||
          (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup))
        )
      : [];

    const delIdx = currentGroupItems.findIndex(si => si.id === delId);

    // Calculate next active item so cursor/selection jumps to the next row
    let nextActiveId: string | null = null;
    if (delIdx !== -1) {
      if (delIdx + 1 < currentGroupItems.length) {
        nextActiveId = currentGroupItems[delIdx + 1].id;
      } else if (delIdx - 1 >= 0) {
        nextActiveId = currentGroupItems[delIdx - 1].id;
      }
    }

    const nextItems = skipItems.filter(si => si.id !== delId);
    saveSkipItems(nextItems);
    macAudio.playSuccess();

    // Jump cursor to next row!
    setSelectedItemId(nextActiveId);
    setEditingItemId(null);
    setItemToDelete(null);
  };

  const handleDeleteItem = (id: string) => {
    const item = skipItems.find(si => si.id === id);
    if (item) promptDeleteItem(item);
  };

  const handleItemPaste = (e: React.ClipboardEvent) => {
    if (!selectedMainGroupId) return;
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\n') && !text.includes('\t'))) return;
    e.preventDefault();
    macAudio.playSuccess();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const newItems: SkipItemSeed[] = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l).map((line, idx) => ({
      id: 'si-' + (Date.now() + idx),
      subGroupId: selectedMainGroupId,
      mainGroup:  curSub?.mainGroup || '',
      groupName:  curSub?.groupName || '',
      itemPrefix: line.split('\t')[0].trim()
    }));
    if (newItems.length > 0) saveSkipItems([...newItems, ...skipItems]);
  };

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = () => {
        if (selectedMainGroupId) handleAddItem();
        else handleAddSubGroup();
      };
    }
  }, [onAddRef, selectedMainGroupId, subGroups, skipItems, mainGroups]);

  /* ─────────────────────────────────────────────────────────
     KEYBOARD HANDLER
     Rules:
     • When inside an input/select:
         Enter / ArrowRight  → move to NEXT input in same row
         ArrowLeft           → move to PREV input in same row
         Enter on LAST input → save (exit edit mode)
         Escape              → cancel edit
     • When NOT in input:
         Insert              → add new row  ✅ FIXED
         Ctrl+Enter          → enter edit mode on selected row
         Delete              → delete selected row
         Escape              → deselect
  ───────────────────────────────────────────────────────── */
  /* ─── derived ─── */
  const filteredSubGroups = subGroups.filter(sg => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    return (sg.groupName||'').toLowerCase().includes(q) ||
      (sg.mainGroup||'').toLowerCase().includes(q) ||
      skipItems.some(si =>
        (si.subGroupId === sg.id ||
         (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))) &&
        (si.itemPrefix||'').toLowerCase().includes(q)
      );
  });

  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub
    ? skipItems.filter(si =>
        si.subGroupId === curSub.id ||
        (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup))
      )
    : [];
  const filteredItems = itemsForSelectedGroup.filter(si =>
    si.itemPrefix.toLowerCase().includes(itemSearch.toLowerCase())
  );

  /* ─────────────────────────────────────────────────────────
     KEYBOARD HANDLER: UP, DOWN, LEFT, RIGHT, ENTER, ESC, DEL, INSERT
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target  = e.target as HTMLElement;
      const tagName = target.tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);

      if (isInput) {
        /* ── navigation inside a row (Edit Mode) ── */
        if (e.key === 'Enter' || (e.key === 'ArrowRight' && !e.shiftKey)) {
          const row = target.closest('tr');
          if (!row) return;
          const inputs = Array.from(
            row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
              'input:not([disabled]), select:not([disabled])'
            )
          );
          const currIdx = inputs.indexOf(target as any);
          if (currIdx >= 0 && currIdx < inputs.length - 1) {
            e.preventDefault();
            macAudio.playHover();
            inputs[currIdx + 1].focus();
            if ((inputs[currIdx + 1] as HTMLInputElement).select)
              (inputs[currIdx + 1] as HTMLInputElement).select?.();
            return;
          }
          // last input in row → save & exit edit mode on Enter
          if (e.key === 'Enter') {
            e.preventDefault();
            macAudio.playSuccess();
            if (editingItemId) {
              const itemIdx = filteredItems.findIndex(it => it.id === editingItemId);
              if (itemIdx !== -1) {
                const currentVal = (target as HTMLInputElement).value ?? filteredItems[itemIdx].itemPrefix;
                commitItemPrefix(editingItemId, currentVal, itemIdx);
              }
            }
            setEditingItemId(null);
            setEditingGroupId(null);
            return;
          }
        }

        if (e.key === 'ArrowLeft') {
          const row = target.closest('tr');
          if (!row) return;
          const inputs = Array.from(
            row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
              'input:not([disabled]), select:not([disabled])'
            )
          );
          const currIdx = inputs.indexOf(target as any);
          if (currIdx > 0) {
            e.preventDefault();
            macAudio.playHover();
            inputs[currIdx - 1].focus();
            if ((inputs[currIdx - 1] as HTMLInputElement).select)
              (inputs[currIdx - 1] as HTMLInputElement).select?.();
          }
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingGroupId(null);
          setEditingItemId(null);
          return;
        }

        return; // don't handle other keys while typing
      }

      /* ── global (not in input) ── */

      // ArrowDown — move down row
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activePanel === 'items' || selectedItemId) {
          setActivePanel('items');
          const idx = filteredItems.findIndex(si => si.id === selectedItemId);
          if (idx === -1) {
            if (filteredItems.length > 0) {
              setSelectedItemId(filteredItems[0].id);
              macAudio.playHover();
            }
          } else if (idx < filteredItems.length - 1) {
            setSelectedItemId(filteredItems[idx + 1].id);
            macAudio.playHover();
          }
        } else {
          setActivePanel('subgroups');
          const idx = filteredSubGroups.findIndex(s => s.id === selectedMainGroupId);
          if (idx === -1) {
            if (filteredSubGroups.length > 0) {
              setSelectedMainGroupId(filteredSubGroups[0].id);
              macAudio.playHover();
            }
          } else if (idx < filteredSubGroups.length - 1) {
            setSelectedMainGroupId(filteredSubGroups[idx + 1].id);
            macAudio.playHover();
          }
        }
        return;
      }

      // ArrowUp — move up row
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activePanel === 'items' || selectedItemId) {
          setActivePanel('items');
          const idx = filteredItems.findIndex(si => si.id === selectedItemId);
          if (idx > 0) {
            setSelectedItemId(filteredItems[idx - 1].id);
            macAudio.playHover();
          } else if (idx === -1 && filteredItems.length > 0) {
            setSelectedItemId(filteredItems[0].id);
            macAudio.playHover();
          }
        } else {
          setActivePanel('subgroups');
          const idx = filteredSubGroups.findIndex(s => s.id === selectedMainGroupId);
          if (idx > 0) {
            setSelectedMainGroupId(filteredSubGroups[idx - 1].id);
            macAudio.playHover();
          } else if (idx === -1 && filteredSubGroups.length > 0) {
            setSelectedMainGroupId(filteredSubGroups[0].id);
            macAudio.playHover();
          }
        }
        return;
      }

      // ArrowRight — switch from subgroups table to items table
      if (e.key === 'ArrowRight') {
        if (activePanel === 'subgroups') {
          e.preventDefault();
          setActivePanel('items');
          if (filteredItems.length > 0) {
            setSelectedItemId(filteredItems[0].id);
            macAudio.playHover();
          }
          return;
        }
      }

      // ArrowLeft — switch from items table to subgroups table
      if (e.key === 'ArrowLeft') {
        if (activePanel === 'items') {
          e.preventDefault();
          setActivePanel('subgroups');
          setSelectedItemId(null);
          macAudio.playHover();
          return;
        }
      }

      // Ctrl+Enter — enter edit mode on selected row
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if ((activePanel === 'items' || selectedItemId) && selectedItemId) {
          macAudio.playClick();
          setEditingItemId(selectedItemId);
        } else if (selectedMainGroupId) {
          macAudio.playClick();
          setEditingGroupId(selectedMainGroupId);
        }
        return;
      }

      // Escape — deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingGroupId(null);
        setEditingItemId(null);
        setSelectedItemId(null);
        return;
      }

      // INSERT → add new row
      if (e.key === 'Insert') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (activePanel === 'items' && selectedMainGroupId) handleAddItem();
        else handleAddSubGroup();
        return;
      }

      // Delete → delete selected row (triggers confirmation modal)
      if (e.key === 'Delete') {
        e.preventDefault();
        if (itemToDelete || subGroupToDelete || isMainGroupModalOpen) return;
        if (selectedItemId) {
          const it = skipItems.find(s => s.id === selectedItemId);
          if (it) promptDeleteItem(it);
        } else if (selectedMainGroupId) {
          const sg = subGroups.find(s => s.id === selectedMainGroupId);
          if (sg) promptDeleteSubGroup(sg);
        }
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedMainGroupId, editingGroupId,
    selectedItemId, editingItemId,
    subGroups, skipItems, mainGroups,
    itemToDelete, subGroupToDelete, isMainGroupModalOpen,
    filteredItems, filteredSubGroups, activePanel
  ]);

  /* ─── shared styles — clean shadcn zinc ─── */
  const cellInput: React.CSSProperties = {
    width: '100%',
    background: '#27272a',
    border: '1px solid #3f3f46',
    outline: 'none',
    color: '#f4f4f5',
    fontSize: '12px',
    padding: '3px 8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '4px',
    fontWeight: 500
  };
  const cellText: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    fontWeight: 500
  };
  const selectSt: React.CSSProperties = {
    width: '100%',
    background: '#27272a',
    border: '1px solid #3f3f46',
    color: '#f4f4f5',
    fontSize: '11px',
    fontWeight: 500,
    borderRadius: '4px',
    padding: '2px 4px',
    outline: 'none'
  };


  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{
      flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr',
      gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden'
    }}>

      {/* ══════════════════════════════════════════
          LEFT — Sub Groups Configuration Table
      ══════════════════════════════════════════ */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '8px', border: '1px solid #27272a', background: '#09090b', overflow: 'hidden' }}
      >
        {/* Header — clean shadcn zinc */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', background: '#18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
            Sub Groups Configuration ({subGroups.length})
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Tooltip title="Add or Manage Main Groups" side="bottom">
              <button
                type="button"
                onClick={() => setIsMainGroupModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  height: '28px', padding: '0 9px', borderRadius: '5px',
                  background: 'transparent', border: '1px solid #27272a',
                  color: '#f4f4f5', fontSize: '11.5px', fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={13} color="#a1a1aa" />
                <span>Main Groups ({mainGroups.length})</span>
              </button>
            </Tooltip>

            <Tooltip title="Reset to Backup Data" side="bottom">
              <button
                type="button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  height: '28px', padding: '0 8px', borderRadius: '5px',
                  background: 'transparent', border: '1px solid #27272a',
                  color: '#ef4444', fontSize: '11px', fontWeight: 500,
                  cursor: 'pointer'
                }}
                onClick={purgeAndLoadPristineBackup}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </Tooltip>

            <Tooltip title="Add New Group (Insert)" side="bottom">
              <button
                type="button"
                onClick={handleAddSubGroup}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  height: '28px', padding: '0 10px', borderRadius: '5px',
                  background: '#f4f4f5', border: 'none',
                  color: '#09090b', fontSize: '11.5px', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Add Group
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
              <tr style={{ borderBottom: '1px solid #27272a' }}>
                <th style={{ width: DEFAULT_MAIN_COLS.srNo, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>#</th>
                <th style={{ width: DEFAULT_MAIN_COLS.mainGroup, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>MAIN GROUP</th>
                <th style={{ width: DEFAULT_MAIN_COLS.groupName, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>GROUP NAME</th>
                <th style={{ width: DEFAULT_MAIN_COLS.sumCol, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SUM COL</th>
                <th style={{ width: DEFAULT_MAIN_COLS.items, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ITEMS</th>
                <th style={{ width: 65, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubGroups.map((sg, idx) => {
                const isSelected = selectedMainGroupId === sg.id;
                const isEditing  = editingGroupId      === sg.id;
                const itemCount  = skipItems.filter(si =>
                  si.subGroupId === sg.id ||
                  (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))
                ).length;

                return (
                  <tr
                    key={sg.id}
                    ref={el => {
                      if (isSelected && el) el.scrollIntoView({ block: 'nearest' });
                    }}
                    style={{
                      height: '28px',
                      borderBottom: '1px solid #27272a',
                      background: isSelected ? '#1c1c1f' : idx % 2 === 0 ? 'rgba(24,24,27,0.5)' : 'transparent',
                      outline: isSelected ? '1px solid #3f3f46' : 'none',
                      outlineOffset: '-1px',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease'
                    }}
                    onClick={() => {
                      setActivePanel('subgroups');
                      setSelectedMainGroupId(sg.id);
                      setSelectedItemId(null);
                    }}
                    onDoubleClick={() => setEditingGroupId(sg.id)}
                  >
                    <td style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', userSelect: 'none', padding: '4px 6px' }}>
                      {idx + 1}
                    </td>


                    {/* MAIN GROUP — select (navigable with Enter/Arrow) */}
                    <td style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <ShadcnSelect

                          style={{ ...selectSt, height: '24px', fontSize: '11px' }}
                          value={sg.mainGroup}
                          onChange={(e: any) => {
                            if (e.target.value === '__ADD_NEW__') {
                              const name = prompt('Enter new Main Group name:');
                              if (name && name.trim()) {
                                const newId = handleAddMainGroup(name.trim());
                                if (newId) {
                                  handleSubGroupChange(sg.id, 'mainGroup', name.trim());
                                }
                              }
                            } else {
                              handleSubGroupChange(sg.id, 'mainGroup', e.target.value);
                            }
                          }}
                        >
                          {mainGroups.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                          <option value="__ADD_NEW__">
                            + Add New Main Group...
                          </option>
                        </ShadcnSelect>
                      ) : (
                        <span style={{ ...cellText, fontWeight: 600 }}>{sg.mainGroup}</span>
                      )}
                    </td>

                    {/* GROUP NAME — text input */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <input
                          style={{ ...cellInput, fontWeight: 700 }}
                          value={sg.groupName}
                          onChange={e => handleSubGroupChange(sg.id, 'groupName', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{ ...cellText, fontWeight: 700 }}>{sg.groupName}</span>
                      )}
                    </td>

                    {/* SUM COL — select */}
                    <td style={{ padding: '2px', textAlign: 'center' }}>
                      {isEditing ? (
                        <ShadcnSelect
                          style={{ ...selectSt, height: '24px', fontSize: '11px', textAlign: 'center' }}
                          value={sg.sumColumn}
                          onChange={(e: any) => handleSubGroupChange(sg.id, 'sumColumn', e.target.value)}
                        >
                          <option value="QTY">QTY</option>
                          <option value="U CAP">U CAP</option>
                          <option value="L CAP">L CAP</option>
                        </ShadcnSelect>
                      ) : (
                        <span style={{ ...cellText, textAlign: 'center' }}>{sg.sumColumn}</span>
                      )}
                    </td>

                    {/* ITEM COUNT */}
                    <td style={{ textAlign: 'center', color: '#ffffff', fontWeight: 600, fontSize: '11px' }}>
                      {itemCount > 0 ? (
                        <span style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontSize: '9.5px', fontWeight: 600 }}>
                          {itemCount}
                        </span>
                      ) : <span style={{ color: '#475569', fontSize: '9.5px' }}>0</span>}
                    </td>

                    {/* ACTION */}
                    <td style={{ textAlign: 'center', padding: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {isEditing ? (
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 10px', height: '24px', borderRadius: '4px',
                              background: '#f4f4f5', color: '#09090b',
                              border: 'none', fontSize: '11px', fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}
                          >
                            <Check size={11} /> Save
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '24px', height: '24px', borderRadius: '4px',
                                background: 'transparent', color: '#a1a1aa',
                                border: '1px solid transparent', cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLButtonElement).style.color = '#f4f4f5'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
                              onClick={e => { e.stopPropagation(); setEditingGroupId(sg.id); }}
                              title="Edit Sub Group"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '24px', height: '24px', borderRadius: '4px',
                                background: 'transparent', color: '#52525b',
                                border: '1px solid transparent', cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
                              onClick={e => { e.stopPropagation(); promptDeleteSubGroup(sg); }}
                              title="Delete Sub Group"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* ══════════════════════════════════════════
          RIGHT — Skip Items Table
      ══════════════════════════════════════════ */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '8px', border: '1px solid #27272a', background: '#09090b', overflow: 'hidden' }}
        onPaste={handleItemPaste}
      >
        {/* Header */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', background: '#18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
              {curSub ? `${curSub.groupName} (${itemsForSelectedGroup.length})` : 'Select a Group'}
            </span>
            {externalSearch === undefined && curSub && (
              <input
                type="text"
                placeholder="Search item..."
                value={internalSearch}
                onChange={e => setInternalSearch(e.target.value)}
                style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', color: '#f4f4f5', outline: 'none', width: '130px' }}
              />
            )}
          </div>
          {curSub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Button 1: AUTO CONVERT */}
              <Tooltip title="AUTO CONVERT [Alt+A / Numpad *]" side="bottom">
                <button
                  type="button"
                  onMouseEnter={() => macAudio.playHover()}
                  onClick={() => {
                    macAudio.playClick();
                    handleToggle('autoConvert');
                  }}
                  className={`apple-box-btn ${autoConvert ? 'active' : ''}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '5px',
                    background: autoConvert ? 'rgba(56, 189, 248, 0.2)' : '#27272a',
                    border: autoConvert ? '1px solid #38bdf8' : '1px solid #3f3f46',
                    color: autoConvert ? '#38bdf8' : '#a1a1aa',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRightLeft size={13} />
                </button>
              </Tooltip>

              {/* Button 2: AUTO ITEM */}
              <Tooltip title="AUTO ITEM [Alt+Z / Numpad *]" side="bottom">
                <button
                  type="button"
                  onMouseEnter={() => macAudio.playHover()}
                  onClick={() => {
                    macAudio.playClick();
                    handleToggle('autoItem');
                  }}
                  className={`apple-box-btn ${autoItem ? 'active' : ''}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '5px',
                    background: autoItem ? 'rgba(56, 189, 248, 0.2)' : '#27272a',
                    border: autoItem ? '1px solid #38bdf8' : '1px solid #3f3f46',
                    color: autoItem ? '#38bdf8' : '#a1a1aa',
                    cursor: 'pointer'
                  }}
                >
                  <PackagePlus size={13} />
                </button>
              </Tooltip>

              {/* Button 3: SIMPLE MODE */}
              <Tooltip title="SIMPLE MODE [Alt+X / Numpad *]" side="bottom">
                <button
                  type="button"
                  onMouseEnter={() => macAudio.playHover()}
                  onClick={() => {
                    macAudio.playClick();
                    handleToggle('simpleMode');
                  }}
                  className={`apple-box-btn ${simpleMode ? 'active' : ''}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '5px',
                    background: simpleMode ? 'rgba(56, 189, 248, 0.2)' : '#27272a',
                    border: simpleMode ? '1px solid #38bdf8' : '1px solid #3f3f46',
                    color: simpleMode ? '#38bdf8' : '#a1a1aa',
                    cursor: 'pointer'
                  }}
                >
                  <SlidersHorizontal size={13} />
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={handleAddItem}
                title="Add Item (or press Insert)"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  height: '28px', padding: '0 10px', borderRadius: '5px',
                  background: '#f4f4f5', border: 'none',
                  color: '#09090b', fontSize: '11.5px', fontWeight: 600,
                  cursor: 'pointer', marginLeft: '4px'
                }}
              >
                <Plus size={13} /> Add Item
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {curSub ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  <th style={{ width: DEFAULT_SUB_COLS.srNo, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ITEM NAME / PREFIX</th>
                  <th style={{ width: 65, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((si, idx) => {
                  const isSel  = selectedItemId === si.id;
                  const isEdit = editingItemId  === si.id;
                  return (
                    <tr
                      key={si.id}
                      ref={el => {
                        if (isSel && el) el.scrollIntoView({ block: 'nearest' });
                      }}
                      style={{
                        height: '28px',
                        borderBottom: '1px solid #27272a',
                        background: isSel ? '#1c1c1f' : idx % 2 === 0 ? 'rgba(24,24,27,0.5)' : 'transparent',
                        outline: isSel ? '1px solid #3f3f46' : 'none',
                        outlineOffset: '-1px',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease'
                      }}
                      onClick={() => {
                        setActivePanel('items');
                        setSelectedItemId(si.id);
                      }}
                      onDoubleClick={() => setEditingItemId(si.id)}
                    >
                      <td style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', userSelect: 'none', padding: '4px 6px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEdit ? (
                          <input
                            style={{ ...cellInput, fontWeight: 600 }}
                            value={si.itemPrefix}
                            onChange={e => handleItemChange(si.id, e.target.value)}
                            onBlur={e => {
                              commitItemPrefix(si.id, e.target.value, idx);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                const val = (e.target as HTMLInputElement).value || si.itemPrefix;
                                commitItemPrefix(si.id, val, idx);
                                macAudio.playSuccess();
                                setEditingItemId(null);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ ...cellText, fontWeight: 600 }}>
                            {si.itemPrefix || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {isEdit ? (
                            <button
                              type="button"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 10px', height: '24px', borderRadius: '4px',
                                background: '#f4f4f5', color: '#09090b',
                                border: 'none', fontSize: '11px', fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                commitItemPrefix(si.id, si.itemPrefix, idx);
                                macAudio.playSuccess();
                                setEditingItemId(null);
                              }}
                            >
                              <Check size={11} /> Save
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  background: 'transparent', color: '#a1a1aa',
                                  border: '1px solid transparent', cursor: 'pointer',
                                  transition: 'all 0.12s ease'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLButtonElement).style.color = '#f4f4f5'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
                                onClick={e => { e.stopPropagation(); setEditingItemId(si.id); }}
                                title="Edit item"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  background: 'transparent', color: '#52525b',
                                  border: '1px solid transparent', cursor: 'pointer',
                                  transition: 'all 0.12s ease'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
                                onClick={e => { e.stopPropagation(); promptDeleteItem(si); }}
                                title="Delete item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
              <Tag size={28} strokeWidth={1} color="#52525b" />
              <span>Select a group from the left panel</span>
            </div>
          )}
        </div>
      </div>


      {/* ══════════════════════════════════════════
          MODAL: MANAGE / ADD MAIN GROUPS
      ══════════════════════════════════════════ */}
      {isMainGroupModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => { setIsMainGroupModalOpen(false); setEditingMainGroupId(null); }}
        >
          <div
            className="glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width: '620px',
              maxWidth: '95vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              background: '#0f172a',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 41, 59, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '7px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <FolderPlus size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.03em' }}>
                    MAIN GROUPS CONFIGURATION
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Naye Main Groups banayein ya existing groups ko rename/delete karein ({mainGroups.length} Active Groups)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsMainGroupModalOpen(false); setEditingMainGroupId(null); }}
                className="mac-btn"
                style={{ width: '26px', height: '26px', padding: 0 }}
              >
                <X size={13} color="#94a3b8" />
              </button>
            </div>

            {/* Quick Add Bar */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                + CREATE NEW MAIN GROUP
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (newMainGroupName.trim()) {
                    handleAddMainGroup(newMainGroupName);
                    setNewMainGroupName('');
                  }
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  placeholder="Enter new Main Group name (e.g. 8D Sheet, Acrylic, etc.)..."
                  value={newMainGroupName}
                  onChange={e => setNewMainGroupName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMainGroupName.trim()}
                  className="mac-btn primary"
                  style={{ fontSize: '11.5px', padding: '6px 14px', whiteSpace: 'nowrap' }}
                >
                  <Plus size={13} /> Add Main Group
                </button>
              </form>
            </div>

            {/* List / Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>MAIN GROUP NAME</th>
                    <th style={{ width: 100, textAlign: 'center' }}>SUB GROUPS</th>
                    <th style={{ width: 80, textAlign: 'center' }}>ITEMS</th>
                    <th style={{ width: 90, textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {mainGroups.map((mg, idx) => {
                    const isEditing = editingMainGroupId === mg.id;
                    const subCount = subGroups.filter(s => s.mainGroupId === mg.id || s.mainGroup === mg.name).length;
                    const itemCount = skipItems.filter(si => si.mainGroup === mg.name).length;

                    return (
                      <tr key={mg.id} className="mac-table-row">
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          {isEditing ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                handleRenameMainGroup(mg.id, editingMainGroupName);
                                setEditingMainGroupId(null);
                              }}
                              style={{ display: 'flex', gap: '4px' }}
                            >
                              <input
                                type="text"
                                value={editingMainGroupName}
                                onChange={e => setEditingMainGroupName(e.target.value)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid #38bdf8',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '11.5px',
                                  color: '#fff',
                                  outline: 'none'
                                }}
                                autoFocus
                              />
                              <button type="submit" className="mac-btn primary" style={{ padding: '2px 6px' }}>
                                <Check size={11} />
                              </button>
                              <button
                                type="button"
                                className="mac-btn"
                                style={{ padding: '2px 6px' }}
                                onClick={() => setEditingMainGroupId(null)}
                              >
                                <X size={11} />
                              </button>
                            </form>
                          ) : (
                            <div
                              onDoubleClick={() => {
                                setEditingMainGroupId(mg.id);
                                setEditingMainGroupName(mg.name);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              title="Double click to rename"
                            >
                              <Folder size={13} color="#38bdf8" />
                              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>
                                {mg.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700, fontSize: '11.5px' }}>
                          {subCount}
                        </td>
                        <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700, fontSize: '11.5px' }}>
                          {itemCount}
                        </td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="mac-btn"
                              style={{ padding: '3px 6px', height: '22px' }}
                              onClick={() => {
                                setEditingMainGroupId(mg.id);
                                setEditingMainGroupName(mg.name);
                              }}
                              title="Rename Main Group"
                            >
                              <Edit2 size={11} color="#94a3b8" />
                            </button>
                            <button
                              type="button"
                              className="mac-btn danger"
                              style={{ padding: '3px 6px', height: '22px' }}
                              onClick={() => promptDeleteMainGroup(mg)}
                              title="Delete Main Group"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '10px 18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 41, 59, 0.3)'
              }}
            >
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Double-click name to rename · Rename automatically updates all linked sub groups & items
              </span>
              <button
                type="button"
                className="mac-btn"
                style={{ fontSize: '11px', padding: '5px 14px' }}
                onClick={() => { setIsMainGroupModalOpen(false); setEditingMainGroupId(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODALS (Bill UI Style)
      ══════════════════════════════════════════ */}
      {itemToDelete && (
        <UnsavedChangesModal
          titleText="Delete Skip Item?"
          descText={`Kya aap sach me item "${itemToDelete.itemPrefix || 'Is item'}" ko skip list se delete karna chahte hain?`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteItem}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {subGroupToDelete && (
        <UnsavedChangesModal
          titleText="Delete Sub Group?"
          descText={`Kya aap sach me sub group "${subGroupToDelete.groupName}" aur uske sabhi items ko delete karna chahte hain?`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteSubGroup}
          onCancel={() => setSubGroupToDelete(null)}
        />
      )}

      {mainGroupToDelete && (
        <UnsavedChangesModal
          titleText="Delete Main Group?"
          descText={`Kya aap sach me Main Group "${mainGroupToDelete.name}" ko delete karna chahte hain? Isse related sub groups par asar pad sakta hai.`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteMainGroup}
          onCancel={() => setMainGroupToDelete(null)}
        />
      )}
    </div>
  );
};
