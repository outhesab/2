/**
 * Support.tsx — Yardım ve Destek
 * 
 * Kullanıcıların sorunlarını bildirebileceği, dökümanlara
 * ulaşabileceği ve destek alabileceği merkez.
 */

import React from 'react';
import { Mail, MessageSquare, LifeBuoy, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HELP_TOPICS = [
  {
    title: 'Hızlı Başlangıç Rehberi',
    description: 'Sistemi ilk kez kullanıyorsanız, kurulum ve temel işlemler için rehberimize göz atın.',
    icon: <BookOpen className=\"w-6 h-6 text-blue-500\" />,
    action: 'Rehberi Aç',
    link: '#'
  },
  {
    title: 'Sıkça Sorulan Sorular',
    description: 'Ödeme yöntemleri, stok takibi ve yedekleme ile ilgili en çok sorulan sorular ve cevapları.',
    icon: <MessageSquare className=\"w-6 h-6 text-green-500\" />,
    action: 'SSS Görüntüle',
    link: '#'
  },
  {
    title: 'Hata Bildirimi',
    description: 'Sistemde bir hata mı fark ettiniz? Geliştirici ekibimize anında bildirin, hemen çözelim.',
    icon: <LifeBuoy className=\"w-6 h-6 text-red-500\" />,
    action: 'Hata Bildir',
    link: '#'
  },
];

export default function Support() {
  return (
    <div className=\"max-w-4xl mx-auto p-6 space-y la-12\">
      <div className=\"text-center space-y-4 mb-12\">
        <div className=\"inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2\">
          <LifeBuoy className=\"w-8 h-8 text-primary\" />
        </div>
        <h1 className=\"text-3xl font-bold tracking-tight\">Destek Merkezi</h1>
        <p className=\"text-muted-foreground max-w-2xl mx-auto\">
          Size yardımcı olmak için buradayız. Karşılaştığınız sorunları bildirebilir veya 
          uygulamayı daha verimli kullanmak için rehberlerimize göz atabilirsiniz.
        </p>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6">
        {HELP_TOPICS.map((topic, index) => (
          <Card key={index} className=\"flex flex-col h-full hover:shadow-md transition-all duration-300\">
            <CardHeader>
              <div className=\"mb-4 p-2 w-fit rounded-lg bg-muted">
                {topic.icon}
              </div>
              <CardTitle className=\"text-lg\">{topic.title}</CardTitle>
            </CardHeader>
            <CardContent className=\"flex-1 flex flex-col justify-between space-y-6">
              <p className=\"text-sm text-muted-foreground leading-relaxed">
                {topic.description}
              </p>
              <Button variant=\"outline\" className=\"w-full\" asChild>
                <a href={topic.link} target=\"_blank\" rel=\"noreferrer\" className=\"flex items-center justify-center gap-2\">
                  {topic.action} <ExternalLink className=\"w-3 h-3\" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className=\"p-8 rounded-3xl bg-muted/50 border border-border text-center space-y-6">
        <div className=\"flex justify-center\">\n          <div className=\"p-4 bg-background rounded-full shadow-sm\">\n            <Mail className=\"w-8 h-8 text-primary\" />\n          </div>\n        </div>
        <div className=\"space-y-2\">\n          <h3 className=\"text-xl font-bold\">Doğrudan İletişime Geçin</h3>\n          <p className=\"text-muted-foreground max-w-md mx-auto\">\n            Kendi başınıza çözemediğiniz sorunlar için bize e-posta yoluyla ulaşabilirsiniz.\n          </p>\n        </div>
        <Button size=\"lg\" className=\"px-8\">
          destek@parspel.com
        </Button>
      </div>
    </div>
  );
}
