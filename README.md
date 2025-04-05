# Öğretmen-Öğrenci Takip Sistemi

Öğrencilerin akademik gelişimini takip etmek ve öğretmenlerin sınıf yönetimini kolaylaştırmak için oluşturulmuş web uygulaması.

## Önemli Güvenlik Bildirimi

Bu proje public bir repo olarak yayınlanmıştır. Lütfen aşağıdaki güvenlik önlemlerine dikkat edin:

- `.env.example` dosyasını `.env` olarak kopyalayın ve kendi API anahtarlarınızla doldurun
- Asla gerçek API anahtarlarını veya hassas bilgileri GitHub'a push etmeyin
- `.env` dosyası `.gitignore` içinde tanımlıdır ve GitHub'a gönderilmeyecektir

## Genel Özellikler

### Öğretmen Özellikleri
- Hesap oluşturma ve giriş yapma
- Sınıf oluşturma ve yönetme
- Öğrencileri sınıflara davet etme
- Ödevleri yönetme ve değerlendirme
- Öğrenci çözümlerini takip etme
- Sınıf performans analizleri görme

### Öğrenci Özellikleri
- Hesap oluşturma ve giriş yapma
- Öğretmen daveti ile sınıflara katılma
- Ödevleri görüntüleme ve teslim etme
- Çözdükleri soruları sisteme yükleme
- Bireysel performans takibi

## Teknik Özellikler

- Next.js tabanlı modern web uygulaması
- Supabase veritabanı ve kimlik doğrulama
- ChakraUI ile modern ve responsive tasarım
- TypeScript ile güçlü tip güvenliği
- Dosya yükleme ve görüntüleme özellikleri

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/omer-kirac/teacher-student-tracker.git
   cd teacher-student-tracker
   ```

2. Gerekli NPM paketlerini yükleyin:
   ```bash
   npm install
   ```

3. `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli Supabase bilgilerini ekleyin

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

5. Tarayıcıda uygulamayı görüntüleyin:
   ```
   http://localhost:3000
   ```

## Veritabanı Şeması

Aşağıdaki tablolar Supabase veritabanında yer alır:

- **teachers**: Öğretmen profilleri
- **students**: Öğrenci profilleri
- **classes**: Sınıf bilgileri
- **assignments**: Ödev bilgileri
- **student_assignments**: Öğrenci ödev teslimleri
- **student_solutions**: Öğrenci çözümleri

## Son Güncellemeler

- Ödev yönetim sistemi eklendi
- Dosya yükleme altyapısı geliştirildi
- Öğrenci-ödev takip sistemi tamamlandı

## İlerleyen Aşamalarda Eklenecek Özellikler

- Takvim entegrasyonu ve ödev hatırlatıcıları
- Ebeveyn portalı
- Gelişmiş analitik ve raporlama araçları
- PDF formatında rapor çıktıları

## Tech Stack

- **Frontend**: Next.js 15, React 19, Chakra UI
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Emotion, Chakra UI, TailwindCSS
- **File Storage**: Base64 encoding (development) / Supabase Storage (production)
- **Charts**: Recharts
- **Form Handling**: React Hook Form
- **Type Safety**: TypeScript

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request göndermekten çekinmeyin.

1. Projeyi fork edin
2. Feature branch'inizi oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'e push edin (`git push origin feature/yeni-ozellik`)
5. Bir Pull Request açın

## Lisans

MIT
