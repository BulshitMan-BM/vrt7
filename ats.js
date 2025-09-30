// =======================
// AUTHENTICATION SYSTEM
// =======================

const W = "https://pemanis.bulshitman1.workers.dev";

function S(i, m) {
    const element = document.getElementById(i);
    if (element) {
        element.innerText = m;
    }
}

function T(a, e, t) {
    localStorage.setItem(a, e);
    if (t && typeof t === 'number') {
        if (t > Date.now()) {
            localStorage.setItem("tokenExpires", t);
        } else {
            localStorage.setItem("tokenExpires", Date.now() + t * 1000);
        }
    }
}

function C() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpires");
}

async function P(b) {
    const h = localStorage.getItem("accessToken") || "";
    const r = await fetch(W, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": h ? "Bearer " + h : ""
        },
        body: JSON.stringify(b)
    });
    return r.json();
}

// Token validation and refresh
async function V() {
    const a = localStorage.getItem("accessToken");
    const e = parseInt(localStorage.getItem("tokenExpires") || 0);
    
    if (!a || Date.now() > e) {
        const r = localStorage.getItem("refreshToken");
        if (r) {
            try {
                const t = await P({
                    action: "refresh-token",
                    accessToken: a,
                    refreshToken: r
                });
                
                if (t.success) {
                    const tokenExpires = t.data.tokenExpires;
                    const expirationTime = tokenExpires * 1000;
                    
                    localStorage.setItem("accessToken", t.data.accessToken);
                    localStorage.setItem("refreshToken", t.data.refreshToken);
                    localStorage.setItem("tokenExpires", expirationTime);
                } else {
                    C();
                    return false;
                }
            } catch (error) {
                C();
                return false;
            }
        } else {
            C();
            return false;
        }
    }
    return true;
}

// Login functionality
function handleRealLogin() {
    document.getElementById("login-form").addEventListener("submit", async (e) => {
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
        
        loginBtn.disabled = true;
        loginText.textContent = "Memproses...";
        loginSpinner.classList.remove("hidden");
        showMessage("login-message", "Sedang memproses login...", "info");
        
        try {
            const r = await P({
                action: "login",
                nik: nik,
                password: password
            });
            
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
            loginBtn.disabled = false;
            loginText.textContent = "Masuk";
            loginSpinner.classList.add("hidden");
        }
    });
}

// OTP verification functionality
function handleRealOTP() {
    document.getElementById("otp-form").addEventListener("submit", async (e) => {
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
        
        verifyBtn.disabled = true;
        verifyText.textContent = "Memverifikasi...";
        verifySpinner.classList.remove("hidden");
        showMessage("otp-message", "Memverifikasi OTP...", "info");
        
        try {
            const r = await P({
                action: "verify-otp",
                nik: nik,
                otp: otpCode
            });
            
            if (r.success) {
                const tokenExpires = r.data.tokenExpires;
                const expirationTime = tokenExpires * 1000;
                
                localStorage.setItem("accessToken", r.data.accessToken);
                localStorage.setItem("refreshToken", r.data.refreshToken);
                localStorage.setItem("tokenExpires", expirationTime);
                
                document.getElementById("otp-overlay").classList.add("hidden");
                clearInterval(otpTimer);
                
                if (typeof showDashboard === 'function') {
                    showDashboard();
                }
                if (typeof renderDashboard === 'function') {
                    renderDashboard(r.data);
                }
            } else {
                showMessage("otp-message", r.message || "OTP salah", "error");
            }
        } catch (error) {
            showMessage("otp-message", "Terjadi kesalahan koneksi", "error");
        } finally {
            verifyBtn.disabled = false;
            verifyText.textContent = "Verifikasi OTP";
            verifySpinner.classList.add("hidden");
        }
    });
    
    // Resend OTP functionality
    document.getElementById("resend-otp").addEventListener("click", async () => {
        const nik = document.getElementById("nik").value.trim();
        
        try {
            const r = await P({
                action: "resend-otp",
                nik: nik
            });
            
            showMessage("otp-message", r.message || "OTP berhasil dikirim ulang", r.success ? "info" : "error");
            
            if (r.success) {
                startOtpTimer(120);
            }
        } catch (error) {
            showMessage("otp-message", "Gagal kirim ulang OTP", "error");
        }
    });
}

