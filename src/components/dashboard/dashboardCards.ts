import {
  FileCheck,
  ScrollText,
  FileText,
  BookMarked,
  Mail,
  Landmark,
  FileSpreadsheet,
  DoorOpen,
  Home,
  ClipboardList,
  LucideIcon
} from 'lucide-react';
import { getMasterColumns } from '../admin/KuaDailyManagement';

export interface DashboardCardDef {
  id: string;
  label: string;
  subtitle: string;
  unit: string;
  fields: string[];
  icon: LucideIcon;
  color: {
    box: string;
    text: string;
  };
}

interface CardMeta {
  unit: string;
  icon: LucideIcon;
  color: {
    box: string;
    text: string;
  };
}

const CARD_META: Record<string, CardMeta> = {
  'pendaftaran_nikah_kantor': { unit: 'Peristiwa', icon: FileText, color: { box: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', text: 'text-indigo-500' } },
  'pendaftaran_nikah_luar_kantor': { unit: 'Peristiwa', icon: FileSpreadsheet, color: { box: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', text: 'text-cyan-500' } },
  'pelaksanaan_nikah_kantor': { unit: 'Pasang', icon: Home, color: { box: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', text: 'text-purple-500' } },
  'pelaksanaan_nikah_luar_kantor': { unit: 'Pasang', icon: DoorOpen, color: { box: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', text: 'text-blue-500' } },
  'pelaksanaan_bimwin': { unit: 'Catin', icon: FileCheck, color: { box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', text: 'text-amber-500' } },
  'duplikat_buku_nikah': { unit: 'Buku', icon: BookMarked, color: { box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', text: 'text-rose-500' } },
  'surat_rekomendasi_nikah': { unit: 'Surat', icon: ScrollText, color: { box: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', text: 'text-orange-500' } },
  'legalisir_buku_nikah': { unit: 'Buku', icon: FileText, color: { box: 'bg-lime-500/10 text-lime-600 dark:text-lime-400', text: 'text-lime-500' } },
  'surat_keluar': { unit: 'Surat', icon: Mail, color: { box: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', text: 'text-sky-500' } },
  'pelaksanaan_wakaf': { unit: 'Akta', icon: Landmark, color: { box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', text: 'text-violet-500' } }
};

const DEFAULT_META: CardMeta = {
  unit: 'Berkas',
  icon: ClipboardList,
  color: { box: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', text: 'text-slate-500' }
};

export function getDashboardCards(): DashboardCardDef[] {
  return getMasterColumns().map(col => {
    const meta = CARD_META[col.key] || DEFAULT_META;
    return {
      id: col.key,
      label: col.label,
      subtitle: col.shortLabel,
      unit: meta.unit,
      fields: [col.key],
      icon: meta.icon,
      color: meta.color
    };
  });
}

export function getDashboardCardSelection(): string[] {
  const cards = getDashboardCards();
  const saved = localStorage.getItem('kua_dashboard_cards');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((id: string) => cards.some(c => c.id === id));
        if (filtered.length > 0) return filtered;
      }
    } catch {
      // fallback
    }
  }
  return cards.slice(0, 4).map(c => c.id);
}

export function setDashboardCardSelection(ids: string[]) {
  localStorage.setItem('kua_dashboard_cards', JSON.stringify(ids));
  window.dispatchEvent(new Event('kua_dashboard_cards_updated'));
}

export function computeCardValue(card: DashboardCardDef, dailyData: Record<string, any>[]): number {
  return dailyData.reduce((acc, curr) => {
    let sum = 0;
    for (const f of card.fields) {
      sum += Number(curr[f] || 0);
    }
    return acc + sum;
  }, 0);
}
