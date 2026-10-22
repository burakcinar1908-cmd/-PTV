# DESIGN.md

Koyu, sakin, teknik. Tek vurgu rengi, bol boşluk, kutu içinde kutu yok.

## Renk
| Token | Değer | Rol |
|---|---|---|
| --bg | #05060a | sayfa zemini |
| --surface | #0b0d14 | kart ve panel zemini |
| --text | #f5f7fa | ana metin (kontrast > 15:1) |
| --muted | #94a3b8 | ikincil metin (kontrast > 4.5:1) |
| --accent | #22d3ee | birincil buton, bağlantı, odak halkası |
| --accent-hover | #67e8f9 | birincil butonun üzeri |
| --accent-ink | #020617 | accent üzerindeki metin |
| --danger | #fda4af | hata metni |
| --warning | #fcd34d | uyarı metni |
| --border | white 10% | ayırıcı çizgi |

Açık tema yok. Renkleri yalnızca tokenlardan kullan, sayfada ham renk yazma.

## Tipografi
- Sistem sans (Inter yerine yerleşik yazı tipi, dosya yüklemez).
- Başlık: 36-72px, semibold, satır aralığı 1.1-1.2.
- Gövde: 16px, satır aralığı 1.6, en fazla 75 karakter genişlik.
- Etiket (eyebrow): 14px, geniş harf aralığı, muted renk.

## Boşluk ve şekil
- Taban 4px, kullanılan adımlar: 8, 12, 16, 24, 32, 48, 96.
- Bölüm dikey boşluğu: 96px masaüstü, 64px mobil.
- İçerik genişliği: max 1152px (max-w-6xl), oynatıcı max 1024px.
- Radius: 12px kart, tam yuvarlak buton (rounded-full).
- Gölge: yok. Derinlik zemin farkıyla verilir.

## Bileşenler
- Birincil buton (.btn-primary): accent zemin, hover accent-hover, basınca scale 0.96.
- İkincil buton (.btn-secondary): şeffaf zemin, border, hover hafif dolgu.
- Odak: her etkileşimli öğede 2px accent halka (focus-visible).
- Kart: surface zemin, border, radius 12px.

## Hareket
- Giriş: opacity 0→1, translateY 12px→0, 400ms, power2.out, öğeler arası 100ms.
- Çıkış: 150ms, -12px sabit. Bounce ve overshoot yok.
- İlk yüklemede hero animasyonu bir kez oynar, sonra tekrar etmez.
- prefers-reduced-motion: tüm animasyonlar kapanır (globals.css ve Hero).

## Yasak
- Mor-mavi gradyan, glassmorphism, gradyan metin (Hero'daki vurgu hariç, bir sonraki turda kaldırılacak).
- Emoji ikon. Tek ikon seti kullan.
