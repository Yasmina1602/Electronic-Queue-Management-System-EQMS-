# MASTER PROMPT — ELEKTRON NAVBAT BOSHQARUV TIZIMI

## 1. Loyiha haqida

Sen tajribali Senior Full-Stack Developer, Software Architect va Database Engineer sifatida ishlaysan.

Maqsad — bir nechta filiallarda ishlaydigan, mijozlar oqimini avtomatik boshqaradigan, xodimlarga navbatlarni adolatli taqsimlaydigan va rahbariyatga real vaqt rejimida nazorat imkoniyatini beradigan professional **Elektron Navbat Boshqaruv WEB Tizimi**ni ishlab chiqish.

Loyiha to‘liq WEB texnologiyalar asosida ishlashi kerak. Android yoki React Native ilovalaridan foydalanilmasin.

Tizim quyidagi interfeyslardan tashkil topadi:

1. Mijozlar uchun Kiosk WEB interfeysi.
2. Xodimlar uchun Operator WEB paneli.
3. Menejer WEB paneli.
4. Administrator WEB paneli.
5. Navbatlarni ko‘rsatish uchun Monitor WEB interfeysi.

Barcha interfeyslar yagona Backend va yagona PostgreSQL ma’lumotlar bazasi orqali ishlaydi.

## 2. Asosiy biznes qoidalari

**Eng muhim talab: mijoz hech qanday shaxsiy ma’lumot kiritmasligi kerak.**

Mijoz kiosk ekraniga keladi, kerakli xizmatni tanlaydi va tizim avtomatik ravishda navbat yaratadi.

Mijozdan quyidagilar so‘ralmasin:
- Ism va familiya.
- Telefon raqami.
- Pasport yoki boshqa hujjat ma’lumotlari.
- Telegram yoki boshqa aloqa ma’lumotlari.

Navbat faqat quyidagi ma’lumotlar orqali boshqariladi:
- Filial.
- Xizmat turi.
- Noyob navbat raqami.
- Navbat identifikatori.
- Yaratilgan vaqt.
- Joriy holat.

Tizim mijozning shaxsiy profilini yaratmasligi kerak.

## 3. Kiosk WEB interfeysi

Kiosk alohida Android dastur emas, balki brauzerda to‘liq ekran rejimida ishlaydigan WEB sahifa bo‘ladi.

### Ishlash algoritmi:

1. Kiosk ishga tushganda o‘ziga biriktirilgan filialni aniqlaydi.
2. Shu filialga tegishli faol xizmatlar ekranga chiqariladi.
3. Mijoz kerakli xizmatni tanlaydi.
4. Backend xizmatning mavjudligini tekshiradi.
5. Tizim noyob navbat raqamini yaratadi.
6. Navbat PostgreSQL bazasiga WAITING holatida yoziladi.
7. Navbat cheki Xprinter orqali chiqariladi.
8. Mijoz chekni olib, o‘z navbatini kutadi.

### Kiosk talablari:

- Katta va tushunarli tugmalar.
- Sodda va zamonaviy dizayn.
- O‘zbek va rus tillarini qo‘llab-quvvatlash imkoniyati.
- Har bir filial uchun alohida konfiguratsiya.
- Tasodifiy takroriy bosishlardan himoya.
- Printer ishlamay qolsa, navbat yo‘qolmasligi.
- Printer holatini aniqlash va xatolikni administratorga bildirish.
- Belgilangan vaqt davomida harakatsizlik bo‘lsa, bosh sahifaga qaytish.
- Kioskni mijoz tomonidan boshqaruv paneliga kirishdan himoyalash.

## 4. Xodimlarga navbat taqsimlash algoritmi

Bu loyihaning eng muhim qismi hisoblanadi.

Navbatlar avtomatik ravishda tegishli xodimlarga taqsimlanishi kerak. Xodim o‘ziga yoqqan navbatni ixtiyoriy tanlay olmasligi kerak.

### 4.1. Xodim holatlari

- OFFLINE — tizimda ishlamayapti.
- AVAILABLE — xizmat ko‘rsatishga tayyor.
- BUSY — mijozga xizmat ko‘rsatmoqda.
- PAUSED — vaqtincha tanaffusda.

