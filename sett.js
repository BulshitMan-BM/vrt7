// =======================
// SETTINGS MANAGEMENT
// =======================

// Variables to track original form values
let originalProfileData = {};
let originalPasswordData = {};
let hasAvatarChanged = false;
let pendingAvatarFile = null;
let emailVerificationSent = false;
let emailTimer;

// Initialize settings functionality
function initSettings() {
    const settingsMenuBtn = document.getElementById("settings-menu");
    const profileSettingsButton = document.getElementById("profile-settings-btn");
    const showEditProfileBtn = document.getElementById("show-edit-profile");
    const showChangePasswordBtn = document.getElementById("show-change-password");
    const backToDashboardBtn = document.getElementById("back-to-dashboard");
    const backToSettingsMenuBtn = document.getElementById("back-to-settings-menu");
    const backToSettingsMenuBtn2 = document.getElementById("back-to-settings-menu-2");
    
    if (settingsMenuBtn) {
        settingsMenuBtn.addEventListener("click", showSettingsMenu);
    }
    
    if (profileSettingsButton) {
        profileSettingsButton.addEventListener("click", showSettingsMenu);
    }
    
    if (showEditProfileBtn) {
        showEditProfileBtn.addEventListener("click", () => showEditProfile());
    }
    
    if (showChangePasswordBtn) {
        showChangePasswordBtn.addEventListener("click", () => showChangePassword());
    }
    
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener("click", () => {
            if (typeof backToDashboard === 'function') {
                backToDashboard();
            }
        });
    }
    
    if (backToSettingsMenuBtn) {
        backToSettingsMenuBtn.addEventListener("click", backToSettingsMenu);
    }
    
    if (backToSettingsMenuBtn2) {
        backToSettingsMenuBtn2.addEventListener("click", () => {
            if (window.changePasswordSource === 'profile') {
                if (typeof setCurrentPage === 'function') {
                    setCurrentPage('profile');
                }
                document.getElementById('settings-content').classList.add('hidden');
                document.getElementById('profile-content').classList.remove('hidden');
                document.getElementById('dashboard-content').classList.add('hidden');
                window.changePasswordSource = null;
            } else {
                backToSettingsMenu();
            }
        });
    }
    
    initEmailVerification();
    initAvatarUpload();
    initProfileForm();
    initPasswordForm();
    initPasswordToggles();
}

// Show settings menu
function showSettingsMenu() {
    if (typeof currentPage !== 'undefined' && currentPage === 'settings') {
        return;
    }
    
    if (typeof setCurrentPage === 'function') {
        setCurrentPage('settings');
    }
    
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('profile-content').classList.add('hidden');
    document.getElementById('settings-content').classList.remove('hidden');
    
    document.getElementById('settings-loading').classList.remove('hidden');
    document.getElementById('settings-menu-view').classList.add('hidden');
    document.getElementById('edit-profile-view').classList.add('hidden');
    document.getElementById('change-password-view').classList.add('hidden');
    
    const profileDropdown = document.getElementById("profile-dropdown");
    if (profileDropdown) {
        profileDropdown.classList.add('hidden');
    }
    
    setTimeout(() => {
        document.getElementById('settings-loading').classList.add('hidden');
        document.getElementById('settings-menu-view').classList.remove('hidden');
    }, 800);
}

// Show edit profile form
function showEditProfile(fromPage = 'settings') {
    window.editProfileSource = fromPage;
    
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('profile-content').classList.add('hidden');
    document.getElementById('settings-content').classList.remove('hidden');
    
    document.getElementById('settings-menu-view').classList.add('hidden');
    document.getElementById('edit-profile-view').classList.remove('hidden');
    document.getElementById('change-password-view').classList.add('hidden');
    
    document.getElementById('profile-loading').classList.remove('hidden');
    document.getElementById('profile-header').classList.add('hidden');
    
    const profileFormCard = document.querySelector('#edit-profile-view .bg-white');
    if (profileFormCard) {
        profileFormCard.classList.add('hidden');
    }
    
    setTimeout(() => {
        loadUserProfileData();
    }, 600);
}

