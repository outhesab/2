# PARSPEL KAPSAMLI AUDIT RAPORU
**Tarih:** 05.06.2026 19:56:07
**Sürüm:** 3.13.2

---

## 1. ÖZET

| Metrik | Değer |
|--------|-------|
| Taranan Sayfa | 36 |
| Ortalama Yüklenme Süresi | 2053ms |
| Toplam Console Hata | 180 |
| Toplam Page Hatası | 0 |
| Bundle Boyutu | 3.25 MB (58 dosya), HTML: 2.2 KB |

---

## 2. SAYFA BAZINDA PERFORMANS

| # | Sayfa | Yüklenme | FCP | LCP | DOM Düğümü | Metin Elemanı |
|---|-------|----------|-----|-----|------------|--------------|
| 1 | Özet Dashboard | 3246ms | 796ms | N/A | 727 | 214 |
| 2 | Finans Dashboard | 2774ms | 720ms | N/A | 830 | 193 |
| 3 | Ticaret Dashboard | 3143ms | 548ms | N/A | 887 | 253 |
| 4 | Operasyon Dashboard | 2562ms | 504ms | N/A | 572 | 195 |
| 5 | Strateji Dashboard | 2495ms | 432ms | N/A | 740 | 188 |
| 6 | Ürünler | 2684ms | 592ms | N/A | 539 | 204 |
| 7 | Satış | 2720ms | 480ms | N/A | 505 | 202 |
| 8 | Fatura | 2525ms | 444ms | N/A | 487 | 169 |
| 9 | Tedarikçi | 2517ms | 484ms | N/A | 522 | 197 |
| 10 | Pelet | 2793ms | 764ms | N/A | 501 | 170 |
| 11 | Boru Tedarik | 2615ms | 576ms | N/A | 478 | 167 |
| 12 | Ortak Emanet | 2670ms | 628ms | N/A | 525 | 179 |
| 13 | Cari | 2973ms | 488ms | N/A | 553 | 211 |
| 14 | Kasa | 2961ms | 716ms | N/A | 553 | 215 |
| 15 | Bütçe | 2791ms | 700ms | N/A | 33 | 5 |
| 16 | Banka | 2701ms | 600ms | N/A | 472 | 163 |
| 17 | Raporlar | 3085ms | 684ms | N/A | 564 | 207 |
| 18 | Çizelge | 3020ms | 988ms | N/A | 605 | 181 |
| 19 | Stok | 3337ms | 1168ms | N/A | 575 | 230 |
| 20 | İzleme | 4050ms | 772ms | N/A | 554 | 196 |
| 21 | Kontrol Halkası | 3238ms | 756ms | N/A | 677 | 199 |
| 22 | Anomali Öneri | 3037ms | 708ms | N/A | 602 | 205 |
| 23 | Entegrasyon | 8988ms | 6840ms | N/A | 634 | 237 |
| 24 | Excel Birleştir | 3509ms | 472ms | N/A | 570 | 195 |
| 25 | Not Defteri | 2836ms | 600ms | N/A | 560 | 192 |
| 26 | Ortaklar | 2817ms | 736ms | N/A | 567 | 203 |
| 27 | Ayarlar | 3406ms | 924ms | N/A | 831 | 321 |
| 28 | Bug Hunter | 2797ms | 756ms | N/A | 549 | 187 |
| 29 | Excel İçe Aktar | 2815ms | 732ms | N/A | 547 | 185 |
| 30 | AI Eylem Log | 2833ms | 804ms | N/A | 568 | 185 |
| 31 | Spec Dashboard | 3211ms | 732ms | N/A | 651 | 234 |
| 32 | Performans | 2743ms | 704ms | N/A | 514 | 211 |
| 33 | 404 Sayfa | 4929ms | 816ms | N/A | 431 | 147 |
| 34 | Ürün Detay | 3414ms | 688ms | N/A | 494 | 154 |
| 35 | Satış Detay | 3508ms | 836ms | N/A | 33 | 5 |
| 36 | Cari Detay | 3713ms | 1408ms | N/A | 553 | 211 |

---

## 3. TESPİT EDİLEN SORUNLAR

