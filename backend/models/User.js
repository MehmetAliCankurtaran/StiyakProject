// ================================
// USER MODEL (Kullanıcı Şeması)
// ================================
// Ne: MongoDB'de saklayacağımız bir "kullanıcı" belgesinin (document)
//     hangi alanlardan oluşacağını, hangi tipte olacağını tanımlıyoruz.
// Neden: Mongoose'a "her kullanıcı kaydında email ve şifre OLMALI,
//        email STRING olmalı" gibi kurallar koyuyoruz — böylece
//        yanlışlıkla eksik/bozuk veri kaydetmemizi engelliyor.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,       // veri tipi: metin
    required: true,     // zorunlu alan, boş bırakılamaz
    unique: true,        // aynı email'le iki kayıt OLAMAZ
    lowercase: true,     // kaydetmeden önce otomatik küçük harfe çevir
    trim: true,           // baştaki/sondaki boşlukları otomatik sil
  },
  password: {
    type: String,
    required: true,
    // NOT: Burada minlength koymuyoruz çünkü kaydedilen şey
    // artık HASH'lenmiş şifre olacak (uzun, şifreli bir metin),
    // gerçek şifre uzunluğu kontrolünü frontend zaten yapıyor.
  },
  createdAt: {
    type: Date,
    default: Date.now,   // otomatik olarak "şu an" değerini ata
  },
});

// mongoose.model(isim, şema): bu şemayı kullanarak "User" adında
// bir model oluşturuyoruz. Bu model, MongoDB'de "users" adında bir
// koleksiyona (collection - SQL'deki "tablo" karşılığı) karşılık gelir.
const User = mongoose.model("User", userSchema);

module.exports = User;