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
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="listing-card">
        <div class="listing-img">${emoji}</div>
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
// aramaTerimi parametresi opsiyonel — hiç yazılmazsa "" (boş) olur,
// yani "tüm ilanları getir" demek.
async function ilanlariYukle(aramaTerimi = "") {
  const container = document.getElementById("listingsContainer");

  try {
    // encodeURIComponent: kullanıcının yazdığı metni URL'e güvenli
    // hale getirir (boşluk, Türkçe karakter gibi şeyleri "kodlar").
    // Neden gerekli: "3+1 daire" gibi bir arama, kodlanmadan adrese
    // eklenirse "+"  işareti URL'de farklı bir anlama gelir, bozulur.
    const url = aramaTerimi
      ? `https://stiyakproject.onrender.com/listings?ara=${encodeURIComponent(aramaTerimi)}`
      : "https://stiyakproject.onrender.com/listings";

    const response = await fetch(url);
    const ilanlar = await response.json();

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

  // 3) Backend'e gönder
  try {
    const response = await fetch("https://stiyakproject.onrender.com/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baslik:    baslik.value.trim(),
        kategori:  kategori.value,
        fiyat:     Number(fiyat.value),
        konum:     konum.value.trim(),
        aciklama:  aciklama.value.trim(),
        kullanici: userEmail,
      }),
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