Faqat AVAILABLE holatidagi va tegishli xizmat vakolatiga ega xodim navbat olishi mumkin.

### 4.2. FIFO algoritmi

FIFO — birinchi kelgan mijozga birinchi xizmat ko‘rsatish tamoyili.

1. Yangi navbat yaratilganda yaratilgan vaqt saqlanadi.
2. Navbat tegishli filial va xizmat bo‘yicha kutish ro‘yxatiga qo‘shiladi.
3. Xodim AVAILABLE holatiga o‘tadi.
4. Xodim «Keyingi mijoz» tugmasini bosadi.
5. Backend xodimning filialini va xizmat vakolatlarini tekshiradi.
6. Xodim xizmat ko‘rsata oladigan WAITING navbatlar aniqlanadi.
7. Ularning ichidan eng oldin yaratilgani tanlanadi.
8. Navbat atomar tranzaksiya orqali xodimga biriktiriladi.
9. Navbat CALLED holatiga o‘tadi.
10. Xodim xizmatni boshlaganda IN_SERVICE holatiga o‘tadi.
11. Xizmat yakunlanganda COMPLETED holatiga o‘tadi.
12. Xodim AVAILABLE holatiga qaytadi.

### 4.3. Bir nechta xodim bir vaqtda bo‘sh bo‘lganda

Agar bir nechta xodim bir vaqtda «Keyingi mijoz» tugmasini bossa:

1. Backend har bir xodimning holatini tekshiradi.
2. Xodimning xizmat vakolatlari aniqlanadi.
3. Faqat mos xizmatlarga tegishli navbatlar ko‘rib chiqiladi.
4. Eng eski navbat tanlanadi.
5. PostgreSQL tranzaksiyasi orqali navbat biriktiriladi.
6. Parallel so‘rovlar uchun SELECT FOR UPDATE SKIP LOCKED yoki unga teng xavfsiz mexanizm qo‘llanadi.
7. Bir navbat faqat bitta xodimga biriktiriladi.
8. Boshqa xodimlar keyingi mos navbatni oladi.
9. Navbat topilmasa, xodimga tegishli xabar chiqariladi.

Biriktirish jarayoni tranzaksiya ichida xodimning AVAILABLE holatini tekshirish, navbatni bloklash, navbatni biriktirish va xodimni BUSY holatiga o‘tkazishni o‘z ichiga olishi kerak.

### 4.4. Xodimlar yuklamasini tenglashtirish

Bir xil xizmatni bir nechta xodim bajarsa:

1. Faqat AVAILABLE xodimlar hisobga olinadi.
2. Xizmat vakolati tekshiriladi.
3. Navbat FIFO asosida tanlanadi.
4. Xodim tanlashda oxirgi xizmatni yakunlagan vaqt hisobga olinadi.
5. Eng uzoq vaqt davomida mijoz qabul qilmagan xodimga ustunlik beriladi.
6. Ko‘rsatkichlar teng bo‘lsa, Round-Robin algoritmi qo‘llanadi.
7. Taqsimlash natijasi bazada saqlanadi.

**Muhim:** FIFO mijozlar tartibini belgilaydi, yuklamani tenglashtirish esa xodimni tanlashni boshqaradi. Ushbu ikki algoritm bir-biriga zid ishlamasligi kerak.

### 4.5. Bir nechta xizmatni biladigan xodim

Agar xodim bir nechta xizmatni ko‘rsata olsa:

1. Xodimning barcha xizmat vakolatlari olinadi.
2. Ushbu xizmatlarga tegishli kutayotgan navbatlar birlashtiriladi.
3. Eng eski navbat tanlanadi.
4. Xizmatlar orasida alohida ustuvorlik mavjud bo‘lsa, administrator sozlagan qoida qo‘llanadi.
5. Ustuvorlik bo‘lmasa, umumiy FIFO saqlanadi.

### 4.6. Mijoz chaqiruvga kelmasa

1. Xodim «Mijoz kelmadi» tugmasini bosadi.
2. Navbat NO_SHOW holatiga o‘tadi.
3. Chaqiruv vaqti va xodim ID saqlanadi.
4. Administrator belgilagan qoidaga ko‘ra navbat qayta chaqirilishi yoki yakunlanishi mumkin.
5. Xodim keyingi navbatni olish imkoniyatiga ega bo‘ladi.