// Show change password form
function showChangePassword(fromPage = 'settings') {
    window.changePasswordSource = fromPage;
    
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('profile-content').classList.add('hidden');
    document.getElementById('settings-content').classList.remove('hidden');
    
    document.getElementById('settings-menu-view').classList.add('hidden');
    document.getElementById('edit-profile-view').classList.add('hidden');
    document.getElementById('change-password-view').classList.remove('hidden');
    
    document.getElementById('password-loading').classList.remove('hidden');
    document.getElementById('password-header').classList.add('hidden');
    
    const passwordFormCard = document.querySelector('#change-password-view .bg-white');
    if (passwordFormCard) {
        passwordFormCard.classList.add('hidden');
    }
    
    setTimeout(() => {
        document.getElementById('password-loading').classList.add('hidden');
        document.getElementById('password-header').classList.remove('hidden');
        
        if (passwordFormCard) {
            passwordFormCard.classList.remove('hidden');
        }
        
        setupPasswordFormListeners();
    }, 600);
}

// Back to settings menu or profile page
function backToSettingsMenu() {
    if (window.editProfileSource === 'profile') {
        if (typeof setCurrentPage === 'function') {
            setCurrentPage('profile');
        }
        document.getElementById('settings-content').classList.add('hidden');
        document.getElementById('profile-content').classList.remove('hidden');
        document.getElementById('dashboard-content').classList.add('hidden');
        window.editProfileSource = null;
    } else {
        document.getElementById('edit-profile-view').classList.add('hidden');
        document.getElementById('change-password-view').classList.add('hidden');
        document.getElementById('settings-menu-view').classList.remove('hidden');
    }
}

// Load user profile data
async function loadUserProfileData() {
    try {
        const response = await P({ action: "get-profile" });
        
        if (response.success) {
            const userData = response.data;
            
            originalProfileData = {
                name: userData.name || userData.username || "",
                email: userData.email || "",
                nik: userData.nik || "",
                role: userData.role || ""
            };
            
            hasAvatarChanged = false;
            
            const profileName = document.getElementById("profile-name");
            const currentEmailDisplay = document.getElementById("current-email-display");
            const profileNik = document.getElementById("profile-nik");
            const profileRole = document.getElementById("profile-role");
            
            if (profileName) {
                profileName.value = originalProfileData.name;
                profileName.addEventListener('input', checkProfileFormChanges);
            }
            if (currentEmailDisplay) {
                currentEmailDisplay.value = originalProfileData.email;
            }
            if (profileNik) profileNik.value = originalProfileData.nik;
            if (profileRole) profileRole.value = originalProfileData.role;
            
            if (userData.avatarUrl) {
                updateProfileFormAvatar(userData.avatarUrl);
            }
            
            setupEmailChangeButtons();
            checkProfileFormChanges();
            
            document.getElementById('profile-loading').classList.add('hidden');
            document.getElementById('profile-header').classList.remove('hidden');
            
            const profileFormCard = document.querySelector('#edit-profile-view .bg-white');
            if (profileFormCard) {
                profileFormCard.classList.remove('hidden');
            }
            
            if (typeof showMessage === 'function') {
                showMessage("settings-message", "Data profil berhasil dimuat", "success");
            }
        } else {
            document.getElementById('profile-loading').classList.add('hidden');
            document.getElementById('profile-header').classList.remove('hidden');
            
            const profileFormCard = document.querySelector('#edit-profile-view .bg-white');
            if (profileFormCard) {
                profileFormCard.classList.remove('hidden');
            }
            
            if (typeof showMessage === 'function') {
                showMessage("settings-message", "Gagal memuat data profil", "error");
            }
        }
    } catch (error) {
        document.getElementById('profile-loading').classList.add('hidden');
        document.getElementById('profile-header').classList.remove('hidden');
        
        const profileFormCard = document.querySelector('#edit-profile-view .bg-white');
        if (profileFormCard) {
            profileFormCard.classList.remove('hidden');
        }
        
        if (typeof showMessage === 'function') {
            showMessage("settings-message", "Terjadi kesalahan saat memuat data", "error");
        }
    }
}