### 3.1 Console Hataları
1. `Connecting to 'ws://127.0.0.1:3001/?token=tndGKT4oy8GB' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelanguage.googleapis.com". The action has been b`
2. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678392780' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
3. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678392780. Refused to connect because it violates the document's Content Security Policy.`
4. `Creating a worker from 'blob:http://127.0.0.1:3000/74ea181d-b083-4c85-93a5-a745c3dd2179' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
5. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678396145' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
6. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678396145. Refused to connect because it violates the document's Content Security Policy.`
7. `Creating a worker from 'blob:http://127.0.0.1:3000/7ed9728e-4505-44ac-96d7-889dc4eb076e' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
8. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678400472' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
9. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678400472. Refused to connect because it violates the document's Content Security Policy.`
10. `Creating a worker from 'blob:http://127.0.0.1:3000/13f3b0b2-f47e-4c51-88dc-73d8b8ba2e0c' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
11. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678404054' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
12. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678404054. Refused to connect because it violates the document's Content Security Policy.`
13. `Creating a worker from 'blob:http://127.0.0.1:3000/e31e0ea8-0726-4350-a5fa-e3cde43ee03a' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
14. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678408344' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
15. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678408344. Refused to connect because it violates the document's Content Security Policy.`
16. `Creating a worker from 'blob:http://127.0.0.1:3000/7c1226f0-e8b6-44af-b7f8-30d7b7de4676' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
17. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678411682' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
18. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678411682. Refused to connect because it violates the document's Content Security Policy.`
19. `Creating a worker from 'blob:http://127.0.0.1:3000/5ae21dbd-9088-43e0-83ff-5b9f2ffe0a48' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
20. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678415471' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
21. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678415471. Refused to connect because it violates the document's Content Security Policy.`
22. `Creating a worker from 'blob:http://127.0.0.1:3000/d218f086-e398-4ed9-baf1-6bd75ce54e64' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
23. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678418908' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
24. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678418908. Refused to connect because it violates the document's Content Security Policy.`
25. `Creating a worker from 'blob:http://127.0.0.1:3000/fffa5127-5060-4568-94d1-bbc39fbc3ffa' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
26. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678422525' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
27. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678422525. Refused to connect because it violates the document's Content Security Policy.`
28. `Creating a worker from 'blob:http://127.0.0.1:3000/6e8847b7-f491-45dc-a3b5-48adc3a971e3' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
29. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678426053' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
30. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678426053. Refused to connect because it violates the document's Content Security Policy.`
31. `Creating a worker from 'blob:http://127.0.0.1:3000/271e8e39-5056-45cb-bfcf-0dff3c1c9f9a' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
32. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678429997' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
33. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678429997. Refused to connect because it violates the document's Content Security Policy.`
34. `Creating a worker from 'blob:http://127.0.0.1:3000/22afb81a-b9a7-4fa8-8eb5-26754be9f7fb' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
35. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678433682' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
36. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678433682. Refused to connect because it violates the document's Content Security Policy.`
37. `Creating a worker from 'blob:http://127.0.0.1:3000/0c6997e3-7048-4e79-af14-6440fe4857b7' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
38. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678437495' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
39. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678437495. Refused to connect because it violates the document's Content Security Policy.`
40. `Creating a worker from 'blob:http://127.0.0.1:3000/e4360650-8eca-4587-8725-8bd1d748798e' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
41. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678441135' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
42. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678441135. Refused to connect because it violates the document's Content Security Policy.`
43. `Creating a worker from 'blob:http://127.0.0.1:3000/96610664-0190-42be-955b-c59a03a95b4d' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
44. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678445426' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
45. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678445426. Refused to connect because it violates the document's Content Security Policy.`
46. `Creating a worker from 'blob:http://127.0.0.1:3000/46af61cf-b85b-47ae-aa7e-08b8e2d0c9e0' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
47. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678449493' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
48. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678449493. Refused to connect because it violates the document's Content Security Policy.`
49. `Creating a worker from 'blob:http://127.0.0.1:3000/61b4863c-f936-4903-9853-478e536cf5c2' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
50. `%o

%s

