// ================================
// GİRİŞ KONTROLÜ
// ================================
const userEmail = localStorage.getItem("userEmail");
if (!userEmail) {
  window.location.href = "index.html";
}
document.getElementById("userEmail").textContent = userEmail;

// ================================
// ÇIKIŞ YAP
// ================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("userEmail");
  window.location.href = "index.html";
});

// ================================
// KATEGORİ EMOJİLERİ
// ================================
const kategoriEmoji = {
  "Vasıta": "🚗",
  "Emlak": "🏠",
  "Elektronik": "📱",
  "Ev & Bahçe": "🛋️",
  "Giyim": "👕",
  "Diğer": "📦",
};

// ================================
// İLAN KARTI OLUŞTUR
// ================================
function ilanKartiOlustur(ilan) {
  const emoji = kategoriEmoji[ilan.kategori] || "📦";
  const tarih = new Date(ilan.createdAt).toLocaleDateString("tr-TR");

  // Eğer ilanın en az bir resmi varsa, İLK resmi kart görselinde göster.
  // Yoksa (kullanıcı resim eklemediyse), eskisi gibi emoji göster.
  const gorsel = (ilan.resimler && ilan.resimler.length > 0)
    ? `<img src="${ilan.resimler[0]}" class="listing-img" alt="${ilan.baslik}">`
    : `<div class="listing-img">${emoji}</div>`;

  // data-id: bu karta tıklandığında HANGİ ilanın detayının açılacağını
  // bilmemiz lazım. İlanın MongoDB'deki benzersiz kimliğini (_id)
  // HTML elementinin üzerine "etiket" olarak yapıştırıyoruz.
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="listing-card" data-id="${ilan._id}">
        ${gorsel}
        <div class="listing-body">
          <div class="listing-title">${ilan.baslik}</div>
          <div class="listing-price">${Number(ilan.fiyat).toLocaleString("tr-TR")} TL</div>
          <div class="listing-location">📍 ${ilan.konum}</div>
          <div class="listing-date">${tarih}</div>
        </div>
      </div>
    </div>
  `;
}

// ================================
// İLANLARI BACKEND'DEN ÇEKME
// ================================
// mevcutIlanlar: en son çekilen ilan listesini HAFIZADA tutuyoruz.
// Neden: bir karta tıklandığında, o ilanın TÜM bilgisine (resimler,
// açıklama gibi kart üzerinde göstermediğimiz alanlara) tekrar
// backend'e istek atmadan, buradan anında ulaşabilelim diye.
let mevcutIlanlar = [];

async function ilanlariYukle(aramaTerimi = "") {
  const container = document.getElementById("listingsContainer");

  try {
    const url = aramaTerimi
      ? `https://stiyakproject.onrender.com/listings?ara=${encodeURIComponent(aramaTerimi)}`
      : "https://stiyakproject.onrender.com/listings";

    const response = await fetch(url);
    const ilanlar = await response.json();

    mevcutIlanlar = ilanlar; // hafızaya al

    if (ilanlar.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          ${aramaTerimi ? "Aramanızla eşleşen ilan bulunamadı." : "Henüz ilan yok. İlk ilanı sen ver! 🎉"}
        </div>`;
      document.querySelector(".listing-count").textContent = "";
      return;
    }

    container.innerHTML = ilanlar.map(ilanKartiOlustur).join("");
    document.querySelector(".listing-count").textContent = `(${ilanlar.length} ilan)`;

  } catch (error) {
    container.innerHTML = `
      <div class="col-12 text-center text-danger py-5">
        Sunucuya bağlanılamadı. Lütfen tekrar deneyin.
      </div>`;
  }
}

ilanlariYukle();

// ================================
// İLAN DETAYINI AÇ (Instagram tarzı modal)
// ================================
// Ne: Bir ilan kartına tıklandığında, o ilana ait tüm resimleri
//     galeri olarak, bilgileri de yanda gösteren modalı dolduruyoruz.
// Neden event delegation (container'a tek listener): Kartlar JS ile
//     SONRADAN oluşturuluyor. Her karta ayrı ayrı addEventListener
//     eklemek yerine, hep var olan SABİT container'a TEK bir listener
//     ekleyip, tıklamanın hangi karttan geldiğini "closest" ile
//     buluyoruz — yeni ilan eklense bile listener'ı tekrar kurmamıza
//     gerek kalmıyor.

document.getElementById("listingsContainer").addEventListener("click", (event) => {
  // event.target: tam olarak neye tıklandığı (resmin kendisi olabilir,
  // başlık yazısı olabilir). .closest(".listing-card") ile, tıklanan
  // yerin İÇİNDE bulunduğu en yakın ".listing-card" elementini buluyoruz.
  const kart = event.target.closest(".listing-card");
  if (!kart) return; // kart dışı bir yere tıklandıysa hiçbir şey yapma

  const id = kart.dataset.id; // data-id="..." attribute'unu okur
  const ilan = mevcutIlanlar.find((i) => i._id === id);
  if (!ilan) return;

  detayModaliDoldurVeAc(ilan);
});

function detayModaliDoldurVeAc(ilan) {
  const emoji = kategoriEmoji[ilan.kategori] || "📦";
  const tarih = new Date(ilan.createdAt).toLocaleDateString("tr-TR");

  // Metin alanlarını doldur
  document.getElementById("detayBaslik").textContent = ilan.baslik;
  document.getElementById("detayFiyat").textContent =
    `${Number(ilan.fiyat).toLocaleString("tr-TR")} TL`;
  document.getElementById("detayKonum").textContent = ilan.konum;
  document.getElementById("detayKategori").textContent = ilan.kategori;
  document.getElementById("detayTarih").textContent = tarih;
  document.getElementById("detayAciklama").textContent =
    ilan.aciklama && ilan.aciklama.trim() ? ilan.aciklama : "Açıklama girilmemiş.";
  document.getElementById("detayKullanici").textContent = ilan.kullanici;

  // Carousel'i (resim galerisini) doldur.
  const carouselInner = document.getElementById("detayCarouselInner");

  if (ilan.resimler && ilan.resimler.length > 0) {
    // .map() ile her resim için bir "carousel-item" HTML'i üretiyoruz.
    // İlk eleman "active" class'ını almalı — Bootstrap Carousel'in
    // kuralı bu, hangi resmin İLK gösterileceğini bu class belirler.
    carouselInner.innerHTML = ilan.resimler
      .map((resimUrl, index) => `
        <div class="carousel-item ${index === 0 ? "active" : ""}">
          <img src="${resimUrl}" alt="${ilan.baslik}">
        </div>
      `)
      .join("");
  } else {
    // Hiç resim yoksa, kocaman bir emoji göster (kart görünümüyle tutarlı)
    carouselInner.innerHTML = `
      <div class="carousel-item active">
        <div class="carousel-item-emoji">${emoji}</div>
      </div>
    `;
  }

  // Modalı aç.
  const modal = new bootstrap.Modal(document.getElementById("detayModal"));
  modal.show();
}

// ================================
// ARAMA KUTUSU
// ================================
// Ne: Kullanıcı arama kutusuna yazdıkça (ya da Enter'a basınca)
//     ilanlariYukle() fonksiyonunu, yazdığı terimle tekrar çağırıyoruz.

const searchInput = document.getElementById("searchInput");

if (searchInput) {
  let debounceTimer; // gecikme zamanlayıcısı için

  searchInput.addEventListener("input", () => {
    // DEBOUNCE: kullanıcı her harf yazdığında ANINDA istek atmak
    // yerine, yazmayı bir süre (300ms) durdurunca istek atıyoruz.
    // Neden: "daire" yazarken 5 harf = 5 ayrı istek yerine,
    // yazmayı bitirince TEK istek atmak sunucuyu gereksiz yormaz.
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      ilanlariYukle(searchInput.value.trim());
    }, 300);
  });
}

// ================================
// İLAN EKLEME MODAL
// ================================
const ilanGonderBtn = document.getElementById("ilanGonderBtn");

function modalHataGoster(inputEl, errorEl, mesaj) {
  inputEl.classList.add("is-invalid");
  errorEl.textContent = mesaj;
}

function modalHatalariTemizle() {
  ["ilanBaslik", "ilanKategori", "ilanFiyat", "ilanKonum"].forEach(id => {
    document.getElementById(id).classList.remove("is-invalid");
  });
  ["baslikError", "kategoriError", "fiyatError", "konumError"].forEach(id => {
    document.getElementById(id).textContent = "";
  });
  const modalMsg = document.getElementById("modalMessage");
  modalMsg.classList.add("d-none");
}

ilanGonderBtn.addEventListener("click", async () => {
  const baslik    = document.getElementById("ilanBaslik");
  const kategori  = document.getElementById("ilanKategori");
  const fiyat     = document.getElementById("ilanFiyat");
  const konum     = document.getElementById("ilanKonum");
  const aciklama  = document.getElementById("ilanAciklama");
  const resimler  = document.getElementById("ilanResimler");
  const modalMsg  = document.getElementById("modalMessage");

  // 1) Validasyon
  modalHatalariTemizle();
  let hasError = false;

  if (!baslik.value.trim()) {
    modalHataGoster(baslik, document.getElementById("baslikError"), "Başlık zorunludur.");
    hasError = true;
  }
  if (!kategori.value) {
    modalHataGoster(kategori, document.getElementById("kategoriError"), "Kategori seçiniz.");
    hasError = true;
  }
  if (!fiyat.value || Number(fiyat.value) < 0) {
    modalHataGoster(fiyat, document.getElementById("fiyatError"), "Geçerli bir fiyat girin.");
    hasError = true;
  }
  if (!konum.value.trim()) {
    modalHataGoster(konum, document.getElementById("konumError"), "Konum zorunludur.");
    hasError = true;
  }

  if (hasError) return;

  // 2) Butonu devre dışı bırak
  ilanGonderBtn.disabled = true;
  ilanGonderBtn.textContent = "Yayınlanıyor...";

  // 3) FormData oluştur ve backend'e gönder.
  // Ne: FormData, JSON'dan farklı olarak DOSYA da taşıyabilen bir
  //     "veri paketi" türü. Fotoğraf yüklerken JSON kullanamayız
  //     çünkü JSON sadece metin/sayı taşıyabilir, ikili (binary)
  //     dosya verisi taşıyamaz.
  // Neden headers YOK: JSON.stringify kullanırken elle
  //     "Content-Type": "application/json" yazıyorduk. FormData
  //     kullanırken bunu YAZMIYORUZ — tarayıcı, dosya sınırlarını
  //     (boundary) kendisi hesaplayıp doğru header'ı OTOMATİK ekliyor.
  //     Elle yazarsak bu otomatik hesaplama bozulur, istek başarısız olur.

  const formData = new FormData();
  formData.append("baslik", baslik.value.trim());
  formData.append("kategori", kategori.value);
  formData.append("fiyat", fiyat.value);
  formData.append("konum", konum.value.trim());
  formData.append("aciklama", aciklama.value.trim());
  formData.append("kullanici", userEmail);

  // resimler.files: kullanıcının seçtiği dosyaların listesi (FileList).
  // for...of ile tek tek geziyoruz, her birini AYNI "resimler" adıyla
  // ekliyoruz — backend'deki upload.array("resimler", 5) bu ismi bekliyor.
  for (const dosya of resimler.files) {
    formData.append("resimler", dosya);
  }

  try {
    const response = await fetch("https://stiyakproject.onrender.com/listings", {
      method: "POST",
      body: formData, // DİKKAT: JSON.stringify YOK, doğrudan formData
    });

    const data = await response.json();

    if (response.ok) {
      // Modalı kapat, formu temizle, ilanları yenile
      const modal = bootstrap.Modal.getInstance(document.getElementById("ilanModal"));
      modal.hide();
      document.getElementById("ilanForm").reset();
      ilanlariYukle();
    } else {
      modalMsg.textContent = data.message;
      modalMsg.classList.remove("d-none", "alert-success");
      modalMsg.classList.add("alert-danger");
    }

  } catch (error) {
    modalMsg.textContent = "Sunucuya bağlanılamadı.";
    modalMsg.classList.remove("d-none", "alert-success");
    modalMsg.classList.add("alert-danger");
  } finally {
    ilanGonderBtn.disabled = false;
    ilanGonderBtn.textContent = "İlanı Yayınla";
  }
});