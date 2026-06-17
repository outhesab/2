# CODER TASK — SESSION 2 (Refactor İşleri)

> **Agent:** qwen3-coder:free  
> **Tahmini Süre:** 4-6 saat  
> **Dosya Sayısı:** ~8 dosya  
> **Risk Seviyesi:** 🟡 Orta  

---

## GENEL TALİMATLAR

### Ön Koşul
✅ **SESSION 1 tamamlanmış olmalı** (5.12, 6.8, J1)

### Zorunlu Okuma
1. `AGENTS.md` — Component kuralları (bölüm 4)
2. `WEEKLY_PLAN.md` — Görev 6.2 ve 6.3
3. `docs/BILESEN_MIMARISI.md` (varsa)

### Refactor Kuralları
- ✅ Custom component max 150 satır
- ✅ Page component max 800 satır
- ✅ Her component 4 state destekler: loading, empty, error, success
- ✅ `@/` import alias kullan (relative path yasak)
- ✅ Props TypeScript ile tip güvenliği
- ✅ Mevcut fonksiyonaliteyi kırma
- ❌ Korunan UI component'lere (`src/components/ui/`) dokunma

### Component Bölme Stratejisi
```typescript
// 1. State'i belirle — hangi component neye ihtiyaç duyar?
// 2. Shared state için Context veya props drilling
// 3. Event handler'ları üst component'te tut
// 4. Alt component'ler presentation-only olmalı (mümkünse)
```

---

## GÖREV 1: AIAsistan.tsx → 3 Modül (6.2)

### Hedef
`src/pages/AIAsistan.tsx` dosyasını 3 bağımsız modüle ayır.

### Mevcut Durum Analizi
1. Dosyayı oku: `src/pages/AIAsistan.tsx`
2. Satır sayısı ve sorumlulukları belirle
3. State bağımlılıklarını çıkar

### Hedef Yapı
```
src/pages/AIAsistan/
├── index.tsx              (ana orchestrator, 150-200 satır)
├── ChatPanel.tsx          (chat input, mesaj gönderme)
├── MessageList.tsx        (mesajları render etme)
└── ActionHistory.tsx      (işlem geçmişi sidebar)
```

### Bölme Planı

#### **1. ChatPanel.tsx**
**Sorumluluk:** Kullanıcı input, gönder butonu, ses kaydı (varsa)

```typescript
interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatPanel({ onSendMessage, isLoading, disabled }: ChatPanelProps) {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };
  
  return (
    <div className="chat-panel">
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading || disabled}
      />
      <Button onClick={handleSend} disabled={isLoading}>
        Gönder
      </Button>
    </div>
  );
}
```

#### **2. MessageList.tsx**
**Sorumluluk:** Mesaj listesini render et, scroll yönetimi

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <LoadingIndicator />}
      <div ref={scrollRef} />
    </div>
  );
}
```

#### **3. ActionHistory.tsx**
**Sorumluluk:** Geçmiş işlemleri göster, filtrele

```typescript
interface Action {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
}

interface ActionHistoryProps {
  actions: Action[];
  onClearHistory?: () => void;
}

