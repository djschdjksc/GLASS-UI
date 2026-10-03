import React, { memo } from "react";
import type { BillRecord } from "../services/db/schema";
import { macAudio } from "../utils/macAudio";
import { formatBillNumber } from "../utils/billDocTypes";

interface NotificationCardProps {
  bill: BillRecord;
  isActive: boolean;
  timeText?: string;
  onClick?: (e?: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

const NotificationCard = memo(function NotificationCard({
  bill,
  isActive,
  timeText,
  onClick,
  onDoubleClick,
}: NotificationCardProps) {
  const docType = bill.docType || 'SALE BILL';
  const docColor =
    docType === 'SALE BILL' || docType === 'SALE'
      ? '#0a84ff'
      : docType === 'ORDER'
      ? '#ff9f0a'
      : docType === 'RETURN' || docType === 'SALE RETURN'
      ? '#ff375f'
      : '#30d158';

  return (
    <div
      className={`card ${isActive ? 'active-card' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => macAudio.playHover()}
    >
      <div className="icon" style={{ background: docColor }}>
        🧾
      </div>
      <div className="content">
        <div className="top-row">
          <span className="app-name" style={{ color: docColor }}>
            {docType}
          </span>
          <span className="time">{timeText || bill.date}</span>
        </div>
        <div className="title">
          #{formatBillNumber(bill.token)} — {bill.party}
        </div>
        <div className="message">
          <span>Veh: {bill.vehicle || '-'}</span>
          <strong style={{ color: '#34d399', fontWeight: 700, fontSize: '12px' }}>
            ₹{Number(bill.total || 0).toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </div>
  );
});

export default NotificationCard;
