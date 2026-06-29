/**
 * Roadmap.tsx — Ürün Yol Haritası
 *
 * PARSPEL'in gelecek vizyonunu ve geliştirme aşamalarını
 * kullanıcıya sunan etkileşimli zaman çizelgesi.
 */

import { Rocket, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  category: 'teknik' | 'özellik' | 'ux' | 'yapay-zeka';
  date?: string;
}

const ROADMAP_DATA: RoadmapItem[] = [
  {
    title: 'Temel Altyapı ve Veri Güvenliği',
    description: 'Offline-first mimari, IndexedDB entegrasyonu ve güvenli yedekleme sisteminin kurulması.',
    status: 'completed',
    category: 'teknik',
    date: 'v3.0.0',
  },
  {
    title: 'Agent-Based Yönetim Sistemi',
    description: 'Satış, Stok, Cari ve Kasa ajanlarının geliştirilmesi; iş mantığının ajanlara devredilmesi.',
    status: 'completed',
    category: 'yapay-zeka',
    date: 'v3.10.0',
  },
  {
    title: 'Sayfa Modernizasyonu ve Modülerizasyon',
    description:
      'Tüm ana sayfaların (Suppliers, Cari, Monitor vb.) monolit yapıdan kurtarılıp modüler hale getirilmesi.',
    status: 'completed',
    category: 'ux',
    date: 'v3.32.0',
  },
  {
    title: 'Gelişmiş Analitik ve Öngörü',
    description: 'Anomali tespit motorunun geliştirilmesi ve satış tahminleme algoritmalarının entegrasyonu.',
    status: 'in-progress',
    category: 'yapay-zeka',
    date: 'v3.33.0',
  },
  {
    title: 'Çoklu Mağaza ve Merkezi Yönetim',
    description: 'Birden fazla şubenin tek bir merkezden yönetilebildiği "Multi-Store" mimarisinin kurulması.',
    status: 'planned',
    category: 'özellik',
    date: 'v3.40.0',
  },
  {
    title: 'Mobil Uygulama (PWA+)',
    description: 'Tüm özelliklerin mobil cihazlarda optimize edildiği, push bildirim destekli tam kapsamlı PWA.',
    status: 'planned',
    category: 'ux',
    date: 'v3.50.0',
  },
  {
    title: 'Otomatik Fatura ve E-Ticaret Entegrasyonu',
    description: 'E-fatura sistemleri ve online satış kanalları ile tam otomatik senkronizasyon.',
    status: 'planned',
    category: 'özellik',
    date: 'v3.60.0',
  },
];

const StatusIcon = ({ status }: { status: RoadmapItem['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'in-progress':
      return <CircleDot className="w-5 h-5 text-blue-500 animate-pulse" />;
    case 'planned':
      return <Clock className="w-5 h-5 text-slate-400" />;
  }
};

const CategoryBadge = ({ category }: { category: RoadmapItem['category'] }) => {
  const config = {
    teknik: { label: 'Teknik', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    özellik: { label: 'Özellik', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    ux: { label: 'UX/UI', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    'yapay-zeka': { label: 'AI/ML', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };
  const { label, color } = config[category];
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      {label}
    </Badge>
  );
};

export default function Roadmap() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Yol Haritası</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          PARSPEL'in gelişim yolculuğu. Mevcut yeteneklerimizi geliştirirken, geleceğin akıllı işletme yönetim sistemini
          inşa ediyoruz.
        </p>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-slate-300 before:to-slate-200">
        {ROADMAP_DATA.map((item, index) => (
          <div key={index} className="relative pl-12 group">
            <div className="absolute left-0 top-1 z-10 flex items-center justify-center w-10 h-10 bg-background border-2 border-primary rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200">
              <StatusIcon status={item.status} />
            </div>

            <Card className="transition-all duration-300 group-hover:shadow-md group-hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={item.category} />
                    {item.date && <span className="text-xs text-muted-foreground font-mono">{item.date}</span>}
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
