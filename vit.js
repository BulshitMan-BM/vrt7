const LoginSystem = (function() {
    // Private variables
    const W = "https://pemanis.bulshitman1.workers.dev/";
    let otpTimer;
    let currentUser = null;
    let captchaCode = ''; // <- [DITAMBAHKAN] Variabel untuk menyimpan kode Captcha

    // Private functions
    function S(i, m) {
        const element = document.getElementById(i);
        if (element) {
            element.innerText = m;
        }
    }

    // [DITAMBAHKAN] Fungsi untuk generate dan menampilkan Captcha
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
        // Kosongkan input field setiap kali captcha baru dibuat
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

    function updateProfileImages() {
        const sidebarImg = document.getElementById('sidebarAvatar');
        const sidebarFallback = document.getElementById('sidebarProfileFallback');
        
        let avatarUrl = localStorage.getItem('AvatarUrl');
        
        if (avatarUrl && avatarUrl.trim() !== '') {
            let processedAvatarUrl = avatarUrl;
            if (avatarUrl.includes('drive.google.com')) {
                const fileIdMatch = avatarUrl.match(/[?&]id=([^&]+)/);
                if (fileIdMatch) {
                    const fileId = fileIdMatch[1];
                    processedAvatarUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                }
            }
            
            if (sidebarImg) {
                sidebarImg.src = processedAvatarUrl;
                sidebarImg.style.display = 'block';
                
                sidebarImg.onload = function() {
                    if (sidebarFallback) {
                        sidebarFallback.style.display = 'none';
                    }
                };
                
                sidebarImg.onerror = function() {
                    const proxyUrl = `https://pemanis.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(processedAvatarUrl)}`;
                    
                    this.src = proxyUrl;
                    
                    this.onerror = function() {
                        this.style.display = 'none';
                        if (sidebarFallback) {
                            sidebarFallback.style.display = 'flex';
                        }
                    };
                };
            }
        } else {
            if (sidebarImg) {
                sidebarImg.style.display = 'none';
            }
            if (sidebarFallback) {
                sidebarFallback.style.display = 'flex';
            }
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
            // Check if user has tokens and show dashboard immediately
            const existingToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            
            if (existingToken && refreshToken) {
                try {
                    const payload = JSON.parse(atob(existingToken.split(".")[1]));
                    
                    // Show dashboard immediately with cached data
                    D(payload.name || payload.username || 'User');
                    
                    // Then validate and refresh tokens in background
                    setTimeout(async () => {
                        const isValid = await V();
                        if (isValid) {
                            try {
                                const userDataResponse = await P({ action: "get-user-data" });
                                
                                if (userDataResponse.success) {
                                    if (userDataResponse.data && userDataResponse.data.avatarUrl) {
                                        localStorage.setItem('AvatarUrl', userDataResponse.data.avatarUrl);
                                        updateProfileImages();
                                    }
                                    
                                    const userName = document.getElementById("user-name");
                                    const welcomeTitle = document.getElementById("welcome-title");
                                    
                                    if (userDataResponse.data.username && userName) {
                                        userName.textContent = userDataResponse.data.username;
                                    }
                                    if (userDataResponse.data.username && welcomeTitle) {
                                        welcomeTitle.textContent = `Selamat Datang, ${userDataResponse.data.username}!`;
                                    }
                                }
                            } catch (e) {
                                // Continue with cached data if server request fails
                            }
                        } else {
                            if (window.DashboardAPI) {
                                window.DashboardAPI.showLogin();
                            }
                            showMessage('info', 'Sesi telah berakhir, silakan login kembali');
                        }
                    }, 100);
                    
                } catch (e) {
                    if (window.DashboardAPI) {
                        window.DashboardAPI.showLogin();
                    }
                }
            } else {
                if (window.DashboardAPI) {
                    window.DashboardAPI.showLogin();
                }
            }

            this.setupEventListeners();
        },

        setupEventListeners: function() {
            // [DITAMBAHKAN] Captcha handler
            const refreshCaptchaBtn = document.getElementById('rc');
            if (refreshCaptchaBtn) {
                refreshCaptchaBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Mencegah form ter-submit jika tombol berada di dalam form
                    generateCaptcha();
                });
            }
            // Generate Captcha pertama kali saat halaman dimuat
            generateCaptcha();

            // Login form handler
            const loginForm = document.getElementById("login-form");
            if (loginForm) {
                loginForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    
                    // [DITAMBAHKAN] Validasi Captcha
                    const captchaInput = document.getElementById('vc');
                    const userCaptcha = captchaInput.value.trim();

                    if (!userCaptcha || userCaptcha.toLowerCase() !== captchaCode.toLowerCase()) {
                        showMessage('error', 'Kode Verifikasi salah. Silakan coba lagi.');
                        generateCaptcha(); // Buat captcha baru setelah gagal
                        return; // Hentikan proses login
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
                    
                    const requestPayload = {
                        action: "login",
                        nik: nik,
                        password: password
                    };
                    
                    try {
                        const response = await P(requestPayload);
                        
                        if (response.success && response.step === "otp") {
                            if (response.data) {
                                if (response.data.avatarUrl) {
                                    localStorage.setItem('AvatarUrl', response.data.avatarUrl);
                                }
                                localStorage.setItem('tempUserData', JSON.stringify(response.data));
                            }
                            
                            document.getElementById("otp-overlay").classList.remove('hidden');
                            O(300);
                            showOtpMessage('info', 'Kode OTP telah dikirim');
                            
                            const otpInputs = document.querySelectorAll('.otp-input');
                            if (otpInputs.length > 0) {
                                otpInputs[0].focus();
                            }
                        } else if (response.success) {
                            if (response.data) {
                                if (response.data.accessToken) {
                                    T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                                    T("refreshToken", response.data.refreshToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                                }
                                
                                if (response.data.avatarUrl) {
                                    localStorage.setItem('AvatarUrl', response.data.avatarUrl);
                                }
                                
                                D(response.data.username || response.data.name || 'User', response.data);
                            }
                        } else {
                            showMessage('error', response.message || 'Login gagal');
                            generateCaptcha(); // Buat captcha baru jika login gagal dari server
                        }
                    } catch (error) {
                        showMessage('error', 'Terjadi kesalahan koneksi');
                        generateCaptcha(); // Buat captcha baru jika ada error koneksi
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
                    otpInputs.forEach(input => {
                        otp += input.value;
                    });
                    
                    if (otp.length !== 6) {
                        showOtpMessage('error', 'Masukkan 6 digit kode OTP');
                        return;
                    }
                    
                    verifyBtn.disabled = true;
                    verifyText.textContent = 'Memverifikasi...';
                    verifySpinner.classList.remove('hidden');
                    
                    const requestPayload = {
                        action: "verify-otp",
                        nik: nik,
                        otp: otp
                    };
                    
                    try {
                        const response = await P(requestPayload);
                        
                        if (response.success) {
                            const tempUserData = localStorage.getItem('tempUserData');
                            let combinedUserData = response.data || {};
                            
                            if (tempUserData) {
                                try {
                                    const parsedTempData = JSON.parse(tempUserData);
                                    combinedUserData = { ...parsedTempData, ...combinedUserData };
                                    localStorage.removeItem('tempUserData');
                                } catch (e) {
                                    // Continue with response data only
                                }
                            }
                            
                            if (response.data.accessToken) {
                                T("accessToken", response.data.accessToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            }
                            if (response.data.refreshToken) {
                                T("refreshToken", response.data.refreshToken, response.data.tokenExpires - Math.floor(Date.now() / 1000));
                            }
                            
                            if (response.data.avatarUrl) {
                                localStorage.setItem('AvatarUrl', response.data.avatarUrl);
                            } else if (combinedUserData.avatarUrl) {
                                localStorage.setItem('AvatarUrl', combinedUserData.avatarUrl);
                            }
                            
                            const username = combinedUserData.username || combinedUserData.name || response.data.username || response.data.name || 'User';
                            D(username, combinedUserData);
                            
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
            }

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
                        C();
                        if (window.DashboardAPI) {
                            window.DashboardAPI.showLogin();
                        }
                        showMessage('success', 'Logout berhasil');
                        
                        logoutBtn.disabled = false;
                        logoutBtn.innerHTML = originalContent;

                        // [DITAMBAHKAN] Generate captcha baru setelah logout
                        generateCaptcha();
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
