// ================================
// 1) PAKETLERİ İÇERİ AL
// ================================
// require(): npm ile kurduğumuz paketleri koda dahil ediyoruz.
const Listing = require("./models/Listing");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

// ================================
// 2) UYGULAMAYI OLUŞTUR
// ================================
// express() çağrısı bize bir "app" nesnesi verir — sunucumuzun
// kendisi bu, tüm ayarları ve rotaları (endpoint'leri) buna ekleyeceğiz.
const app = express();
// Render, kendi PORT numarasını otomatik olarak process.env.PORT
// içine koyar. Kendi bilgisayarında bu değişken olmadığı için
// " || 3000 " ile "yoksa 3000 kullan" diyoruz — böylece hem
// Render'da hem kendi bilgisayarında sorunsuz çalışır.
const PORT = process.env.PORT || 3000;

// ================================
// 3) MONGODB BAĞLANTI ADRESİ
// ================================
// process.env.MONGO_URI: Render'da (ya da kendi bilgisayarında bir
// .env dosyasında) tanımladığımız "ortam değişkenini" okuyoruz.
// Neden: Şifreyi artık KOD İÇİNE yazmıyoruz — kod GitHub'a public
// olarak yüklendiğinde şifre de herkese açık olurdu, bu ÇOK KÖTÜ
// bir güvenlik açığı olurdu. Bunun yerine şifreyi Render'ın kendi
// panelinde, koddan AYRI bir yerde saklıyoruz.
//
// " || " işareti: "eğer sol taraf yoksa (undefined), sağ tarafı kullan"
// demek. Bu sayede KENDİ bilgisayarında (Render'da değilken) da
// çalışmaya devam eder — process.env.MONGO_URI boşsa, buradaki
// sabit adresi "yedek" olarak kullanır.

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://opticons001_db_user:pKAIR2KoluShMEHk@clustermehmet.8lkf9hj.mongodb.net/sahibindenDB?appName=clusterMehmet";

// ================================
// 4) MONGODB'YE BAĞLAN
// ================================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB'ye bağlanıldı ✅"))
  .catch((err) => console.error("MongoDB bağlantı hatası ❌:", err.message));

// ================================
// 5) MIDDLEWARE'LER
// ================================
app.use(cors());
app.use(express.json());

// ================================
// 6) TEST ENDPOINT'İ
// ================================
app.get("/", (req, res) => {
  res.send("Merhaba! Backend çalışıyor.");
});

// ================================
// 6.1) KAYIT (REGISTER) ENDPOINT'İ
// ================================
// Ne: Frontend'den gelen email/şifreyi alıp, şifreyi hashleyip,
//     yeni bir kullanıcı olarak MongoDB'ye kaydediyoruz.
// Neden POST: Sunucuda YENİ bir kayıt OLUŞTURUYORUZ, sadece
//             veri okumuyoruz — bu yüzden GET değil POST kullanılır.

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Alanlar boş mu?
        if (!email || !password) {
            return res.status(400).json({ message: "E-posta ve şifre zorunludur." });
        }

        // 2) Bu email kayıtlı mı?
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "E-posta veya şifre hatalı." });
        }

        // 3) Şifre doğru mu? (hash karşılaştırma)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "E-posta veya şifre hatalı." });
        }

        // 4) Her şey tamam, giriş başarılı
        res.status(200).json({ message: "Giriş başarılı!", email: user.email });

    } catch (error) {
        console.error("Login hatası:", error);
        res.status(500).json({ message: "Sunucu hatası, lütfen tekrar deneyin." });
    }
});

// ================================
// 6.2) GİRİŞ (LOGIN) ENDPOINT'İ
// ================================

app.post("/register", async (req, res) => {
  // async: Bu fonksiyonun içinde "await" (bekleme) kullanacağımızı
  // belirtiyoruz. Veritabanı işlemleri zaman alır (internet üzerinden
  // gerçekleşir), bu yüzden "bitene kadar bekle" dememiz gerekiyor.

  try {
    // req.body: frontend'in bize POST ile gönderdiği JSON veri.
    // express.json() middleware'i sayesinde bunu otomatik okuyabiliyoruz.
    const { email, password } = req.body;

    // 1) Basit bir sunucu tarafı kontrolü (frontend zaten kontrol
    // ediyordu, ama sunucu ASLA frontend'e güvenmemeli — biri
    // frontend'i atlayıp direkt backend'e istek atabilir).
    if (!email || !password) {
      return res.status(400).json({ message: "E-posta ve şifre zorunludur." });
    }

    // 2) Bu email zaten kayıtlı mı diye kontrol et.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    // 3) Şifreyi HASH'le — asla düz metin olarak saklamıyoruz.
    // bcrypt.hash(şifre, saltRounds): saltRounds ne kadar yüksekse
    // o kadar güvenli ama o kadar yavaş olur. 10 yaygın bir denge.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) Yeni kullanıcıyı oluştur ve veritabanına kaydet.
    const newUser = new User({
      email: email,
      password: hashedPassword, // DİKKAT: düz şifre değil, hash'lenmiş hali
    });
    await newUser.save();

    // 5) Başarılı cevabı gönder. Şifreyi ASLA geri döndürmüyoruz,
    // hash'lenmiş olsa bile frontend'e/kullanıcıya göstermemize gerek yok.
    res.status(201).json({ message: "Kayıt başarılı!", email: newUser.email });

  } catch (error) {
    console.error("Register hatası:", error);
    res.status(500).json({ message: "Sunucu hatası, lütfen tekrar deneyin." });
  }
});


// ================================
// 6.3) İLANLARI GETİR (GET /listings)
// ================================
app.get("/listings", async (req, res) => {
  try {
    // req.query: adresteki "?ara=..." gibi sorgu parametrelerini okur.
    // Örnek: /listings?ara=daire  →  req.query.ara === "daire"
    const { ara } = req.query;

    // Varsayılan filtre: boş obje = "hiçbir kısıtlama yok, hepsini getir"
    let filtre = {};

    // Eğer kullanıcı bir arama terimi gönderdiyse, filtreyi doldur.
    if (ara) {
      // $regex: MongoDB'nin "metin içinde ara" özelliği.
      // $options: "i": büyük/küçük harf FARK ETMESİN (case-insensitive).
      // $or: BAŞLIK'ta VEYA AÇIKLAMA'da geçsin, ikisinden biri yeterli.
      filtre = {
        $or: [
          { baslik: { $regex: ara, $options: "i" } },
          { aciklama: { $regex: ara, $options: "i" } },
        ],
      };
    }

    // En yeni ilan en üstte çıksın
    const listings = await Listing.find(filtre).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    console.error("Listings getirme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// ================================
// 6.4) İLAN EKLE (POST /listings)
// ================================
app.post("/listings", async (req, res) => {
  try {
    const { baslik, fiyat, konum, kategori, aciklama, kullanici } = req.body;

    if (!baslik || !fiyat || !konum || !kategori || !kullanici) {
      return res.status(400).json({ message: "Zorunlu alanlar eksik." });
    }

    const yeniIlan = new Listing({ baslik, fiyat, konum, kategori, aciklama, kullanici });
    await yeniIlan.save();

    res.status(201).json({ message: "İlan eklendi!", ilan: yeniIlan });
  } catch (error) {
    console.error("İlan ekleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});



// ================================
// 7) SUNUCUYU BAŞLAT
// ================================
app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});