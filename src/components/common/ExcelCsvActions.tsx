import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { downloadCSV, downloadTemplate, parseCSV } from '../../utils/exportCsv';
import { macAudio } from '../../utils/macAudio';
import { Tooltip } from '../ui/shadcn';

export interface CsvColumnDef<T = any> {
  header: string;
  key: keyof T | string;
  sampleValue?: string | number;
  sample?: string | number;
  required?: boolean;
  transformImport?: (rawVal: string, rawRow: Record<string, string>) => any;
  parser?: (rawVal: string, rawRow: Record<string, string>) => any;
  formatExport?: (row: T) => string | number | null | undefined;
  formatter?: (val: any) => string | number | null | undefined;
}


export interface ExcelCsvActionsProps<T = any> {
  entityName?: string;
  title?: string;
  filenamePrefix: string;
  columns: CsvColumnDef<T>[];
  data: T[];
  onImport?: (rows: Partial<T>[], mode: 'append' | 'replace') => void | Promise<void>;
  sampleRows?: Record<string, any>[];
  compact?: boolean;
  buttonLabel?: string;
  style?: React.CSSProperties;
}

/* Shadcn/ui zinc design tokens */
const Z = {
  bg:       '#09090b',
  surface:  '#18181b',
  border:   '#27272a',
  muted:    '#3f3f46',
  subtle:   '#52525b',
  ghost:    '#71717a',
  dim:      '#a1a1aa',
  soft:     '#d4d4d8',
  fg:       '#e4e4e7',
  fgStrong: '#f4f4f5',
  white:    '#ffffff',
};

