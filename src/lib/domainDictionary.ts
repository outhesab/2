/**
 * PARSPEL — Domain Dictionary (Sektörel Sözlük)
 * Soba bayii ortamında sık kullanılan terimler ve olası yanlış anlaşılmalar.
 * Bu sözlük, AI'nın sesli komutlardaki gürültüyü temizlemesine yardımcı olur.
 */

export const DOMAIN_DICTIONARY = {
  products: {
    'soba': ['soba', 'ocak', 'şömine', 'döküm'],
    'boru': ['boru', 'dirsek', 't bağlantı', 'soket', 'ayar borusu'],
    'pelet': ['pelet', 'yakıt', 'pelet yakıt', 'torba pelet'],
    'aksesuar': ['kül kovası', 'sopa', 'fitil', 'koruma plakası', 'lastik'],
  },
  actions: {
    'sale': ['sat', 'satış yap', 'ekle', 'yaz', 'gir'],
    'return': ['iade', 'geri al', 'iade et', 'geri gönder'],
    'cancel': ['iptal', 'sil', 'iptal et', 'vazgeç'],
    'update': ['düzelte', 'fiyatı değiştir', 'güncelle', 'yanlış girmişim'],
  },
  financials: {
    'payment': ['nakit', 'kart', 'pos', 'havale', 'eft', 'vadeli', 'cari'],
    'balance': ['bakiye', 'borç', 'alacak', 'kalan', 'tahsilat'],
  },
  entities: {
    'customer': ['cari', 'müşteri', 'hesap', 'kişi'],
    'cashier': ['kasa', 'nakit kasa', 'banka', 'pos kasası'],
  }
};

export function getDomainContext(): string {
  return JSON.stringify(DOMAIN_DICTIONARY, null, 2);
}
