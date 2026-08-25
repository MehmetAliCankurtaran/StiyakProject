// ================================
// SAHİBİNDEN KAYIT - JavaScript
// ================================

const emailInput         = document.getElementById("email");
const passwordInput      = document.getElementById("password");
const passwordConfirm    = document.getElementById("passwordConfirm");
const registerForm       = document.getElementById("registerForm");
const registerBtn        = document.getElementById("registerBtn");
const formMessage        = document.getElementById("formMessage");
const emailError         = document.getElementById("emailError");
const passwordError      = document.getElementById("passwordError");
const passwordConfirmError = document.getElementById("passwordConfirmError");

// ================================
// YARDIMCI FONKSİYONLAR
// ================================
function isEmpty(value) { return value.trim() === ""; }

function isValidEmail(value) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value);
}

function clearErrors() {
  [emailInput, passwordInput, passwordConfirm].forEach(el => {
    el.classList.remove("is-invalid");
  });
  [emailError, passwordError, passwordConfirmError].forEach(el => {
    el.classList.remove("d-block");
  });
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
// FORM SUBMIT
// ================================
registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const emailValue    = emailInput.value;
  const passwordValue = passwordInput.value;
  const confirmValue  = passwordConfirm.value;

  // 1) Validasyon
  clearErrors();
  let hasError = false;

  if (isEmpty(emailValue)) {
    showFieldError(emailInput, emailError, "E-posta alanı boş bırakılamaz.");
    hasError = true;
  } else if (!isValidEmail(emailValue)) {
    showFieldError(emailInput, emailError, "Geçerli bir e-posta girin.");
    hasError = true;
  }

  if (isEmpty(passwordValue)) {
    showFieldError(passwordInput, passwordError, "Şifre alanı boş bırakılamaz.");
    hasError = true;
  } else if (passwordValue.length < 6) {
    showFieldError(passwordInput, passwordError, "Şifre en az 6 karakter olmalı.");
    hasError = true;
  }

  if (isEmpty(confirmValue)) {
    showFieldError(passwordConfirm, passwordConfirmError, "Şifre tekrar alanı boş bırakılamaz.");
    hasError = true;
  } else if (passwordValue !== confirmValue) {
    showFieldError(passwordConfirm, passwordConfirmError, "Şifreler eşleşmiyor.");
    hasError = true;
  }

  if (hasError) return;

  // 2) Butonu devre dışı bırak
  registerBtn.disabled = true;
  registerBtn.textContent = "Kayıt yapılıyor...";

  // 3) Backend'e istek at
  try {
    const response = await fetch("https://stiyakproject.onrender.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
    });

    const data = await response.json();

    if (response.ok) {
      // 201 — Kayıt başarılı, login sayfasına yönlendir
      showFormMessage("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      // 409 (email zaten kayıtlı) veya 400
      showFormMessage(data.message, "danger");
    }

  } catch (error) {
    showFormMessage("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.", "danger");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Üye Ol";
  }
});