// Update avatar in profile form
function updateProfileFormAvatar(avatarUrl) {
    const profileAvatar = document.getElementById("profileAvatar");
    const profileFallback = document.getElementById("profileAvatarFallback");
    
    if (avatarUrl && profileAvatar && profileFallback) {
        const processedUrl = `${W}/avatar?url=${encodeURIComponent(avatarUrl)}`;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = function() {
            profileAvatar.src = processedUrl;
            profileAvatar.style.display = "block";
            profileFallback.style.display = "none";
        };
        
        img.onerror = function() {
            profileAvatar.style.display = "none";
            profileFallback.style.display = "flex";
        };
        
        img.src = processedUrl;
    }
}

// Check if profile form has changes
function checkProfileFormChanges() {
    const profileName = document.getElementById("profile-name");
    const saveBtn = document.getElementById("save-profile-btn");
    
    if (!profileName || !saveBtn) return;
    
    const hasNameChanged = profileName.value.trim() !== originalProfileData.name;
    const hasChanges = hasNameChanged || hasAvatarChanged;
    
    if (hasChanges) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        saveBtn.classList.add('hover:bg-blue-700');
    } else {
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        saveBtn.classList.remove('hover:bg-blue-700');
    }
}

// Setup password form change listeners
function setupPasswordFormListeners() {
    const oldPassword = document.getElementById("old-password");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    
    if (oldPassword) {
        oldPassword.removeEventListener('input', checkPasswordFormChanges);
        oldPassword.addEventListener('input', checkPasswordFormChanges);
    }
    if (newPassword) {
        newPassword.removeEventListener('input', checkPasswordFormChanges);
        newPassword.addEventListener('input', checkPasswordFormChanges);
    }
    if (confirmPassword) {
        confirmPassword.removeEventListener('input', checkPasswordFormChanges);
        confirmPassword.addEventListener('input', checkPasswordFormChanges);
    }
    
    checkPasswordFormChanges();
}

// Check if password form has changes
function checkPasswordFormChanges() {
    const oldPassword = document.getElementById("old-password");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    const changeBtn = document.getElementById("change-password-btn");
    
    if (!oldPassword || !newPassword || !confirmPassword || !changeBtn) return;
    
    const hasOldPassword = oldPassword.value.trim() !== '';
    const hasNewPassword = newPassword.value.trim() !== '';
    const hasConfirmPassword = confirmPassword.value.trim() !== '';
    const hasChanges = hasOldPassword || hasNewPassword || hasConfirmPassword;
    
    if (hasChanges) {
        changeBtn.disabled = false;
        changeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        changeBtn.classList.add('hover:bg-green-700');
    } else {
        changeBtn.disabled = true;
        changeBtn.classList.add('opacity-50', 'cursor-not-allowed');
        changeBtn.classList.remove('hover:bg-green-700');
    }
}

