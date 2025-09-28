/**
 * =================================================================
 * SCRIPT LENGKAP: LOGIN SYSTEM & PROFILE SYSTEM
 * Cukup salin semua kode di bawah ini dan tempelkan ke file JS Anda.
 * =================================================================
 */

// Function untuk toggle password visibility (dibuat global karena dipanggil dari onclick HTML)
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input && icon) {
        if (input.type === "password") {
            input.type = "text";
            icon.className = "fas fa-eye-slash";
        } else {
            input.type = "password";
            icon.className = "fas fa-eye";
        }
    }
}

// MODUL SISTEM LOGIN
const LoginSystem = (function() {
    // Private variables
    const W = "https://pemanis.bulshitman1.workers.dev/";
    let otpTimer;
    let currentUser = null;
    let captchaCode = '';

    // Private functions
    function S(i, m) {
        const element = document.getElementById(i);
        if (element) {
            element.innerText = m;
        }
    }

    function generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaCode = result;
        const captchaTextElement = document.getElementById('ct');
        if (captchaTextElement) {
            captchaTextElement.textContent = captchaCode;
        }
        const verifyCodeInput = document.getElementById('vc');
        if (verifyCodeInput) {
            verifyCodeInput.value = '';
        }
    }

    function showMessage(type, message) {
        const loginMessage = document.getElementById('login-message');
        const loginMessageIcon = document.getElementById('login-message-icon');
        const loginMessageText = document.getElementById('login-message-text');
        
        if (loginMessage && loginMessageIcon && loginMessageText) {
            loginMessage.classList.remove('hidden', 'bg-red-50', 'bg-green-50', 'bg-blue-50', 'text-red-800', 'text-green-800', 'text-blue-800');
            loginMessageIcon.className = '';
            
            if (type === 'error') {
                loginMessage.classList.add('bg-red-50', 'text-red-800');
                loginMessageIcon.className = 'fas fa-exclamation-circle text-red-600';
            } else if (type === 'success') {
                loginMessage.classList.add('bg-green-50', 'text-green-800');
                loginMessageIcon.className = 'fas fa-check-circle text-green-600';
            } else {
                loginMessage.classList.add('bg-blue-50', 'text-blue-800');
                loginMessageIcon.className = 'fas fa-info-circle text-blue-600';
            }
            
            loginMessageText.textContent = message;
        }
    }

    function showOtpMessage(type, message) {
        const otpMessage = document.getElementById('otp-message');
        const otpMessageIcon = document.getElementById('otp-message-icon');
        const otpMessageText = document.getElementById('otp-message-text');
        
        if (otpMessage && otpMessageIcon && otpMessageText) {
            otpMessage.classList.remove('hidden', 'bg-red-50', 'bg-green-50', 'bg-blue-50', 'text-red-800', 'text-green-800', 'text-blue-800');
            otpMessageIcon.className = '';
            
            if (type === 'error') {
                otpMessage.classList.add('bg-red-50', 'text-red-800');
                otpMessageIcon.className = 'fas fa-exclamation-circle text-red-600';
            } else if (type === 'success') {
                otpMessage.classList.add('bg-green-50', 'text-green-800');
                otpMessageIcon.className = 'fas fa-check-circle text-green-600';
            } else {
                otpMessage.classList.add('bg-blue-50', 'text-blue-800');
                otpMessageIcon.className = 'fas fa-info-circle text-blue-600';
            }
            
            otpMessageText.textContent = message;
        }
    }

    function T(a, e, t) {
        localStorage.setItem(a, e);
        localStorage.setItem("tokenExpires", Date.now() + t * 1000);
    }

    function C() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpires");
        localStorage.removeItem("AvatarUrl");
        localStorage.removeItem("tempUserData");
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

    function O(s) {
        clearInterval(otpTimer);
        let timerElement = document.getElementById("otp-timer");
        let t = s;
        
        if (timerElement) {
            otpTimer = setInterval(() => {
                if (t <= 0) {
                    clearInterval(otpTimer);
                    timerElement.innerText = "00:00";
                    showOtpMessage('error', 'Kode OTP telah kedaluwarsa');
                    return;
                }
                const minutes = Math.floor(t / 60);
                const seconds = t % 60;
                timerElement.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                t--;
            }, 1000);
        }
    }

    // DIMODIFIKASI: Fungsi ini sekarang mengupdate avatar di sidebar DAN di halaman profil
    function updateProfileImages() {
        const sidebarImg = document.getElementById('sidebarAvatar');
        const sidebarFallback = document.getElementById('sidebarProfileFallback');
        const profileImg = document.getElementById('profileAvatar');
        const profileFallback = document.getElementById('profileAvatarFallback');

        let avatarUrl = localStorage.getItem('AvatarUrl');
        let processedAvatarUrl = avatarUrl;

        if (avatarUrl && avatarUrl.includes('drive.google.com')) {
            const fileIdMatch = avatarUrl.match(/[?&]id=([^&]+)/);
            if (fileIdMatch) {
                processedAvatarUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
            }
        }

        const images = [sidebarImg, profileImg].filter(Boolean);
        const fallbacks = [sidebarFallback, profileFallback].filter(Boolean);

        if (avatarUrl && avatarUrl.trim() !== '') {
            images.forEach(img => {
                img.src = processedAvatarUrl;
                img.style.display = 'block';
                img.onload = () => fallbacks.forEach(fb => fb.style.display = 'none');
                img.onerror = function() {
                    this.src = `https://pemanis.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(processedAvatarUrl)}`;
                    this.onerror = function() {
                        this.style.display = 'none';
                        fallbacks.forEach(fb => fb.style.display = 'flex');
                    };
                };
            });
            fallbacks.forEach(fb => fb.style.display = 'none');
        } else {
            images.forEach(img => img.style.display = 'none');
            fallbacks.forEach(fb => fb.style.display = 'flex');
        }
    }

function D(u, userData = {}) {
    if (window.DashboardAPI) {
        window.DashboardAPI.showDashboard();
    }
    
    const welcomeTitle = document.getElementById("welcome-title");
    const userName = document.getElementById("user-name");
    
    if (welcomeTitle) {
        welcomeTitle.textContent = `Selamat Datang, ${u}!`;
    }
    if (userName) {
        userName.textContent = u;
    }
    
    currentUser = userData;
    updateProfileImages();
    
    // Inisialisasi sistem profil
    if (window.ProfileSystem) {
        // 👉 gunakan data user dari parameter kalau ada
        if (userData && Object.keys(userData).length > 0) {
            currentUserData = userData;
        } else if (!currentUserData || Object.keys(currentUserData).length === 0) {
            // fallback ke decode token kalau userData kosong
            try {
                const token = localStorage.getItem("accessToken");
                if (token) {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    currentUserData = {
                        username: payload.username || "User",
                        nik: payload.nik || "",
                        role: payload.role || "Member",
                        lastLogin: payload.lastLogin || null,
                        avatarUrl: localStorage.getItem("AvatarUrl") || ""
                    };
                }
            } catch (e) {
                window.location.href = "login.html";
                return;
            }
        }
        
        ProfileSystem.init(P, currentUserData);
    }
}


    async function V() {
        const a = localStorage.getItem("accessToken");
        const e = parseInt(localStorage.getItem("tokenExpires") || 0);
        
        if (!a || Date.now() > e) {
            const r = localStorage.getItem("refreshToken");
            if (r) {
                const t = await P({
                    action: "refresh-token",
                    accessToken: a,
                    refreshToken: r
                });
                if (t.success) {
                    T("accessToken", t.data.accessToken, t.data.tokenExpires - Math.floor(Date.now() / 1000));
                    T("refreshToken", t.data.refreshToken, t.data.tokenExpires - Math.floor(Date.now() / 1000));
                } else {
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

    // Public API
    return {
        init: function() {
            const existingToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            
            if (existingToken && refreshToken) {
                try {
                    const payload = JSON.parse(atob(existingToken.split(".")[1]));
                    D(payload.name || payload.username || 'User', payload);
                    
                    setTimeout(async () => {
                        const isValid = await V();
                        if (isValid) {
                            try {
                                const userDataResponse = await P({ action: "get-user-data" });
                                
                                if (userDataResponse.success && userDataResponse.data) {
                                    localStorage.setItem('AvatarUrl', userDataResponse.data.avatarUrl || '');
                                    D(userDataResponse.data.username, userDataResponse.data);
                                }
                            } catch (e) { /* Gagal fetch data baru, tetap gunakan data lama */ }
                        } else {
                            if (window.DashboardAPI) window.DashboardAPI.showLogin();
                            showMessage('info', 'Sesi telah berakhir, silakan login kembali');
                        }
                    }, 100);
                    
                } catch (e) {
                    if (window.DashboardAPI) window.DashboardAPI.showLogin();
                }
            } else {
                if (window.DashboardAPI) window.DashboardAPI.showLogin();
            }

            this.setupEventListeners();
        },
        
        // DITAMBAHKAN: Mengekspos fungsi update avatar
        updateAllAvatars: function() {
            updateProfileImages();
        },

        setupEventListeners: function() {
            // Captcha handler
            const refreshCaptchaBtn = document.getElementById('rc');
            if (refreshCaptchaBtn) {
                refreshCaptchaBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    generateCaptcha();
                });
            }
            generateCaptcha();

            // Login form handler
            const loginForm = document.getElementById("login-form");
            if (loginForm) {
                loginForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const captchaInput = document.getElementById('vc');
                    const userCaptcha = captchaInput.value.trim();

                    if (!userCaptcha || userCaptcha.toLowerCase() !== captchaCode.toLowerCase()) {
                        showMessage('error', 'Kode Verifikasi salah. Silakan coba lagi.');
                        generateCaptcha();
                        return;
                    }

                    const nikInput = document.getElementById("nik");
                    const passwordInput = document.getElementById("password");
                    const loginBtn = document.getElementById("login-btn");
                    const loginText = document.getElementById("login-text");
                    const loginSpinner = document.getElementById("login-spinner");
                    
                    const nik = nikInput.value.trim();
                    const password = passwordInput.value.trim();
                    
                    if (!nik || !password) {
                        showMessage('error', 'NIK dan Password wajib diisi');
                        return;
                    }
                    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
                        showMessage('error', 'NIK harus 16 digit angka');
                        return;
                    }
                    
                    loginBtn.disabled = true;
                    loginText.textContent = 'Memproses...';
                    loginSpinner.classList.remove('hidden');
                    
                    try {
                        const response = await P({ action: "login", nik: nik, password: password });
                        
                        if (response.success && response.step === "otp") {
                            if (response.data) {
                                localStorage.setItem('AvatarUrl', response.data.avatarUrl || '');
                                localStorage.setItem('tempUserData', JSON.stringify(response.data));
                            }
                            document.getElementById("otp-overlay").classList.remove('hidden');
                            O(300);
                            showOtpMessage('info', 'Kode OTP telah dikirim');
                            document.querySelector('.otp-input')?.focus();
                        } else if (response.success) {
                            T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            T("refreshToken", response.data.refreshToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            localStorage.setItem('AvatarUrl', response.data.avatarUrl || '');
                            D(response.data.username || 'User', response.data);
                        } else {
                            showMessage('error', response.message || 'Login gagal');
                            generateCaptcha();
                        }
                    } catch (error) {
                        showMessage('error', 'Terjadi kesalahan koneksi');
                        generateCaptcha();
                    } finally {
                        loginBtn.disabled = false;
                        loginText.textContent = 'Masuk';
                        loginSpinner.classList.add('hidden');
                    }
                });
            }

            // OTP input functionality
            const otpInputs = document.querySelectorAll('.otp-input');
            otpInputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    if (e.target.value && index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && index > 0) {
                        otpInputs[index - 1].focus();
                    }
                });
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
                    for (let i = 0; i < Math.min(pastedData.length, otpInputs.length - index); i++) {
                        otpInputs[index + i].value = pastedData[i];
                    }
                    const nextEmptyIndex = Math.min(index + pastedData.length, otpInputs.length - 1);
                    otpInputs[nextEmptyIndex].focus();
                });
            });

            // OTP form handler
            const otpForm = document.getElementById("otp-form");
            if (otpForm) {
                otpForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const nikInput = document.getElementById("nik");
                    const verifyBtn = document.getElementById("verify-otp-btn");
                    const verifyText = document.getElementById("verify-otp-text");
                    const verifySpinner = document.getElementById("verify-otp-spinner");
                    
                    const nik = nikInput.value.trim();
                    
                    let otp = Array.from(otpInputs).map(input => input.value).join('');
                    
                    if (otp.length !== 6) {
                        showOtpMessage('error', 'Masukkan 6 digit kode OTP');
                        return;
                    }
                    
                    verifyBtn.disabled = true;
                    verifyText.textContent = 'Memverifikasi...';
                    verifySpinner.classList.remove('hidden');
                    
                    try {
                        const response = await P({ action: "verify-otp", nik: nik, otp: otp });
                        
                        if (response.success) {
                            const tempUserData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
                            const combinedUserData = { ...tempUserData, ...response.data };
                            
                            T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            T("refreshToken", response.data.refreshToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            localStorage.setItem('AvatarUrl', combinedUserData.avatarUrl || '');
                            
                            D(combinedUserData.username || 'User', combinedUserData);
                            
                            clearInterval(otpTimer);
                            document.getElementById("otp-overlay").classList.add('hidden');
                            localStorage.removeItem('tempUserData');
                        } else {
                            showOtpMessage('error', response.message || 'Kode OTP salah');
                        }
                    } catch (error) {
                        showOtpMessage('error', 'Terjadi kesalahan koneksi');
                    } finally {
                        verifyBtn.disabled = false;
                        verifyText.textContent = 'Verifikasi';
                        verifySpinner.classList.add('hidden');
                    }
                });
            }

            // Resend OTP handler
            document.getElementById("resend-otp")?.addEventListener("click", async () => {
                const nik = document.getElementById("nik").value.trim();
                try {
                    const response = await P({ action: "resend-otp", nik: nik });
                    if (response.success) {
                        showOtpMessage('success', 'Kode OTP baru telah dikirim');
                        O(300);
                    } else {
                        showOtpMessage('error', response.message || 'Gagal mengirim ulang OTP');
                    }
                } catch (error) {
                    showOtpMessage('error', 'Terjadi kesalahan koneksi');
                }
            });

            // Close OTP handler
            document.getElementById("close-otp")?.addEventListener("click", () => {
                document.getElementById("otp-overlay").classList.add('hidden');
                clearInterval(otpTimer);
                otpInputs.forEach(input => input.value = '');
            });

            // Password toggle
            const togglePassword = document.getElementById("toggle-password");
            const passwordInput = document.getElementById("password");
            const passwordIcon = document.getElementById("password-icon");
            if (togglePassword) {
                togglePassword.addEventListener("click", () => {
                    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
                    passwordInput.setAttribute("type", type);
                    passwordIcon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
                });
            }

            // Logout handler
            const logoutBtn = document.getElementById("logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", async () => {
                    const originalContent = logoutBtn.innerHTML;
                    logoutBtn.disabled = true;
                    logoutBtn.innerHTML = `<div class="loading-spinner mr-3"></div> Logging out...`;
                    
                    try {
                        await P({ action: "logout" });
                    } catch (error) { /* Abaikan error, tetap logout */ }
                    
                    setTimeout(() => {
                        C();
                        if (window.DashboardAPI) window.DashboardAPI.showLogin();
                        showMessage('success', 'Logout berhasil');
                        logoutBtn.disabled = false;
                        logoutBtn.innerHTML = originalContent;
                        generateCaptcha();
                    }, 800);
                });
            }
        }
    };
})();

