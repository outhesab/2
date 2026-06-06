# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 05.06.2026
- **Hedef:** Skill sistemini iyileştir, proje içine taşı
- **Durum:** Skill'ler projeye taşındı, MEMORY.md aktif

## Önemli Kararlar

- Skill'ler `~/.config/opencode/skills/` yerine proje içi `.opencode/skills/` klasöründe
- `opencode.json`'da `skills.paths` ile referans verildi — GitHub'da versiyonlanır
- `MEMORY.md` ile cross-session hafıza — `instructions` dizisinde referans
- SKILL_SPEC.md ve SKILL_HOOKS.md standartları oluşturuldu

## Yapılacaklar

- [ ] `git commit` ile değişiklikleri kaydet
- [ ] Yeni skill eklendiğinde `.opencode/skills/` klasörüne ekle

## Notlar

- `data-query` diye bir klasör PARSPEL'de yok, başka projedeymiş
- Tüm skill'ler spec'e uygun hale getirildi (version, hooks, tools, requires)
- Skill'ler otomatik çalışır, manuel müdahale gerekmez

---

## Geçmiş

| Tarih | Konu | Karar/Not |
|-------|------|-----------|
| 05.06.2026 | GitHub'dan çekme | `dev` branch'i `15f34d1`'e güncellendi, typecheck+lint+test temiz |
| 05.06.2026 | Skill Creator düzeltme | Yanlış yol düzeltildi, validation, spec, hook sistemi eklendi |
| 05.06.2026 | Tüm skill'ler güncellendi | 7 skill de spec'e uygun hale getirildi |
| 05.06.2026 | Skill'ler projeye taşındı | `.opencode/skills/` + `opencode.json` config |
| 05.06.2026 | MEMORY.md oluşturuldu | Cross-session hafıza sistemi aktif |