// Setup email change functionality
function setupEmailChangeButtons() {
    const editEmailBtn = document.getElementById("edit-email-btn");
    const cancelEmailBtn = document.getElementById("cancel-email-edit-btn");
    const requestEmailBtn = document.getElementById("request-email-change-btn");
    const newEmailSection = document.getElementById("new-email-section");
    const passwordSection = document.getElementById("current-password-section");
    const newEmailInput = document.getElementById("new-email-input");
    const currentPasswordInput = document.getElementById("current-password-input");
    const emailChangeMsg = document.getElementById("email-change-msg");
    
    if (editEmailBtn) {
        editEmailBtn.addEventListener("click", () => {
            newEmailSection.classList.remove("hidden");
            passwordSection.classList.remove("hidden");
            emailChangeMsg.classList.remove("hidden");
            
            editEmailBtn.classList.add("hidden");
            cancelEmailBtn.classList.remove("hidden");
            requestEmailBtn.classList.remove("hidden");
            
            newEmailInput.focus();
            
            emailChangeMsg.textContent = "";
            emailChangeMsg.className = "text-sm text-center";
        });
    }
    
    if (cancelEmailBtn) {
        cancelEmailBtn.addEventListener("click", () => {
            newEmailSection.classList.add("hidden");
            passwordSection.classList.add("hidden");
            emailChangeMsg.classList.add("hidden");
            
            editEmailBtn.classList.remove("hidden");
            cancelEmailBtn.classList.add("hidden");
            requestEmailBtn.classList.add("hidden");
            
            newEmailInput.value = "";
            currentPasswordInput.value = "";
            emailChangeMsg.textContent = "";
        });
    }
    
    if (requestEmailBtn) {
        requestEmailBtn.addEventListener("click", async () => {
            const newEmail = newEmailInput.value.trim();
            const currentPassword = currentPasswordInput.value;
            const requestText = document.getElementById("request-email-text");
            const requestSpinner = document.getElementById("request-email-spinner");
            
            if (!newEmail || !currentPassword) {
                emailChangeMsg.className = "text-sm text-center text-red-600 dark:text-red-400";
                emailChangeMsg.textContent = "Email baru dan password saat ini wajib diisi.";
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                emailChangeMsg.className = "text-sm text-center text-red-600 dark:text-red-400";
                emailChangeMsg.textContent = "Format email tidak valid.";
                return;
            }
            
            requestEmailBtn.disabled = true;
            requestText.textContent = "Memproses...";
            requestSpinner.classList.remove("hidden");
            emailChangeMsg.className = "text-sm text-center text-blue-600 dark:text-blue-400";
            emailChangeMsg.textContent = "Memproses permintaan...";
            
            try {
                const result = await P({
                    action: "request-email-change",
                    newEmail: newEmail,
                    currentPassword: currentPassword
                });
                
                if (result.success) {
                    emailChangeMsg.className = "text-sm text-center text-green-600 dark:text-green-400";
                    newEmailInput.value = "";
                    currentPasswordInput.value = "";
                    
                    setTimeout(() => {
                        newEmailSection.classList.add("hidden");
                        passwordSection.classList.add("hidden");
                        emailChangeMsg.classList.add("hidden");
                        editEmailBtn.classList.remove("hidden");
                        cancelEmailBtn.classList.add("hidden");
                        requestEmailBtn.classList.add("hidden");
                    }, 3000);
                } else {
                    emailChangeMsg.className = "text-sm text-center text-red-600 dark:text-red-400";
                }
                emailChangeMsg.textContent = result.message;
            } catch (error) {
                emailChangeMsg.className = "text-sm text-center text-red-600 dark:text-red-400";
                emailChangeMsg.textContent = "Terjadi kesalahan saat memproses permintaan.";
            } finally {
                requestEmailBtn.disabled = false;
                requestText.textContent = "Kirim Verifikasi";
                requestSpinner.classList.add("hidden");
            }
        });
    }
}

