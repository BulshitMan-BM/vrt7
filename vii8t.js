/**
 * =================================================================
 * SCRIPT LENGKAP & TERKONEKSI: LOGIN & PROFILE SYSTEM V3 (PERBAIKAN)
 * Perbaikan pada manajemen sesi, pembaruan data, dan notifikasi.
 * =================================================================
 */

// Fungsi untuk toggle password (global karena dipanggil dari onclick)
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input && icon) {
        const type = input.type === "password" ? "text" : "password";
        input.type = type;
        icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
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
    function generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaCode = result;
        const captchaTextElement = document.getElementById('ct');
        if (captchaTextElement) captchaTextElement.textContent = captchaCode;
        const verifyCodeInput = document.getElementById('vc');
        if (verifyCodeInput) verifyCodeInput.value = '';
    }

    function showMessage(type, message) {
        const msg = {
            el: document.getElementById('login-message'),
            icon: document.getElementById('login-message-icon'),
            text: document.getElementById('login-message-text')
        };
        if (msg.el && msg.icon && msg.text) {
            msg.el.className = 'p-4 mb-4 text-sm rounded-lg flex items-center';
            msg.icon.className = 'mr-3';
            if (type === 'error') {
                msg.el.classList.add('bg-red-50', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
                msg.icon.classList.add('fas', 'fa-exclamation-circle');
            } else if (type === 'success') {
                msg.el.classList.add('bg-green-50', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
                msg.icon.classList.add('fas', 'fa-check-circle');
            } else {
                msg.el.classList.add('bg-blue-50', 'text-blue-800', 'dark:bg-blue-900', 'dark:text-blue-200');
                msg.icon.classList.add('fas', 'fa-info-circle');
            }
            msg.text.textContent = message;
            msg.el.classList.remove('hidden');
        }
    }

    function showOtpMessage(type, message) {
        const msg = {
            el: document.getElementById('otp-message'),
            icon: document.getElementById('otp-message-icon'),
            text: document.getElementById('otp-message-text')
        };
        if (msg.el && msg.icon && msg.text) {
            msg.el.className = 'p-4 rounded-lg flex items-center mb-4';
             if (type === 'error') {
                msg.el.classList.add('bg-red-50', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
                msg.icon.className = 'fas fa-exclamation-circle mr-3';
            } else if (type === 'success') {
                msg.el.classList.add('bg-green-50', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
                msg.icon.className = 'fas fa-check-circle mr-3';
            } else {
                msg.el.classList.add('bg-blue-50', 'text-blue-800', 'dark:bg-blue-900', 'dark:text-blue-200');
                msg.icon.className = 'fas fa-info-circle mr-3';
            }
            msg.text.textContent = message;
            msg.el.classList.remove('hidden');
        }
    }

    function T(a, e, t) {
        localStorage.setItem(a, e);
        if (t) {
             localStorage.setItem("tokenExpires", Date.now() + t * 1000);
        }
    }

    // PERBAIKAN: Menggunakan removeItem satu per satu agar lebih aman
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
            headers: { "Content-Type": "application/json", "Authorization": h ? "Bearer " + h : "" },
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
                const m = Math.floor(t / 60).toString().padStart(2, '0');
                const sec = (t % 60).toString().padStart(2, '0');
                timerElement.innerText = `${m}:${sec}`;
                t--;
            }, 1000);
        }
    }
    
    function updateProfileImages() {
        const targets = [
            { img: document.getElementById('sidebarAvatar'), fallback: document.getElementById('sidebarProfileFallback') },
            { img: document.getElementById('profileAvatar'), fallback: document.getElementById('profileAvatarFallback') }
        ];
        
        let avatarUrl = localStorage.getItem('AvatarUrl');
        if (avatarUrl && avatarUrl.includes('drive.google.com')) {
            const fileIdMatch = avatarUrl.match(/[?&]id=([^&]+)/);
            if (fileIdMatch) avatarUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
        }

        targets.forEach(target => {
            if (!target.img || !target.fallback) return;
            if (avatarUrl && avatarUrl.trim() !== '' && avatarUrl !== 'null') {
                target.img.src = avatarUrl;
                target.img.style.display = 'block';
                target.fallback.style.display = 'none';
                target.img.onerror = () => {
                    target.img.style.display = 'none';
                    target.fallback.style.display = 'flex';
                };
            } else {
                target.img.style.display = 'none';
                target.fallback.style.display = 'flex';
            }
        });
    }

    // PERBAIKAN: Fungsi ini sekarang menjadi satu-satunya sumber untuk update UI
    function D(userData) {
        currentUser = userData;
        const username = userData.username || 'Pengguna';

        if (window.DashboardAPI) window.DashboardAPI.showDashboard();
        
        const welcomeTitle = document.getElementById("welcome-title");
        const userName = document.getElementById("user-name");
        
        if (welcomeTitle) welcomeTitle.textContent = `Selamat Datang, ${username}!`;
        if (userName) userName.textContent = username;
        
        localStorage.setItem('AvatarUrl', userData.avatarUrl || '');
        updateProfileImages();
        
        if (window.ProfileSystem) ProfileSystem.init(P, currentUser);
    }

    async function V() {
        const a = localStorage.getItem("accessToken");
        const e = parseInt(localStorage.getItem("tokenExpires") || 0);
        if (!a || Date.now() > e) {
            const r = localStorage.getItem("refreshToken");
            if (r) {
                const t = await P({ action: "refresh-token", refreshToken: r });
                if (t.success && t.data) {
                    T("accessToken", t.data.accessToken, t.data.tokenExpires - Math.floor(Date.now() / 1000));
                    T("refreshToken", t.data.refreshToken); // Refresh token biasanya tidak punya expiry yang sama
                    return true;
                }
            }
            C(); // Hapus token jika refresh gagal atau tidak ada refresh token
            return false;
        }
        return true;
    }

    // Public API
    return {
        init: async function() {
            if (await V()) { // Cek dan refresh token terlebih dahulu
                try {
                    const res = await P({ action: "get-user-data" });
                    if (res.success && res.data) {
                        D(res.data); // Update UI dengan data terbaru
                    } else {
                        // Token valid tapi data user tidak ditemukan, paksa logout
                        C();
                        if (window.DashboardAPI) window.DashboardAPI.showLogin();
                    }
                } catch(e) {
                    // Gagal konek ke server, mungkin offline
                     if (window.DashboardAPI) window.DashboardAPI.showLogin();
                     showMessage('error', 'Gagal terhubung ke server.');
                }
            } else {
                // Token tidak valid atau kedaluwarsa
                if (window.DashboardAPI) window.DashboardAPI.showLogin();
            }
            this.setupEventListeners();
        },
        updateAllAvatars: updateProfileImages,
        setupEventListeners: function() {
            document.getElementById('rc')?.addEventListener('click', e => { e.preventDefault(); generateCaptcha(); });
            generateCaptcha();

            document.getElementById("login-form")?.addEventListener("submit", async e => {
                e.preventDefault();
                if (document.getElementById('vc').value.trim().toLowerCase() !== captchaCode.toLowerCase()) {
                    return showMessage('error', 'Kode Verifikasi salah.');
                }
                const nik = document.getElementById("nik").value.trim();
                const password = document.getElementById("password").value.trim();
                const btn = document.getElementById("login-btn");
                btn.disabled = true;
                btn.querySelector('#login-text').textContent = 'Memproses...';
                btn.querySelector('#login-spinner').classList.remove('hidden');
                try {
                    const res = await P({ action: "login", nik, password });
                    if (res.success && res.data) {
                        if (res.step === "otp") {
                            localStorage.setItem('tempUserData', JSON.stringify(res.data));
                            document.getElementById("otp-overlay").classList.remove('hidden'); O(300);
                            showOtpMessage('info', 'Kode OTP telah dikirim ke email Anda.');
                        } else {
                            T("accessToken", res.data.accessToken, res.data.tokenExpires - Math.floor(Date.now() / 1000));
                            T("refreshToken", res.data.refreshToken);
                            D(res.data);
                        }
                    } else { 
                        showMessage('error', res.message || 'Login gagal, periksa kembali NIK dan Password.');
                        generateCaptcha(); 
                    }
                } catch { 
                    showMessage('error', 'Koneksi gagal.');
                    generateCaptcha(); 
                } finally {
                    btn.disabled = false;
                    btn.querySelector('#login-text').textContent = 'Masuk';
                    btn.querySelector('#login-spinner').classList.add('hidden');
                }
            });

            document.querySelectorAll('.otp-input').forEach((input, index, arr) => {
                input.addEventListener('input', () => { if (input.value && index < arr.length - 1) arr[index + 1].focus(); });
                input.addEventListener('keydown', e => { if (e.key === 'Backspace' && !input.value && index > 0) arr[index - 1].focus(); });
            });
            
            document.getElementById("otp-form")?.addEventListener("submit", async e => {
                e.preventDefault();
                const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
                if (otp.length !== 6) return showOtpMessage('error', 'OTP harus 6 digit.');
                
                const btn = document.getElementById("verify-otp-btn");
                btn.disabled = true;
                const tempUser = JSON.parse(localStorage.getItem('tempUserData'));
                if (!tempUser) return showOtpMessage('error', 'Sesi tidak valid, silakan ulangi login.');

                try {
                    const res = await P({ action: "verify-otp", nik: tempUser.nik, otp });
                    if (res.success && res.data) {
                        const data = { ...tempUser, ...res.data };
                        T("accessToken", data.accessToken, data.tokenExpires - Math.floor(Date.now() / 1000));
                        T("refreshToken", data.refreshToken);
                        D(data);
                        document.getElementById("otp-overlay").classList.add('hidden');
                        localStorage.removeItem('tempUserData');
                    } else { showOtpMessage('error', res.message || 'OTP salah atau tidak valid.'); }
                } catch { showOtpMessage('error', 'Koneksi gagal.'); }
                finally { btn.disabled = false; }
            });

            document.getElementById("resend-otp")?.addEventListener("click", async () => {
                const tempUser = JSON.parse(localStorage.getItem('tempUserData'));
                if (!tempUser) return showOtpMessage('error', 'Sesi tidak valid, silakan ulangi login.');
                await P({ action: "resend-otp", nik: tempUser.nik }); 
                O(300);
                showOtpMessage('success', 'OTP baru telah dikirim ulang.');
            });

            document.getElementById("logout-btn")?.addEventListener("click", async () => { 
                await P({ action: "logout" }); 
                C(); 
                window.location.reload(); 
            });
            
            document.getElementById("toggle-password")?.addEventListener("click", () => {
                const p = document.getElementById("password");
                const i = document.getElementById("password-icon");
                p.type = p.type === "password" ? "text" : "password";
                i.className = p.type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
            });
        }
    };
})();

