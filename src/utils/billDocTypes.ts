export type BillDocType = 'SALE' | 'SALE RETURN' | 'ORDER' | 'PURCHASE';

export const DOC_TYPES: BillDocType[] = ['SALE', 'SALE RETURN', 'ORDER', 'PURCHASE'];

export const normalizeDocType = (dt?: string): BillDocType => {
  if (!dt) return 'SALE';
  const u = dt.toUpperCase().trim();
  if (u.includes('RETURN') || u.includes('CREDIT')) return 'SALE RETURN';
  if (u.includes('ORDER') || u.includes('QUOTATION')) return 'ORDER';
  if (u.includes('PURCHASE') || u.includes('INWARD')) return 'PURCHASE';
  return 'SALE';
};

export const getBillCategory = (b: { docType?: string; typeSelection?: string }): BillDocType => {
  const doc = (b.docType || '').toUpperCase().trim();
  const type = (b.typeSelection || '').toUpperCase().trim();
  if (doc.includes('RETURN') || doc.includes('CREDIT') || type.includes('RETURN')) return 'SALE RETURN';
  if (doc.includes('ORDER') || doc.includes('QUOTATION') || type.includes('ORDER')) return 'ORDER';
  if (doc.includes('PURCHASE') || doc.includes('INWARD') || type.includes('PURCHASE')) return 'PURCHASE';
  return 'SALE';
};

export const getStoredBillPrefix = (): string => {
  const p = localStorage.getItem('modern_setting_bill_prefix');
  if (p !== null && p !== undefined && p.trim() !== '') return p.trim();
  const userP = localStorage.getItem('modern_app_user_prefix');
  if (userP && userP.trim()) {
    const clean = userP.trim().toUpperCase();
    return clean.endsWith('-') ? clean : `${clean}-`;
  }
  return 'REAL-';
};

export const formatBillNumber = (token: string | number | undefined | null, customPrefix?: string): string => {
  const prefix = customPrefix !== undefined ? customPrefix : getStoredBillPrefix();
  const str = String(token ?? '').trim();
  if (!str) return prefix ? `${prefix}1` : '1';

  if (!prefix) return str;

  // Extract the numeric part (e.g. from "ROHIT-2" -> 2, "REAL-2" -> 2, "B-2" -> 2, "2" -> 2)
  const match = str.match(/\d+$/);
  const num = match ? match[0] : str;

  const normalizedPrefix = (prefix.endsWith('-') || prefix.endsWith('/') || prefix.endsWith('_'))
    ? prefix
    : `${prefix}-`;

  return `${normalizedPrefix}${num}`;
};
