// Global variables for login
let otpTimer = null;
let resendTimer = null;

// API Configuration
const API_WORKER_URL = "https://pemanis.bulshitman1.workers.dev/";

// =======================
// LocalStorage Helper Functions
// =======================
function setSession(sessionId) {
    localStorage.setItem("sessionId", sessionId);
}

function getSession() {
    return localStorage.getItem("sessionId");
}

function clearSession() {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("pendingNik");
}

// =======================
// Session Management
// =======================
function checkSessionBeforeNavigation() {
    const sessionId = getSession();
    const storedUser = localStorage.getItem("currentUser");
    
    if (!sessionId || !storedUser) {
        console.log('No session found - redirecting to login');
        handleInvalidSession();
        return false;
    }
    
    try {
        const user = JSON.parse(storedUser);
        if (!user || !user.sessionId) {
            console.log('Invalid user data - redirecting to login');
            handleInvalidSession();
            return false;
        }
        
        if (!window.currentUser) {
            window.currentUser = user;
        }
        
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        handleInvalidSession();
        return false;
    }
}

function handleInvalidSession() {
    console.log('Session invalid - redirecting to login');
    clearSession();
    clearTimers();
    window.currentUser = null;
    window.sessionValidated = false;
    
    if (window.DashboardManager) {
        window.DashboardManager.hideDashboard();
    }
    showLoginForm();
}

// =======================
// Initialization
// =======================
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
});

function initializeLogin() {
    const loginFormElement = document.getElementById('loginFormElement');
    const otpFormElement = document.getElementById('otpFormElement');
    const togglePassword = document.getElementById('togglePassword');
    const backToLoginButton = document.getElementById('backToLoginButton');
    const resendOtpButton = document.getElementById('resendOtpButton');

    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    if (otpFormElement) {
        otpFormElement.addEventListener('submit', handleOtpVerification);
    }

    if (togglePassword) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const passwordInput = document.getElementById('passwordInput');
            const icon = this.querySelector('i');
            
            if (passwordInput && icon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            }
        });
    }

    if (backToLoginButton) {
        backToLoginButton.addEventListener('click', showLoginForm);
    }

    if (resendOtpButton) {
        resendOtpButton.addEventListener('click', resendOtp);
    }

    initializeOtpInputs();
    checkExistingSession();
}

async function checkExistingSession() {
    const sessionId = getSession();
    const storedUser = localStorage.getItem("currentUser");
    
    if (!sessionId || !storedUser) {
        showLoginForm();
        return;
    }

    try {
        window.currentUser = JSON.parse(storedUser);
        
        if (window.DashboardManager) {
            window.DashboardManager.showDashboard();
            window.DashboardManager.enableDashboardFunctionality();
        }
        
        const res = await fetch(API_WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-session-id": sessionId
            },
            body: JSON.stringify({ action: "validate-session" })
        });

        const data = await res.json();
        
        if (data.success && data.user) {
            window.currentUser = data.user;
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            
            if (window.DashboardManager) {
                window.DashboardManager.updateUserInfo();
            }
            window.sessionValidated = true;
        } else {
            window.sessionValidated = false;
            console.warn('Session invalid - will redirect on next navigation');
        }
    } catch (error) {
        console.error('Session validation error:', error);
        window.sessionValidated = false;
    }
}

// =======================
// Login Functions
// =======================
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('otpOverlay').classList.add('hidden');
    clearOtpInputs();
    clearTimers();
}

function showOtpForm() {
    document.getElementById('otpOverlay').classList.remove('hidden');
    focusFirstOtpInput();
    startOtpTimer();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const nikInput = document.getElementById('nikInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    const nik = nikInput.value.trim();
    const password = passwordInput.value.trim();
    
    hideLoginError();
    
    if (!nik || !password) {
        showLoginError('NIK dan password harus diisi');
        return;
    }
    
    if (nik.length !== 16) {
        showLoginError('NIK harus 16 digit');
        return;
    }
    
    loginButton.disabled = true;
    loginButtonText.textContent = 'Memverifikasi...';
    loginSpinner.style.display = 'inline-block';
    
    try {
        const res = await fetch(API_WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "login",
                nik,
                password,
                deviceInfo: navigator.userAgent
            })
        });

        const data = await res.json();
        
        if (data.success && data.step === "otp") {
            localStorage.setItem("pendingNik", nik);
            showOtpForm();
            
            const otpPhoneNumber = document.getElementById('otpPhoneNumber');
            if (otpPhoneNumber && data.maskedEmail) {
                otpPhoneNumber.textContent = data.maskedEmail;
            }
            
            showOtpSuccess('OTP telah dikirim ke email Anda!');
        } else {
            showLoginError(data.message || 'Login gagal. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
        loginButton.disabled = false;
        loginButtonText.textContent = 'Masuk';
        loginSpinner.style.display = 'none';
    }
}

