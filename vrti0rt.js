const LoginSystem = (function() {
    // =========================================================================
    // PRIVATE CONFIGURATION & STATE
    // =========================================================================
    const API_BASE_URL = "https://pemanis.bulshitman1.workers.dev";
    const OTP_DURATION_SECONDS = 300;

    let otpTimer;
    let currentUser = null;
    let captchaCode = '';

    // =========================================================================
    // UI MANAGER (Handles page visibility)
    // =========================================================================
    const UIManager = {
        showLogin: function() {
            document.getElementById('login-page')?.classList.remove('hidden');
            document.getElementById('dashboard-page')?.classList.add('hidden');
        },
        showDashboard: function() {
            document.getElementById('login-page')?.classList.add('hidden');
            document.getElementById('dashboard-page')?.classList.remove('hidden');
            // Re-attach event listeners needed for the dashboard
            this.initializeDashboardUI();
        },
        initializeDashboardUI: function() {
            // This function ensures event listeners are active on the dashboard.
            // It's safe to call multiple times.
            const profileBtn = document.getElementById('profile-btn');
            const profileDropdown = document.getElementById('profile-dropdown');
            const dashboardDarkModeToggle = document.getElementById('dashboardDarkModeToggle');
            const sidebarToggle = document.getElementById('sidebarToggle');
            const headerToggle = document.getElementById('headerToggle');

            // --- Logout Handler ---
            // Use a flag to prevent attaching multiple listeners
            if (!document.getElementById("logout-btn")._hasListener) {
                document.getElementById("logout-btn").addEventListener("click", () => LoginSystem.logout());
                document.getElementById("logout-btn")._hasListener = true;
            }

            // --- Profile Dropdown ---
            if (profileBtn && !profileBtn._hasListener) {
                profileBtn.addEventListener('click', () => {
                    profileDropdown.classList.toggle('hidden');
                });
                profileBtn._hasListener = true;
            }
            
            // --- Sidebar Toggle ---
            const toggleSidebar = () => {
                document.getElementById('sidebar')?.classList.toggle('collapsed');
                document.getElementById('mainContent')?.classList.toggle('expanded');
                document.getElementById('header')?.classList.toggle('expanded');
                document.getElementById('headerToggle')?.classList.toggle('hidden');
            };

            if (sidebarToggle && !sidebarToggle._hasListener) {
                 sidebarToggle.addEventListener('click', toggleSidebar);
                 sidebarToggle._hasListener = true;
            }
           
            if (headerToggle && !headerToggle._hasListener) {
                headerToggle.addEventListener('click', toggleSidebar);
                headerToggle._hasListener = true;
            }
            
            // --- Dark Mode ---
             if (dashboardDarkModeToggle && !dashboardDarkModeToggle._hasListener) {
                dashboardDarkModeToggle.addEventListener('click', () => {
                    const isDark = document.documentElement.classList.toggle('dark');
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    const icon = document.getElementById('dashboardThemeIcon');
                    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                });
                dashboardDarkModeToggle._hasListener = true;
            }

            // Close dropdown if clicked outside
            document.addEventListener('click', function(event) {
                if (profileBtn && profileDropdown && !profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }
    };

    // =========================================================================
    // PRIVATE HELPER FUNCTIONS
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

        msgContainer.className = 'mt-4 p-3 rounded-lg flex items-center'; // Reset
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
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpires");
        localStorage.removeItem("AvatarUrl");
        localStorage.removeItem("tempUserData");
    }

    function generateCaptcha() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        captchaCode = [...Array(5)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const captchaTextEl = document.getElementById('ct');
        if (captchaTextEl) captchaTextEl.textContent = captchaCode;
        const captchaInputEl = document.getElementById('vc');
        if (captchaInputEl) captchaInputEl.value = '';
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
        const sidebarImg = document.getElementById('sidebarAvatar');
        const fallback = document.getElementById('sidebarProfileFallback');
        const url = localStorage.getItem('AvatarUrl');
        if (!sidebarImg || !fallback) return;

        if (url && url.trim()) {
            let pUrl = url.includes('drive.google.com') ? `https://drive.google.com/uc?export=view&id=${url.match(/[?&]id=([^&]+)/)[1]}` : url;
            sidebarImg.src = pUrl;
            sidebarImg.style.display = 'block';
            fallback.style.display = 'none';
            sidebarImg.onerror = () => {
                sidebarImg.src = `${API_BASE_URL}/avatar?url=${encodeURIComponent(pUrl)}`;
                sidebarImg.onerror = () => {
                    sidebarImg.style.display = 'none';
                    fallback.style.display = 'flex';
                };
            };
        } else {
            sidebarImg.style.display = 'none';
            fallback.style.display = 'flex';
        }
    }

    function showDashboardUI(username, userData = {}) {
        UIManager.showDashboard();
        const welcomeTitle = document.getElementById("welcome-title");
        if (welcomeTitle) welcomeTitle.textContent = `Selamat Datang, ${username}!`;
        const userNameEl = document.getElementById("user-name");
        if (userNameEl) userNameEl.textContent = username;
        currentUser = userData;
        updateProfileImages();
    }

    async function validateAndRefreshToken() {
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
                    clearSessionData();
                    return false;
                }
            } catch (error) {
                console.error("Token refresh failed:", error);
                clearSessionData();
                return false;
            }
        }
        return true;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    return {
        init: async function() {
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
                        clearSessionData();
                        UIManager.showLogin();
                    }
                } else {
                    UIManager.showLogin();
                    displayMessage('info', 'Sesi telah berakhir, silakan login kembali', 'login');
                }
            } else {
                UIManager.showLogin();
            }
            generateCaptcha();
            this.setupEventListeners();
        },
        logout: async function() {
            const logoutBtn = document.getElementById("logout-btn");
            if(logoutBtn) logoutBtn.disabled = true;
            try { await apiRequest({ action: "logout" }); } 
            catch (error) { console.error("Logout request failed, proceeding.", error); }
            clearSessionData();
            generateCaptcha();
            UIManager.showLogin();
            displayMessage('success', 'Logout berhasil', 'login');
        },
        setupEventListeners: function() {
            document.getElementById("login-form")?.addEventListener("submit", async (e) => {
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
                        if (response.data) localStorage.setItem('tempUserData', JSON.stringify(response.data));
                        document.getElementById("otp-overlay").classList.remove('hidden');
                        startOtpTimer(OTP_DURATION_SECONDS);
                        displayMessage('info', 'Kode OTP telah dikirim', 'otp');
                        document.querySelector('.otp-input')?.focus();
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
            // Add other permanent listeners like OTP form logic here
            const otpForm = document.getElementById("otp-form");
             if (otpForm) {
                otpForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const verifyBtn = document.getElementById("verify-otp-btn");
                    const otpInputs = document.querySelectorAll('.otp-input');
                    const nik = document.getElementById("nik").value.trim();
                    const otp = Array.from(otpInputs).map(input => input.value).join('');

                    if (otp.length !== 6) return displayMessage('error', 'Masukkan 6 digit kode OTP', 'otp');
                    
                    verifyBtn.disabled = true;
                    verifyBtn.querySelector("#verify-otp-text").textContent = 'Memverifikasi...';
                    verifyBtn.querySelector("#verify-otp-spinner").classList.remove('hidden');

                    try {
                        const response = await apiRequest({ action: "verify-otp", nik, otp });
                        if (response.success) {
                            const tempUserData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
                            const finalUserData = { ...tempUserData, ...response.data };
                            
                            saveSessionData(finalUserData);
                            showDashboardUI(finalUserData.username || finalUserData.name || 'User', finalUserData);
                            
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
        }
    };
})();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginSystem.init());
} else {
    LoginSystem.init();
}

