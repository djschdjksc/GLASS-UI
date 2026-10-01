import React from 'react';
import type { BillHeader, RawItem, FinishedItem } from '../types';
import { BillPrintModal } from './BillPrintModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  header: BillHeader;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  initialMode?: 'estimate' | 'summary_only' | 'loading_slip';
  billNo?: string | number;
  dynamicCols?: Array<{ field: string; label: string }>;
  hasPartyCodeCol?: boolean;
  editId?: string;
}

export const SlipModal: React.FC<Props> = (props) => {
  return <BillPrintModal {...props} />;
};

export { BillPrintModal };