### 4.7. Xodim OFFLINE yoki PAUSED bo‘lsa

1. Xodim yangi navbat ololmaydi.
2. BUSY holatidagi xodimning amaldagi navbati avtomatik boshqa xodimga berilmaydi.
3. Menejer vaziyatni ko‘rib chiqadi.
4. Zarur bo‘lsa, navbatni boshqa xodimga qayta biriktiradi.
5. Barcha o‘zgarishlar audit jurnalida saqlanadi.

### 4.8. Ustuvor navbatlar

Administrator xizmatlar uchun ustuvorlik darajasini belgilashi mumkin.

Taqsimlash tartibi:

1. Tasdiqlangan ustuvor navbatlar.
2. Oddiy navbatlar.
3. Har bir guruh ichida FIFO.

Oddiy navbatlar cheksiz kutib qolmasligi uchun ustuvorlik mexanizmi administrator tomonidan chegaralanishi kerak.

## 5. Navbat holatlari

Quyidagi holatlardan foydalanilsin:

- WAITING — kutmoqda.
- CALLED — chaqirildi.
- IN_SERVICE — xizmat ko‘rsatilmoqda.
- COMPLETED — yakunlandi.
- NO_SHOW — mijoz kelmadi.
- CANCELLED — bekor qilindi.
- TRANSFERRED — boshqa xodimga yoki jarayonga o‘tkazildi.

Holatlar o‘zgarishi faqat Backend orqali boshqarilsin.

Ruxsat etilmagan holat o‘zgarishlariga yo‘l qo‘yilmasin. Har bir o‘zgarish va uning sababi tarixda saqlansin.

## 6. Operator WEB paneli

Xodim tizimga login va parol orqali kiradi.

Asosiy imkoniyatlar:

- O‘z holatini AVAILABLE, PAUSED yoki OFFLINE sifatida boshqarish.
- «Keyingi mijoz» tugmasi.
- Chaqirilgan navbatni ko‘rish.
- Mijozga xizmat ko‘rsatishni boshlash.
- Xizmatni yakunlash.
- Mijoz kelmaganini belgilash.
- Navbatni menejerga yuborish.
- O‘zining bugungi xizmatlari statistikasini ko‘rish.

Xodim boshqa xodimning navbatlarini boshqara olmasligi kerak.

## 7. Menejer WEB paneli

Menejer o‘ziga biriktirilgan filialni nazorat qiladi.

Imkoniyatlar:

- Filialdagi barcha xodimlarni kuzatish.
- Xodimlarning joriy ish holatini ko‘rish.
- Kutayotgan navbatlarni ko‘rish.
- Xizmat ko‘rsatilayotgan navbatlarni kuzatish.
- Navbatni boshqa xodimga qayta biriktirish.
- Xodimni vaqtincha bloklash.
- Xodimlar yuklamasini solishtirish.
- O‘rtacha kutish vaqtini ko‘rish.
- O‘rtacha xizmat vaqtini ko‘rish.
- Kunlik, haftalik va oylik hisobotlarni olish.

## 8. Administrator WEB paneli

Administrator butun tizimni boshqaradi.

Funksiyalar:

- Filiallarni yaratish va tahrirlash.
- Bo‘limlarni boshqarish.
- Xizmat turlarini yaratish.
- Xodimlarni ro‘yxatdan o‘tkazish.
- Xodimlarga rollar biriktirish.
- Xodimlarni xizmatlarga biriktirish.
- Ish vaqtlarini belgilash.
- Ustuvorlik qoidalarini sozlash.
- Kiosklarni ro‘yxatdan o‘tkazish.
- Printer va monitorlarni boshqarish.
- Navbat algoritmlarini sozlash.
- Tizim faoliyatini audit qilish.

## 9. Navbat monitori

Filiallarda alohida WEB monitor ishlaydi.

Monitor quyidagilarni ko‘rsatadi:

- Navbat raqami.
- Qaysi oynaga yoki xodimga borish kerakligi.
- Hozir chaqirilayotgan navbatlar.
- Oxirgi chaqirilgan navbatlar.

Monitor WebSocket orqali real vaqt rejimida yangilanadi.

