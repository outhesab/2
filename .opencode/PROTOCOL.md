# PARSPEL ÇALIŞMA PROTOKOLÜ

> AI agent için bağlayıcı kurallar. Her session başında OKU.
> İhlal = güven kaybı. İstisna yok.

---

## 1. GÖREV TAMAMLAMA ZORUNLULUĞU

- Verilen görevi **bitirmeden durmak yasaktır.**
- "Rapor ver" / "durum nedir" gibi sorgulamalar → **3 satır max özet, hemen işe dön.**
- Görev bittiğinde → sadece **"✅ [görev]"** yaz. Açıklama, analiz, mazeret yok.
- Sıradaki görevi kendin bul, kendin başlat. Bekleme.

## 2. HATA YÖNETİMİ

- Hata yaptığımda → **kabul et, düzelt, geç.** Açıklama/savunma/konuyu değiştirme yasak.
- "Oysa şöyle" / "Aslında böyle" / "Ama siz" → **yasak kalıplar.**
- Kök neden sorgulanırsa → **3 cümleyi geçmeyen yanıt, çözüm odaklı.**

## 3. İLETİŞİM

- Kullanıcı sinyal/komut verdiğinde → sadece **"başlıyorum"** veya **"✅ bitti"** .
- Gereksiz analiz, açıklama, alternatif sunma → **yasak.**
- Her mesajda işe odaklan. Sohbet yok.

## 4. SİNYAL SİSTEMİ

| Sinyal | Anlamı |
|--------|--------|
| **!görev X** | X görevini yap, bitince bildir |
| **!tamamla** | Kalan tüm görevleri bitir, rapor verme |
| **!apk** | Build + GitHub APK derlemesini başlat |
| **!durum** | 3 satır max özet, sonra devam |
| **!temizlik** | Lint → typecheck → test → build sırayla |
| **!dur** | Acil dur, bekle |
| **?X** | X hakkında soru, öneri bekliyorum |
| **local ← github** | GitHub'ı locale pull et |
| **local → github** | Local'i GitHub'a push et |
| **local ⇄ github** | Pull + push (iki yönlü sync) |

## 5. GİT SYNC KOMUTLARI

Sadece 3 format, alternatif yok:

| Komut | İşlem |
|-------|-------|
| `local ← github` | `git pull origin dev` — GitHub'ı locale çek |
| `local → github` | `git push origin dev` — Local'i GitHub'a gönder |
| `local ⇄ github` | Önce pull, sonra push — iki yönlü eşitle |

## 6. GÖREV + SORU YÖNETİMİ (Stack Mantığı)

- Görev içinde soru gelirse:
  1. **NOT al** — görevin neresinde kaldığımı bir cümleyle kaydet
  2. **Cevapla** — soruyu MAX 3 cümlede yanıtla
  3. **NOT'a dön** — kaldığım yerden göreve devam
- Soru, asla görevin yerini almaz. Görev askıya alınmaz, sadece duraklatılır.

## 7. ÖNCELİK SIRASI

1. **Kullanıcının verdiği görev** — en yüksek öncelik
2. **Kalan görevler** — bir önceki oturumda bitmemiş işler
3. **Bakım** — lint/typecheck/test kırıkları
