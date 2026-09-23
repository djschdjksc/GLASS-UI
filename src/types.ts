export interface BillHeader {
  docType: string;
  partyName: string;
  typeSelection: string;
  vehicleNo: string;
  date: string;
  tokenNo: number | string;
}

export interface RawItem {
  id: string;
  name: string;
  qty: number;
  uCap: number;
  lCap: number;
  selected?: boolean;
}

export interface FinishedItem {
  id: string;
  mould: string;
  qty: number;
  price: number;
  total: number;
  selected?: boolean;
}

export interface ToggleState {
  autoConvert: boolean;
  autoItem: boolean;
  simple: boolean;
  rowMode: boolean;
}

export type NavKey = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F8' | 'F9' | 'F10';

export type EnterDirection = 'right' | 'down' | 'left' | 'up';
