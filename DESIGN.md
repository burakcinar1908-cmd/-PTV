# DESIGN.md

Konu: Türkçe canlı yayın platformu. İş: kanalı hızla bulmak ve izlemek. Dil: televizyonun kendi görsel dili (test yayını, kanal etiketi), sakin ve okunaklı bir ekran.

## Renk (60 / 30 / 10)
| Token | Değer | Rol |
|---|---|---|
| --bg | #0d2b33 | zemin (yüzde 60) |
| --surface | #12363f | kart, panel (yüzde 30) |
| --raised | #184552 | bir kademe yüksek yüzey |
| --text | #eaf6f4 | ana metin |
| --muted | #9fc3c6 | ikincil metin |
| --accent | #ffc233 | birincil buton, odak, aktif durum (yüzde 10) |
| --accent-ink | #1a1400 | accent üzerindeki metin |
| --danger / --warning / --ok | #ffa89b / #ffd466 / #8fe3b8 | hata / uyarı / başarı metni |

Renk yalnızca tokenlardan kullanılır. Değişken renklere Tailwind ile /NN opaklık verilmez (v3'te sessizce düşer); gerekirse ayrı token tanımlanır (--ok-bg).

## Tipografi
- Başlık: Barlow Condensed 600. Gövde: IBM Plex Sans 400 / 500 / 600. Uygulama genelinde en fazla üç ağırlık.
- Boyutlar: gövde 16px, ikincil 14-15px, meta 12px altına inilmez. Başlık satır aralığı 1.1, gövde 1.6.
- Satır uzunluğu en fazla 65 karakter.

## Yerleşim ve şekil
- Sol hizalı, max-w-6xl. Boşluk 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Radius: kart 12px, buton 8px, iç içe yüzeylerde eş merkezli (dış = iç + dolgu).
- Derinlik 1px kenarlıkla verilir, gölge yok. Cam efekti ve gradyan metin yok.
- Etkileşimli öğeler en az 44x44px. Üst menü sticky, içerik altından başlar.

## Hareket
- Süre: 100 / 150 / 200 / 300ms, yalnızca transform ve opacity.
- Tek orkestre an: ana sayfada test görüntüsü 300ms'de "açılır".
- Basma geri bildirimi scale 0.96. prefers-reduced-motion'da her şey kapanır.

## Desenler
- Ana sayfa: pazarlama kompozisyonu. Kanallar: liste/dizin. İzle: ayrıntı. Giriş/kayıt: form.
- Buton etiketleri fiil ile başlar (Kanalları aç, Paketi etkinleştir). Hata metni kullanıcıyı suçlamaz ve bir sonraki adımı verir.
