// ================================
// LISTING MODEL (İlan Şeması)
// ================================
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  baslik: {
    type: String,
    required: true,
    trim: true,
  },
  fiyat: {
    type: Number,
    required: true,
  },
  konum: {
    type: String,
    required: true,
    trim: true,
  },
  kategori: {
    type: String,
    required: true,
    enum: ["Vasıta", "Emlak", "Elektronik", "Ev & Bahçe", "Giyim", "Diğer"],
    default: "Diğer",
  },
  aciklama: {
    type: String,
    trim: true,
    default: "",
  },
  // İlanı kimin verdiği — email saklıyoruz
  kullanici: {
    type: String,
    required: true,
  },
  // resimler: birden fazla resim linkini bir DİZİ (array) olarak
  // tutuyoruz — "[String]" demek "String'lerden oluşan bir liste" demek.
  resimler: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;