export function ExcelCsvActions<T = any>({
  entityName,
  title,
  filenamePrefix,
  columns,
  data,
  onImport,
  sampleRows,
  compact = false,
  buttonLabel = 'Excel / CSV',
  style,
}: ExcelCsvActionsProps<T>) {
  const resolvedEntityName = entityName || title || 'Records';
  const [isMenuOpen, setIsMenuOpen]           = useState(false);
  const [isImportModalOpen, setIsImportModal] = useState(false);
  const [importMode, setImportMode]           = useState<'append' | 'replace'>('append');
  const [parsedImportRows, setParsedRows]     = useState<any[]>([]);
  const [importFileName, setImportFileName]   = useState('');
  const [importError, setImportError]         = useState<string | null>(null);
  const [isConfirming, setIsConfirming]       = useState(false);

  const menuRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleExport = () => {
    macAudio.playSuccess();
    setIsMenuOpen(false);
    const headers = columns.map(c => c.header);
    const rows = data.map(item =>
      columns.map(col => {
        if (col.formatExport) return col.formatExport(item);
        if (col.formatter)    return col.formatter((item as any)[col.key]);
        const val = (item as any)[col.key];
        return val !== undefined && val !== null ? val : '';
      })
    );
    downloadCSV(`${filenamePrefix}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleDownloadTemplate = () => {
    macAudio.playSuccess();
    setIsMenuOpen(false);
    const headers = columns.map(c => c.header);
    let rows: (string | number)[][] = [];
    if (sampleRows && sampleRows.length > 0) {
      rows = sampleRows.map(s =>
        columns.map(col => s[col.key as string] ?? col.sampleValue ?? col.sample ?? '')
      );
    } else {
      rows = [columns.map(col => col.sampleValue ?? col.sample ?? '')];
    }
    downloadTemplate(`${filenamePrefix}_Template`, headers, rows);
  };

  const handleTriggerUpload = () => {
    setIsMenuOpen(false);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        if (!text) { setImportError('File is empty'); return; }
        const { headers: fileHeaders, rows: fileRows } = parseCSV(text);
        if (!fileHeaders.length || !fileRows.length) {
          setImportError('No valid data rows found in this CSV file.');
          return;
        }
        const colMap: { [fileColIdx: number]: CsvColumnDef } = {};
        columns.forEach(colDef => {
          const norm = colDef.header.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx  = fileHeaders.findIndex(fh => {
            const n = fh.toLowerCase().replace(/[^a-z0-9]/g, '');
            return n === norm || n.includes(norm) || norm.includes(n);
          });
          if (idx >= 0) colMap[idx] = colDef;
        });
        const parsedObjects: any[] = [];
        fileRows.forEach(rowCells => {
          if (rowCells.every(c => !c || c.trim() === '')) return;
          const rawRowMap: Record<string, string> = {};
          fileHeaders.forEach((fh, i) => { rawRowMap[fh] = rowCells[i] || ''; });
          const obj: any = {};
          columns.forEach(c => {
            const foundIdx = Object.keys(colMap).find(i => colMap[Number(i)].key === c.key);
            const val = foundIdx !== undefined ? rowCells[Number(foundIdx)] : '';
            if (c.transformImport) obj[c.key] = c.transformImport(val, rawRowMap);
            else if (c.parser)     obj[c.key] = c.parser(val, rawRowMap);
            else                   obj[c.key] = val;
          });
          parsedObjects.push(obj);
        });
        if (!parsedObjects.length) {
          setImportError('All rows in the CSV appear to be empty.');
          return;
        }
        setParsedRows(parsedObjects);
        setIsImportModal(true);
        macAudio.playSuccess();
      } catch (err: any) {
        setImportError(err?.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    if (!parsedImportRows.length || !onImport) return;
    setIsConfirming(true);
    macAudio.playClick();
    try {
      await onImport(parsedImportRows, importMode);
      setIsImportModal(false);
      setParsedRows([]);
      setImportFileName('');
      macAudio.playSuccess();
    } catch (err: any) {
      setImportError(err?.message || 'Error occurred while saving imported data.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex', ...style }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Trigger button - shadcn outline variant */}
      <Tooltip title={`${resolvedEntityName} (CSV / Excel Data Center)`} side="bottom">
        <button
          type="button"
          onClick={() => { macAudio.playHover(); setIsMenuOpen(p => !p); }}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '5px',
            padding:      compact ? '3px 8px' : '5px 10px',
            height:       compact ? '26px' : '30px',
            background:   isMenuOpen ? Z.surface : 'transparent',
            color:        Z.fg,
            border:       `1px solid ${isMenuOpen ? Z.muted : Z.border}`,
            borderRadius: '6px',
            fontSize:     '12px',
            fontWeight:   500,
            cursor:       'pointer',
            userSelect:   'none',
            fontFamily:   'inherit',
            transition:   'background 0.12s, border-color 0.12s',
            whiteSpace:   'nowrap',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = Z.surface;
            (e.currentTarget as HTMLButtonElement).style.borderColor = Z.muted;
          }}
          onMouseLeave={e => {
            if (!isMenuOpen) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = Z.border;
            }
          }}
        >
          <FileSpreadsheet size={13} color={Z.dim} />
          {!compact && <span>{buttonLabel}</span>}
          <ChevronDown
            size={11}
            color={Z.ghost}
            style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          />
        </button>
      </Tooltip>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div style={{
          position:      'absolute',
          top:           'calc(100% + 4px)',
          right:         0,
          zIndex:        9999,
          minWidth:      '200px',
          background:    Z.bg,
          border:        `1px solid ${Z.border}`,
          borderRadius:  '8px',
          padding:       '4px',
          boxShadow:     '0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.25)',
          display:       'flex',
          flexDirection: 'column',
          gap:           '1px',
        }}>
          <div style={{
            padding:        '5px 8px 4px',
            fontSize:       '11px',
            fontWeight:     500,
            color:          Z.ghost,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}>
            <span>{resolvedEntityName}</span>
            <span style={{ color: Z.subtle }}>{data.length} rows</span>
          </div>
          <div style={{ height: '1px', background: Z.border, margin: '1px 0 3px' }} />
          <DropdownItem
            icon={<Download size={14} color={Z.dim} />}
            label="Export CSV"
            sub={`Download current ${data.length} records`}
            onClick={handleExport}
          />
          {onImport && (
            <DropdownItem
              icon={<Upload size={14} color={Z.dim} />}
              label="Import from CSV"
              sub="Upload a .csv file to add rows"
              onClick={handleTriggerUpload}
            />
          )}
          <div style={{ height: '1px', background: Z.border, margin: '3px 0' }} />
          <DropdownItem
            icon={<FileDown size={14} color={Z.dim} />}
            label="Download Template"
            sub="Ready-to-fill sample with headers"
            onClick={handleDownloadTemplate}
          />
        </div>
      )}

      {/* Import confirmation dialog */}
      {isImportModalOpen && (
        <div
          style={{
            position:       'fixed',
            inset:          0,
            background:     'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(3px)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         99999,
            padding:        '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setIsImportModal(false); }}
        >
          <div style={{
            width:         '100%',
            maxWidth:      '680px',
            background:    Z.bg,
            border:        `1px solid ${Z.border}`,
            borderRadius:  '12px',
            boxShadow:     '0 24px 64px rgba(0,0,0,0.7)',
            display:       'flex',
            flexDirection: 'column',
            overflow:      'hidden',
          }}>
            {/* Dialog header */}
            <div style={{
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              padding:        '18px 20px 16px',
              borderBottom:   `1px solid ${Z.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: Z.surface,
                  border: `1px solid ${Z.border}`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileSpreadsheet size={18} color={Z.soft} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: Z.fgStrong, lineHeight: 1.3 }}>
                    Import {resolvedEntityName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: Z.ghost, lineHeight: 1.4 }}>
                    <span style={{ color: Z.dim }}>{importFileName}</span>
                    {' · '}
                    <span>{parsedImportRows.length} rows detected</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModal(false)}
                style={{
                  background: 'transparent', border: 'none',
                  color: Z.ghost, cursor: 'pointer', padding: '2px',
                  borderRadius: '4px', display: 'flex', alignItems: 'center',
                  flexShrink: 0, marginTop: '2px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = Z.fg)}
                onMouseLeave={e => (e.currentTarget.style.color = Z.ghost)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Dialog body */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {importError && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '6px', padding: '10px 12px',
                }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '12px', color: '#f87171', lineHeight: 1.5 }}>{importError}</span>
                </div>
              )}

              <div>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 500, color: Z.dim }}>Import mode</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <ModeCard
                    active={importMode === 'append'}
                    onClick={() => setImportMode('append')}
                    icon={<Layers size={14} />}
                    title="Append"
                    description={`Add ${parsedImportRows.length} rows to existing ${data.length} records`}
                  />
                  <ModeCard
                    active={importMode === 'replace'}
                    onClick={() => setImportMode('replace')}
                    icon={<AlertTriangle size={14} />}
                    title="Replace all"
                    description={`Remove existing ${data.length} records, load only from file`}
                    danger
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: Z.dim }}>
                    Preview - first {Math.min(parsedImportRows.length, 5)} of {parsedImportRows.length} rows
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: '11px', color: Z.ghost, cursor: 'pointer',
                      fontFamily: 'inherit', padding: 0,
                      textDecoration: 'underline', textUnderlineOffset: '2px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = Z.fg)}
                    onMouseLeave={e => (e.currentTarget.style.color = Z.ghost)}
                  >
                    Download template
                  </button>
                </div>
                <div style={{
                  border: `1px solid ${Z.border}`,
                  borderRadius: '6px', overflow: 'auto',
                  maxHeight: '170px', background: Z.surface,
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${Z.muted}` }}>
                        <th style={{ padding: '7px 10px', color: Z.ghost, fontWeight: 500, textAlign: 'center', width: '32px' }}>#</th>
                        {columns.slice(0, 6).map((c, i) => (
                          <th key={i} style={{ padding: '7px 10px', color: Z.dim, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap' }}>{c.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedImportRows.slice(0, 5).map((r, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: rIdx < Math.min(parsedImportRows.length, 5) - 1 ? `1px solid ${Z.border}` : 'none' }}>
                          <td style={{ padding: '6px 10px', color: Z.subtle, textAlign: 'center' }}>{rIdx + 1}</td>
                          {columns.slice(0, 6).map((c, cIdx) => (
                            <td key={cIdx} style={{ padding: '6px 10px', color: Z.fg }}>
                              {String(r[c.key as string] ?? '') || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Dialog footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
              padding: '12px 20px', borderTop: `1px solid ${Z.border}`, background: Z.surface,
            }}>
              <button
                type="button"
                onClick={() => setIsImportModal(false)}
                style={{
                  padding: '6px 14px', borderRadius: '6px',
                  background: 'transparent', border: `1px solid ${Z.border}`,
                  color: Z.fg, fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = Z.muted)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isConfirming}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 16px', borderRadius: '6px',
                  background: importMode === 'replace' ? '#dc2626' : Z.white,
                  border: `1px solid ${importMode === 'replace' ? '#b91c1c' : Z.white}`,
                  color: importMode === 'replace' ? Z.white : Z.bg,
                  fontSize: '12px', fontWeight: 500,
                  cursor: isConfirming ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: isConfirming ? 0.6 : 1,
                  transition: 'opacity 0.12s',
                }}
              >
                <CheckCircle2 size={13} />
                {isConfirming ? 'Importing...' : `Import ${parsedImportRows.length} rows`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  icon, label, sub, onClick,
}: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', padding: '6px 8px',
        background: hovered ? Z.surface : 'transparent',
        border: 'none', borderRadius: '6px',
        color: Z.fg, fontSize: '13px', fontWeight: 400,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: Z.fgStrong, lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: '11px', color: Z.ghost, lineHeight: 1.4 }}>{sub}</span>
      </span>
    </button>
  );
}

function ModeCard({
  active, onClick, icon, title, description, danger = false,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string; danger?: boolean }) {
  const accentColor = danger ? '#ef4444' : Z.fgStrong;
  return (
    <div
      onClick={onClick}
      style={{
        border:     `1px solid ${active ? (danger ? '#ef4444' : Z.soft) : Z.border}`,
        background: active ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)') : 'transparent',
        padding:    '10px 12px', borderRadius: '8px',
        cursor:     'pointer', transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', color: active ? accentColor : Z.dim }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 600 }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: Z.ghost, lineHeight: 1.45 }}>{description}</p>
    </div>
  );
}