Bir filial monitori boshqa filial navbatlarini ko‘rsatmasligi kerak.

## 10. Mijozlar uchun Bonus va Chegirma tizimi (Loyalty & Referral System)

Tizimda mijozlarni qayta tashrif buyurishga rag‘batlantirish va yangi mijozlarni jalb qilish uchun avtomatlashtirilgan bonus hamda chegirma moduli ishlab chiqilsin.

**Asosiy talab:** mijozdan ism, familiya, telefon raqami yoki boshqa shaxsiy ma'lumotlar talab qilinmasin.

### 10.1. Anonim mijoz identifikatsiyasi

1. Mijoz birinchi marta navbat olganda tizim noyob anonim Customer ID yaratadi.
2. Ushbu ID uchun QR-kod shakllantiriladi.
3. QR-kod navbat chekida chop etiladi yoki alohida bonus kartasi sifatida beriladi.
4. Keyingi tashriflarda mijoz QR-kodni kiosk orqali skaner qiladi.
5. Tizim avvalgi tashriflar va bonuslarni aniqlaydi.
6. Mijoz QR-kodni yo‘qotgan taqdirda, uning tashrif tarixini avtomatik tiklash kafolatlanmaydi.

### 10.2. Doimiy mijozlar uchun chegirma

1. Har bir muvaffaqiyatli yakunlangan xizmat mijozning tashriflar soniga qo‘shiladi.
2. Tizim tashriflar soniga qarab chegirma darajasini aniqlaydi.
3. Chegirma qoidalari administrator tomonidan sozlanadi.
4. Chegirma tegishli xizmat uchun avtomatik hisoblanadi.
5. Bitta xizmat uchun chegirma takroran qo‘llanmasligi kerak.

Boshlang‘ich chegirma darajalari:
- 3 ta tashrif — 5%.
- 5 ta tashrif — 10%.
- 10 ta tashrif — 15%.

### 10.3. Do‘stlarni taklif qilish (Referral System)

1. Har bir mijoz uchun noyob referral QR-kod yaratiladi.
2. Mijoz ushbu QR-kodni do‘stlariga ulashishi mumkin.
3. Yangi mijoz kioskda QR-kodni skaner qiladi.
4. Referral identifikatori navbat bilan bog‘lanadi.
5. Taklif qilingan mijoz xizmatdan muvaffaqiyatli foydalangandan keyin taklif qilgan mijozga bonus beriladi.
6. Bonus mijozning anonim hisobiga yoziladi.
7. Keyingi tashrifda bonusdan foydalanish mumkin bo‘ladi.

Referral bonuslari administrator tomonidan sozlanadi.

### 10.4. Bonuslarni boshqarish

- Bonuslarni foiz yoki belgilangan summa ko‘rinishida berish.
- Bonusning amal qilish muddatini belgilash.
- Minimal tashriflar sonini belgilash.
- Xizmatlar bo‘yicha chegirma cheklovlarini sozlash.
- Bir xizmatda chegirmalarni birlashtirish yoki birlashtirmaslik.
- Maksimal chegirma miqdorini belgilash.
- Bonuslarni qo‘lda qo‘shish va bekor qilish.
- Bonus operatsiyalarining to‘liq tarixini saqlash.

### 10.5. Firibgarlikdan himoya

- Bitta referral QR-kod orqali takroriy bonus olishga yo‘l qo‘yilmasin.
- Taklif qilgan mijoz o‘zini o‘zi taklif qila olmasin.
- Referral bonusi faqat xizmat COMPLETED bo‘lganda berilsin.
- Bekor qilingan va NO_SHOW navbatlar bonus hisobiga kiritilmasin.
- Shubhali bonus operatsiyalari audit jurnalida saqlansin.
- QR-kodlar xavfsiz tasodifiy tokenlar asosida yaratilishi kerak.

Shaxsiy ma'lumotlarsiz bir insonning bir nechta anonim ID yaratishini mutlaq aniqlash imkoni yo‘qligi hisobga olinsin. Shu sababli referral cheklovlari va bonus nazorati qo‘llanilsin.

### 10.6. Administrator statistikasi

