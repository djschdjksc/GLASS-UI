import React from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';
import 'sonner/dist/styles.css';

// =========================================================================
// SHADCN / SONNER OFFICIAL TOAST ENGINE (ui.shadcn.com/docs/components/sonner)
// Features:
// - Curved rounded corners (14px / rounded-xl)
// - Built-in Close (✕) cross button on the RIGHT CENTER
// - Multi-notification 3D stack with smooth HOVER EXPAND ANIMATION
// - Automatically strips duplicate emojis from text so only 1 clean icon displays
// - Full compatibility with existing toast(), toast.success(), etc.
// =========================================================================

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastActionElement {
  altText?: string;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastProps {
  id?: string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement | React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export type ToastOptions = ToastProps;

/**
 * Strips leading emojis & symbols (e.g. ⚠️, 🚨, ❌, ✅, ℹ️, ✨) from text
 * to prevent double icons when toast already provides an icon.
 */
function cleanToastText(text: React.ReactNode): React.ReactNode {
  if (typeof text !== 'string') return text;
  return text
    .replace(/^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}?,!]+/u, '')
    .trim();
}

/**
 * Universal toast function compatible with both Shadcn & Sonner calls
 */
export function toast(props: ToastOptions | string | React.ReactNode) {
  if (typeof props === 'string') {
    return sonnerToast(cleanToastText(props) as string);
  }
  if (React.isValidElement(props)) {
    return sonnerToast(props);
  }

  const { title, description, action, variant, duration } = props as ToastOptions;

  const cleanTitle = cleanToastText(title);
  const cleanDesc = cleanToastText(description);

  const actionObj =
    action && typeof action === 'object' && 'label' in action && 'onClick' in action
      ? {
          label: (action as ToastActionElement).label,
          onClick: (action as ToastActionElement).onClick as (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
        }
      : undefined;

  const options: Record<string, any> = {
    description: cleanDesc,
    duration,
    action: actionObj,
  };

  if (variant === 'destructive') {
    return sonnerToast.error(cleanTitle || (cleanDesc as string), options);
  } else if (variant === 'success') {
    return sonnerToast.success(cleanTitle || (cleanDesc as string), options);
  }

  return sonnerToast(cleanTitle || (cleanDesc as string), options);
}

// Toast Variants / Helpers (strips duplicate emoji icons from text)
toast.success = (titleOrDesc: React.ReactNode, desc?: React.ReactNode, extra?: Partial<ToastOptions>) => {
  const title = desc !== undefined ? cleanToastText(titleOrDesc) : undefined;
  const description = desc !== undefined ? cleanToastText(desc) : cleanToastText(titleOrDesc);
  return sonnerToast.success(title || description, {
    description: title ? description : undefined,
    duration: extra?.duration,
    action: extra?.action && typeof extra?.action === 'object' && 'label' in extra.action
      ? {
          label: (extra.action as ToastActionElement).label,
          onClick: (extra.action as ToastActionElement).onClick as (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
        }
      : undefined,
  });
};

toast.error = (titleOrDesc: React.ReactNode, desc?: React.ReactNode, extra?: Partial<ToastOptions>) => {
  const title = desc !== undefined ? cleanToastText(titleOrDesc) : undefined;
  const description = desc !== undefined ? cleanToastText(desc) : cleanToastText(titleOrDesc);
  return sonnerToast.error(title || description, {
    description: title ? description : undefined,
    duration: extra?.duration,
    action: extra?.action && typeof extra?.action === 'object' && 'label' in extra.action
      ? {
          label: (extra.action as ToastActionElement).label,
          onClick: (extra.action as ToastActionElement).onClick as (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
        }
      : undefined,
  });
};

toast.warning = (titleOrDesc: React.ReactNode, desc?: React.ReactNode, extra?: Partial<ToastOptions>) => {
  const title = desc !== undefined ? cleanToastText(titleOrDesc) : undefined;
  const description = desc !== undefined ? cleanToastText(desc) : cleanToastText(titleOrDesc);
  return sonnerToast.warning(title || description, {
    description: title ? description : undefined,
    duration: extra?.duration,
    action: extra?.action && typeof extra?.action === 'object' && 'label' in extra.action
      ? {
          label: (extra.action as ToastActionElement).label,
          onClick: (extra.action as ToastActionElement).onClick as (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
        }
      : undefined,
  });
};

toast.info = (titleOrDesc: React.ReactNode, desc?: React.ReactNode, extra?: Partial<ToastOptions>) => {
  const title = desc !== undefined ? cleanToastText(titleOrDesc) : undefined;
  const description = desc !== undefined ? cleanToastText(desc) : cleanToastText(titleOrDesc);
  return sonnerToast.info(title || description, {
    description: title ? description : undefined,
    duration: extra?.duration,
    action: extra?.action && typeof extra?.action === 'object' && 'label' in extra.action
      ? {
          label: (extra.action as ToastActionElement).label,
          onClick: (extra.action as ToastActionElement).onClick as (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
        }
      : undefined,
  });
};

toast.promise = sonnerToast.promise;
toast.dismiss = (id?: string | number) => sonnerToast.dismiss(id);
export const dismissToast = toast.dismiss;

export function useToast() {
  return {
    toast,
    dismiss: toast.dismiss,
  };
}

// =========================================================================
// OFFICIAL SHADCN TOASTER COMPONENT
// =========================================================================
export const Toaster: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  richColors?: boolean;
  closeButton?: boolean;
}> = ({
  position = 'bottom-right',
  richColors = true,
  closeButton = true,
}) => {
  return (
    <SonnerToaster
      position={position}
      closeButton={closeButton}
      richColors={richColors}
      visibleToasts={5}
      expand={false}
      style={{
        zIndex: 99999999,
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif)',
      }}
      toastOptions={{
        style: {
          borderRadius: '14px',
          padding: '14px 40px 14px 18px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border, #27272a)',
          background: 'var(--card, #121215)',
          color: 'var(--text-primary, #f8fafc)',
          fontSize: '13px',
        },
        actionButtonStyle: {
          borderRadius: '8px',
          padding: '6px 12px',
          fontWeight: 600,
          fontSize: '12px',
        },
        cancelButtonStyle: {
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
        },
      }}
    />
  );
};

// Backwards-compatibility stubs for manual Radix element imports if needed
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ToastViewport: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
export const ToastAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);
export const ToastClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);
export const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
export const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
export const Toast: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