// =================================================================

// MODUL SISTEM PROFIL (KODE BARU)
const ProfileSystem = (function() {
    // Private variables
    let apiHandler = null;
    let currentUserData = null;

    // Private functions
    function showProfileMessage(type, message) {
        // Ganti dengan sistem notifikasi yang lebih baik jika ada
        alert(`${type.toUpperCase()}: ${message}`);
    }

    function loadProfileData() {
        if (!currentUserData) return;

        const profileName = document.getElementById('profileName');
        const profileRole = document.getElementById('profileRole');
        const editUsername = document.getElementById('editUsername');
        const accountNik = document.getElementById('accountNik');
        const lastLogin = document.getElementById('lastLogin');

        if (profileName) profileName.textContent = currentUserData.username || 'User';
        if (profileRole) profileRole.textContent = currentUserData.role || 'Member';
        if (editUsername) editUsername.value = currentUserData.username || '';
        if (accountNik && currentUserData.nik) accountNik.textContent = `****-****-****-${currentUserData.nik.slice(-4)}`;
        if (lastLogin) lastLogin.textContent = currentUserData.lastLogin ? new Date(currentUserData.lastLogin).toLocaleString('id-ID') : "Baru saja";
        
        // Update avatar juga diurus oleh fungsi global updateProfileImages dari LoginSystem
    }

    async function handleAvatarUpload(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showProfileMessage('error', 'Ukuran file maksimal 2MB.');
            return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showProfileMessage('error', 'Format file harus JPG atau PNG.');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const response = await apiHandler({
                    action: "update-avatar",
                    avatar: reader.result // Base64 string
                });
                if (response.success && response.data.avatarUrl) {
                    showProfileMessage('success', 'Foto profil berhasil diperbarui.');
                    localStorage.setItem('AvatarUrl', response.data.avatarUrl);
                    if (window.LoginSystem) LoginSystem.updateAllAvatars();
                } else {
                    showProfileMessage('error', response.message || 'Gagal memperbarui foto.');
                }
            } catch (error) {
                showProfileMessage('error', 'Terjadi kesalahan koneksi.');
            }
        };
    }

    // Public API
    return {
        init: function(api, userData) {
            apiHandler = api;
            currentUserData = userData;
            
            if (document.getElementById('edit-profile-form')) {
                loadProfileData();
                this.setupEventListeners();
            }
        },

        setupEventListeners: function() {
            document.getElementById('avatar')?.addEventListener('change', (e) => {
                handleAvatarUpload(e.target.files[0]);
            });

            document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = document.getElementById('editUsername').value.trim();
                if (!newUsername) {
                    showProfileMessage('error', 'Username tidak boleh kosong.');
                    return;
                }
                try {
                    const response = await apiHandler({ action: "update-profile", username: newUsername });
                    if (response.success) {
                        showProfileMessage('success', 'Username berhasil diperbarui.');
                        currentUserData.username = newUsername;
                        loadProfileData();
                        if (document.getElementById('user-name')) document.getElementById('user-name').textContent = newUsername;
                        if (document.getElementById('welcome-title')) document.getElementById('welcome-title').textContent = `Selamat Datang, ${newUsername}!`;
                    } else {
                        showProfileMessage('error', response.message || 'Gagal memperbarui username.');
                    }
                } catch (error) {
                    showProfileMessage('error', 'Terjadi kesalahan koneksi.');
                }
            });

            document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                const oldPassword = document.getElementById('oldPassword').value;
                const newPassword = document.getElementById('newPassword').value;

                if (!oldPassword || !newPassword) {
                    showProfileMessage('error', 'Semua field password wajib diisi.');
                    return;
                }
                try {
                    const response = await apiHandler({ action: "change-password", oldPassword, newPassword });
                    if (response.success) {
                        showProfileMessage('success', 'Password berhasil diubah.');
                        form.reset();
                    } else {
                        showProfileMessage('error', response.message || 'Gagal mengubah password.');
                    }
                } catch (error) {
                    showProfileMessage('error', 'Terjadi kesalahan koneksi.');
                }
            });
        }
    };
})();

// =================================================================

// Auto-initialize ketika DOM sudah siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LoginSystem.init();
    });
} else {
    LoginSystem.init();
}
