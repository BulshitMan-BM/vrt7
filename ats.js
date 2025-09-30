// =======================
// AUTHENTICATION LOGIC
// =======================

/**
 * Inisialisasi semua event listener untuk fungsionalitas autentikasi.
 * Fungsi ini dipanggil dari dashboard.js setelah DOM siap.
 */
function initAuth() {
    // Event listener untuk form login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nik = document.getElementById("nik").value.trim();
            const password = document.getElementById("password").value.trim();
            const loginBtn = document.getElementById("login-btn");
            const loginText = document.getElementById("login-text");
            const loginSpinner = document.getElementById("login-spinner");

            if (!nik || !password) {
                showMessage("login-message", "NIK & Password wajib diisi", "error");
                return;
            }
            if (nik.length !== 16) {
                showMessage("login-message", "NIK harus 16 digit", "error");
                return;
            }

            // Tampilkan status loading
            loginBtn.disabled = true;
            loginText.textContent = "Memproses...";
            loginSpinner.classList.remove("hidden");
            showMessage("login-message", "Sedang memproses login...", "info");

            try {
                const r = await P({ action: "login", nik: nik, password: password });
                if (r.success && r.step === "otp") {
                    document.getElementById("otp-overlay").classList.remove("hidden");
                    startOtpTimer(120);
                    showMessage("otp-message", "OTP dikirim ke email", "info");
                } else {
                    showMessage("login-message", r.message || "Login gagal", "error");
                }
            } catch (error) {
                showMessage("login-message", "Terjadi kesalahan koneksi", "error");
            } finally {
                // Kembalikan status tombol
                loginBtn.disabled = false;
                loginText.textContent = "Masuk";
                loginSpinner.classList.add("hidden");
            }
        });
    }

    // Event listener untuk form verifikasi OTP
    const otpForm = document.getElementById("otp-form");
    if (otpForm) {
        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nik = document.getElementById("nik").value.trim();
            const otpInputs = document.querySelectorAll('.otp-input');
            const otpCode = Array.from(otpInputs).map(input => input.value).join('');
            const verifyBtn = document.getElementById("verify-otp-btn");
            const verifyText = document.getElementById("verify-otp-text");
            const verifySpinner = document.getElementById("verify-otp-spinner");

            if (!otpCode || otpCode.length !== 6) {
                showMessage("otp-message", "OTP wajib diisi (6 digit)", "error");
                return;
            }

            // Tampilkan status loading
            verifyBtn.disabled = true;
            verifyText.textContent = "Memverifikasi...";
            verifySpinner.classList.remove("hidden");
            showMessage("otp-message", "Memverifikasi OTP...", "info");

            try {
                const r = await P({ action: "verify-otp", nik: nik, otp: otpCode });
                if (r.success) {
                    const tokenExpires = r.data.tokenExpires * 1000; // Konversi ke milidetik
                    localStorage.setItem("accessToken", r.data.accessToken);
                    localStorage.setItem("refreshToken", r.data.refreshToken);
                    localStorage.setItem("tokenExpires", tokenExpires);

                    document.getElementById("otp-overlay").classList.add("hidden");
                    clearInterval(window.otpTimer); // Hapus timer dari variabel global
                    
                    showDashboard();
                    renderDashboard(r.data);
                } else {
                    showMessage("otp-message", r.message || "OTP salah", "error");
                }
            } catch (error) {
                showMessage("otp-message", "Terjadi kesalahan koneksi", "error");
            } finally {
                // Kembalikan status tombol
                verifyBtn.disabled = false;
                verifyText.textContent = "Verifikasi OTP";
                verifySpinner.classList.add("hidden");
            }
        });
    }

    // Event listener untuk kirim ulang OTP
    const resendOtp = document.getElementById("resend-otp");
    if (resendOtp) {
        resendOtp.addEventListener("click", async () => {
            const nik = document.getElementById("nik").value.trim();
            try {
                const r = await P({ action: "resend-otp", nik: nik });
                showMessage("otp-message", r.message || "OTP berhasil dikirim ulang", r.success ? "info" : "error");
                if (r.success) {
                    startOtpTimer(120);
                }
            } catch (error) {
                showMessage("otp-message", "Gagal kirim ulang OTP", "error");
            }
        });
    }

    // Event listener untuk tombol logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await P({ action: "logout" });
            } catch (error) {
                // Lanjutkan logout lokal meskipun API gagal
            }
            C(); // Hapus token
            showLogin();
            document.getElementById("login-form").reset();
            document.querySelectorAll('.otp-input').forEach(input => input.value = '');
            resetUserAvatars();
            showMessage("login-message", "Logout berhasil", "info");
        });
    }

    // Penanganan input OTP (auto-focus dan auto-submit)
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            if (Array.from(otpInputs).every(inp => inp.value.length === 1)) {
                otpForm.dispatchEvent(new Event('submit'));
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Menutup overlay OTP
    const closeOtp = document.getElementById("close-otp");
    if(closeOtp) {
        closeOtp.addEventListener("click", () => {
            document.getElementById("otp-overlay").classList.add("hidden");
            clearInterval(window.otpTimer);
            document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        });
    }
}