// Initialize email verification
function initEmailVerification() {
    // Close email verification overlay
    document.getElementById("close-email-verification").addEventListener("click", () => {
        const modal = document.getElementById("email-verification-overlay");
        modal.classList.add("hidden");
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        clearInterval(emailTimer);
        emailVerificationSent = false;
        document.querySelectorAll('.email-otp-input').forEach(input => input.value = '');
        
        const sendBtn = document.getElementById("send-email-verification");
        const verifyBtn = document.getElementById("verify-email-btn");
        const resendBtn = document.getElementById("resend-email-verification");
        
        sendBtn.classList.remove("hidden");
        verifyBtn.disabled = true;
        verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
        resendBtn.classList.add("hidden");
    });

    // Email OTP input handling
    const emailOtpInputs = document.querySelectorAll('.email-otp-input');
    emailOtpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 1 && index < emailOtpInputs.length - 1) {
                emailOtpInputs[index + 1].focus();
            }
            
            const allFilled = Array.from(emailOtpInputs).every(inp => inp.value.length === 1);
            const verifyBtn = document.getElementById("verify-email-btn");
            
            if (allFilled && emailVerificationSent) {
                verifyBtn.disabled = false;
                verifyBtn.classList.remove("opacity-50", "cursor-not-allowed");
                verifyBtn.classList.add("hover:bg-green-700");
            } else {
                verifyBtn.disabled = true;
                verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
                verifyBtn.classList.remove("hover:bg-green-700");
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                emailOtpInputs[index - 1].focus();
            }
        });
    });

    // Send email verification
    document.getElementById("send-email-verification").addEventListener("click", async () => {
        const sendBtn = document.getElementById("send-email-verification");
        const sendText = document.getElementById("send-email-text");
        const sendSpinner = document.getElementById("send-email-spinner");
        const sendIcon = document.getElementById("send-email-icon");
        const newEmail = window.pendingProfileChanges?.newEmail;
        
        if (!newEmail) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Email tidak valid", "error");
            }
            return;
        }
        
        sendBtn.disabled = true;
        sendText.textContent = "Mengirim...";
        sendSpinner.classList.remove("hidden");
        if (sendIcon) {
            sendIcon.style.display = "none";
            sendIcon.classList.add("hidden");
        }
        if (typeof showMessage === 'function') {
            showMessage("email-verification-message", "Mengirim kode verifikasi...", "info");
        }
        
        try {
            const userNik = localStorage.getItem("userNik") || originalProfileData.nik || "";
            const response = await P({
                action: "send-email-verification",
                newEmail: newEmail,
                nik: userNik
            });
            
            if (response.success) {
                emailVerificationSent = true;
                sendBtn.classList.add("hidden");
                document.getElementById("resend-email-verification").classList.remove("hidden");
                
                startEmailTimer(300);
                
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", "Kode verifikasi telah dikirim ke email baru", "success");
                }
                
                const firstInput = document.querySelector('.email-otp-input');
                if (firstInput) firstInput.focus();
            } else {
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", response.message || "Gagal mengirim kode verifikasi", "error");
                }
            }
        } catch (error) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Terjadi kesalahan saat mengirim kode", "error");
            }
        } finally {
            sendBtn.disabled = false;
            sendText.textContent = "Kirim Kode Verifikasi";
            sendSpinner.classList.add("hidden");
            if (sendIcon) {
                sendIcon.style.display = "";
                sendIcon.classList.remove("hidden");
            }
        }
    });

    // Resend email verification
    document.getElementById("resend-email-verification").addEventListener("click", async () => {
        const resendBtn = document.getElementById("resend-email-verification");
        const newEmail = window.pendingProfileChanges?.newEmail;
        
        if (!newEmail) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Email tidak valid", "error");
            }
            return;
        }
        
        resendBtn.disabled = true;
        resendBtn.textContent = "Mengirim...";
        
        try {
            const userNik = localStorage.getItem("userNik") || originalProfileData.nik || "";
            const response = await P({
                action: "send-email-verification",
                newEmail: newEmail,
                nik: userNik
            });
            
            if (response.success) {
                startEmailTimer(300);
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", "Kode verifikasi berhasil dikirim ulang", "success");
                }
            } else {
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", response.message || "Gagal mengirim ulang kode", "error");
                }
            }
        } catch (error) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Terjadi kesalahan saat mengirim ulang", "error");
            }
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = "Kirim Ulang";
        }
    });

    // Email verification form submission
    document.getElementById("email-verification-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailOtpInputs = document.querySelectorAll('.email-otp-input');
        const emailOtpCode = Array.from(emailOtpInputs).map(input => input.value).join('');
        const verifyBtn = document.getElementById("verify-email-btn");
        const verifyText = document.getElementById("verify-email-text");
        const verifySpinner = document.getElementById("verify-email-spinner");
        
        if (!emailOtpCode || emailOtpCode.length !== 6) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Kode verifikasi harus 6 digit", "error");
            }
            return;
        }
        
        if (!window.pendingProfileChanges) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Data perubahan tidak ditemukan", "error");
            }
            return;
        }
        
        verifyBtn.disabled = true;
        verifyText.textContent = "Memverifikasi...";
        verifySpinner.classList.remove("hidden");
        if (typeof showMessage === 'function') {
            showMessage("email-verification-message", "Memverifikasi kode dan menyimpan perubahan...", "info");
        }
        
        try {
            let avatarUploadSuccess = true;
            let newAvatarUrl = null;
            
            if (window.pendingProfileChanges.avatarFile) {
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", "Mengupload foto profil...", "info");
                }
                
                const reader = new FileReader();
                const avatarBase64 = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(window.pendingProfileChanges.avatarFile);
                });
                
                const avatarResponse = await P({
                    action: "upload-avatar",
                    avatarBase64: avatarBase64
                });
                
                if (avatarResponse.success) {
                    newAvatarUrl = avatarResponse.data.avatarUrl;
                } else {
                    avatarUploadSuccess = false;
                    if (typeof showMessage === 'function') {
                        showMessage("email-verification-message", "Gagal mengupload foto: " + (avatarResponse.message || "Unknown error"), "error");
                    }
                }
            }
            
            if (avatarUploadSuccess) {
                if (typeof showMessage === 'function') {
                    showMessage("email-verification-message", "Memverifikasi email dan menyimpan profil...", "info");
                }
                
                const response = await P({
                    action: "verify-email-and-update-profile",
                    username: window.pendingProfileChanges.newName,
                    newEmail: window.pendingProfileChanges.newEmail,
                    verificationCode: emailOtpCode
                });
                
                if (response.success) {
                    const modal = document.getElementById("email-verification-overlay");
                    modal.classList.add("hidden");
                    modal.style.display = "none";
                    modal.style.visibility = "hidden";
                    modal.style.opacity = "0";
                    clearInterval(emailTimer);
                    
                    const userName = document.getElementById("user-name");
                    const welcomeTitle = document.getElementById("welcome-title");
                    const profileEmail = document.getElementById("profile-email");
                    const profileName = document.getElementById("profile-name");
                    
                    if (userName) userName.textContent = window.pendingProfileChanges.newName;
                    if (welcomeTitle) welcomeTitle.textContent = `Selamat datang, ${window.pendingProfileChanges.newName}!`;
                    if (profileEmail) profileEmail.value = window.pendingProfileChanges.newEmail;
                    if (profileName) profileName.value = window.pendingProfileChanges.newName;
                    
                    localStorage.setItem("userName", window.pendingProfileChanges.newName);
                    
                    if (newAvatarUrl && typeof updateUserAvatar === 'function') {
                        updateUserAvatar(newAvatarUrl);
                        localStorage.setItem("avatarUrl", newAvatarUrl);
                    }
                    
                    originalProfileData.name = window.pendingProfileChanges.newName;
                    originalProfileData.email = window.pendingProfileChanges.newEmail;
                    hasAvatarChanged = false;
                    pendingAvatarFile = null;
                    
                    const avatarFileInput = document.getElementById("avatar-file");
                    if (avatarFileInput) avatarFileInput.value = '';
                    
                    window.pendingProfileChanges = null;
                    
                    checkProfileFormChanges();
                    
                    if (typeof showMessage === 'function') {
                        showMessage("settings-message", "Profil dan email berhasil diperbarui!", "success");
                    }
                } else {
                    if (typeof showMessage === 'function') {
                        showMessage("email-verification-message", response.message || "Kode verifikasi salah atau kedaluwarsa", "error");
                    }
                }
            }
        } catch (error) {
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Terjadi kesalahan saat verifikasi", "error");
            }
        } finally {
            verifyBtn.disabled = true;
            verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
            verifyText.textContent = "Verifikasi & Simpan";
            verifySpinner.classList.add("hidden");
        }
    });
}

