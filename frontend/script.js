// ================================
// SAHİBİNDEN GİRİŞ - JavaScript
// ================================

console.log("script.js bağlandı, hazırız! (v3)");

// ================================
// DOM SEÇME
// ================================
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginForm     = document.getElementById("loginForm");
const loginBtn      = document.getElementById("loginBtn");
const formMessage   = document.getElementById("formMessage");
const emailError    = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// ================================
// YARDIMCI FONKSİYONLAR
// ================================
function isEmpty(value) { return value.trim() === ""; }

function isValidEmail(value) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value);
}

function isValidPassword(value) { return value.length >= 6; }

function clearErrors() {
  emailInput.classList.remove("is-invalid");
  passwordInput.classList.remove("is-invalid");
  emailError.classList.remove("d-block");
  passwordError.classList.remove("d-block");
  formMessage.classList.add("d-none");
}

function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add("is-invalid");
  errorEl.textContent = message;
  errorEl.classList.add("d-block");
}

function showFormMessage(message, type) {
  formMessage.textContent = message;
  formMessage.classList.remove("d-none", "alert-danger", "alert-success");
  formMessage.classList.add("alert-" + type);
}

// ================================
// FORM SUBMIT — BACKEND'E BAĞLANTI
// ================================
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const emailValue    = emailInput.value;
  const passwordValue = passwordInput.value;

  // 1) Frontend validasyonu
  clearErrors();
  let hasError = false;

  if (isEmpty(emailValue)) {
    showFieldError(emailInput, emailError, "E-posta alanı boş bırakılamaz.");
    hasError = true;
  } else if (!isValidEmail(emailValue)) {
    showFieldError(emailInput, emailError, "Geçerli bir e-posta girin (ornek@mail.com).");
    hasError = true;
  }

  if (isEmpty(passwordValue)) {
    showFieldError(passwordInput, passwordError, "Şifre alanı boş bırakılamaz.");
    hasError = true;
  } else if (!isValidPassword(passwordValue)) {
    showFieldError(passwordInput, passwordError, "Şifre en az 6 karakter olmalı.");
    hasError = true;
  }

  if (hasError) return;

  // 2) Butonu devre dışı bırak (çift tıklamayı önle)
  loginBtn.disabled = true;
  loginBtn.textContent = "Giriş yapılıyor...";

  // 3) Backend'e istek at
  try {
    const response = await fetch("https://stiyakproject.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
    });

    const data = await response.json();

    if (response.ok) {
      // 200 — Giriş başarılı
      localStorage.setItem("userEmail", emailValue);
      window.location.href = "ilanlar.html";
      // İleride: window.location.href = "ilanlar.html";
    } else {
      // 401, 400 vb. — Hata mesajını göster
      showFormMessage(data.message, "danger");
    }

  } catch (error) {
    // Sunucuya ulaşılamadı
    showFormMessage("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.", "danger");
  } finally {
    // Butonu tekrar aktif et
    loginBtn.disabled = false;
    loginBtn.textContent = "Giriş Yap";
  }
});