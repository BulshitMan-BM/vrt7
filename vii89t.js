/**
 * =================================================================
 * SCRIPT LENGKAP: LOGIN SYSTEM & PROFILE SYSTEM (VERSI STABIL)
 * Perbaikan sinkronisasi data pada struktur kode asli.
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
        const loginMessage = document.getElementById('login-message');
        const loginMessageIcon = document.getElementById('login-message-icon');
        const loginMessageText = document.getElementById('login-message-text');
        if (loginMessage && loginMessageIcon && loginMessageText) {
            loginMessage.classList.remove('hidden', 'bg-red-50', 'bg-green-50', 'bg-blue-50', 'text-red-800', 'text-green-800', 'text-blue-800');
            loginMessageIcon.className = 'mr-3';
            if (type === 'error') {
                loginMessage.classList.add('bg-red-50', 'text-red-800');
                loginMessageIcon.classList.add('fas', 'fa-exclamation-circle', 'text-red-600');
            } else if (type === 'success') {
                loginMessage.classList.add('bg-green-50', 'text-green-800');
                loginMessageIcon.classList.add('fas', 'fa-check-circle', 'text-green-600');
            } else {
                loginMessage.classList.add('bg-blue-50', 'text-blue-800');
                loginMessageIcon.classList.add('fas', 'fa-info-circle', 'text-blue-600');
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
            otpMessageIcon.className = 'mr-3';
             if (type === 'error') {
                otpMessage.classList.add('bg-red-50', 'text-red-800');
                otpMessageIcon.classList.add('fas', 'fa-exclamation-circle', 'text-red-600');
            } else if (type === 'success') {
                otpMessage.classList.add('bg-green-50', 'text-green-800');
                otpMessageIcon.classList.add('fas', 'fa-check-circle', 'text-green-600');
            } else {
                otpMessage.classList.add('bg-blue-50', 'text-blue-800');
                otpMessageIcon.classList.add('fas', 'fa-info-circle', 'text-blue-600');
            }
            otpMessageText.textContent = message;
        }
    }

    function T(a, e, t) {
        localStorage.setItem(a, e);
        if (t) localStorage.setItem("tokenExpires", Date.now() + t * 1000);
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
            headers: { "Content-Type": "application/json", "Authorization": h ? `Bearer ${h}` : "" },
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
                const minutes = Math.floor(t / 60).toString().padStart(2, '0');
                const seconds = (t % 60).toString().padStart(2, '0');
                timerElement.innerText = `${minutes}:${seconds}`;
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
        targets.forEach(target => {
            if (target.img && target.fallback) {
                if (avatarUrl && avatarUrl !== 'null' && avatarUrl.trim() !== '') {
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
            }
        });
    }

    // PERBAIKAN 1: Fungsi D sekarang hanya menerima satu argumen (objek data lengkap)
    // dan menentukan nama pengguna di satu tempat untuk konsistensi.
    function D(userData = {}) {
        if (!userData) { C(); window.location.reload(); return; }

        // Menentukan nama pengguna dari satu sumber kebenaran
        const username = userData.username || userData.name || 'Pengguna';

        if (window.DashboardAPI) window.DashboardAPI.showDashboard();
        
        const welcomeTitle = document.getElementById("welcome-title");
        const userName = document.getElementById("user-name");
        
        if (welcomeTitle) welcomeTitle.textContent = `Selamat Datang, ${username}!`;
        if (userName) userName.textContent = username;
        
        currentUser = userData;
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
                    T("refreshToken", t.data.refreshToken);
                    return true;
                }
            }
            C();
            return false;
        }
        return true;
    }

    // Public API
    return {
        init: function() {
            const existingToken = localStorage.getItem("accessToken");
            if (existingToken) {
                try {
                    const payload = JSON.parse(atob(existingToken.split(".")[1]));
                    // PERBAIKAN 2: Panggil D dengan objek lengkap, bukan string terpisah.
                    D(payload); 
                    
                    setTimeout(async () => {
                        if (await V()) {
                            const userDataResponse = await P({ action: "get-user-data" });
                            if (userDataResponse.success && userDataResponse.data) {
                                // PERBAIKAN 3: Panggil D lagi dengan data terbaru yang lengkap.
                                D(userDataResponse.data);
                            }
                        } else {
                            if (window.DashboardAPI) window.DashboardAPI.showLogin();
                            showMessage('info', 'Sesi telah berakhir, silakan login kembali');
                        }
                    }, 100);
                } catch (e) {
                    C();
                    if (window.DashboardAPI) window.DashboardAPI.showLogin();
                }
            } else {
                if (window.DashboardAPI) window.DashboardAPI.showLogin();
            }
            this.setupEventListeners();
        },
        updateAllAvatars: updateProfileImages,
        setupEventListeners: function() {
            // (Semua event listener Anda tidak diubah dan tetap ada di sini)
            const refreshCaptchaBtn = document.getElementById('rc');
            if (refreshCaptchaBtn) refreshCaptchaBtn.addEventListener('click', e => { e.preventDefault(); generateCaptcha(); });
            generateCaptcha();

            const loginForm = document.getElementById("login-form");
            if (loginForm) loginForm.addEventListener("submit", async e => {
                e.preventDefault();
                const captchaInput = document.getElementById('vc').value.trim();
                if (!captchaInput || captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
                    return showMessage('error', 'Kode Verifikasi salah.');
                }
                const nik = document.getElementById("nik").value.trim();
                const password = document.getElementById("password").value.trim();
                const loginBtn = document.getElementById("login-btn");
                loginBtn.disabled = true;

                try {
                    const response = await P({ action: "login", nik, password });
                    if (response.success) {
                        if (response.step === "otp") {
                            localStorage.setItem('tempUserData', JSON.stringify(response.data));
                            document.getElementById("otp-overlay").classList.remove('hidden');
                            O(300);
                            showOtpMessage('info', 'Kode OTP telah dikirim');
                        } else {
                            T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            T("refreshToken", response.data.refreshToken);
                            D(response.data);
                        }
                    } else {
                        showMessage('error', response.message || 'Login gagal');
                        generateCaptcha();
                    }
                } catch (error) {
                    showMessage('error', 'Terjadi kesalahan koneksi');
                    generateCaptcha();
                } finally {
                    loginBtn.disabled = false;
                }
            });

            // (Sisa event listener seperti OTP, logout, dll. tetap sama)
            const otpForm = document.getElementById("otp-form");
             if (otpForm) otpForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const otp = Array.from(document.querySelectorAll('.otp-input')).map(input => input.value).join('');
                if (otp.length !== 6) return showOtpMessage('error', 'Masukkan 6 digit kode OTP');
                
                const verifyBtn = document.getElementById("verify-otp-btn");
                verifyBtn.disabled = true;

                try {
                    const tempUserData = JSON.parse(localStorage.getItem('tempUserData'));
                    const nik = tempUserData.nik;
                    const response = await P({ action: "verify-otp", nik, otp });

                    if (response.success) {
                        const combinedUserData = { ...tempUserData, ...response.data };
                        T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                        T("refreshToken", response.data.refreshToken);
                        D(combinedUserData);
                        document.getElementById("otp-overlay").classList.add('hidden');
                        localStorage.removeItem('tempUserData');
                    } else {
                        showOtpMessage('error', response.message || 'Kode OTP salah');
                    }
                } catch(error) {
                     showOtpMessage('error', 'Terjadi kesalahan koneksi');
                } finally {
                    verifyBtn.disabled = false;
                }
            });

            const logoutBtn = document.getElementById("logout-btn");
            if(logoutBtn) logoutBtn.addEventListener("click", async () => {
                await P({ action: "logout" });
                C();
                window.location.reload();
            });

        }
    };
})();

// =================================================================

// MODUL SISTEM PROFIL
const ProfileSystem = (function() {
    let apiHandler = null;
    let currentUserData = null;

    // PERBAIKAN 4: Mengganti alert dengan sistem notifikasi yang lebih baik.
    function showProfileMessage(type, message) {
        const msgEl = document.getElementById('profile-message');
        const iconEl = document.getElementById('profile-message-icon');
        const textEl = document.getElementById('profile-message-text');
        if (!msgEl || !iconEl || !textEl) return;
        msgEl.className = 'mt-6 p-4 rounded-lg flex items-center';
        iconEl.className = 'mr-3';
        const styles = {
            success: ['bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200', 'fas', 'fa-check-circle'],
            error: ['bg-red-100', 'dark:bg-red-900', 'text-red-800', 'dark:text-red-200', 'fas', 'fa-exclamation-circle']
        };
        const style = styles[type] || styles.error;
        msgEl.classList.add(...style.slice(0, 4));
        iconEl.classList.add(...style.slice(4));
        textEl.textContent = message;
        msgEl.classList.remove('hidden');
        setTimeout(() => msgEl.classList.add('hidden'), 4000);
    }

    function loadProfileData() {
        if (!currentUserData) return;
        // PERBAIKAN 5: Memastikan logika penentuan nama pengguna sama dengan di fungsi D.
        const username = currentUserData.username || currentUserData.name || 'Pengguna';
        
        const profileName = document.getElementById('profileName');
        const profileRole = document.getElementById('profileRole');
        const editUsername = document.getElementById('editUsername');
        const accountNik = document.getElementById('accountNik');
        const lastLogin = document.getElementById('lastLogin');

        if (profileName) profileName.textContent = username;
        if (profileRole) profileRole.textContent = currentUserData.role || 'Member';
        if (editUsername) editUsername.value = username;
        if (accountNik && currentUserData.nik) accountNik.textContent = `****-****-****-${currentUserData.nik.slice(-4)}`;
        if (lastLogin) lastLogin.textContent = currentUserData.lastLogin ? new Date(currentUserData.lastLogin).toLocaleString('id-ID') : "Baru saja";
    }
    
    // Fungsi event listener yang lain tidak berubah...
    async function handleAvatarUpload(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return showProfileMessage('error', 'Ukuran file maksimal 2MB.');
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const response = await apiHandler({ action: "update-avatar", avatar: reader.result });
                if (response.success && response.data?.avatarUrl) {
                    showProfileMessage('success', 'Foto profil berhasil diperbarui.');
                    localStorage.setItem('AvatarUrl', response.data.avatarUrl);
                    LoginSystem.updateAllAvatars();
                } else {
                    showProfileMessage('error', response.message || 'Gagal memperbarui foto.');
                }
            } catch {
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
            // (Event listener untuk form profil tidak diubah)
             document.getElementById('avatar')?.addEventListener('change', (e) => {
                handleAvatarUpload(e.target.files[0]);
            });

            document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = document.getElementById('editUsername').value.trim();
                if (!newUsername) return showProfileMessage('error', 'Username tidak boleh kosong.');
                
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
                } catch {
                    showProfileMessage('error', 'Terjadi kesalahan koneksi.');
                }
            });

            document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                const oldPassword = document.getElementById('oldPassword').value;
                const newPassword = document.getElementById('newPassword').value;

                if (!oldPassword || !newPassword) return showProfileMessage('error', 'Semua field password wajib diisi.');
                
                try {
                    const response = await apiHandler({ action: "change-password", oldPassword, newPassword });
                    if (response.success) {
                        showProfileMessage('success', 'Password berhasil diubah.');
                        form.reset();
                    } else {
                        showProfileMessage('error', response.message || 'Gagal mengubah password.');
                    }
                } catch {
                     showProfileMessage('error', 'Terjadi kesalahan koneksi.');
                }
            });
        }
    };
})();

// Auto-initialize ketika DOM sudah siap
document.addEventListener('DOMContentLoaded', () => {
    LoginSystem.init();
});
