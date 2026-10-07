import React, { useEffect } from "react";
import "./UnsavedChangesModal.css";
import { macAudio } from "../utils/macAudio";

export interface UnsavedChangesModalProps {
  billNumber?: string | number;
  onSave?: () => void;
  onDiscard?: () => void;
  onKeep?: () => void;
  onCancel?: () => void;
  /** Custom label for the discard/action button */
  discardLabel?: string;
  /** Custom label for the modal title */
  titleText?: string;
  /** Custom description text */
  descText?: string;
}

export default function UnsavedChangesModal({
  billNumber = 529,
  onSave,
  onDiscard,
  onKeep,
  onCancel,
  discardLabel,
  titleText,
  descText,
}: UnsavedChangesModalProps) {
  const handleDiscardAction = onDiscard || onKeep;

  useEffect(() => {
    macAudio.playPop();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const isOne = e.key === "1" || e.code === "Digit1" || e.code === "Numpad1";
      const isTwo = e.key === "2" || e.code === "Digit2" || e.code === "Numpad2";
      const isThree = e.key === "3" || e.code === "Digit3" || e.code === "Numpad3";
      const isEscape = e.key === "Escape";

      if (onSave) {
        // Mode 1 (Save Dialog): 1 = Save & Clear, 2 = Discard, 3/Esc = Cancel
        if (isOne) {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playSuccess();
          onSave();
        } else if (isTwo) {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playClick();
          handleDiscardAction?.();
        } else if (isThree || isEscape) {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playClick();
          onCancel?.();
        }
      } else {
        // Mode 2 (Delete / Confirm Dialog): Delete / Enter / 1 / Y = Confirm Delete, 2 / Esc / N = Cancel
        const isConfirmDelete = 
          isOne || 
          e.key === "Delete" || 
          e.code === "Delete" || 
          e.key === "Enter" || 
          e.code === "Enter" || 
          e.key === "y" || 
          e.key === "Y";

        if (isConfirmDelete) {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playClick();
          handleDiscardAction?.();
        } else if (isTwo || isEscape || e.key === "n" || e.key === "N") {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playClick();
          onCancel?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, handleDiscardAction, onCancel]);

  return (
    <div 
      className="modal-backdrop"
      onClick={() => {
        macAudio.playClick();
        onCancel?.();
      }}
    >
      <div
        className="unsaved-modal anim-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {/* Icon */}
          <div className="document-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>

          {/* Text */}
          <div className="modal-text">
            <h2 id="unsaved-title">
              {titleText || `Unsaved Changes in Bill #${billNumber}`}
            </h2>

            <p>
              {descText ? descText : (<>Aapne is bill me changes kiye hain.<br />Kya aap ise save karna chahte hain?</>)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          {/* 1: Save & Clear — only shown when onSave is provided */}
          {onSave && (
            <button
              type="button"
              className="action-btn save-btn"
              onClick={(e) => {
                e.stopPropagation();
                macAudio.playSuccess();
                onSave?.();
              }}
              onMouseEnter={() => macAudio.playHover()}
              autoFocus={!!onSave}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>

              <span>Save &amp; Clear</span>
              <kbd>1</kbd>
            </button>
          )}

          {/* 2 / 1: Discard / Delete */}
          <button
            type="button"
            className="action-btn discard-btn"
            onClick={(e) => {
              e.stopPropagation();
              macAudio.playClick();
              handleDiscardAction?.();
            }}
            onMouseEnter={() => macAudio.playHover()}
            autoFocus={!onSave}
            style={!onSave ? { background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.5)' } : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>

            <span>{discardLabel || (onSave ? 'Discard & Clear' : 'Delete')}</span>
            <kbd>{onSave ? '2' : 'Del / 1'}</kbd>
          </button>

          {/* 3 / 2: Cancel */}
          <button
            type="button"
            className="action-btn cancel-btn"
            onClick={(e) => {
              e.stopPropagation();
              macAudio.playClick();
              onCancel?.();
            }}
            onMouseEnter={() => macAudio.playHover()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>

            <span>Cancel</span>
            <kbd>{onSave ? '3' : '2'}</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
