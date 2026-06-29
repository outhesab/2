export const WIDGET_OPTIONS = [
  { id: 'chart', icon: '📈', label: 'Performans Grafiği' },
  { id: 'quickStats', icon: '📊', label: 'Hızlı Özet' },
  { id: 'recentSales', icon: '🛒', label: 'Son Satışlar' },
  { id: 'tips', icon: '💡', label: 'Akıllı Öneriler' },
  { id: 'stockAlerts', icon: '⚠️', label: 'Stok Uyarıları' },
  { id: 'activity', icon: '📋', label: 'Son Aktiviteler' },
  { id: 'excelBar', icon: '📊', label: 'Excel İndir' },
  { id: 'categoryChart', icon: '🍩', label: 'Kategori Dağılımı' },
  { id: 'kasaSayim', icon: '🏦', label: 'Gün Sonu Kasa Sayımı' },
  { id: 'yedekHatirlatma', icon: '💾', label: 'Yedek Hatırlatma' },
] as const;

export type WidgetId = (typeof WIDGET_OPTIONS)[number]['id'];