Administrator quyidagilarni ko‘ra olishi kerak:
- Jami anonim mijozlar.
- Takroriy tashriflar soni.
- Yangi taklif qilingan mijozlar.
- Eng ko‘p mijoz taklif qilganlar.
- Berilgan bonuslar miqdori.
- Ishlatilgan chegirmalar.
- Filiallar kesimidagi bonus statistikasi.

Baholash (Ratings) moduli loyihada bo‘lmasin. Uning o‘rniga faqat Bonus va Chegirma moduli ishlatilsin.

## 11. Texnologik arxitektura

Loyiha to‘liq WEB asosida ishlab chiqilsin.

Tavsiya etiladigan texnologiyalar:

- Frontend: React + TypeScript.
- UI: Tailwind CSS.
- Backend: Node.js + NestJS yoki Express.
- Database: PostgreSQL.
- Real-time: WebSocket.
- Cache va qo‘shimcha koordinatsiya: Redis (zarurat bo‘lsa).
- Authentication: JWT + Role-Based Access Control.
- Printer: Xprinter, brauzer orqali chop etish yoki ishonchli lokal print bridge.

Barcha biznes mantiqi Backendda joylashadi.

Frontend PostgreSQL bazasiga to‘g‘ridan-to‘g‘ri ulanmasligi kerak.

Kiosk, Operator, Menejer, Administrator va Monitor bir xil WEB tizimning alohida interfeyslari sifatida ishlab chiqilsin.

## 12. Ma’lumotlar bazasi

PostgreSQL asosiy ma’lumotlar bazasi bo‘ladi.

Quyidagi jadvallar yaratilishi kerak:

1. branches — filiallar.
2. departments — bo‘limlar.
3. services — xizmatlar.
4. employees — xodimlar.
5. roles — rollar.
6. employee_services — xodimlarning xizmat vakolatlari.
7. queues — navbatlar.
8. queue_history — navbat holatlari tarixi.
9. devices — kiosk, printer va monitorlar.
10. ratings — xizmat baholash.
11. audit_logs — tizimdagi muhim amallar.
12. work_schedules — xodimlarning ish jadvali.
13. system_settings — tizim sozlamalari.

Barcha jadvallar orasidagi PRIMARY KEY, FOREIGN KEY, UNIQUE va INDEX bog‘lanishlari to‘g‘ri tashkil etilsin.

Navbatlar uchun quyidagilar ta'minlansin:

- Noyob navbat identifikatori.
- Filial bo‘yicha navbat raqami.
- Xizmat turi.
- Xodim ID.
- Navbat holati.
- Yaratilgan vaqt.
- Chaqirilgan vaqt.
- Xizmat boshlangan vaqt.
- Xizmat yakunlangan vaqt.

Kunlik navbat raqamlari filial kesimida boshqarilsin. Bir vaqtning o‘zida navbat yaratilganda raqamlar takrorlanmasligi uchun tranzaksion mexanizm ishlatilsin.

## 13. Xavfsizlik va ishonchlilik

Quyidagi talablar majburiy:

- Role-Based Access Control.
- Har bir foydalanuvchi faqat o‘z vakolatidagi ma’lumotlarni ko‘radi.
- Filiallararo ma’lumotlar izolyatsiyasi.
- Parollar xavfsiz hash ko‘rinishida saqlanishi.
- API so‘rovlarini validatsiya qilish.
- SQL Injection va XSS himoyasi.
- CORS va autentifikatsiya sozlamalari.
- Muhim amallarni audit jurnalida saqlash.
- Xatoliklarni markazlashgan qayd etish.
- Ma’lumotlar bazasining zaxira nusxasini yaratish.
- WebSocket ulanishlarini autentifikatsiya qilish.
- Kiosk qurilmalarini maxsus token orqali identifikatsiya qilish.

Tizim internet yoki tarmoq vaqtincha uzilganda ma’lumotlar yo‘qolishining oldini oladigan mexanizmlarga ega bo‘lsin.

## 14. Statistik va hisobot moduli

Quyidagi statistikalar shakllantirilsin:

- Kunlik navbatlar soni.
- Haftalik va oylik navbatlar soni.
- Filiallar kesimidagi natijalar.
- Xizmatlar kesimidagi natijalar.
- Xodimlar kesimidagi xizmatlar soni.
- O‘rtacha kutish vaqti.
- O‘rtacha xizmat ko‘rsatish vaqti.
- NO_SHOW holatlari.
- Bekor qilingan navbatlar.
- Mijozlar baholash natijalari.
- Xodimlar yuklamasi.