// Email timer function
function startEmailTimer(seconds) {
    clearInterval(emailTimer);
    let timeLeft = seconds;
    const timerElement = document.getElementById("email-timer");
    
    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    emailTimer = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            clearInterval(emailTimer);
            timerElement.textContent = "00:00";
            emailVerificationSent = false;
            
            const sendBtn = document.getElementById("send-email-verification");
            const verifyBtn = document.getElementById("verify-email-btn");
            const resendBtn = document.getElementById("resend-email-verification");
            
            sendBtn.classList.remove("hidden");
            verifyBtn.disabled = true;
            verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
            resendBtn.classList.add("hidden");
            
            if (typeof showMessage === 'function') {
                showMessage("email-verification-message", "Kode verifikasi telah kedaluwarsa", "error");
            }
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Initialize avatar upload
function initAvatarUpload() {
    const uploadAvatarBtn = document.getElementById("upload-avatar-btn");
    const avatarFileInput = document.getElementById("avatar-file");
    
    if (uploadAvatarBtn && avatarFileInput) {
        uploadAvatarBtn.addEventListener("click", () => {
            avatarFileInput.click();
        });
        
        avatarFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Ukuran file maksimal 2MB", "error");
                }
                avatarFileInput.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "File harus berupa gambar", "error");
                }
                avatarFileInput.value = '';
                return;
            }
            
            pendingAvatarFile = file;
            
            const reader = new FileReader();
            reader.onload = () => {
                const profileAvatar = document.getElementById("profileAvatar");
                const profileFallback = document.getElementById("profileAvatarFallback");
                
                if (profileAvatar && profileFallback) {
                    profileAvatar.src = reader.result;
                    profileAvatar.style.display = "block";
                    profileFallback.style.display = "none";
                }
                
                hasAvatarChanged = true;
                checkProfileFormChanges();
                
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Foto dipilih. Klik 'Simpan Perubahan' untuk mengupload", "info");
                }
            };
            
            reader.onerror = () => {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Gagal membaca file", "error");
                }
                pendingAvatarFile = null;
                avatarFileInput.value = '';
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// Initialize profile form
function initProfileForm() {
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const profileName = document.getElementById("profile-name");
            const currentEmailDisplay = document.getElementById("current-email-display");
            const saveBtn = document.getElementById("save-profile-btn");
            const saveText = document.getElementById("save-profile-text");
            const saveSpinner = document.getElementById("save-profile-spinner");
            const saveIcon = document.getElementById("save-profile-icon");
            
            const newName = profileName.value.trim();
            const currentEmail = currentEmailDisplay.value.trim();
            
            if (!newName) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Nama tidak boleh kosong", "error");
                }
                return;
            }
            
            await updateProfileDirectly(newName, currentEmail, saveBtn, saveText, saveSpinner, saveIcon);
        });
    }
}

