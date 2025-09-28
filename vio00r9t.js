// =========================================================================
// 		PEMANI_SYSTEM v2.0 - Unified Login & Dashboard Controller
// =========================================================================
const PemanisSystem = (function() {
    // =========================================================================
    // PRIVATE CONFIGURATION & STATE
    // =========================================================================
    const API_BASE_URL = "https://pemanis.bulshitman1.workers.dev";
    const OTP_DURATION_SECONDS = 300;

    let otpTimer;
    let currentUser = null;
    let captchaCode = '';

    // =========================================================================
    // UI MANAGER (Handles page visibility & Dashboard UI Logic)
    // =========================================================================
    const UIManager = {
        showLogin: function() {
            document.getElementById('login-page')?.classList.remove('hidden');
            document.getElementById('dashboard-page')?.classList.add('hidden');
            document.body.className = 'h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800';
        },
        showDashboard: function() {
            document.getElementById('login-page')?.classList.add('hidden');
            document.getElementById('dashboard-page')?.classList.remove('hidden');
            document.body.className = 'h-full bg-gray-50 dark:bg-gray-900 font-sans';
            this.initializeDashboardUI();
        },

        // --- [TERPUSAT] Inisialisasi semua Event Listener untuk Dashboard ---
        initializeDashboardUI: function() {
            if (this._dashboardInitialized) return; // Hanya inisialisasi sekali

            const profileBtn = document.getElementById("profile-btn");
            const profileDropdown = document.getElementById("profile-dropdown");
            const dashboardDarkModeToggle = document.getElementById("dashboardDarkModeToggle");
            
            // --- Logout Handler ---
            document.getElementById("logout-btn")?.addEventListener("click", () => PemanisSystem.logout());

            // --- Profile Dropdown ---
            if (profileBtn && profileDropdown) {
                profileBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    profileDropdown.classList.toggle('hidden');
                });
            }
            // Listener untuk menutup dropdown saat klik di luar
            document.addEventListener("click", (e) => {
                if (profileBtn && profileDropdown && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });

            // --- Dark Mode ---
            if (dashboardDarkModeToggle) {
                dashboardDarkModeToggle.addEventListener('click', () => {
                    const isDark = document.documentElement.classList.toggle('dark');
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    const icon = document.getElementById('dashboardThemeIcon');
                    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                });
            }

            // --- [BARU] Logika Sidebar & Responsif dari script internal ---
            const sidebar = document.getElementById('sidebar');
            const header = document.getElementById('header');
            const mainContent = document.getElementById('mainContent');
            const sidebarToggle = document.getElementById('sidebarToggle');
            const headerToggle = document.getElementById('headerToggle');
            const mobileBackdrop = document.getElementById('mobileBackdrop');

            function toggleSidebar() {
                if (!sidebar) return;
                const isMobile = window.innerWidth < 768;

                if (isMobile) {
                    const isShown = sidebar.classList.contains('show');
                    if (isShown) {
                        sidebar.classList.remove('show');
                        mobileBackdrop?.classList.remove('show');
                        document.body.style.overflow = '';
                    } else {
                        sidebar.classList.add('show');
                        mobileBackdrop?.classList.add('show');
                        document.body.style.overflow = 'hidden';
                    }
                } else {
                    const isCollapsed = sidebar.classList.contains('w-16');
                    if (isCollapsed) { // Jika sedang tertutup -> BUKA
                        sidebar.classList.replace('w-16', 'w-64');
                        mainContent?.classList.replace('ml-16', 'ml-64');
                        header?.classList.replace('left-0', 'left-64');
                    } else { // Jika sedang terbuka -> TUTUP
                        sidebar.classList.replace('w-64', 'w-16');
                        mainContent?.classList.replace('ml-64', 'ml-16');
                        header?.classList.replace('left-64', 'left-0');
                    }
                }
            }
            
            function handleResize() {
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    sidebar?.classList.remove('w-16', 'show');
                    sidebar?.classList.add('w-64', 'mobile-overlay');
                    mainContent?.classList.remove('ml-64', 'ml-16');
                    mainContent?.classList.add('ml-0');
                    header?.classList.remove('left-64');
                    header?.classList.add('left-0');
                    mobileBackdrop?.classList.remove('show');
                    document.body.style.overflow = '';
                } else {
                    sidebar?.classList.remove('mobile-overlay', 'show', 'w-16');
                    sidebar?.classList.add('w-64');
                    mainContent?.classList.remove('ml-0', 'ml-16');
                    mainContent?.classList.add('ml-64');
                     header?.classList.remove('left-0');
                    header?.classList.add('left-64');
                }
            }

            sidebarToggle?.addEventListener('click', toggleSidebar);
            headerToggle?.addEventListener('click', toggleSidebar);
            mobileBackdrop?.addEventListener('click', toggleSidebar);
            window.addEventListener('resize', handleResize);
            
            // Inisialisasi tampilan saat pertama kali load
            handleResize();

            this._dashboardInitialized = true;
        }
    };

    // =========================================================================
    // PRIVATE HELPER FUNCTIONS (Fungsi Bantuan)
    // =========================================================================
    async function apiRequest(payload) {
        const accessToken = localStorage.getItem("accessToken") || "";
        const response = await fetch(`${API_BASE_URL}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify(payload)
        });
        return response.json();
    }

    function displayMessage(type, message, context) {
        const msgContainer = document.getElementById(`${context}-message`);
        const msgIcon = document.getElementById(`${context}-message-icon`);
        const msgText = document.getElementById(`${context}-message-text`);
        if (!msgContainer || !msgIcon || !msgText) return;
        msgContainer.className = 'mt-4 p-3 rounded-lg flex items-center';
        msgIcon.className = 'mr-2';
        const themes = {
            error: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-300', icon: 'fas fa-exclamation-circle text-red-600' },
            success: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300', icon: 'fas fa-check-circle text-green-600' },
            info: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-300', icon: 'fas fa-info-circle text-blue-600' }
        };
        const theme = themes[type] || themes.info;
        msgContainer.classList.add(...theme.bg.split(' '), ...theme.text.split(' '));
        msgIcon.classList.add(...theme.icon.split(' '));
        msgText.textContent = message;
    }
    
    function saveSessionData(data) {
        if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.avatarUrl) localStorage.setItem("AvatarUrl", data.avatarUrl);
        if (data.tokenExpires) {
            const expiresAt = Date.now() + (data.tokenExpires - Math.floor(Date.now() / 1000)) * 1000;
            localStorage.setItem("tokenExpires", expiresAt);
        }
    }

    function clearSessionData() {
        localStorage.clear(); // Lebih bersih untuk membersihkan semua saat logout
    }

    function generateCaptcha() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        captchaCode = [...Array(5)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const captchaTextEl = document.getElementById('ct');
        if (!captchaTextEl) return;
        captchaTextEl.innerHTML = '';
        for (let i = 0; i < captchaCode.length; i++) {
            const span = document.createElement('span');
            span.textContent = captchaCode[i];
            span.style.cssText = `display:inline-block; transform:rotate(${Math.random()*30-15}deg); color:rgb(${Math.random()*150},${Math.random()*150},${Math.random()*150}); font-weight:bold; font-size:${16+Math.random()*8}px;`;
            captchaTextEl.appendChild(span);
        }
        document.getElementById('vc')?.value = '';
    }

    function startOtpTimer(duration) {
        clearInterval(otpTimer);
        const timerEl = document.getElementById("otp-timer");
        let timeLeft = duration;
        if (!timerEl) return;
        otpTimer = setInterval(() => {
            if (timeLeft-- <= 0) {
                clearInterval(otpTimer);
                timerEl.textContent = "00:00";
                displayMessage('error', 'Kode OTP telah kedaluwarsa', 'otp');
            } else {
                timerEl.textContent = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
            }
        }, 1000);
    }
    
    function updateProfileImages() {
        const url = localStorage.getItem('AvatarUrl');
        document.querySelectorAll('.profile-avatar-img').forEach(img => {
             if (url && url.trim()) {
                img.src = url;
                img.style.display = 'block';
             } else {
                img.style.display = 'none';
             }
        });
         document.querySelectorAll('.profile-avatar-fallback').forEach(fb => {
             fb.style.display = (url && url.trim()) ? 'none' : 'flex';
        });
    }

    function showDashboardUI(username, userData = {}) {
        UIManager.showDashboard();
        document.getElementById("welcome-title").textContent = `Selamat Datang, ${username}!`;
        document.getElementById("user-name").textContent = username;
        currentUser = userData;
        updateProfileImages();
    }

    async function validateAndRefreshToken() {
        // ... (Fungsi ini sudah bagus, tidak perlu diubah)
        const accessToken = localStorage.getItem("accessToken");
        const expiresAt = parseInt(localStorage.getItem("tokenExpires") || 0);
        if (!accessToken || Date.now() > expiresAt) {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) { clearSessionData(); return false; }
            try {
                const response = await apiRequest({ action: "refresh-token", accessToken, refreshToken });
                if (response.success) {
                    saveSessionData(response.data);
                } else {
                    clearSessionData(); return false;
                }
            } catch (error) {
                console.error("Token refresh failed:", error);
                clearSessionData(); return false;
            }
        }
        return true;
    }

    // =========================================================================
    // PUBLIC API (Metode yang bisa diakses dari luar)
    // =========================================================================
    return {
        init: async function() {
            // Inisialisasi Dark mode global
            const isDark = localStorage.getItem('theme') === 'dark';
            document.documentElement.classList.toggle('dark', isDark);

            if (localStorage.getItem("accessToken")) {
                const isValid = await validateAndRefreshToken();
                if (isValid) {
                    try {
                        const token = localStorage.getItem("accessToken");
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        showDashboardUI(payload.name || payload.username || 'User');
                        const response = await apiRequest({ action: "get-user-data" });
                        if (response.success && response.data) {
                            saveSessionData(response.data);
                            showDashboardUI(response.data.username || payload.name || 'User', response.data);
                        }
                    } catch (e) {
                        clearSessionData(); UIManager.showLogin();
                    }
                } else {
                    UIManager.showLogin();
                    displayMessage('info', 'Sesi telah berakhir, silakan login kembali', 'login');
                }
            } else {
                UIManager.showLogin();
            }
            this.setupEventListeners();
        },

        logout: async function() {
            // ... (Fungsi ini sudah bagus, tidak perlu diubah)
            try { await apiRequest({ action: "logout" }); } 
            catch (error) { console.error("Logout request failed, proceeding.", error); }
            clearSessionData();
            generateCaptcha();
            UIManager.showLogin();
            displayMessage('success', 'Logout berhasil', 'login');
        },

        setupEventListeners: function() {
            // Hanya setup listener yang sifatnya permanen (login, otp, dll)
            document.getElementById("login-form")?.addEventListener("submit", async (e) => {
                // ... (Logika form login sudah bagus, tidak perlu diubah)
                e.preventDefault();
                const nik = document.getElementById("nik").value.trim();
                const password = document.getElementById("password").value.trim();
                const captcha = document.getElementById('vc').value.trim();
                const loginBtn = document.getElementById("login-btn");
                if (!nik || !password) return displayMessage('error', 'NIK dan Password wajib diisi', 'login');
                if (nik.length !== 16 || !/^\d+$/.test(nik)) return displayMessage('error', 'NIK harus 16 digit angka', 'login');
                if (!captcha) return displayMessage('error', 'Kode verifikasi wajib diisi', 'login');
                if (captcha.toLowerCase() !== captchaCode.toLowerCase()) {
                    generateCaptcha();
                    return displayMessage('error', 'Kode verifikasi salah', 'login');
                }
                loginBtn.disabled = true;
                loginBtn.querySelector("#login-text").textContent = 'Memproses...';
                loginBtn.querySelector("#login-spinner").classList.remove('hidden');
                try {
                    const response = await apiRequest({ action: "login", nik, password });
                    if (response.success && response.step === "otp") {
                        document.getElementById("otp-overlay").classList.remove('hidden');
                        startOtpTimer(OTP_DURATION_SECONDS);
                    } else if (response.success) {
                        saveSessionData(response.data);
                        showDashboardUI(response.data.username || response.data.name || 'User', response.data);
                    } else {
                        generateCaptcha();
                        displayMessage('error', response.message || 'Login gagal', 'login');
                    }
                } catch (error) {
                    generateCaptcha();
                    displayMessage('error', 'Terjadi kesalahan koneksi', 'login');
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.querySelector("#login-text").textContent = 'Masuk';
                    loginBtn.querySelector("#login-spinner").classList.add('hidden');
                }
            });
            
            document.getElementById('rc')?.addEventListener('click', generateCaptcha);
            generateCaptcha(); // Panggil saat init
            
            document.getElementById("otp-form")?.addEventListener("submit", async (e) => {
                 // ... (Logika form OTP sudah bagus, tidak perlu diubah)
                 e.preventDefault();
                 const verifyBtn = document.getElementById("verify-otp-btn");
                 const otp = Array.from(document.querySelectorAll('.otp-input')).map(input => input.value).join('');
                 if (otp.length !== 6) return displayMessage('error', 'Masukkan 6 digit kode OTP', 'otp');
                 verifyBtn.disabled = true;
                 verifyBtn.querySelector("#verify-otp-text").textContent = 'Memverifikasi...';
                 verifyBtn.querySelector("#verify-otp-spinner").classList.remove('hidden');
                 try {
                     const response = await apiRequest({ action: "verify-otp", nik: document.getElementById("nik").value.trim(), otp });
                     if (response.success) {
                         saveSessionData(response.data);
                         showDashboardUI(response.data.username || 'User', response.data);
                         clearInterval(otpTimer);
                         document.getElementById("otp-overlay").classList.add('hidden');
                     } else {
                         displayMessage('error', response.message || 'Kode OTP salah', 'otp');
                     }
                 } catch (error) {
                     displayMessage('error', 'Terjadi kesalahan koneksi', 'otp');
                 } finally {
                     verifyBtn.disabled = false;
                     verifyBtn.querySelector("#verify-otp-text").textContent = 'Verifikasi';
                     verifyBtn.querySelector("#verify-otp-spinner").classList.add('hidden');
                 }
            });
        }
    };
})();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PemanisSystem.init());
} else {
    PemanisSystem.init();
}