export function ActionHistory({ actions, onClearHistory }: ActionHistoryProps) {
  return (
    <aside className="action-history">
      <div className="header">
        <h3>İşlem Geçmişi</h3>
        <Button onClick={onClearHistory} size="sm">Temizle</Button>
      </div>
      <ul>
        {actions.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </ul>
    </aside>
  );
}
```

#### **4. index.tsx (Ana Orchestrator)**
**Sorumluluk:** State yönetimi, AI API çağrıları, child component'leri koordine et

```typescript
export default function AIAsistan() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    const userMsg = { id: nanoid(), role: 'user', content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    
    try {
      const response = await callAIApi(content);
      const assistantMsg = { id: nanoid(), role: 'assistant', content: response, timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);
      
      // Action kaydet
      setActions((prev) => [...prev, { id: nanoid(), type: 'ai_query', description: content, timestamp: Date.now(), status: 'success' }]);
    } catch (error) {
      logger.error('AI API hatası', { error });
      showToast('AI yanıt veremedi', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="ai-asistan-layout">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatPanel onSendMessage={handleSendMessage} isLoading={isLoading} />
      <ActionHistory actions={actions} onClearHistory={() => setActions([])} />
    </div>
  );
}
```

### Adımlar
1. `src/pages/AIAsistan/` klasörünü oluştur
2. Mevcut `AIAsistan.tsx` içeriğini analiz et
3. ChatPanel.tsx oluştur → input ve send logic taşı
4. MessageList.tsx oluştur → mesaj render logic taşı
5. ActionHistory.tsx oluştur → geçmiş logic taşı
6. index.tsx oluştur → state ve API logic tut
7. Eski `src/pages/AIAsistan.tsx` dosyasını sil
8. Import yollarını güncelle (eğer başka yerde import ediliyorsa)
9. Test et: `pnpm run test:run`
10. Build et: `pnpm run build`

### Başarı Kriteri
- ✅ 4 dosya oluşturuldu (index, ChatPanel, MessageList, ActionHistory)
- ✅ Her dosya <150 satır
- ✅ Props tip güvenliği var
- ✅ Tüm fonksiyonalite korundu
- ✅ CI pipeline pass etti

### Changelog Entry
```typescript
{
  version: '3.8.0',
  date: '12 Haziran 2026',
  title: 'AIAsistan component refactor',
  summary: 'AIAsistan.tsx 3 modüle ayrıldı: ChatPanel, MessageList, ActionHistory.',
  changes: [
    { type: 'iyilestirme', text: 'AIAsistan component bölündü - maintainability (Görev 6.2)' },
  ],
}
```

### Tahmini Süre
⏱️ 2-3 saat

---

## GÖREV 2: Fatura.tsx → 3 Modül (6.3)

### Hedef
`src/pages/Fatura.tsx` dosyasını 3 bağımsız modüle ayır.

### Mevcut Durum Analizi
1. Dosyayı oku: `src/pages/Fatura.tsx`
2. Satır sayısı ve sorumlulukları belirle
3. PDF, form, liste logic'lerini ayır

### Hedef Yapı
```
src/pages/Fatura/
├── index.tsx              (ana orchestrator, route/state)
├── FaturaList.tsx         (fatura listesi, arama, filtreleme)
├── FaturaForm.tsx         (yeni fatura oluşturma formu)
└── FaturaPDF.tsx          (PDF oluşturma ve önizleme)
```

### Bölme Planı

#### **1. FaturaList.tsx**
**Sorumluluk:** Fatura listesi, arama, sıralama

```typescript
interface Invoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  date: number;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface FaturaListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export function FaturaList({ invoices, onSelectInvoice, onDeleteInvoice }: FaturaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredInvoices = invoices.filter((inv) =>
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="fatura-list">
      <input 
        type="search" 
        placeholder="Müşteri ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Fatura No</th>
            <th>Müşteri</th>
            <th>Tarih</th>
            <th>Tutar</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.invoiceNo}</td>
              <td>{inv.customerName}</td>
              <td>{new Date(inv.date).toLocaleDateString('tr-TR')}</td>
              <td>{inv.total.toFixed(2)} ₺</td>
              <td>
                <Button size="sm" onClick={() => onSelectInvoice(inv)}>Görüntüle</Button>
                <Button size="sm" variant="destructive" onClick={() => onDeleteInvoice(inv.id)}>Sil</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### **2. FaturaForm.tsx**
**Sorumluluk:** Yeni fatura oluşturma, ürün ekleme

```typescript
interface FaturaFormData {
  customerName: string;
  items: Array<{ productId: string; qty: number; price: number }>;
  notes?: string;
}

interface FaturaFormProps {
  onSubmit: (data: FaturaFormData) => void;
  onCancel: () => void;
}

export function FaturaForm({ onSubmit, onCancel }: FaturaFormProps) {
  const [formData, setFormData] = useState<FaturaFormData>({
    customerName: '',
    items: [],
  });
  
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', qty: 1, price: 0 }],
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="fatura-form">
      <label>
        Müşteri Adı:
        <input 
          type="text" 
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          required
        />
      </label>
      
      <div className="items-section">
        <h3>Ürünler</h3>
        {formData.items.map((item, idx) => (
          <div key={idx} className="item-row">
            {/* Ürün seçimi, miktar, fiyat */}
          </div>
        ))}
        <Button type="button" onClick={handleAddItem}>+ Ürün Ekle</Button>
      </div>
      
      <div className="form-actions">
        <Button type="submit">Oluştur</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>İptal</Button>
      </div>
    </form>
  );
}
```

#### **3. FaturaPDF.tsx**
**Sorumluluk:** PDF oluşturma, önizleme, yazdırma

```typescript
interface FaturaPDFProps {
  invoice: Invoice;
  onDownload: () => void;
  onPrint: () => void;
}

export function FaturaPDF({ invoice, onDownload, onPrint }: FaturaPDFProps) {
  return (
    <div className="fatura-pdf">
      <div className="pdf-toolbar">
        <Button onClick={onDownload}>İndir (PDF)</Button>
        <Button onClick={onPrint}>Yazdır</Button>
      </div>
      
      <div className="pdf-preview">
        {/* PDF içeriği - canvas veya iframe */}
        <div className="invoice-template">
          <h1>Fatura #{invoice.invoiceNo}</h1>
          <p>Müşteri: {invoice.customerName}</p>
          {/* Detaylar */}
        </div>
      </div>
    </div>
  );
}
```

#### **4. index.tsx (Ana Orchestrator)**
**Sorumluluk:** Route logic, DB CRUD, state

```typescript
export default function Fatura() {
  const { db, save } = useDB();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleCreateInvoice = async (data: FaturaFormData) => {
    const newInvoice: Invoice = {
      id: nanoid(),
      invoiceNo: `INV-${Date.now()}`,
      ...data,
      date: Date.now(),
      status: 'unpaid',
    };
    
    await save((prevDB) => ({
      ...prevDB,
      invoices: [...prevDB.invoices, newInvoice],
    }));
    
    setIsFormOpen(false);
    showToast('Fatura oluşturuldu', 'success');
  };
  
  const handleDeleteInvoice = async (id: string) => {
    await save((prevDB) => ({
      ...prevDB,
      invoices: prevDB.invoices.filter((inv) => inv.id !== id),
    }));
    showToast('Fatura silindi', 'success');
  };
  
  return (
    <div className="fatura-page">
      {!isFormOpen && !selectedInvoice && (
        <>
          <Button onClick={() => setIsFormOpen(true)}>+ Yeni Fatura</Button>
          <FaturaList 
            invoices={db.invoices} 
            onSelectInvoice={setSelectedInvoice}
            onDeleteInvoice={handleDeleteInvoice}
          />
        </>
      )}
      
      {isFormOpen && (
        <FaturaForm 
          onSubmit={handleCreateInvoice}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
      
      {selectedInvoice && (
        <FaturaPDF 
          invoice={selectedInvoice}
          onDownload={() => {/* PDF logic */}}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}
```

### Adımlar
1. `src/pages/Fatura/` klasörünü oluştur
2. Mevcut `Fatura.tsx` içeriğini analiz et
3. FaturaList.tsx oluştur → liste logic taşı
4. FaturaForm.tsx oluştur → form logic taşı
5. FaturaPDF.tsx oluştur → PDF logic taşı
6. index.tsx oluştur → state ve DB logic tut
7. Eski `src/pages/Fatura.tsx` dosyasını sil
8. Import yollarını güncelle
9. Test et: `pnpm run test:run`
10. Build et: `pnpm run build`

### Özel Dikkat
- **PDF logic** — eğer ExcelJS veya jsPDF kullanılıyorsa, lazy import et
- **Form validation** — react-hook-form kullanıyorsa, FaturaForm içinde tut
- **Print styles** — `@media print` CSS'i koru

### Başarı Kriteri
- ✅ 4 dosya oluşturuldu (index, FaturaList, FaturaForm, FaturaPDF)
- ✅ Her dosya <150 satır (index max 200)
- ✅ PDF oluşturma çalışıyor
- ✅ Form submit çalışıyor
- ✅ CI pipeline pass etti

### Changelog Entry
```typescript
{
  version: '3.8.0',
  date: '12 Haziran 2026',
  title: 'Fatura component refactor',
  summary: 'Fatura.tsx 3 modüle ayrıldı: FaturaList, FaturaForm, FaturaPDF.',
  changes: [
    { type: 'iyilestirme', text: 'Fatura component bölündü - maintainability (Görev 6.3)' },
  ],
}
```

### Tahmini Süre
⏱️ 2-3 saat

---

## SEANS SONU KONTROL LİSTESİ

### ✅ Tamamlanması Gerekenler
- [ ] Görev 1: AIAsistan.tsx → 3 modül bölündü
- [ ] Görev 2: Fatura.tsx → 3 modül bölündü
- [ ] `src/lib/changelog.ts` güncellendi (2 entry, version 3.8.0)
- [ ] CI pipeline pass etti
- [ ] Commit yapıldı: `git add . && git commit -m "refactor: session 2 görevleri tamamlandı (6.2, 6.3)"`
- [ ] `WEEKLY_PLAN.md`'de 6.2 ve 6.3 işaretlendi: `⬜ → ✅`

### 📊 Beklenen Metrikler
- Değişen dosya sayısı: ~8 dosya (4 AIAsistan + 4 Fatura)
- Eklenen satır: ~800 (yeni component'ler)
- Silinen satır: ~600 (eski monolitler)
- Component sayısı: +6
- Max component boyutu: <150 satır ✅

---

## SORUN GİDERME

### State Paylaşımı Sorunları
Eğer alt component'ler arası state paylaşımı gerekiyorsa:

**Seçenek 1: Props Drilling**
```typescript
// Basit durumlar için yeterli
<ChildA value={state} onChange={setState} />
```

**Seçenek 2: Context**
```typescript
// Derin component tree için
const AIContext = createContext<AIContextType | null>(null);

export function AIAsistanProvider({ children }) {
  const [state, setState] = useState(...);
  return (
    <AIContext.Provider value={{ state, setState }}>
      {children}
    </AIContext.Provider>
  );
}
```

### Import Hatası
```bash
# Eğer import path hatası varsa
pnpm run typecheck
# @/ alias kullanıldığından emin ol
```

### Performans Sorunu
```typescript
// Eğer component çok render oluyorsa
import { memo } from 'react';

export const MessageList = memo(function MessageList({ messages }) {
  // ...
});
```

---

## NOT

- **SESSION 2, SESSION 1'e bağımlı değil** — ayrı commit'ler
- Her görev bağımsız — AIAsistan başarısızsa, Fatura'ya geç
- **Rollback gerekirse:** `git revert HEAD` → problemi analiz et → tekrar dene

**Session 2 bitince** → `WEEKLY_PLAN.md` güncelle, tüm seans görevleri tamamlandı işaretle.