// Function to update profile directly (when no email change)
async function updateProfileDirectly(newName, newEmail, saveBtn, saveText, saveSpinner, saveIcon) {
    saveBtn.disabled = true;
    saveText.textContent = "Menyimpan...";
    saveSpinner.classList.remove("hidden");
    saveIcon.classList.add("hidden");
    if (typeof showMessage === 'function') {
        showMessage("settings-message", "Menyimpan perubahan...", "info");
    }
    
    try {
        let avatarUploadSuccess = true;
        let newAvatarUrl = null;
        
        if (pendingAvatarFile) {
            if (typeof showMessage === 'function') {
                showMessage("settings-message", "Mengupload foto profil...", "info");
            }
            
            const reader = new FileReader();
            const avatarBase64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(pendingAvatarFile);
            });
            
            const avatarResponse = await P({
                action: "upload-avatar",
                avatarBase64: avatarBase64
            });
            
            if (avatarResponse.success) {
                newAvatarUrl = avatarResponse.data.avatarUrl;
            } else {
                avatarUploadSuccess = false;
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Gagal mengupload foto: " + (avatarResponse.message || "Unknown error"), "error");
                }
            }
        }
        
        if (avatarUploadSuccess) {
            if (typeof showMessage === 'function') {
                showMessage("settings-message", "Menyimpan informasi profil...", "info");
            }
            
            const response = await P({
                action: "edit-profile",
                username: newName,
                email: newEmail
            });
            
            if (response.success) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Profil berhasil diperbarui!", "success");
                }
                
                const userName = document.getElementById("user-name");
                const welcomeTitle = document.getElementById("welcome-title");
                
                if (userName) userName.textContent = newName;
                if (welcomeTitle) welcomeTitle.textContent = `Selamat datang, ${newName}!`;
                
                localStorage.setItem("userName", newName);
                
                if (newAvatarUrl && typeof updateUserAvatar === 'function') {
                    updateUserAvatar(newAvatarUrl);
                    localStorage.setItem("avatarUrl", newAvatarUrl);
                }
                
                originalProfileData.name = newName;
                originalProfileData.email = newEmail;
                hasAvatarChanged = false;
                pendingAvatarFile = null;
                
                const avatarFileInput = document.getElementById("avatar-file");
                if (avatarFileInput) avatarFileInput.value = '';
                
                checkProfileFormChanges();
            } else {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", response.message || "Gagal menyimpan perubahan", "error");
                }
            }
        }
    } catch (error) {
        if (typeof showMessage === 'function') {
            showMessage("settings-message", "Terjadi kesalahan saat menyimpan", "error");
        }
    } finally {
        saveBtn.disabled = false;
        saveText.textContent = "Simpan Perubahan";
        saveSpinner.classList.add("hidden");
        saveIcon.classList.remove("hidden");
    }
}

