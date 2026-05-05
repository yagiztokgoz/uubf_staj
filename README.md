# UUBF Staj Takip

**Staj deneyimlerini paylaş, veriden ilham al.**

İTÜ Uçak ve Uzay Mühendisliği öğrencileri için geliştirilmiş, anonim staj takip ve analitik platformu.

🌐 **[uubf-staj.vercel.app](https://uubf-staj.vercel.app)**

---

## Ne İşe Yarar?

- Staj başvurularını kaydet — şirket, birim, dönem, sonuç, maaş, puan
- Mülakat notları ve staj deneyimini anonim olarak paylaş
- Tüm öğrencilerin verilerinden derlenen analitikleri gör:
  - Şirket bazında kabul oranları
  - Dönem bazında trendler
  - Maaş & puan karşılaştırmaları
  - Torpil vs torpilsiz kabul oranı
  - Demografik kırılımlar (cinsiyet, bölüm, sınıf, GPA)
  - İlgi alanı ve çap/yandal dağılımları

## Kimler Kullanabilir?

Yalnızca `@itu.edu.tr` uzantılı e-posta adresine sahip İTÜ öğrencileri. Giriş şifresiz, magic link ile yapılır — hesap oluşturmaya gerek yok.

## Gizlilik

Sistemde yalnızca girilen İTÜ mail adresi tutulur. Tüm staj verileri anonimleştirilmiş olarak saklanır ve gösterilir. Hiçbir kullanıcı başka bir kullanıcının kişisel bilgilerini göremez.

---

## Teknoloji

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **E-posta:** Brevo SMTP
- **Deploy:** Vercel

## Geliştirme Ortamı

```bash
npm install
npm run dev
```

`.env.local` dosyasına Supabase bilgilerini ekle:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Katkıda Bulunmak

Pull request ve issue'lar açık. Özellikle şu konularda katkı bekleniyor:
- Uzay Mühendisliği ders planına göre ilgi alanları güncellemesi
- Google OAuth entegrasyonu
- Şifre ile giriş desteği
