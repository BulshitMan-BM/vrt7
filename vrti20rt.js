const LoginSystem = (function() {
    // =========================================================================
    // PRIVATE CONFIGURATION & STATE
    // =========================================================================
    const API_BASE_URL = "https://pemanis.bulshitman1.workers.dev"; // FIX: Removed trailing slash
    const OTP_DURATION_SECONDS = 300; // 5 menit

    let otpTimer;
    let currentUser = null;
    let captchaCode = ''; // Variable to store the current CAPTCHA code

    // =========================================================================
    // PRIVATE HELPER FUNCTIONS
    // =========================================================================

    /**
     * Sends a request to the backend API.
     * @param {object} payload - The data to send in the request body.
     * @returns {Promise<object>} - The JSON response from the server.
     */
    async function apiRequest(payload) {
        const accessToken = localStorage.getItem("accessToken") || "";
        const response = await fetch(`${API_BASE_URL}/`, { // Added slash here for the main endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": accessToken ? `Bearer ${accessToken}` : ""
            },
            body: JSON.stringify(payload)
        });
        return response.json();
    }

    /**
     * Displays a message (error, success, info) in a specified container.
     * @param {string} type - 'error', 'success', or 'info'.
     * @param {string} message - The message to display.
     * @param {string} context - The prefix for the element IDs ('login' or 'otp').
     */
    function displayMessage(type, message, context) {
        const messageContainer = document.getElementById(`${context}-message`);
        const messageIcon = document.getElementById(`${context}-message-icon`);
        const messageText = document.getElementById(`${context}-message-text`);
        
        if (!messageContainer || !messageIcon || !messageText) return;

        messageContainer.classList.remove('hidden'); // Make sure message is visible
        messageContainer.classList.remove('bg-red-50', 'bg-green-50', 'bg-blue-50', 'text-red-800', 'text-green-800', 'text-blue-800');
        messageIcon.className = '';
        
        let containerClasses, iconClass;
        
        switch (type) {
            case 'error':
                containerClasses = ['bg-red-50', 'text-red-800'];
                iconClass = 'fas fa-exclamation-circle text-red-600';
                break;
            case 'success':
                containerClasses = ['bg-green-50', 'text-green-800'];
                iconClass = 'fas fa-check-circle text-green-600';
                break;
            default:
                containerClasses = ['bg-blue-50', 'text-blue-800'];
                iconClass = 'fas fa-info-circle text-blue-600';
        }
        
        messageContainer.classList.add(...containerClasses);
        messageIcon.className = iconClass;
        messageText.textContent = message;
    }
    
    /**
     * Saves session data (tokens, avatar) to localStorage.
     * @param {object} data - The session data from the API response.
     */
    function saveSessionData(data) {
        if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.avatarUrl) localStorage.setItem("AvatarUrl", data.avatarUrl);
        if (data.tokenExpires) {
            const expiresAt = Date.now() + (data.tokenExpires - Math.floor(Date.now() / 1000)) * 1000;
            localStorage.setItem("tokenExpires", expiresAt);
        }
    }

    /**
     * Clears all session-related data from localStorage.
     */
    function clearSessionData() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpires");
        localStorage.removeItem("AvatarUrl");
        localStorage.removeItem("tempUserData");
    }

    /**
     * Generates a new random CAPTCHA code and displays it.
     */
    function generateCaptcha() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let code = "";
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaCode = code;
        
        const captchaTextElement = document.getElementById('ct');
        const captchaInputElement = document.getElementById('vc');

        if (captchaTextElement) {
            captchaTextElement.textContent = captchaCode;
        }
        if (captchaInputElement) {
            captchaInputElement.value = ''; // Clear previous input
        }
    }

    /**
     * Starts the countdown timer for OTP verification.
     * @param {number} durationInSeconds - The duration of the timer.
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
                    displayMessage('error', 'Kode OTP telah kedaluwarsa', 'otp');
                    return;
                }
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                timeLeft--;
            }, 1000);
        }
    }
    
    /**
     * Updates profile images across the UI based on localStorage.
     */
    function updateProfileImages() {
        const sidebarImg = document.getElementById('sidebarAvatar');
        const sidebarFallback = document.getElementById('sidebarProfileFallback');
        const avatarUrl = localStorage.getItem('AvatarUrl');
        
        if (!sidebarImg || !sidebarFallback) return;

        if (avatarUrl && avatarUrl.trim() !== '') {
            let processedUrl = avatarUrl;
            if (avatarUrl.includes('drive.google.com')) {
                const fileIdMatch = avatarUrl.match(/[?&]id=([^&]+)/);
                if (fileIdMatch) {
                    processedUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
                }
            }
            
            sidebarImg.src = processedUrl;
            sidebarImg.style.display = 'block';
            sidebarFallback.style.display = 'none';

            sidebarImg.onerror = function() {
                this.src = `${API_BASE_URL}/avatar?url=${encodeURIComponent(processedUrl)}`;
                this.onerror = function() {
                    this.style.display = 'none';
                    sidebarFallback.style.display = 'flex';
                };
            };
        } else {
            sidebarImg.style.display = 'none';
            sidebarFallback.style.display = 'flex';
        }
    }

    /**
     * Updates the UI to show the main dashboard.
     * @param {string} username - The user's name to display.
     * @param {object} userData - The full user data object.
     */
    function showDashboard(username, userData = {}) {
        if (window.DashboardAPI) {
            window.DashboardAPI.showDashboard();
        }
        
        const welcomeTitle = document.getElementById("welcome-title");
        const userNameElement = document.getElementById("user-name");
        
        if (welcomeTitle) welcomeTitle.textContent = `Selamat Datang, ${username}!`;
        if (userNameElement) userNameElement.textContent = username;
        
        currentUser = userData;
        updateProfileImages();
    }

    /**
     * Validates the current access token and refreshes it if necessary.
     * @returns {Promise<boolean>} - True if the session is valid, false otherwise.
     */
    async function validateAndRefreshToken() {
        const accessToken = localStorage.getItem("accessToken");
        const expiresAt = parseInt(localStorage.getItem("tokenExpires") || 0);

        if (!accessToken || Date.now() > expiresAt) {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const response = await apiRequest({
                        action: "refresh-token",
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    });
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
            } else {
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
            const existingToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");

            if (existingToken && refreshToken) {
                const isValid = await validateAndRefreshToken(); // Validate first
                if (isValid) {
                    try {
                        // Get the potentially refreshed token
                        const currentToken = localStorage.getItem("accessToken");
                        const payload = JSON.parse(atob(currentToken.split(".")[1]));
                        showDashboard(payload.name || payload.username || 'User');
                        
                        // Fetch fresh data in the background to update details
                        try {
                            const response = await apiRequest({ action: "get-user-data" });
                            if (response.success && response.data) {
                                saveSessionData(response.data);
                                const username = response.data.username || payload.name || 'User';
                                showDashboard(username, response.data); // Re-render with fresh data
                            }
                        } catch (e) {
                            console.error("Failed to fetch user data, using cached data.", e);
                        }
                    } catch (e) {
                        // This might happen if the token is malformed even after validation
                        clearSessionData();
                        if (window.DashboardAPI) window.DashboardAPI.showLogin();
                    }
                } else {
                    // Token validation failed
                    if (window.DashboardAPI) window.DashboardAPI.showLogin();
                    displayMessage('info', 'Sesi telah berakhir, silakan login kembali', 'login');
                }
            } else {
                // No tokens found
                if (window.DashboardAPI) window.DashboardAPI.showLogin();
            }

            generateCaptcha(); // Generate CAPTCHA for the login page
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            const loginForm = document.getElementById("login-form");
            const otpForm = document.getElementById("otp-form");
            const otpInputs = document.querySelectorAll('.otp-input');
            const refreshCaptchaBtn = document.getElementById('rc');

            // --- CAPTCHA Refresh Handler ---
            if (refreshCaptchaBtn) {
                refreshCaptchaBtn.addEventListener('click', generateCaptcha);
            }
            
            // --- Login Form Handler ---
            if (loginForm) {
                loginForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const nikInput = document.getElementById("nik");
                    const passwordInput = document.getElementById("password");
                    const captchaInput = document.getElementById('vc');
                    const loginBtn = document.getElementById("login-btn");
                    const loginText = document.getElementById("login-text");
                    const loginSpinner = document.getElementById("login-spinner");
                    
                    const nik = nikInput.value.trim();
                    const password = passwordInput.value.trim();
                    const captchaValue = captchaInput.value.trim();

                    // --- VALIDATION CHECKS ---
                    if (!nik || !password) return displayMessage('error', 'NIK dan Password wajib diisi', 'login');
                    if (nik.length !== 16 || !/^\d+$/.test(nik)) return displayMessage('error', 'NIK harus 16 digit angka', 'login');
                    if (!captchaValue) return displayMessage('error', 'Kode verifikasi wajib diisi', 'login');

                    // --- CAPTCHA VALIDATION ---
                    if (captchaValue.toLowerCase() !== captchaCode.toLowerCase()) {
                        generateCaptcha(); // Regenerate captcha on failure
                        return displayMessage('error', 'Kode verifikasi salah', 'login');
                    }
                    
                    loginBtn.disabled = true;
                    loginText.textContent = 'Memproses...';
                    loginSpinner.classList.remove('hidden');

                    try {
                        const response = await apiRequest({ action: "login", nik, password });
                        if (response.success && response.step === "otp") {
                            if (response.data) {
                                localStorage.setItem('tempUserData', JSON.stringify(response.data));
                            }
                            document.getElementById("otp-overlay").classList.remove('hidden');
                            startOtpTimer(OTP_DURATION_SECONDS);
                            displayMessage('info', 'Kode OTP telah dikirim', 'otp');
                            if (otpInputs.length > 0) otpInputs[0].focus();
                        } else if (response.success) {
                            saveSessionData(response.data);
                            const username = response.data.username || response.data.name || 'User';
                            showDashboard(username, response.data);
                        } else {
                            generateCaptcha(); // Also regenerate captcha on login failure
                            displayMessage('error', response.message || 'Login gagal', 'login');
                        }
                    } catch (error) {
                        generateCaptcha();
                        displayMessage('error', 'Terjadi kesalahan koneksi', 'login');
                    } finally {
                        loginBtn.disabled = false;
                        loginText.textContent = 'Masuk';
                        loginSpinner.classList.add('hidden');
                    }
                });
            }

            // --- OTP Input Logic ---
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
                    for (let i = 0; i < pastedData.length && (index + i) < otpInputs.length; i++) {
                        otpInputs[index + i].value = pastedData[i];
                    }
                    const nextFocusIndex = Math.min(index + pastedData.length, otpInputs.length - 1);
                    otpInputs[nextFocusIndex].focus();
                });
            });

            // --- OTP Form Handler ---
            if (otpForm) {
                otpForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    const verifyBtn = document.getElementById("verify-otp-btn");
                    const verifyText = document.getElementById("verify-otp-text");
                    const verifySpinner = document.getElementById("verify-otp-spinner");
                    
                    const nik = document.getElementById("nik").value.trim();
                    const otp = Array.from(otpInputs).map(input => input.value).join('');

                    if (otp.length !== 6) return displayMessage('error', 'Masukkan 6 digit kode OTP', 'otp');
                    
                    verifyBtn.disabled = true;
                    verifyText.textContent = 'Memverifikasi...';
                    verifySpinner.classList.remove('hidden');

                    try {
                        const response = await apiRequest({ action: "verify-otp", nik, otp });
                        if (response.success) {
                            const tempUserData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
                            const finalUserData = { ...tempUserData, ...response.data };
                            
                            saveSessionData(finalUserData);
                            
                            const username = finalUserData.username || finalUserData.name || 'User';
                            showDashboard(username, finalUserData);
                            
                            clearInterval(otpTimer);
                            document.getElementById("otp-overlay").classList.add('hidden');
                        } else {
                            displayMessage('error', response.message || 'Kode OTP salah', 'otp');
                        }
                    } catch (error) {
                        displayMessage('error', 'Terjadi kesalahan koneksi', 'otp');
                    } finally {
                        verifyBtn.disabled = false;
                        verifyText.textContent = 'Verifikasi';
                        verifySpinner.classList.add('hidden');
                    }
                });
            }
            
            // --- Resend & Close OTP Handlers ---
            document.getElementById("resend-otp")?.addEventListener("click", async () => {
                const nik = document.getElementById("nik").value.trim();
                try {
                    const response = await apiRequest({ action: "resend-otp", nik });
                    if (response.success) {
                        displayMessage('success', 'Kode OTP baru telah dikirim', 'otp');
                        startOtpTimer(OTP_DURATION_SECONDS);
                    } else {
                        displayMessage('error', response.message || 'Gagal mengirim ulang OTP', 'otp');
                    }
                } catch (error) {
                    displayMessage('error', 'Terjadi kesalahan koneksi', 'otp');
                }
            });

            document.getElementById("close-otp")?.addEventListener("click", () => {
                document.getElementById("otp-overlay").classList.add('hidden');
                clearInterval(otpTimer);
                otpInputs.forEach(input => { input.value = ''; });
            });

            // --- Password Toggle Handler ---
            const togglePassword = document.getElementById("toggle-password");
            if (togglePassword) {
                togglePassword.addEventListener("click", () => {
                    const passwordInput = document.getElementById("password");
                    const passwordIcon = document.getElementById("password-icon");
                    const isPassword = passwordInput.getAttribute("type") === "password";
                    passwordInput.setAttribute("type", isPassword ? "text" : "password");
                    passwordIcon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
                });
            }

            // --- Logout Handler ---
            document.getElementById("logout-btn")?.addEventListener("click", async (e) => {
                const logoutBtn = e.currentTarget;
                const originalContent = logoutBtn.innerHTML;
                logoutBtn.disabled = true;
                logoutBtn.innerHTML = `<div class="loading-spinner mr-3"></div> Logging out...`;
                
                try {
                    await apiRequest({ action: "logout" });
                } catch (error) {
                    console.error("Logout request failed, proceeding with client-side logout.", error);
                }
                
                setTimeout(() => {
                    clearSessionData();
                    generateCaptcha(); // Generate new captcha for next login
                    if (window.DashboardAPI) window.DashboardAPI.showLogin();
                    displayMessage('success', 'Logout berhasil', 'login');
                    
                    logoutBtn.disabled = false;
                    logoutBtn.innerHTML = originalContent;
                }, 800);
            });
        }
    };
})();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginSystem.init());
} else {
    LoginSystem.init();
}