%s
 TypeError: Cannot read properties of undefined (reading 'map')
    at http://127.0.0.1:3000/src/pages/Butce.tsx:531:30
    at Array.map (<anonymous>)
    at Butce (http://127.0.0.1:3000/src/pages/Butce.tsx:438:21)
    at Object.react_stack_bottom_frame (http://127.0.0.1:3000/node_modules`
51. `[ErrorBoundary] TypeError: Cannot read properties of undefined (reading 'map')
    at http://127.0.0.1:3000/src/pages/Butce.tsx:531:30
    at Array.map (<anonymous>)
    at Butce (http://127.0.0.1:3000/src/pages/Butce.tsx:438:21)
    at Object.react_stack_bottom_frame (http://127.0.0.1:3000/node_mod`
52. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678452931' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
53. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678452931. Refused to connect because it violates the document's Content Security Policy.`
54. `Creating a worker from 'blob:http://127.0.0.1:3000/00c4e9fc-53a1-42a0-ae53-e0c7d12bafbf' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
55. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678456954' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
56. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678456954. Refused to connect because it violates the document's Content Security Policy.`
57. `Creating a worker from 'blob:http://127.0.0.1:3000/07f6e141-d845-4610-bb2a-753989f0daba' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
58. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678461780' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
59. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678461780. Refused to connect because it violates the document's Content Security Policy.`
60. `Creating a worker from 'blob:http://127.0.0.1:3000/0bfff72e-10fb-47a5-9fbc-a4fe037171ba' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
61. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678466271' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
62. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678466271. Refused to connect because it violates the document's Content Security Policy.`
63. `Creating a worker from 'blob:http://127.0.0.1:3000/fd4b88b4-3228-486d-b67a-8a0c0499745a' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
64. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678470483' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
65. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678470483. Refused to connect because it violates the document's Content Security Policy.`
66. `Creating a worker from 'blob:http://127.0.0.1:3000/6ba7403d-8abc-411f-a646-1c3294498683' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
67. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678475733' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
68. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678475733. Refused to connect because it violates the document's Content Security Policy.`
69. `Creating a worker from 'blob:http://127.0.0.1:3000/0367aa67-11fd-450d-b2e4-c3185c125847' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
70. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678480051' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
71. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678480051. Refused to connect because it violates the document's Content Security Policy.`
72. `Creating a worker from 'blob:http://127.0.0.1:3000/0a8dee3e-fbab-46d4-a322-748817f5664f' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
73. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678490362' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
74. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678490362. Refused to connect because it violates the document's Content Security Policy.`
75. `Creating a worker from 'blob:http://127.0.0.1:3000/419990fc-94af-40ff-bb63-f840765368e0' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
76. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678494051' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
77. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678494051. Refused to connect because it violates the document's Content Security Policy.`
78. `Creating a worker from 'blob:http://127.0.0.1:3000/7d50a888-e6de-41a0-bfd5-a5447d3e3c72' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
79. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678498695' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
80. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678498695. Refused to connect because it violates the document's Content Security Policy.`
81. `Creating a worker from 'blob:http://127.0.0.1:3000/6c6e839e-1b1b-47f4-8bbf-4164726e5195' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
82. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678502701' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
83. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678502701. Refused to connect because it violates the document's Content Security Policy.`
84. `Creating a worker from 'blob:http://127.0.0.1:3000/472c6718-c784-4b2b-91f0-a6824ee2ae7c' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
85. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678507082' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
86. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678507082. Refused to connect because it violates the document's Content Security Policy.`
87. `Creating a worker from 'blob:http://127.0.0.1:3000/274d890b-cd14-4a10-89e3-7d3f45031ab6' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
88. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678511682' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
89. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678511682. Refused to connect because it violates the document's Content Security Policy.`
90. `Creating a worker from 'blob:http://127.0.0.1:3000/8ee35c91-e431-4ebd-aabb-1280bc8d84fe' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
91. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678515546' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
92. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678515546. Refused to connect because it violates the document's Content Security Policy.`
93. `Creating a worker from 'blob:http://127.0.0.1:3000/30d45b65-4be9-4721-8082-4e7d930b0cdf' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
94. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678519461' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
95. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678519461. Refused to connect because it violates the document's Content Security Policy.`
96. `Creating a worker from 'blob:http://127.0.0.1:3000/e64e9bc6-837d-4d38-9fdd-60e6a1494f04' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
97. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678523407' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
98. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678523407. Refused to connect because it violates the document's Content Security Policy.`
99. `Creating a worker from 'blob:http://127.0.0.1:3000/ddb18a6a-78bb-49e6-89a5-9a0eb533d4dc' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
100. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678527827' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
101. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678527827. Refused to connect because it violates the document's Content Security Policy.`
102. `Creating a worker from 'blob:http://127.0.0.1:3000/60ca52c0-6a8f-4048-90fc-0918e5f5f991' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
103. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678531959' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
104. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678531959. Refused to connect because it violates the document's Content Security Policy.`
105. `Creating a worker from 'blob:http://127.0.0.1:3000/2fb78854-83f5-42dd-be09-5c2d4485dea9' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
106. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678537878' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
107. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678537878. Refused to connect because it violates the document's Content Security Policy.`
108. `Creating a worker from 'blob:http://127.0.0.1:3000/df8512f8-8cbf-40eb-80b6-3c2a4026b182' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
109. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678542598' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
110. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678542598. Refused to connect because it violates the document's Content Security Policy.`
111. `Creating a worker from 'blob:http://127.0.0.1:3000/c37d03be-98b2-4703-a439-135b77538721' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
112. `%o

%s

%s
 TypeError: Cannot read properties of undefined (reading 'slice')
    at http://127.0.0.1:3000/src/pages/SaleDetail.tsx:85:116
    at Array.filter (<anonymous>)
    at SaleDetail (http://127.0.0.1:3000/src/pages/SaleDetail.tsx:84:44)
    at Object.react_stack_bottom_frame (http://127.0.0.`
113. `[ErrorBoundary] TypeError: Cannot read properties of undefined (reading 'slice')
    at http://127.0.0.1:3000/src/pages/SaleDetail.tsx:85:116
    at Array.filter (<anonymous>)
    at SaleDetail (http://127.0.0.1:3000/src/pages/SaleDetail.tsx:84:44)
    at Object.react_stack_bottom_frame (http://127.`
114. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678547424' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
115. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678547424. Refused to connect because it violates the document's Content Security Policy.`
116. `Creating a worker from 'blob:http://127.0.0.1:3000/de5292aa-eb83-4ce4-b9db-3eb4add1bf4e' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
117. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678552273' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
118. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678552273. Refused to connect because it violates the document's Content Security Policy.`
119. `Creating a worker from 'blob:http://127.0.0.1:3000/98a43533-5871-43e3-8b98-37c8ff3f6de3' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
120. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678554829' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
121. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678554829. Refused to connect because it violates the document's Content Security Policy.`
122. `Creating a worker from 'blob:http://127.0.0.1:3000/7bfb5de8-1119-4f07-b86f-d1d539c27e35' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
123. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678558155' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
124. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678558155. Refused to connect because it violates the document's Content Security Policy.`
125. `Creating a worker from 'blob:http://127.0.0.1:3000/64f466e0-4633-4ba3-ada8-1c995c659201' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
126. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678560030' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
127. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678560030. Refused to connect because it violates the document's Content Security Policy.`
128. `Creating a worker from 'blob:http://127.0.0.1:3000/eb55a8f4-d38b-4df1-bd4c-457a1cafbeb6' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
129. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678562174' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
130. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678562174. Refused to connect because it violates the document's Content Security Policy.`
131. `Creating a worker from 'blob:http://127.0.0.1:3000/4b7a3f89-5e85-4538-8c2e-2b80ce882f46' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
132. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678564410' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
133. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678564410. Refused to connect because it violates the document's Content Security Policy.`
134. `Creating a worker from 'blob:http://127.0.0.1:3000/b1632785-315c-4b31-9777-2a76a37ef7ec' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`
135. `Connecting to 'https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678566387' violates the following Content Security Policy directive: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelangu`
136. `Fetch API cannot load https://www.react-grab.com/api/version?source=react-scan&v=0.1.44&t=1780678566387. Refused to connect because it violates the document's Content Security Policy.`
137. `Creating a worker from 'blob:http://127.0.0.1:3000/020955ff-f712-4c06-8cd9-a0b8a7840b34' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has b`

### 3.2 Sayfa Hataları
Sayfa hatası bulunamadı.

### 3.3 CSS / Tasarım Sorunları
- **Özet Dashboard**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Finans Dashboard**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Ticaret Dashboard**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Operasyon Dashboard**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Strateji Dashboard**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Ürünler**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Satış**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Fatura**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Tedarikçi**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Pelet**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Boru Tedarik**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Ortak Emanet**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Cari**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Kasa**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Banka**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Raporlar**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Çizelge**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Stok**: overflowX: <div.app-user-avatar> 1px taşıyor
- **İzleme**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Kontrol Halkası**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Anomali Öneri**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Entegrasyon**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Excel Birleştir**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Not Defteri**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Ortaklar**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Ayarlar**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Bug Hunter**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Excel İçe Aktar**: overflowX: <div.app-user-avatar> 1px taşıyor
- **AI Eylem Log**: overflowX: <div.app-user-avatar> 1px taşıyor
- **Spec Dashboard**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Performans**: overflowX: <div.app-user-avatar> 1px taşıyor
- **404 Sayfa**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Ürün Detay**: overflowX: <header.app-header.desktop> 400px taşıyor
- **Cari Detay**: overflowX: <header.app-header.desktop> 400px taşıyor

### 3.4 Görsel Analiz (Screenshot İnceleme)

Aşağıdaki ekran görüntüleri `scripts/screenshots/pages/` klasöründe bulunuyor.

| Sayfa | Desktop | Mobile |
|-------|---------|--------|
| Özet Dashboard | ![Özet Dashboard](00-dashboard-desktop.png) | ![Özet Dashboard 00-dashboard-mobile.png](00-dashboard-mobile.png) |
| Finans Dashboard | ![Finans Dashboard](01-dashboard-finans-desktop.png) | ![Finans Dashboard 01-dashboard-finans-mobile.png](01-dashboard-finans-mobile.png) |
| Ticaret Dashboard | ![Ticaret Dashboard](02-dashboard-ticaret-desktop.png) | ![Ticaret Dashboard 02-dashboard-ticaret-mobile.png](02-dashboard-ticaret-mobile.png) |
| Operasyon Dashboard | ![Operasyon Dashboard](03-dashboard-operasyon-desktop.png) | ![Operasyon Dashboard 03-dashboard-operasyon-mobile.png](03-dashboard-operasyon-mobile.png) |
| Strateji Dashboard | ![Strateji Dashboard](04-dashboard-strateji-desktop.png) | ![Strateji Dashboard 04-dashboard-strateji-mobile.png](04-dashboard-strateji-mobile.png) |
| Ürünler | ![Ürünler](05-products-desktop.png) | ![Ürünler 05-products-mobile.png](05-products-mobile.png) |
| Satış | ![Satış](06-sales-desktop.png) | ![Satış 06-sales-mobile.png](06-sales-mobile.png) |
| Fatura | ![Fatura](07-fatura-desktop.png) | ![Fatura 07-fatura-mobile.png](07-fatura-mobile.png) |
| Tedarikçi | ![Tedarikçi](08-suppliers-desktop.png) | ![Tedarikçi 08-suppliers-mobile.png](08-suppliers-mobile.png) |
| Pelet | ![Pelet](09-pelet-desktop.png) | ![Pelet 09-pelet-mobile.png](09-pelet-mobile.png) |
| Boru Tedarik | ![Boru Tedarik](10-boruTed-desktop.png) | ![Boru Tedarik 10-boruTed-mobile.png](10-boruTed-mobile.png) |
| Ortak Emanet | ![Ortak Emanet](11-ortakEmanet-desktop.png) | ![Ortak Emanet 11-ortakEmanet-mobile.png](11-ortakEmanet-mobile.png) |
| Cari | ![Cari](12-cari-desktop.png) | ![Cari 12-cari-mobile.png](12-cari-mobile.png) |
| Kasa | ![Kasa](13-kasa-desktop.png) | ![Kasa 13-kasa-mobile.png](13-kasa-mobile.png) |
| Bütçe | ![Bütçe](14-butce-desktop.png) | ![Bütçe 14-butce-mobile.png](14-butce-mobile.png) |
| Banka | ![Banka](15-bank-desktop.png) | ![Banka 15-bank-mobile.png](15-bank-mobile.png) |
| Raporlar | ![Raporlar](16-reports-desktop.png) | ![Raporlar 16-reports-mobile.png](16-reports-mobile.png) |
| Çizelge | ![Çizelge](17-cizelge-desktop.png) | ![Çizelge 17-cizelge-mobile.png](17-cizelge-mobile.png) |
| Stok | ![Stok](18-stock-desktop.png) | ![Stok 18-stock-mobile.png](18-stock-mobile.png) |
| İzleme | ![İzleme](19-monitor-desktop.png) | ![İzleme 19-monitor-mobile.png](19-monitor-mobile.png) |
| Kontrol Halkası | ![Kontrol Halkası](20-kontrol-desktop.png) | ![Kontrol Halkası 20-kontrol-mobile.png](20-kontrol-mobile.png) |
| Anomali Öneri | ![Anomali Öneri](21-anomali-desktop.png) | ![Anomali Öneri 21-anomali-mobile.png](21-anomali-mobile.png) |
| Entegrasyon | ![Entegrasyon](22-entegrasyon-desktop.png) | ![Entegrasyon 22-entegrasyon-mobile.png](22-entegrasyon-mobile.png) |
| Excel Birleştir | ![Excel Birleştir](23-excelmerge-desktop.png) | ![Excel Birleştir 23-excelmerge-mobile.png](23-excelmerge-mobile.png) |
| Not Defteri | ![Not Defteri](24-notlar-desktop.png) | ![Not Defteri 24-notlar-mobile.png](24-notlar-mobile.png) |
| Ortaklar | ![Ortaklar](25-partners-desktop.png) | ![Ortaklar 25-partners-mobile.png](25-partners-mobile.png) |
| Ayarlar | ![Ayarlar](26-settings-desktop.png) | ![Ayarlar 26-settings-mobile.png](26-settings-mobile.png) |
| Bug Hunter | ![Bug Hunter](27-bughunter-desktop.png) | ![Bug Hunter 27-bughunter-mobile.png](27-bughunter-mobile.png) |
| Excel İçe Aktar | ![Excel İçe Aktar](28-excelimport-desktop.png) | ![Excel İçe Aktar 28-excelimport-mobile.png](28-excelimport-mobile.png) |
| AI Eylem Log | ![AI Eylem Log](29-ai-eylem-log-desktop.png) | ![AI Eylem Log 29-ai-eylem-log-mobile.png](29-ai-eylem-log-mobile.png) |
| Spec Dashboard | ![Spec Dashboard](30-spec-desktop.png) | ![Spec Dashboard 30-spec-mobile.png](30-spec-mobile.png) |
| Performans | ![Performans](31-perf-desktop.png) | ![Performans 31-perf-mobile.png](31-perf-mobile.png) |
| 404 Sayfa | ![404 Sayfa](32-not-found-desktop.png) | ![404 Sayfa 32-not-found-mobile.png](32-not-found-mobile.png) |
| Ürün Detay | ![Ürün Detay](33-urun-detay-desktop.png) | ![Ürün Detay 33-urun-detay-mobile.png](33-urun-detay-mobile.png) |
| Satış Detay | ![Satış Detay](34-satis-detay-desktop.png) | ![Satış Detay 34-satis-detay-mobile.png](34-satis-detay-mobile.png) |
| Cari Detay | ![Cari Detay](35-cari-detay-desktop.png) | ![Cari Detay 35-cari-detay-mobile.png](35-cari-detay-mobile.png) |

---

## 4. CRUD İŞLEM SONUÇLARI

| İşlem | Durum | Detay |
|-------|-------|-------|
| Yeni Satış Ekleme | ✅ | 3 → 4 satış |
| Kasa Gelir Ekleme | ✅ | 6 → 7 hareket |
| Cari Bakiye Güncelleme | ✅ | Mehmet Kaya: 2.500 → 2.700 TL |

---

## 5. PERFORMANS VERİLERİ

| Metrik | Değer |
|--------|-------|
| Ortalama Sayfa Yüklenme | 2053ms |
| En Hızlı Sayfa | 2495ms |
| En Yavaş Sayfa | 8988ms |
| Ortalama FCP | 878ms |
| Ortalama DOM Düğümü | 556 |
| Bundle Boyutu | 3.25 MB (58 dosya), HTML: 2.2 KB |

---

## 6. ÖNERİLEN İYİLEŞTİRMELER

### ⚠ Yavaş Yüklenen Sayfalar (>3s)
- **Özet Dashboard**: 3246ms
- **Ticaret Dashboard**: 3143ms
- **Raporlar**: 3085ms
- **Çizelge**: 3020ms
- **Stok**: 3337ms
- **İzleme**: 4050ms
- **Kontrol Halkası**: 3238ms
- **Anomali Öneri**: 3037ms
- **Entegrasyon**: 8988ms
- **Excel Birleştir**: 3509ms
- **Ayarlar**: 3406ms
- **Spec Dashboard**: 3211ms
- **404 Sayfa**: 4929ms
- **Ürün Detay**: 3414ms
- **Satış Detay**: 3508ms
- **Cari Detay**: 3713ms


### 💡 Genel Öneriler
1. Lazy loading kontrolü — tüm sayfalar aynı anda yükleniyor olabilir
2. Görseller için optimizasyon önerilir
3. Firebase SDK dinamik import ile yükleniyor — doğru yapılmış
4. ExcelJS (1MB) lazy load ediliyor — doğru yapılmış
5. Sayfa geçişlerinde Suspense fallback kullanılıyor — iyi uygulama

---

## 7. EKRAN GÖRÜNTÜLERİ

Tüm ekran görüntüleri `scripts/screenshots/pages/` altında:
- Desktop (1280x800, fullPage): `*-desktop.png`
- Mobile (375x812, fullPage): `*-mobile.png`

---

*Rapor otomatik oluşturulmuştur — 05.06.2026 19:56:08*