async function handleOtpVerification(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const verifyButton = document.getElementById('verifyOtpButton');
    const verifyButtonText = document.getElementById('verifyButtonText');
    const verifySpinner = document.getElementById('verifySpinner');
    
    const otpValue = Array.from(otpInputs).map(input => input.value).join('');
    const nik = localStorage.getItem("pendingNik");
    
    hideOtpError();
    
    if (otpValue.length !== 6) {
        showOtpError('Masukkan kode OTP 6 digit');
        return;
    }
    
    if (!nik) {
        showOtpError('Sesi telah berakhir. Silakan login ulang.');
        setTimeout(showLoginForm, 2000);
        return;
    }
    
    verifyButton.disabled = true;
    verifyButtonText.textContent = 'Memverifikasi...';
    verifySpinner.style.display = 'inline-block';
    
    try {
        const res = await fetch(API_WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "verify-otp",
                nik,
                otp: otpValue,
                deviceInfo: navigator.userAgent
            })
        });

        const data = await res.json();
        
        if (data.success && data.user && data.user.sessionId) {
            setSession(data.user.sessionId);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            localStorage.removeItem("pendingNik");
            window.currentUser = data.user;
            clearTimers();
            
            if (window.DashboardManager) {
                window.DashboardManager.showDashboard();
                window.DashboardManager.enableDashboardFunctionality();
            }
        } else {
            showOtpError(data.message || 'Kode OTP salah. Silakan coba lagi.');
            clearOtpInputs();
            focusFirstOtpInput();
        }
        
    } catch (error) {
        console.error('OTP verification error:', error);
        showOtpError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
        verifyButton.disabled = false;
        verifyButtonText.textContent = 'Verifikasi';
        verifySpinner.style.display = 'none';
    }
}

// =======================
// OTP Functions
// =======================
function initializeOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            if (value) {
                e.target.classList.add('filled');
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
                otpInputs[index - 1].value = '';
                otpInputs[index - 1].classList.remove('filled');
            }
            
            if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                navigator.clipboard.readText().then(text => {
                    const digits = text.replace(/\D/g, '').slice(0, 6);
                    if (digits.length === 6) {
                        otpInputs.forEach((input, i) => {
                            input.value = digits[i] || '';
                            if (digits[i]) {
                                input.classList.add('filled');
                            } else {
                                input.classList.remove('filled');
                            }
                        });
                    }
                });
            }
        });
    });
}

function clearOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
}

function focusFirstOtpInput() {
    const firstInput = document.querySelector('.otp-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function startOtpTimer() {
    let timeLeft = 300;
    const timerElement = document.getElementById('timerCount');
    
    otpTimer = setInterval(() => {
        timeLeft--;
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            showOtpError('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
        }
    }, 1000);
    
    startResendTimer();
}

function startResendTimer() {
    let timeLeft = 60;
    const resendButton = document.getElementById('resendOtpButton');
    const resendButtonText = document.getElementById('resendButtonText');
    const resendTimerElement = document.getElementById('resendTimer');
    const resendCountElement = document.getElementById('resendCount');
    
    if (resendButton) resendButton.disabled = true;
    if (resendTimerElement) resendTimerElement.classList.remove('hidden');
    
    resendTimer = setInterval(() => {
        timeLeft--;
        if (resendCountElement) {
            resendCountElement.textContent = timeLeft;
        }
        
        if (timeLeft <= 0) {
            clearInterval(resendTimer);
            if (resendButton) resendButton.disabled = false;
            if (resendButtonText) resendButtonText.textContent = 'Kirim Ulang';
            if (resendTimerElement) resendTimerElement.classList.add('hidden');
        }
    }, 1000);
}

async function resendOtp() {
    const nik = localStorage.getItem("pendingNik");
    if (!nik) {
        showOtpError('Sesi telah berakhir. Silakan login ulang.');
        setTimeout(showLoginForm, 2000);
        return;
    }

    const resendButton = document.getElementById('resendOtpButton');
    const resendButtonText = document.getElementById('resendButtonText');
    
    if (resendButton) resendButton.disabled = true;
    if (resendButtonText) resendButtonText.textContent = 'Mengirim...';
    
    try {
        const res = await fetch(API_WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "resend-otp",
                nik,
                deviceInfo: navigator.userAgent
            })
        });

        const data = await res.json();
        
        if (data.success) {
            clearOtpInputs();
            focusFirstOtpInput();
            hideOtpError();
            clearTimers();
            startOtpTimer();
            showOtpSuccess('Kode OTP baru telah dikirim ke email Anda!');
        } else {
            showOtpError(data.message || 'Gagal mengirim ulang OTP. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Resend OTP error:', error);
        showOtpError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
        if (resendButtonText) resendButtonText.textContent = 'Kirim Ulang';
    }
}

function clearTimers() {
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
}

// =======================
// Error/Success Messages
// =======================
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function hideLoginError() {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function showOtpError(message) {
    const errorElement = document.getElementById('otpError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function hideOtpError() {
    const errorElement = document.getElementById('otpError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function showOtpSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm';
    successDiv.textContent = message;
    
    const otpForm = document.getElementById('otpForm');
    const firstChild = otpForm.querySelector('form');
    if (firstChild) {
        otpForm.insertBefore(successDiv, firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// =======================
// Logout Function
// =======================
async function logout() {
    try {
        const sessionId = getSession();
        if (sessionId) {
            await fetch(API_WORKER_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "x-session-id": sessionId 
                },
                body: JSON.stringify({ action: "logout" })
            });
        }
        
        clearSession();
        clearTimers();
        window.currentUser = null;
        
        showLoginForm();
        
    } catch (error) {
        console.error('Logout error:', error);
        clearSession();
        clearTimers();
        window.currentUser = null;
        showLoginForm();
    }
}

// =======================
// Expose LoginManager for dashboard
// =======================
window.LoginManager = {
    checkSessionBeforeNavigation,
    handleInvalidSession,
    logout,
    clearSession,
    getSession,
    setSession
};