// Real logout functionality
function handleRealLogout() {
    document.getElementById("logout-btn").addEventListener("click", async () => {
        try {
            await P({ action: "logout" });
        } catch (error) {
            // Continue with local logout even if API call fails
        }
        
        C();
        if (typeof showLogin === 'function') {
            showLogin();
        }
        
        document.getElementById("login-form").reset();
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        if (typeof resetUserAvatars === 'function') {
            resetUserAvatars();
        }
        
        showMessage("login-message", "Logout berhasil", "info");
    });
}

// OTP Timer
let otpTimer;

function startOtpTimer(seconds) {
    clearInterval(otpTimer);
    let timeLeft = seconds;
    const timerElement = document.getElementById("otp-timer");
    
    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    otpTimer = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            timerElement.textContent = "00:00";
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Initialize authentication
function initAuth() {
    handleRealLogin();
    handleRealOTP();
    handleRealLogout();
    
    // OTP input handling
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            const allFilled = Array.from(otpInputs).every(inp => inp.value.length === 1);
            if (allFilled) {
                document.getElementById("otp-form").dispatchEvent(new Event('submit'));
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Close OTP overlay
    document.getElementById("close-otp").addEventListener("click", () => {
        document.getElementById("otp-overlay").classList.add("hidden");
        clearInterval(otpTimer);
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
    });

    // Password toggle functionality
    const togglePassword = document.getElementById("toggle-password");
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const passwordInput = document.getElementById("password");
            const passwordIcon = document.getElementById("password-icon");
            
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                passwordIcon.className = "fas fa-eye-slash";
            } else {
                passwordInput.type = "password";
                passwordIcon.className = "fas fa-eye";
            }
        });
    }
}

// Session validation
async function validateSession() {
    const accessToken = localStorage.getItem("accessToken");
    const tokenExpires = parseInt(localStorage.getItem("tokenExpires") || 0);
    const hasLocalTokens = accessToken && Date.now() < tokenExpires;
    
    if (hasLocalTokens) {
        const cachedUserName = localStorage.getItem("userName");
        const cachedUserRole = localStorage.getItem("userRole");
        const cachedUserNik = localStorage.getItem("userNik");
        const cachedAvatarUrl = localStorage.getItem("avatarUrl");
        
        if (typeof showDashboard === 'function') {
            showDashboard();
        }
        if (typeof renderDashboard === 'function') {
            renderDashboard({
                name: cachedUserName || "User",
                role: cachedUserRole || "User", 
                nik: cachedUserNik || "****-****-****-****",
                avatarUrl: cachedAvatarUrl
            });
        }
        
        setTimeout(async () => {
            try {
                const isSessionValid = await V();
                
                if (isSessionValid) {
                    const profile = await P({ action: "get-profile" });
                    
                    if (profile.success && typeof renderDashboard === 'function') {
                        renderDashboard(profile.data);
                    } else {
                        C();
                        if (typeof showLogin === 'function') {
                            showLogin();
                        }
                        showMessage("login-message", "Sesi tidak valid, silakan login kembali", "info");
                    }
                } else {
                    C();
                    if (typeof showLogin === 'function') {
                        showLogin();
                    }
                    showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
                }
            } catch (error) {
                setTimeout(() => {
                    if (typeof showMessage === 'function') {
                        showMessage("settings-message", "Mode offline - beberapa fitur mungkin terbatas", "info");
                    }
                }, 2000);
            }
        }, 100);
    } else {
        if (typeof showLogin === 'function') {
            showLogin();
        }
    }
}

// Periodic validation
function startPeriodicValidation() {
    setInterval(async () => {
        const isDashboardVisible = !document.getElementById('dashboard-page').classList.contains('hidden');
        
        if (isDashboardVisible) {
            try {
                const isValid = await V();
                if (!isValid) {
                    C();
                    if (typeof showLogin === 'function') {
                        showLogin();
                    }
                    showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
                }
            } catch (error) {
                // Ignore network errors
            }
        }
    }, 5 * 60 * 1000);
    
    document.addEventListener("visibilitychange", async () => {
        if (!document.hidden) {
            const isDashboardVisible = !document.getElementById('dashboard-page').classList.contains('hidden');
            
            if (isDashboardVisible) {
                try {
                    const isValid = await V();
                    if (!isValid) {
                        C();
                        if (typeof showLogin === 'function') {
                            showLogin();
                        }
                        showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
                    }
                } catch (error) {
                    // Ignore network errors
                }
            }
        }
    });
}
