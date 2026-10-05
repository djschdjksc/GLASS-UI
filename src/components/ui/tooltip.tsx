import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

// =========================================================================
// SLEEK DARK FLOATING PILL TOOLTIP COMPONENT WITH HIGHLIGHTED SHORTCUT BADGE
// & POINTING ARROW (pointing directly at hovered element/button)
// Features:
// - Pointing triangle arrow that seamlessly points at the target component
// - Deep matte dark floating pill container
// - Crisp white label text on left
// - Solid highlighted grey pill badge (<kbd>) for keyboard shortcuts on right
// =========================================================================

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  showArrow?: boolean;
}

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, showArrow = true, children, style, ...props }, ref) => {
  const bg = (style?.background as string) || (style?.backgroundColor as string) || '#1c1c1e';

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        style={{
          zIndex: 9999999999,
          background: '#1c1c1e',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          padding: '3px 4px 3px 12px',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.35)',
          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          lineHeight: '1',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '28px',
          ...style,
        }}
        className={`shadcn-tooltip-content ${className || ''}`}
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipPrimitive.Arrow
            width={10}
            height={5}
            style={{
              fill: bg,
              stroke: 'rgba(255, 255, 255, 0.12)',
              strokeWidth: 1,
            }}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export interface TooltipProps {
  title?: React.ReactNode;
  content?: React.ReactNode;
  shortcut?: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  side?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  delayDuration?: number;
  showArrow?: boolean;
}

// Regex to detect shortcut keys in [brackets] or (parentheses)
// Matches keys like Ctrl+S, Alt+P, F9 / Ctrl+K, Shift+D, Insert, Delete, Esc, PgUp, PgDn, Left Arrow, etc.
const SHORTCUT_KEY_REGEX = /(?:\[([^\]]+)\]|\(([^)]*?(?:Ctrl|Alt|Shift|Cmd|Esc|Insert|Delete|Del|Enter|Return|PgUp|PgDn|Home|End|Tab|F\d+|Arrow|\+|\/)[^)]*?)\))/i;

// Helper to extract keyboard shortcut from string like "Save Bill (Ctrl+S)" or "Rate History (Alt+P)" or "[Alt+A]"
const parseTitleAndShortcut = (raw: React.ReactNode, explicitShortcut?: string): { mainText: React.ReactNode; shortcutText: string | null } => {
  if (explicitShortcut) {
    return { mainText: raw, shortcutText: explicitShortcut };
  }
  if (typeof raw !== 'string') {
    return { mainText: raw, shortcutText: null };
  }

  const str = raw.trim();
  const match = str.match(SHORTCUT_KEY_REGEX);
  if (match) {
    const mainText = str.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
    const shortcutText = (match[1] || match[2]).trim();
    return { mainText, shortcutText };
  }

  return { mainText: str, shortcutText: null };
};

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  content,
  shortcut,
  children,
  placement = 'top',
  side,
  color,
  style,
  delayDuration = 80,
  showArrow = true,
}) => {
  const text = title !== undefined ? title : content;
  if (!text) return <>{children}</>;

  const effectiveSide = side || placement;
  const { mainText, shortcutText } = parseTitleAndShortcut(text, shortcut);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={effectiveSide}
          showArrow={showArrow}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '28px',
            padding: shortcutText ? '3px 4px 3px 12px' : '4px 12px',
            borderRadius: '9999px',
            backgroundColor: color || '#1c1c1e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.35)',
            lineHeight: '1',
            ...(color ? { background: color, ...style } : style),
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              lineHeight: '1',
            }}
          >
            {mainText}
          </span>
          {shortcutText && (
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#3f3f42',
                color: '#f4f4f5',
                padding: '3px 8.5px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 500,
                fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                letterSpacing: '0.02em',
                lineHeight: '1',
                border: 'none',
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {shortcutText}
            </kbd>
          )}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
};
