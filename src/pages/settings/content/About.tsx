/**
 * About.tsx — PARSPEL Hakkında
 *
 * Uygulamanın vizyonu, misyonu ve temel teknik prensiplerini
 * anlatan kurumsal tanıtım sayfası.
 */

import { ShieldCheck, Zap, Cpu, Globe, Heart, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PHILOSOPHY = [
  {
    icon: <Globe className="w-6 h-6 text-blue-500" />,
    title: 'Offline-First Mimari',
    description:
      'İnternet bağlantısı olsun ya da olmasın, işleriniz asla durmaz. Verileriniz önce yerelde saklanır, bağlantı geldiğinde sessizce bulutla senkronize edilir.',
    detail: 'IndexedDB ve localStorage stratejileriyle sıfır gecikme (zero-latency) deneyimi sunuyoruz.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-amber-500" />,
    title: 'Ajan Tabalı Yönetim',
    description: 'Sadece veri girişi yapmazsınız, yanınızda uzman bir ekip varmış gibi çalışırsınız.',
    detail: 'Satış, Stok ve Cari ajanlarımız arka planda kuralları denetler, anomalileri bulur ve sizi uyarır.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
    title: 'Sıfır Hata Vizyonu',
    description: 'Hataları kullanıcı fark etmeden önce yakalayan gelişmiş RuleEngine ve Audit sistemleri.',
    detail: 'Her işlem, onlarca kuraldan geçer. Hatalı bir kayıt oluşturulması neredeyse imkansızdır.',
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    title: 'Yüksek Performans',
    description: 'Binlerce satırlık veriyi saniyeler içinde işleyen optimize edilmiş motorlar.',
    detail: 'BatchQueue ve async processing ile UI asla donmaz, işlemler akıcı şekilde tamamlanır.',
  },
  {
    icon: <Layers className="w-6 h-6 text-purple-500" />,
    title: 'Modüler ve Esnek',
    description: 'İhtiyaçlarınıza göre genişleyebilen, yeni modüllerin hızla eklenebildiği esnek yapı.',
    detail: 'Orchestrator pattern ile geliştirilen sayfalar, işletmenizin büyüme hızına ayak uydurur.',
  },
  {
    icon: <Heart className="w-6 h-6 text-red-500" />,
    title: 'Kullanıcı Odaklılık',
    description: 'Karmaşık ERP sistemleri değil, herkesin kolayca kullanabileceği modern bir deneyimi hedefliyoruz.',
    detail: 'Minimalist arayüz, akıllı kestirmeler ve sezgisel navigasyon.',
  },
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight">PARSPEL Hakkında</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Soba ve Pelet sektörünün dijital dönüşüm yolculuğuna eşlik eden, akıllı veri yönetimi ve yapay zeka destekli
          asistanların buluştuğu yeni nesil bir işletme yönetim platformudur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PHILOSOPHY.map((item, index) => (
          <Card key={index} className="group hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <div className="mb-4 p-2 w-fit rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                {item.icon}
              </div>
              <CardTitle className="text-xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              <p className="text-xs text-foreground/60 italic border-l-2 border-primary/30 pl-3">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-20 p-8 rounded-3xl bg-primary text-primary-foreground relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-bold">Vizyonumuz</h2>
          <p className="text-primary-foreground/90 leading-relaxed max-w-3xl">
            Sadece bir kayıt tutma aracı değil, işletme sahibinin stratejik kararlar almasını sağlayan bir "İş Zekası"
            (Business Intelligence) merkezi olmak. Karmaşıklığı ortadan kaldırıp, veriyi anlamlı bilgiye dönüştürerek
            işletmelerin büyüme yolculuğunu hızlandırmak.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-20 -mb-20 blur-2xl" />
      </div>
    </div>
  );
}