Hisobotlarni Excel va PDF formatlarida eksport qilish imkoniyati bo‘lsin.

## 15. Loyihani ishlab chiqish bosqichlari

Ishni quyidagi ketma-ketlikda amalga oshir:

1. Mavjud loyiha fayllari va arxitekturasini to‘liq o‘rgan.
2. Mavjud xatoliklar va kamchiliklarni aniqlab, ro‘yxatini tuz.
3. Ma’lumotlar bazasi arxitekturasini loyihala.
4. Backend API va biznes mantiqini ishlab chiq.
5. FIFO va xodimlar yuklamasini tenglashtirish algoritmlarini amalga oshir.
6. Parallel so‘rovlar va tranzaksiyalar xavfsizligini ta’minla.
7. Kiosk WEB interfeysini ishlab chiq.
8. Operator panelini ishlab chiq.
9. Menejer va administrator panellarini ishlab chiq.
10. Navbat monitorini ishlab chiq.
11. Xprinter bilan integratsiyani amalga oshir.
12. WebSocket orqali real vaqt yangilanishini ta'minla.
13. Statistik va hisobot modulini ishlab chiq.
14. Barcha modullarni integratsiya qil.
15. Testlar o'tkaz va aniqlangan xatolarni bartaraf et.
16. Production muhitiga joylashtirish uchun konfiguratsiyalarni tayyorla.

## 16. Majburiy test ssenariylari

Quyidagi holatlar albatta sinovdan o'tkazilsin:

1. Bir vaqtda 10 ta mijoz navbat olsa, raqamlar takrorlanmasligi.
2. Bir vaqtda 10 ta xodim «Keyingi mijoz» tugmasini bossa, bitta navbat ikki xodimga berilmasligi.
3. Xodim faqat o‘z xizmat vakolatiga tegishli navbatni olishi.
4. Bir nechta xizmatni biladigan xodim eng eski mos navbatni olishi.
5. Xodim BUSY holatida bo‘lsa, yangi navbat ololmasligi.
6. Xodim OFFLINE bo‘lsa, navbat unga biriktirilmasligi.
7. Xodim xizmatni yakunlagach, AVAILABLE holatiga qaytishi.
8. Printer ishlamasa ham navbat bazada saqlanishi.
9. WebSocket uzilib qolsa, qayta ulanganda ma'lumotlar sinxronlashishi.
10. Bir filial ikkinchi filial ma'lumotlarini ko‘ra olmasligi.
11. Ruxsatsiz foydalanuvchi administrator funksiyalariga kira olmasligi.
12. Bir navbatning ikki marta yakunlanishiga yo‘l qo‘yilmasligi.

## 17. Yakuniy talablar

Loyiha faqat dizayn yoki statik sahifalar to‘plami bo‘lib qolmasin.

Barcha tugmalar, formalar, jadvallar, filtrlar, hisobotlar va funksiyalar real Backend bilan ishlashi kerak.

Mock data faqat dastlabki UI ishlab chiqish va test jarayonida ishlatilishi mumkin. Production rejimida haqiqiy PostgreSQL ma'lumotlari ishlatilishi shart.

Mavjud loyiha kodlari bo‘lsa, ularni tekshirmasdan qayta yozib yuborma. Avval mavjud arxitekturani tahlil qil, xatolarni aniqlab, zarur joylarini tuzat.

Kod sifatiga alohida e'tibor ber:

- Modulli arxitektura.
- Qayta foydalaniladigan komponentlar.
- Toza va tushunarli kod.
- API hujjatlari.
- Database migration.
- Xatoliklarni qayta ishlash.
- Testlar.
- Production konfiguratsiyasi.

**Yakuniy maqsad:** mijoz faqat xizmat turini tanlaydigan, navbat avtomatik yaratiladigan, FIFO va xodim vakolatlari asosida adolatli taqsimlanadigan, barcha jarayonlar real vaqt rejimida kuzatiladigan, ko‘p filialli va to‘liq ishlaydigan professional Elektron Navbat Boshqaruv WEB Tizimini yaratish.