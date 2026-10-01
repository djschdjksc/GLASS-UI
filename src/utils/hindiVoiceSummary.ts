// Hindi Voice Summary & Speech Synthesizer
import type { RawItem, FinishedItem } from '../types';

export interface VoiceSummaryData {
  partyName?: string;
  activeTable?: 'left' | 'right' | null;
  rawItems?: RawItem[];
  finishedItems?: FinishedItem[];
  dynamicCols?: { field: string; label: string }[];
}

export const speakVoiceSummaryHindi = (data: VoiceSummaryData) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported in this environment');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const { partyName, activeTable = 'left', rawItems = [], finishedItems = [], dynamicCols = [] } = data;

  const cleanParty = (partyName || '').trim();

  // Calculate raw items total
  const validRaws = rawItems.filter(r => (r.name && r.name.trim()) || Number(r.qty) > 0 || Number(r.uCap) > 0 || Number(r.lCap) > 0);
  const sizeKeys = ['qty', ...dynamicCols.map(c => c.field)];
  const grandTotalRaw = rawItems.reduce((acc, r) => {
    let rowSum = 0;
    sizeKeys.forEach(k => {
      rowSum += Number((r as any)[k]) || 0;
    });
    rowSum += Number(r.uCap) || 0;
    rowSum += Number(r.lCap) || 0;
    return acc + rowSum;
  }, 0);

  // Calculate finished moulds total
  const validFinished = finishedItems.filter(f => (f.mould && f.mould.trim()) || Number(f.qty) > 0 || Number(f.total) > 0);
  const totalMouldQty = validFinished.reduce((acc, f) => acc + (Number(f.qty) || 0), 0);
  const totalAmount = validFinished.reduce((acc, f) => acc + (Number(f.total) || 0), 0);

  let speechText = '';

  if (activeTable === 'right' && validFinished.length > 0) {
    // Speak Right Table summary
    speechText = `${cleanParty ? `पार्टी ${cleanParty}. ` : ''}राइट टेबल में कुल ${validFinished.length} मोल्ड हैं. कुल क्वांटिटी ${totalMouldQty} पीस, और कुल रकम ${Math.round(totalAmount).toLocaleString('hi-IN')} रुपये है.`;
  } else if (validRaws.length > 0 || cleanParty) {
    // Speak Left Table & Overall summary
    speechText = `${cleanParty ? `पार्टी ${cleanParty}. ` : ''}लेफ्ट टेबल में कुल ${validRaws.length} आइटम हैं, जिनका कुल योग ${grandTotalRaw} पीस है.`;
    if (validFinished.length > 0) {
      speechText += ` तैयार माल में ${validFinished.length} मोल्ड, कुल रकम ${Math.round(totalAmount).toLocaleString('hi-IN')} रुपये.`;
    }
  } else {
    speechText = 'टेबल में अभी कोई डाटा मौजूद नहीं है. कृपया पहले आइटम या पार्टी भरें.';
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Attempt to select Hindi voice if installed in OS/browser
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN' || v.name.toLowerCase().includes('hindi'));
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  } else {
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.lang.startsWith('en-IN'));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
};
