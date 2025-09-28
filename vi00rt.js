const LoginSystem = (function() {
    // =================================================================
    // Private Variables
    // =================================================================
    // PERBAIKAN: Nama variabel lebih deskriptif
    const API_URL = "https://pemanis.bulshitman1.workers.dev/";
    let otpTimer;
    let currentUser = null;
    let loginCaptchaCode = '';

    // =================================================================
    // Private Helper Functions
    // =================================================================

    /**
     * Menampilkan pesan notifikasi (error, success, info) pada elemen tertentu.
     * PERBAIKAN: Menggabungkan showMessage dan showOtpMessage menjadi satu fungsi.
     * @param {string} containerId ID elemen kontainer pesan ('login-message' atau 'otp-message').
     * @param {string} type Tipe pesan ('error', 'success', 'info').
     * @param {string} message Teks pesan yang akan ditampilkan.
     */
    function showNotification(containerId, type, message) {
        const messageContainer = document.getElementById(containerId);
        if (!messageContainer) return;

        const icon = messageContainer.querySelector('[data-role="icon"]');
        const text = messageContainer.querySelector('[data-role="text"]');

        if (!icon || !text) return;

        // Reset classes
        messageContainer.className = 'flex items-center p-4 mb-4 text-sm rounded-lg';
        icon.className = '';

        const typeMap = {
            error: {
                containerClass: 'bg-red-50 text-red-800 dark:bg-gray-800 dark:text-red-400',
                iconClass: 'fas fa-exclamation-circle me-3'
            },
            success: {
                containerClass: 'bg-green-50 text-green-800 dark:bg-gray-800 dark:text-green-400',
                iconClass: 'fas fa-check-circle me-3'
            },
            info: {
                containerClass: 'bg-blue-50 text-blue-800 dark:bg-gray-800 dark:text-blue-400',
                iconClass: 'fas fa-info-circle me-3'
            }
        };

        const config = typeMap[type] || typeMap.info;
        messageContainer.classList.add(...config.containerClass.split(' '));
        icon.className = config.iconClass;
        text.textContent = message;
        messageContainer.classList.remove('hidden');
    }

    /**
     * Membuat request POST ke API.
     * PERBAIKAN: Nama fungsi lebih deskriptif dari 'P'.
     */
    async function apiPostRequest(payload) {
        const accessToken = localStorage.getItem("accessToken") || "";
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": accessToken ? "Bearer " + accessToken : ""
            },
            body: JSON.stringify(payload)
        });
        return response.json();
    }

    /**
     * Menyimpan token (access & refresh) beserta waktu kedaluwarsa ke localStorage.
     * PERBAIKAN: Nama fungsi lebih deskriptif dari 'T'.
     */
    function saveTokens(tokenData) {
        const expiresIn = tokenData.tokenExpires - Math.floor(Date.now() / 1000);
        localStorage.setItem("accessToken", tokenData.accessToken);
        localStorage.setItem("refreshToken", tokenData.refreshToken);
        localStorage.setItem("tokenExpires", Date.now() + expiresIn * 1000);
    }

    /**
     * Membersihkan semua data sesi dari localStorage.
     * PERBAIKAN: Nama fungsi lebih deskriptif dari 'C'.
     */
    function clearSessionData() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpires");
        localStorage.removeItem("AvatarUrl");
        localStorage.removeItem('tempUserData');
        currentUser = null;
    }

    /**
     * Memvalidasi token yang ada dan me-refresh jika perlu.
     * PERBAIKAN: Nama fungsi lebih deskriptif dari 'V'.
     */
    async function validateAndRefreshToken() {
        const accessToken = localStorage.getItem("accessToken");
        const expires = parseInt(localStorage.getItem("tokenExpires") || 0);

        if (!accessToken || Date.now() > expires) {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const response = await apiPostRequest({
                        action: "refresh-token",
                        refreshToken: refreshToken
                    });
                    if (response.success) {
                        saveTokens(response.data);
                        return true;
                    }
                } catch (e) {
                    clearSessionData();
                    return false;
                }
            }
            clearSessionData();
            return false;
        }
        return true;
    }

    /**
     * Memulai timer hitung mundur untuk OTP.
     * PERBAIKAN: Nama fungsi lebih deskriptif dari 'O'.
     */
    function startOtpTimer(durationInSeconds) {
        clearInterval(otpTimer);
        const timerElement = document.getElementById("otp-timer");
        let timeLeft = durationInSeconds;

        if (timerElement) {
            otpTimer = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(otpTimer);
                    timerElement.innerText = "00:00";
                    showNotification('otp-message', 'error', 'Kode OTP telah kedaluwarsa');
                    return;
                }
                const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const seconds = (timeLeft % 60).toString().padStart(2, '0');
                timerElement.innerText = `${minutes}:${seconds}`;
                timeLeft--;
            }, 1000);
        }
    }
    
    /**
     * Membuat kode CAPTCHA baru untuk form login.
     */
    function generateLoginCaptcha() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        loginCaptchaCode = code;
        const captchaText = document.getElementById('ct');
        if (captchaText) captchaText.textContent = code;
    }

    /**
     * Memperbarui gambar profil di semua tempat yang relevan.
     */
    function updateProfileImages() {
        // ... (Fungsi ini sudah cukup baik, tidak perlu diubah signifikan)
        const sidebarImg = document.getElementById('sidebarAvatar');
        const sidebarFallback = document.getElementById('sidebarProfileFallback');
        let avatarUrl = localStorage.getItem('AvatarUrl');
        if (avatarUrl && avatarUrl.trim() !== '') {
            let processedAvatarUrl = avatarUrl;
            if (avatarUrl.includes('drive.google.com')) {
                const fileIdMatch = avatarUrl.match(/[?&]id=([^&]+)/);
                if (fileIdMatch) {
                    processedAvatarUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
                }
            }
            if (sidebarImg) {
                sidebarImg.src = processedAvatarUrl;
                sidebarImg.style.display = 'block';
                if (sidebarFallback) sidebarFallback.style.display = 'none';
                sidebarImg.onerror = function() {
                    this.style.display = 'none';
                    if (sidebarFallback) sidebarFallback.style.display = 'flex';
                };
            }
        } else {
            if (sidebarImg) sidebarImg.style.display = 'none';
            if (sidebarFallback) sidebarFallback.style.display = 'flex';
        }
    }
    
    // =================================================================
    // Main Rendering & Logic Functions
    // =================================================================

    /**
     * Merender seluruh UI dashboard, menampilkannya, dan memasang event listener yang relevan.
     * PERBAIKAN: Menggabungkan `renderDashboard` dan `D`. Fungsi ini menjadi satu-satunya
     * sumber kebenaran untuk tampilan dashboard dan mengatasi bug event listener.
     */
    function renderAndShowDashboard(userData) {
        currentUser = userData;
        const dashboardPage = document.getElementById('dashboard-page');
        if (!dashboardPage) return;

        // 1. Render HTML
        dashboardPage.innerHTML = `
            <div id="sidebar" class="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg sidebar-transition z-20 w-64 flex flex-col">
                </div>

            <header id="header" class="fixed top-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 header-transition z-30 left-64 right-0 h-16">
                 <div class="flex items-center justify-between h-full px-6">
                     <div class="flex items-center space-x-4 ml-auto">
                         <button id="logout-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Logout</button>
                     </div>
                 </div>
            </header>

            <main id="mainContent" class="content-transition ml-64 pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
                <div class="p-6">
                    <h1 id="welcome-title" class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Selamat Datang, ${userData.username || userData.name || 'User'}!
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">Kelola dashboard Anda dengan mudah dan efisien.</p>
                </div>
            </main>
        `;

        // 2. Tampilkan Dashboard (menggunakan API eksternal)
        if (window.DashboardAPI) {
            window.DashboardAPI.showDashboard();
        }
        
        updateProfileImages();

        // 3. Pasang Event Listener untuk elemen dinamis di dalam dashboard
        //    PERBAIKAN KRITIS: Listener dipasang SETELAH HTML di-render.
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }
    }

    /**
     * Fungsi untuk menangani proses logout.
     */
    async function handleLogout() {
        const logoutBtn = document.getElementById("logout-btn");
        const originalContent = logoutBtn.innerHTML;
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = `Logging out...`;

        try {
            await apiPostRequest({ action: "logout" });
        } catch (error) {
            console.error("Logout API call failed, proceeding with client-side logout.", error);
        }

        setTimeout(() => {
            clearSessionData();
            
            // Reset Forms
            document.getElementById("login-form")?.reset();
            document.getElementById("otp-form")?.reset();
            document.getElementById("otp-overlay")?.classList.add('hidden');
            clearInterval(otpTimer);

            if (window.DashboardAPI) {
                window.DashboardAPI.showLogin();
            }
            generateLoginCaptcha();
            showNotification('login-message', 'success', 'Logout berhasil');
        }, 800);
    }
    
    // =================================================================
    // Public API
    // =================================================================
    return {
        init: function() {
            const accessToken = localStorage.getItem("accessToken");
            if (accessToken) {
                try {
                    // Tampilkan dashboard secara optimis dengan data dari token
                    const payload = JSON.parse(atob(accessToken.split(".")[1]));
                    renderAndShowDashboard(payload);

                    // Validasi token di background
                    setTimeout(async () => {
                        const isValid = await validateAndRefreshToken();
                        if (isValid) {
                            // Ambil data user terbaru
                            const userDataResponse = await apiPostRequest({ action: "get-user-data" });
                            if (userDataResponse.success && userDataResponse.data) {
                                localStorage.setItem('AvatarUrl', userDataResponse.data.avatarUrl || '');
                                // Render ulang dashboard dengan data terbaru
                                renderAndShowDashboard(userDataResponse.data);
                            }
                        } else {
                            if (window.DashboardAPI) window.DashboardAPI.showLogin();
                            showNotification('login-message', 'info', 'Sesi telah berakhir, silakan login kembali');
                        }
                    }, 100);
                } catch (e) {
                    clearSessionData();
                    if (window.DashboardAPI) window.DashboardAPI.showLogin();
                }
            } else {
                if (window.DashboardAPI) window.DashboardAPI.showLogin();
            }

            generateLoginCaptcha();
            this.setupStaticEventListeners();
        },

        // PERBAIKAN: Listener dipisah antara yang statis (login) dan dinamis (dashboard)
        setupStaticEventListeners: function() {
            // Login form handler
            const loginForm = document.getElementById("login-form");
            if (loginForm) {
                loginForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const nik = document.getElementById("nik").value.trim();
                    const password = document.getElementById("password").value.trim();
                    const captchaInput = document.getElementById("vc");
                    
                    if (!nik || !password) {
                        return showNotification('login-message', 'error', 'NIK dan Password wajib diisi');
                    }
                    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
                        return showNotification('login-message', 'error', 'NIK harus 16 digit angka');
                    }
                    if (!captchaInput || captchaInput.value.trim().toUpperCase() !== loginCaptchaCode) {
                        generateLoginCaptcha();
                        captchaInput.value = '';
                        return showNotification('login-message', 'error', 'Captcha tidak valid');
                    }

                    const loginBtn = document.getElementById("login-btn");
                    loginBtn.disabled = true;
                    // Tampilkan spinner, dll.

                    try {
                        const response = await apiPostRequest({ action: "login", nik, password });
                        if (response.success && response.step === "otp") {
                            // Simpan data sementara untuk digabung setelah OTP
                            localStorage.setItem('tempUserData', JSON.stringify(response.data));
                            document.getElementById("otp-overlay").classList.remove('hidden');
                            startOtpTimer(300);
                            showNotification('otp-message', 'info', 'Kode OTP telah dikirim');
                            document.querySelector('.otp-input')?.focus();
                        } else if (response.success) {
                            saveTokens(response.data);
                            localStorage.setItem('AvatarUrl', response.data.avatarUrl || '');
                            renderAndShowDashboard(response.data);
                        } else {
                            showNotification('login-message', 'error', response.message || 'Login gagal');
                        }
                    } catch (error) {
                        showNotification('login-message', 'error', 'Terjadi kesalahan koneksi');
                    } finally {
                        loginBtn.disabled = false;
                        // Sembunyikan spinner, dll.
                    }
                });
            }

            // OTP form handler
            const otpForm = document.getElementById("otp-form");
            if (otpForm) {
                otpForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const otpInputs = document.querySelectorAll('.otp-input');
                    let otp = Array.from(otpInputs).map(input => input.value).join('');

                    if (otp.length !== 6) {
                        return showNotification('otp-message', 'error', 'Masukkan 6 digit kode OTP');
                    }

                    const verifyBtn = document.getElementById("verify-otp-btn");
                    verifyBtn.disabled = true;
                    // Tampilkan spinner

                    try {
                         const nik = document.getElementById("nik").value.trim();
                         const response = await apiPostRequest({ action: "verify-otp", nik, otp });
                         
                         if (response.success) {
                             const tempUserData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
                             const combinedUserData = { ...tempUserData, ...response.data };
                             
                             saveTokens(response.data);
                             localStorage.setItem('AvatarUrl', combinedUserData.avatarUrl || '');
                             
                             renderAndShowDashboard(combinedUserData);
                             
                             document.getElementById("otp-overlay").classList.add('hidden');
                             clearInterval(otpTimer);
                             localStorage.removeItem('tempUserData');
                         } else {
                             showNotification('otp-message', 'error', response.message || 'Kode OTP salah');
                         }
                    } catch (error) {
                        showNotification('otp-message', 'error', 'Terjadi kesalahan koneksi');
                    } finally {
                        verifyBtn.disabled = false;
                        // Sembunyikan spinner
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
                        if (otpInputs[index + i]) {
                            otpInputs[index + i].value = pastedData[i];
                        }
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
    
    let otp = '';
    otpInputs.forEach(input => { otp += input.value; });

    if (otp.length !== 6) {
        showOtpMessage('error', 'Masukkan 6 digit kode OTP');
        return;
    }

    verifyBtn.disabled = true;
    verifyText.textContent = 'Memverifikasi...';
    verifySpinner.classList.remove('hidden');

    const requestPayload = { action: "verify-otp", nik, otp };

    try {
        const response = await P(requestPayload);
        if (response.success) {
            // Ambil data sementara dari localStorage
            const tempUserData = localStorage.getItem('tempUserData');
            let combinedUserData = response.data || {};

            if (tempUserData) {
                try {
                    const parsedTempData = JSON.parse(tempUserData);
                    combinedUserData = { ...parsedTempData, ...combinedUserData };
                    localStorage.removeItem('tempUserData');
                } catch (e) {
                    // Lanjut dengan response.data saja
                }
            }
            // Simpan token
            if (response.data.accessToken) {
                T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
            }
            if (response.data.refreshToken) {
                T("refreshToken", response.data.refreshToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
            }
            // Simpan avatar
            if (response.data.avatarUrl) {
                localStorage.setItem('AvatarUrl', response.data.avatarUrl);
            } else if (combinedUserData.avatarUrl) {
                localStorage.setItem('AvatarUrl', combinedUserData.avatarUrl);
            }
            // Render dashboard langsung
            renderDashboard(combinedUserData);
            clearInterval(otpTimer);
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


            // Resend OTP handler
            const resendOtpBtn = document.getElementById("resend-otp");
            if (resendOtpBtn) {
                resendOtpBtn.addEventListener("click", async () => {
                    const nikInput = document.getElementById("nik");
                    const nik = nikInput.value.trim();
                    
                    try {
                        const response = await P({
                            action: "resend-otp",
                            nik: nik
                        });
                        
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
            }

            // Close OTP handler
            const closeOtpBtn = document.getElementById("close-otp");
            if (closeOtpBtn) {
                closeOtpBtn.addEventListener("click", () => {
                    document.getElementById("otp-overlay").classList.add('hidden');
                    clearInterval(otpTimer);
                    
                    otpInputs.forEach(input => {
                        input.value = '';
                    });
                });
            }

            // Password toggle
            const togglePassword = document.getElementById("toggle-password");
            const passwordInput = document.getElementById("password");
            const passwordIcon = document.getElementById("password-icon");
            
            if (togglePassword && passwordInput && passwordIcon) {
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
                    logoutBtn.innerHTML = `
                        <div class="loading-spinner mr-3"></div>
                        Logging out...
                    `;
                    
                    try {
                        await P({ action: "logout" });
                    } catch (error) {
                        // Continue with logout even if server request fails
                    }
                    
setTimeout(() => {
    C(); // Hapus token & avatar
    localStorage.removeItem('tempUserData');
    // Reset login form
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.reset();
    
    // Reset OTP form & overlay
    const otpForm = document.getElementById("otp-form");
    const otpOverlay = document.getElementById("otp-overlay");
    const otpInputs = document.querySelectorAll('.otp-input');
    
    if (otpForm) otpForm.reset();
    if (otpOverlay) otpOverlay.classList.add('hidden');
    otpInputs.forEach(input => input.value = '');
    clearInterval(otpTimer);

    // Tampilkan form login
    if (window.DashboardAPI) {
        window.DashboardAPI.showLogin();
    }
generateLoginCaptcha();
const captchaInput = document.getElementById("vc");
if (captchaInput) captchaInput.value = '';
    showMessage('success', 'Logout berhasil');
    logoutBtn.disabled = false;
    logoutBtn.innerHTML = originalContent;
}, 800);
                });
            }
        }
    };
})();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LoginSystem.init();
    });
} else {
    LoginSystem.init();
}