// Initialize password form
function initPasswordForm() {
    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const oldPassword = document.getElementById("old-password").value;
            const newPassword = document.getElementById("new-password").value;
            const confirmPassword = document.getElementById("confirm-password").value;
            const changeBtn = document.getElementById("change-password-btn");
            const changeText = document.getElementById("change-password-text");
            const changeSpinner = document.getElementById("change-password-spinner");
            const changeIcon = document.getElementById("change-password-icon");
            
            if (!oldPassword || !newPassword || !confirmPassword) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Semua kolom password wajib diisi", "error");
                }
                return;
            }
            
            if (newPassword.length < 8) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Password baru minimal 8 karakter", "error");
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Konfirmasi password tidak cocok", "error");
                }
                return;
            }
            
            changeBtn.disabled = true;
            changeText.textContent = "Mengubah...";
            changeSpinner.classList.remove("hidden");
            changeIcon.classList.add("hidden");
            if (typeof showMessage === 'function') {
                showMessage("settings-message", "Mengubah password...", "info");
            }
            
            try {
                const response = await P({
                    action: "change-password",
                    oldPassword: oldPassword,
                    newPassword: newPassword
                });
                
                if (response.success) {
                    if (typeof showMessage === 'function') {
                        showMessage("settings-message", "Password berhasil diubah! Silakan login ulang.", "success");
                    }
                    
                    passwordForm.reset();
                    
                    setTimeout(() => {
                        C();
                        if (typeof showLogin === 'function') {
                            showLogin();
                        }
                        if (typeof showMessage === 'function') {
                            showMessage("login-message", "Password telah diubah, silakan login kembali", "info");
                        }
                    }, 3000);
                } else {
                    if (typeof showMessage === 'function') {
                        showMessage("settings-message", response.message || "Gagal mengubah password", "error");
                    }
                }
            } catch (error) {
                if (typeof showMessage === 'function') {
                    showMessage("settings-message", "Terjadi kesalahan saat mengubah password", "error");
                }
            } finally {
                if (changeBtn && !changeBtn.disabled) return;
                
                changeBtn.disabled = false;
                changeText.textContent = "Ganti Password";
                changeSpinner.classList.add("hidden");
                changeIcon.classList.remove("hidden");
            }
        });
    }
}

// Initialize password toggles
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                targetInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}
