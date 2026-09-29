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
