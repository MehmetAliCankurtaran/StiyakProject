// ================================
// CLOUDINARY YAPILANDIRMASI
// ================================
// Ne: Cloudinary'e "ben buyum, bu hesaba bağlanacağım" demek için
//     kimlik bilgilerini tanımlıyoruz.
// Neden ayrı dosya: server.js'i şişirmemek için, upload ile ilgili
//        her şeyi burada topluyoruz.

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CloudinaryStorage: multer'a "dosyaları kendi bilgisayarına değil,
// doğrudan Cloudinary'e yükle" diyen özel bir "depolama" ayarı.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sahibinden-ilanlar", // Cloudinary'de resimlerin duracağı klasör
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
    // "limit": resim 1200x1200'den büyükse küçült, küçükse dokunma.
    // Neden: kullanıcı 10MB'lık dev bir fotoğraf yüklerse, hem
    // depolama hem yükleme hızı için makul boyuta indiriyoruz.
  },
});

// upload: bu ayarlarla hazırlanmış bir multer nesnesi.
// server.js'te endpoint'lere "middleware" olarak ekleyeceğiz.
const upload = multer({ storage: storage });

module.exports = upload;
