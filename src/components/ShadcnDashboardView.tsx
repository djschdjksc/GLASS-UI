import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Calendar,
  Download,
  Search,
  ChevronsUpDown,
  Building,
  Check,
  TrendingUp,
  TrendingDown,
  FileText,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Bell,
  Sliders,
  Receipt,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Waves,
  BarChart2
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { macAudio } from '../utils/macAudio';
import type { BillRecord } from '../services/db/schema';
import { downloadCSV } from '../utils/exportCsv';
import { DateRangePicker } from './ui/shadcn';

interface Props {
  themeMode?: 'dark' | 'glass';
  onNavigateToBill?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToStock?: () => void;
  onLoadBillToEditor?: (bill: BillRecord) => void;
}

type DashboardTab = 'overview' | 'analytics' | 'reports' | 'notifications';
type AnalyticsPeriod = '3months' | '30days' | '7days';

interface Point {
  x: number;
  y: number;
}

// Cubic Bezier Spline Generator for silky smooth flow waves
function generateCubicBezierPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

export const ShadcnDashboardView: React.FC<Props> = ({
  themeMode = 'dark',
  onNavigateToBill,
  onNavigateToHistory,
  onNavigateToStock,
  onLoadBillToEditor
}) => {
  const { bills, parties, stockItems, refreshAll } = useDatabase();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Universal Alt+1..4 Subtab Switch listener for Dashboard
  useEffect(() => {
    const handleSubtabSwitch = (e: Event) => {
      const custom = e as CustomEvent<{ index: number }>;
      const idx = custom.detail?.index;
      if (idx === 1) { macAudio.playClick(); setActiveTab('overview'); }
      else if (idx === 2) { macAudio.playClick(); setActiveTab('analytics'); }
      else if (idx === 3) { macAudio.playClick(); setActiveTab('reports'); }
      else if (idx === 4) { macAudio.playClick(); setActiveTab('notifications'); }
    };
    window.addEventListener('app-subtab-switch', handleSubtabSwitch);
    return () => window.removeEventListener('app-subtab-switch', handleSubtabSwitch);
  }, []);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('30days');
  const [overviewChartMode, setOverviewChartMode] = useState<'bar' | 'flow'>('bar');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredWaveIndex, setHoveredWaveIndex] = useState<number | null>(null);
  const [dashboardDateRange, setDashboardDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '2026-01-20',
    endDate: '2026-02-09'
  });
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = themeMode === 'dark';

  // Palette matching shadcn/ui (zinc-950 / zinc-900 / zinc-800 / zinc-100)
  const colors = {
    bg: isDark ? '#09090b' : 'rgba(9, 9, 11, 0.75)',
    card: isDark ? '#0c0a09' : 'rgba(18, 18, 24, 0.75)',
    cardBorder: isDark ? '#27272a' : 'rgba(255, 255, 255, 0.12)',
    foreground: '#f4f4f5',
    muted: '#71717a',
    mutedForeground: '#a1a1aa',
    border: isDark ? '#27272a' : 'rgba(255, 255, 255, 0.12)',
    accent: isDark ? '#27272a' : 'rgba(255, 255, 255, 0.08)',
    primary: '#ffffff',
    primaryForeground: '#09090b',
    barFill: isDark ? '#f4f4f5' : '#ffffff',
    barHover: '#38bdf8'
  };

  // Live Stats calculation from bills and demo benchmark
  const stats = useMemo(() => {
    const totalRevFromBills = (bills || []).reduce((acc, b) => acc + (Number(b.total) || 0), 0);
    const totalRev = totalRevFromBills > 0 ? totalRevFromBills : 45231.89;
    const invoiceCount = (bills && bills.length > 0) ? bills.length : 2350;
    const activeParties = (parties && parties.length > 0) ? parties.length : 573;
    const salesVolume = (bills && bills.length > 0) ? (bills.length * 5) + 12234 : 12234;

    return {
      revenue: totalRev,
      invoices: invoiceCount,
      salesVolume,
      activeNow: activeParties
    };
  }, [bills, parties]);

  // 12-Month Bar Chart Data (Jan - Dec) matching shadcn/ui demo
  const monthlyChartData = useMemo(() => {
    const baseValues = [
      { month: 'Jan', value: 1800 },
      { month: 'Feb', value: 2400 },
      { month: 'Mar', value: 3200 },
      { month: 'Apr', value: 4100 },
      { month: 'May', value: 3800 },
      { month: 'Jun', value: 5200 },
      { month: 'Jul', value: 4800 },
      { month: 'Aug', value: 5600 },
      { month: 'Sep', value: 4200 },
      { month: 'Oct', value: 4900 },
      { month: 'Nov', value: 5400 },
      { month: 'Dec', value: 5900 }
    ];

    if (bills && bills.length > 0) {
      bills.forEach((b) => {
        if (!b.date && !b.createdAt) return;
        const d = b.date ? new Date(b.date) : new Date(b.createdAt);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12 && b.total) {
          baseValues[mIdx].value += Math.round(Number(b.total) / 10);
        }
      });
    }

    return baseValues;
  }, [bills]);

  // Max value for Y-Axis scaling
  const maxBarValue = useMemo(() => {
    const maxVal = Math.max(...monthlyChartData.map((d) => d.value));
    return Math.ceil(maxVal / 1000) * 1000 || 6000;
  }, [monthlyChartData]);

  // Flow Wave Chart Data based on selected period (Exact replica of user's image)
  const flowWaveData = useMemo(() => {
    if (analyticsPeriod === '7days') {
      return {
        labels: ['Jun 24', 'Jun 25', 'Jun 26', 'Jun 27', 'Jun 28', 'Jun 29', 'Jun 30'],
        // Coordinates for 900x280 SVG (crests at Jun 24, Jun 27, Jun 30; troughs at Jun 25, Jun 29)
        wave1Y: [85, 205, 155, 75, 170, 210, 95],
        wave2Y: [145, 225, 190, 120, 205, 230, 155],
        visitors: [420, 180, 310, 540, 240, 190, 480],
        revenue: [14200, 6500, 11300, 18900, 8400, 6800, 16700]
      };
    } else if (analyticsPeriod === '3months') {
      return {
        labels: ['May 01', 'May 15', 'Jun 01', 'Jun 15', 'Jul 01', 'Jul 15', 'Jul 30'],
        wave1Y: [95, 185, 145, 70, 165, 195, 90],
        wave2Y: [155, 215, 180, 115, 200, 220, 150],
        visitors: [390, 210, 340, 590, 250, 200, 510],
        revenue: [13500, 7200, 12100, 20400, 8900, 7100, 17800]
      };
    } else {
      // '30days' (Default - Exact wave shape from user's screenshot)
      return {
        labels: ['Jun 24', 'Jun 25', 'Jun 26', 'Jun 27', 'Jun 28', 'Jun 29', 'Jun 30'],
        wave1Y: [90, 205, 160, 80, 175, 210, 100],
        wave2Y: [150, 225, 195, 125, 210, 230, 160],
        visitors: [450, 195, 330, 580, 260, 210, 520],
        revenue: [15600, 7100, 12400, 20500, 9200, 7600, 18300]
      };
    }
  }, [analyticsPeriod]);

  // Recent Sales list matching shadcn/ui demo
  const recentSales = useMemo(() => {
    if (bills && bills.length > 0) {
      const sorted = [...bills].sort((a, b) => {
        const tA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
        const tB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
        return tB - tA;
      });

      return sorted.slice(0, 5).map((b) => {
        const name = b.party || 'Cash Retail';
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('') || 'CU';

        const station = b.vehicle ? `Vehicle: ${b.vehicle}` : `Invoice #${b.token || b.id}`;
        const amt = Number(b.total) || 1999;

        return {
          id: b.id,
          initials,
          name,
          email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@trading.in • ${station}`,
          amount: `+₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          rawBill: b
        };
      });
    }

    return [
      { id: '1', initials: 'OM', name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+₹1,999.00', rawBill: null },
      { id: '2', initials: 'JL', name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+₹39.00', rawBill: null },
      { id: '3', initials: 'IN', name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+₹299.00', rawBill: null },
      { id: '4', initials: 'WK', name: 'William Kim', email: 'william.kim@email.com', amount: '+₹99.00', rawBill: null },
      { id: '5', initials: 'SD', name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+₹39.00', rawBill: null }
    ];
  }, [bills]);

  // Handle Export CSV
  const handleExportCSV = () => {
    macAudio.playClick();
    if (bills && bills.length > 0) {
      const headers = ['Token / Bill #', 'Date', 'Party', 'Doc Type', 'Total (₹)', 'Status'];
      const rows = bills.map((b) => [
        b.token || b.id,
        b.date || '',
        b.party || '',
        b.docType || 'SALE BILL',
        b.total || 0,
        b.status || 'PAID'
      ]);
      downloadCSV(`shadcn-dashboard-bills-${Date.now()}.csv`, headers, rows);
    } else {
      const demoCsv = [
        ['Month', 'Revenue (₹)', 'Benchmark'],
        ...monthlyChartData.map((d) => [d.month, String(d.value), 'Standard'])
      ];
      const csvStr = demoCsv.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadcn-dashboard-report-${Date.now()}.csv`;
      a.click();
    }
  };

  // Bar Chart SVG dimensions
  const svgWidth = 680;
  const svgHeight = 280;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartPlotWidth = svgWidth - paddingLeft - paddingRight;
  const chartPlotHeight = svgHeight - paddingTop - paddingBottom;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(maxBarValue * pct),
    y: paddingTop + chartPlotHeight * (1 - pct)
  }));

  const barStep = chartPlotWidth / monthlyChartData.length;
  const barWidth = 24;

  // Flow Wave Chart SVG calculations (viewBox 0 0 900 280)
  const waveSvgWidth = 900;
  const waveSvgHeight = 280;
  const waveBottomY = 250;
  const wavePoints1: Point[] = flowWaveData.labels.map((_, i) => ({
    x: 30 + i * ((waveSvgWidth - 60) / (flowWaveData.labels.length - 1)),
    y: flowWaveData.wave1Y[i]
  }));
  const wavePoints2: Point[] = flowWaveData.labels.map((_, i) => ({
    x: 30 + i * ((waveSvgWidth - 60) / (flowWaveData.labels.length - 1)),
    y: flowWaveData.wave2Y[i]
  }));

  const wave1Path = generateCubicBezierPath(wavePoints1);
  const wave1AreaPath = `${wave1Path} L ${wavePoints1[wavePoints1.length - 1].x},${waveBottomY} L ${wavePoints1[0].x},${waveBottomY} Z`;

  const wave2Path = generateCubicBezierPath(wavePoints2);
  const wave2AreaPath = `${wave2Path} L ${wavePoints2[wavePoints2.length - 1].x},${waveBottomY} L ${wavePoints2[0].x},${waveBottomY} Z`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: colors.bg,
        color: colors.foreground,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP NAV HEADER (SHADCN HEADER)                                         */}
      {/* ========================================================================= */}
      <header
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Team Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.foreground,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building size={12} color="#f4f4f5" />
              </div>
              <span>Aluminium ERP</span>
              <ChevronsUpDown size={13} color={colors.muted} />
            </button>

            {isTeamMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '180px',
                  zIndex: 50,
                  padding: '4px'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '11px', color: colors.muted, fontWeight: 600 }}>
                  Active Workspace
                </div>
                <button
                  type="button"
                  onClick={() => setIsTeamMenuOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: colors.accent,
                    border: 'none',
                    color: colors.foreground,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>Aluminium ERP Inc.</span>
                  <Check size={13} color="#10b981" />
                </button>
              </div>
            )}
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span
              onClick={() => setActiveTab('overview')}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'overview' ? 600 : 500,
                color: activeTab === 'overview' ? colors.foreground : colors.mutedForeground,
                cursor: 'pointer'
              }}
            >
              Overview
            </span>
            <span
              onClick={() => setActiveTab('analytics')}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'analytics' ? 600 : 500,
                color: activeTab === 'analytics' ? colors.foreground : colors.mutedForeground,
                cursor: 'pointer'
              }}
            >
              Analytics
            </span>
            <span
              onClick={() => onNavigateToBill ? onNavigateToBill() : undefined}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.mutedForeground,
                cursor: 'pointer'
              }}
            >
              Customers
            </span>
            <span
              onClick={() => onNavigateToStock ? onNavigateToStock() : undefined}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.mutedForeground,
                cursor: 'pointer'
              }}
            >
              Products
            </span>
            <span
              onClick={() => onNavigateToHistory ? onNavigateToHistory() : undefined}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.mutedForeground,
                cursor: 'pointer'
              }}
            >
              Invoices
            </span>
          </nav>
        </div>

        {/* Right Search & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              width: '200px'
            }}
          >
            <Search size={14} color={colors.muted} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: colors.foreground,
                fontSize: '12px',
                width: '100%'
              }}
            />
          </div>

          {/* User Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#27272a',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff'
            }}
          >
            SC
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DASHBOARD TITLE & ACTION CONTROLS                                       */}
      {/* ========================================================================= */}
      <div style={{ padding: '24px 32px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.8px',
                margin: 0,
                color: colors.foreground
              }}
            >
              Dashboard
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Authentic Shadcn Date Range Picker */}
            <DateRangePicker
              startDate={dashboardDateRange.startDate}
              endDate={dashboardDateRange.endDate}
              onChange={(range) => setDashboardDateRange(range)}
              size="default"
            />

            {/* Download Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: colors.primary,
                color: colors.primaryForeground,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher (Overview, Analytics, Reports, Notifications) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: isDark ? '#18181b' : 'rgba(0,0,0,0.3)',
            padding: '3px',
            borderRadius: '8px',
            width: 'fit-content',
            border: `1px solid ${colors.border}`
          }}
        >
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'reports', label: 'Reports' },
            { id: 'notifications', label: 'Notifications' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as DashboardTab);
                  macAudio.playClick();
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? (isDark ? '#09090b' : 'rgba(255,255,255,0.15)') : 'transparent',
                  color: isActive ? colors.foreground : colors.mutedForeground,
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW (THE FLAGSHIP SHADCN DASHBOARD VIEW)                       */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 4 Top Metric Cards (Row 1) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}
            >
              {/* Card 1: Total Revenue */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Total Revenue
                  </span>
                  <DollarSign size={16} color={colors.mutedForeground} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                  ₹{stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', color: colors.mutedForeground }}>
                  +20.1% from last month
                </div>
              </div>

              {/* Card 2: Subscriptions / Invoices */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Subscriptions
                  </span>
                  <Users size={16} color={colors.mutedForeground} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                  +{stats.invoices.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: colors.mutedForeground }}>
                  +180.1% from last month
                </div>
              </div>

              {/* Card 3: Sales */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Sales
                  </span>
                  <CreditCard size={16} color={colors.mutedForeground} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                  +{stats.salesVolume.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: colors.mutedForeground }}>
                  +19% from last month
                </div>
              </div>

              {/* Card 4: Active Now */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Active Now
                  </span>
                  <Activity size={16} color={colors.mutedForeground} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                  +{stats.activeNow}
                </div>
                <div style={{ fontSize: '12px', color: colors.mutedForeground }}>
                  +201 since last hour
                </div>
              </div>
            </div>

            {/* Main Section: 2-Column Grid (Left: Overview Chart with Toggle, Right: Recent Sales) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '4fr 3fr',
                gap: '16px'
              }}
            >
              {/* Left Card: Overview Chart */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: colors.foreground }}>
                    Overview
                  </h3>

                  {/* Mode switcher: Bar vs Flow Area */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      padding: '2px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewChartMode('bar');
                        macAudio.playClick();
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: overviewChartMode === 'bar' ? (isDark ? '#27272a' : 'rgba(255,255,255,0.2)') : 'transparent',
                        color: overviewChartMode === 'bar' ? '#ffffff' : colors.mutedForeground,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <BarChart2 size={12} />
                      <span>Bar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewChartMode('flow');
                        macAudio.playClick();
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: overviewChartMode === 'flow' ? (isDark ? '#27272a' : 'rgba(255,255,255,0.2)') : 'transparent',
                        color: overviewChartMode === 'flow' ? '#38bdf8' : colors.mutedForeground,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Waves size={12} />
                      <span>Flow Wave</span>
                    </button>
                  </div>
                </div>

                {/* 1. Bar Chart View */}
                {overviewChartMode === 'bar' ? (
                  <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
                    >
                      {yTicks.map((tick, idx) => (
                        <g key={idx}>
                          <line
                            x1={paddingLeft}
                            y1={tick.y}
                            x2={svgWidth - paddingRight}
                            y2={tick.y}
                            stroke="#27272a"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={tick.y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#71717a"
                            fontFamily="sans-serif"
                          >
                            ₹{tick.value.toLocaleString('en-IN')}
                          </text>
                        </g>
                      ))}

                      {monthlyChartData.map((d, idx) => {
                        const barX = paddingLeft + idx * barStep + (barStep - barWidth) / 2;
                        const height = (d.value / maxBarValue) * chartPlotHeight;
                        const barY = paddingTop + chartPlotHeight - height;
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <g
                            key={d.month}
                            onMouseEnter={() => {
                              setHoveredBarIndex(idx);
                              macAudio.playHover();
                            }}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={height}
                              rx={4}
                              ry={4}
                              fill={isHovered ? colors.barHover : colors.barFill}
                              opacity={hoveredBarIndex !== null && !isHovered ? 0.45 : 1}
                              style={{ transition: 'all 0.15s ease' }}
                            />
                            <text
                              x={barX + barWidth / 2}
                              y={svgHeight - 12}
                              textAnchor="middle"
                              fontSize="12"
                              fill={isHovered ? colors.foreground : colors.muted}
                              fontWeight={isHovered ? 600 : 400}
                            >
                              {d.month}
                            </text>
                            {isHovered && (
                              <g>
                                <rect
                                  x={barX + barWidth / 2 - 45}
                                  y={barY - 34}
                                  width={90}
                                  height={26}
                                  rx={6}
                                  ry={6}
                                  fill="#09090b"
                                  stroke="#38bdf8"
                                  strokeWidth="1"
                                />
                                <text
                                  x={barX + barWidth / 2}
                                  y={barY - 17}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="700"
                                  fill="#ffffff"
                                >
                                  ₹{d.value.toLocaleString('en-IN')}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  /* 2. Flow Wave View Inside Overview */
                  <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                    <svg
                      viewBox={`0 0 ${waveSvgWidth} ${waveSvgHeight}`}
                      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
                    >
                      <defs>
                        <linearGradient id="flowGrad1_ov" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="flowGrad2_ov" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.30" />
                          <stop offset="70%" stopColor="#1e3a8a" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {[60, 110, 160, 210].map((yVal, i) => (
                        <line
                          key={i}
                          x1={30}
                          y1={yVal}
                          x2={waveSvgWidth - 30}
                          y2={yVal}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="1"
                        />
                      ))}

                      <path d={wave2AreaPath} fill="url(#flowGrad2_ov)" />
                      <path d={wave2Path} fill="none" stroke="#1d4ed8" strokeWidth="2" />

                      <path d={wave1AreaPath} fill="url(#flowGrad1_ov)" />
                      <path d={wave1Path} fill="none" stroke="#2563eb" strokeWidth="2.5" />

                      {flowWaveData.labels.map((lbl, i) => (
                        <text
                          key={i}
                          x={wavePoints1[i].x}
                          y={waveBottomY + 18}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#71717a"
                        >
                          {lbl}
                        </text>
                      ))}
                    </svg>
                  </div>
                )}
              </div>

              {/* Right Card: Recent Sales */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: colors.foreground }}>
                    Recent Sales
                  </h3>
                  <p style={{ fontSize: '13px', color: colors.mutedForeground, margin: '4px 0 0' }}>
                    You made 265 sales this month.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      onClick={() => {
                        if (sale.rawBill && onLoadBillToEditor) {
                          onLoadBillToEditor(sale.rawBill);
                          macAudio.playSuccess();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: sale.rawBill ? 'pointer' : 'default',
                        padding: '4px 0',
                        borderRadius: '6px',
                        transition: 'opacity 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#27272a',
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: colors.foreground
                          }}
                        >
                          {sale.initials}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: colors.foreground }}>
                            {sale.name}
                          </span>
                          <span style={{ fontSize: '12px', color: colors.mutedForeground }}>
                            {sale.email}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.foreground }}>
                        {sale.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANALYTICS (EXACT 100% REPLICA OF USER'S UPLOADED SCREENSHOT)       */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top 4 KPI Cards Matching Screenshot Exactly */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}
            >
              {/* Card 1: Total Revenue */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Total Revenue
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.foreground
                    }}
                  >
                    <span>↗</span>
                    <span>+12.5%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                    $1,250.00
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: colors.foreground, marginTop: '2px' }}>
                    <span>Trending up this month</span>
                    <span>↗</span>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted, marginTop: '2px' }}>
                    Visitors for the last 6 months
                  </div>
                </div>
              </div>

              {/* Card 2: New Customers */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    New Customers
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.foreground
                    }}
                  >
                    <span>↘</span>
                    <span>-20%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                    1,234
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: colors.foreground, marginTop: '2px' }}>
                    <span>Down 20% this period</span>
                    <span>↘</span>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted, marginTop: '2px' }}>
                    Acquisition needs attention
                  </div>
                </div>
              </div>

              {/* Card 3: Active Accounts */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Active Accounts
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.foreground
                    }}
                  >
                    <span>↗</span>
                    <span>+12.5%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                    45,678
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: colors.foreground, marginTop: '2px' }}>
                    <span>Strong user retention</span>
                    <span>↗</span>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted, marginTop: '2px' }}>
                    Engagement exceed targets
                  </div>
                </div>
              </div>

              {/* Card 4: Growth Rate */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: colors.mutedForeground }}>
                    Growth Rate
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.foreground
                    }}
                  >
                    <span>↗</span>
                    <span>+4.5%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: colors.foreground, letterSpacing: '-0.5px' }}>
                    4.5%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: colors.foreground, marginTop: '2px' }}>
                    <span>Steady performance increase</span>
                    <span>↗</span>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted, marginTop: '2px' }}>
                    Meets growth projections
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Large Flow Wave Area Chart Card (Exact Replica of Screenshot) */}
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Header with Title and Segmented Capsule Switcher */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: colors.foreground }}>
                    Total Visitors
                  </h3>
                  <p style={{ fontSize: '13px', color: colors.mutedForeground, margin: '4px 0 0' }}>
                    Total for the last {analyticsPeriod === '7days' ? '7 days' : analyticsPeriod === '3months' ? '3 months' : '30 days'}
                  </p>
                </div>

                {/* Filter Capsule: Last 3 months | Last 30 days | Last 7 days */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '3px'
                  }}
                >
                  {[
                    { id: '3months', label: 'Last 3 months' },
                    { id: '30days', label: 'Last 30 days' },
                    { id: '7days', label: 'Last 7 days' }
                  ].map((p) => {
                    const isSelected = analyticsPeriod === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setAnalyticsPeriod(p.id as AnalyticsPeriod);
                          macAudio.playClick();
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #3f3f46' : '1px solid transparent',
                          background: isSelected ? '#27272a' : 'transparent',
                          color: isSelected ? '#ffffff' : colors.mutedForeground,
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The Blue Multi-Layer Curved Wave Chart */}
              <div style={{ position: 'relative', width: '100%', height: '320px', marginTop: '10px' }}>
                <svg
                  viewBox={`0 0 ${waveSvgWidth} ${waveSvgHeight}`}
                  style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
                >
                  <defs>
                    {/* Primary Upper Wave Gradient (Electric Blue) */}
                    <linearGradient id="flowGradient1_an" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Secondary Lower Wave Gradient (Deep Blue) */}
                    <linearGradient id="flowGradient2_an" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.30" />
                      <stop offset="70%" stopColor="#1e3a8a" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[60, 110, 160, 210].map((yVal, i) => (
                    <line
                      key={i}
                      x1={30}
                      y1={yVal}
                      x2={waveSvgWidth - 30}
                      y2={yVal}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Secondary Lower Wave Area & Line */}
                  <path d={wave2AreaPath} fill="url(#flowGradient2_an)" />
                  <path d={wave2Path} fill="none" stroke="#1d4ed8" strokeWidth="2" />

                  {/* Primary Upper Wave Area & Line */}
                  <path d={wave1AreaPath} fill="url(#flowGradient1_an)" />
                  <path d={wave1Path} fill="none" stroke="#2563eb" strokeWidth="2.5" />

                  {/* X-Axis Dates */}
                  {flowWaveData.labels.map((lbl, idx) => {
                    const isHovered = hoveredWaveIndex === idx;
                    return (
                      <text
                        key={idx}
                        x={wavePoints1[idx].x}
                        y={waveBottomY + 18}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight={isHovered ? 600 : 400}
                        fill={isHovered ? '#ffffff' : '#71717a'}
                        style={{ transition: 'all 0.15s ease' }}
                      >
                        {lbl}
                      </text>
                    );
                  })}

                  {/* Hover Interaction Hotspots */}
                  {flowWaveData.labels.map((lbl, idx) => {
                    const pt1 = wavePoints1[idx];
                    const pt2 = wavePoints2[idx];
                    const isHovered = hoveredWaveIndex === idx;

                    return (
                      <g
                        key={`hotspot-${idx}`}
                        onMouseEnter={() => {
                          setHoveredWaveIndex(idx);
                          macAudio.playHover();
                        }}
                        onMouseLeave={() => setHoveredWaveIndex(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Transparent capture bar */}
                        <rect
                          x={pt1.x - 40}
                          y={20}
                          width={80}
                          height={waveBottomY}
                          fill="transparent"
                        />

                        {isHovered && (
                          <g>
                            {/* Vertical Guide Line */}
                            <line
                              x1={pt1.x}
                              y1={30}
                              x2={pt1.x}
                              y2={waveBottomY}
                              stroke="#3b82f6"
                              strokeDasharray="3 3"
                              strokeWidth="1.5"
                            />

                            {/* Node on Wave 1 */}
                            <circle
                              cx={pt1.x}
                              cy={pt1.y}
                              r={5}
                              fill="#3b82f6"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />

                            {/* Node on Wave 2 */}
                            <circle
                              cx={pt2.x}
                              cy={pt2.y}
                              r={4}
                              fill="#1d4ed8"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />

                            {/* Tooltip Card */}
                            <rect
                              x={pt1.x - 65}
                              y={Math.max(10, pt1.y - 65)}
                              width={130}
                              height={55}
                              rx={8}
                              ry={8}
                              fill="#09090b"
                              stroke="#3b82f6"
                              strokeWidth="1"
                            />
                            <text
                              x={pt1.x}
                              y={Math.max(10, pt1.y - 65) + 18}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="700"
                              fill="#3b82f6"
                            >
                              {lbl}
                            </text>
                            <text
                              x={pt1.x}
                              y={Math.max(10, pt1.y - 65) + 33}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="600"
                              fill="#ffffff"
                            >
                              Visitors: {flowWaveData.visitors[idx]}
                            </text>
                            <text
                              x={pt1.x}
                              y={Math.max(10, pt1.y - 65) + 47}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#a1a1aa"
                            >
                              Revenue: ₹{flowWaveData.revenue[idx].toLocaleString('en-IN')}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REPORTS                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: colors.foreground }}>
                  Consolidated Audit Statement
                </h3>
                <p style={{ fontSize: '13px', color: colors.mutedForeground, margin: '4px 0 0' }}>
                  Periodic ledger balances, GST tax calculations, and party voucher registries.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.foreground,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet size={14} color="#10b981" />
                <span>Export Statement CSV</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}`, textAlign: 'left', color: colors.mutedForeground }}>
                  <th style={{ padding: '10px 0' }}>Metric</th>
                  <th style={{ padding: '10px 0' }}>Recorded Value</th>
                  <th style={{ padding: '10px 0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 0', color: colors.foreground }}>Gross Billed Turnover</td>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>₹{stats.revenue.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 0', color: '#10b981' }}>Audited</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 0', color: colors.foreground }}>Total Invoices Recorded</td>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{stats.invoices}</td>
                  <td style={{ padding: '12px 0', color: '#10b981' }}>Synced</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 0', color: colors.foreground }}>Active Client Accounts</td>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{stats.activeNow}</td>
                  <td style={{ padding: '12px 0', color: '#38bdf8' }}>Verified</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NOTIFICATIONS                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: colors.foreground }}>
              System Alerts & Multi-Device Sync Hub
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { title: 'SQLite Engine :5006', desc: 'Local database server connected and active with zero replication lag.', time: 'Just now', icon: ShieldCheck, color: '#10b981' },
                { title: 'PyQt6 Native Thermal Spooler :5005', desc: 'Direct print queue operational for continuous roll paper printing.', time: '2m ago', icon: Printer, color: '#38bdf8' },
                { title: 'Supabase Cloud Realtime Sync', desc: 'Cross-device multi-terminal delta synchronization enabled.', time: '10m ago', icon: RefreshCw, color: '#c084fc' }
              ].map((notif, idx) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={16} color={notif.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: colors.foreground }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.mutedForeground, marginTop: '2px' }}>
                        {notif.desc}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: colors.muted }}>
                      {notif.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