// MODUL SISTEM PROFIL
const ProfileSystem = (function() {
    let apiHandler = null;
    let currentUserData = null;

    function showProfileMessage(type, message) {
        const msgEl = document.getElementById('profile-message');
        const iconEl = document.getElementById('profile-message-icon');
        const textEl = document.getElementById('profile-message-text');
        if (!msgEl || !iconEl || !textEl) return;

        msgEl.className = 'mt-6 p-4 rounded-lg flex items-center';
        iconEl.className = 'mr-3';
        if (type === 'success') {
            msgEl.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
            iconEl.classList.add('fas', 'fa-check-circle');
        } else {
            msgEl.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-800', 'dark:text-red-200');
            iconEl.classList.add('fas', 'fa-exclamation-circle');
        }
        textEl.textContent = message;
        msgEl.classList.remove('hidden');
        setTimeout(() => msgEl.classList.add('hidden'), 4000);
    }

    function loadProfileData() {
        if (!currentUserData) return;
        document.getElementById('profileName').textContent = currentUserData.username || 'Pengguna';
        document.getElementById('profileRole').textContent = currentUserData.role || 'Member';
        document.getElementById('editUsername').value = currentUserData.username || '';
        if (currentUserData.nik) {
            document.getElementById('accountNik').textContent = `****-****-****-${currentUserData.nik.slice(-4)}`;
        }
        document.getElementById('lastLogin').textContent = currentUserData.lastLogin 
            ? new Date(currentUserData.lastLogin).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short'}) : 'Baru saja';
    }

    return {
        init: function(api, userData) {
            apiHandler = api;
            currentUserData = userData;
            if (document.getElementById('profile-content')) {
                loadProfileData();
                this.setupEventListeners();
            }
        },
        setupEventListeners: function() {
            document.getElementById('avatar')?.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) return showProfileMessage('error', 'Ukuran file maksimal 2MB.');
                
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    const res = await apiHandler({ action: "update-avatar", avatar: reader.result });
                    if (res.success && res.data && res.data.avatarUrl) {
                        showProfileMessage('success', 'Foto profil berhasil diperbarui.');
                        localStorage.setItem('AvatarUrl', res.data.avatarUrl);
                        LoginSystem.updateAllAvatars();
                    } else { showProfileMessage('error', res.message || 'Gagal update foto.'); }
                };
            });

            document.getElementById('edit-profile-form')?.addEventListener('submit', async e => {
                e.preventDefault();
                const newUsername = document.getElementById('editUsername').value.trim();
                if (!newUsername) return showProfileMessage('error', 'Username tidak boleh kosong.');
                const res = await apiHandler({ action: "update-profile", username: newUsername });
                if (res.success) {
                    showProfileMessage('success', 'Username berhasil diperbarui.');
                    currentUserData.username = newUsername;
                    loadProfileData(); // Update tampilan profil
                    // Update juga tampilan di luar profil (sidebar, header)
                    document.getElementById('user-name').textContent = newUsername;
                    document.getElementById('welcome-title').textContent = `Selamat Datang, ${newUsername}!`;
                } else { showProfileMessage('error', res.message || 'Gagal update username.'); }
            });

            document.getElementById('change-password-form')?.addEventListener('submit', async e => {
                e.preventDefault();
                const oldPassword = document.getElementById('oldPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                if (!oldPassword || !newPassword) return showProfileMessage('error', 'Semua field wajib diisi.');
                
                const res = await apiHandler({ action: "change-password", oldPassword, newPassword });
                if (res.success) {
                    showProfileMessage('success', 'Password berhasil diubah.');
                    e.target.reset();
                } else { showProfileMessage('error', res.message || 'Gagal ubah password. Pastikan password lama benar.'); }
            });
        }
    };
})();

// Auto-initialize ketika DOM sudah siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginSystem.init());
} else {
    LoginSystem.init();
}
