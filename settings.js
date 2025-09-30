// ===============================================
// BAGIAN 3: MANAJEMEN PENGATURAN & PROFIL
// ===============================================

// Variabel untuk melacak data dan perubahan
let originalProfileData = {};
let hasAvatarChanged = false;
let pendingAvatarFile = null;
let emailTimer;
let emailVerificationSent = false;

// Memuat data untuk halaman profil publik
async function loadProfilePageData() {
    try {
        const response = await P({ action: "get-profile" });
        const profileCard = document.querySelector('#profile-content .max-w-4xl');

        if (response.success) {
            const userData = response.data;
            document.getElementById("profile-page-name").textContent = userData.name || userData.username || "User";
            document.getElementById("profile-page-role").textContent = userData.role || "User";
            document.getElementById("profile-display-name").textContent = userData.name || userData.username || "User";
            document.getElementById("profile-display-email").innerHTML = `<i class="fas fa-envelope mr-2 text-gray-500"></i>${userData.email || "Tidak tersedia"}`;
            document.getElementById("profile-display-nik").innerHTML = `<i class="fas fa-id-card mr-2 text-gray-500"></i>${userData.nik || "Tidak tersedia"}`;
            document.getElementById("profile-display-role-badge").innerHTML = `<i class="fas fa-shield-alt mr-2"></i>${userData.role || "User"}`;
            const joinDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID') : "Tidak tersedia";
            document.getElementById("profile-join-date").textContent = joinDate;
            const lastLogin = userData.lastLogin ? new Date(userData.lastLogin).toLocaleString('id-ID') : "Sekarang";
            document.getElementById("profile-last-login").innerHTML = `<i class="fas fa-clock mr-2 text-gray-500"></i>${lastLogin}`;
            if (userData.avatarUrl) {
                updateProfilePageAvatar(userData.avatarUrl);
            }
            showMessage("profile-page-message", "Profil berhasil dimuat", "success");
        } else {
            showMessage("profile-page-message", "Gagal memuat data profil", "error");
        }
        document.getElementById('profile-page-loading').classList.add('hidden');
        document.getElementById('profile-page-header').classList.remove('hidden');
        if (profileCard) profileCard.classList.remove('hidden');

    } catch (error) {
        document.getElementById('profile-page-loading').classList.add('hidden');
        document.getElementById('profile-page-header').classList.remove('hidden');
        const profileCard = document.querySelector('#profile-content .max-w-4xl');
        if (profileCard) profileCard.classList.remove('hidden');
        showMessage("profile-page-message", "Terjadi kesalahan saat memuat data", "error");
    }
}

// Memperbarui avatar di halaman profil publik
function updateProfilePageAvatar(avatarUrl) {
    const profilePageAvatar = document.getElementById("profile-page-avatar");
    const profilePageFallback = document.getElementById("profile-page-avatar-fallback");
    if (avatarUrl && profilePageAvatar && profilePageFallback) {
        const processedUrl = `${W}/avatar?url=${encodeURIComponent(avatarUrl)}`;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            profilePageAvatar.src = processedUrl;
            profilePageAvatar.style.display = "block";
            profilePageFallback.style.display = "none";
        };
        img.onerror = function() {
            profilePageAvatar.style.display = "none";
            profilePageFallback.style.display = "flex";
        };
        img.src = processedUrl;
    }
}

// Mengunduh data profil sebagai file teks
function downloadProfileData() {
    const downloadBtn = document.getElementById("download-profile-btn");
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengunduh...';

    const profileData = {
        nama: document.getElementById("profile-display-name")?.textContent || "N/A",
        email: document.getElementById("profile-display-email")?.textContent?.replace(/.*\s/, "") || "N/A",
        nik: document.getElementById("profile-display-nik")?.textContent?.replace(/.*\s/, "") || "N/A",
        role: document.getElementById("profile-display-role-badge")?.textContent?.trim() || "N/A",
        tanggalBergabung: document.getElementById("profile-join-date")?.textContent || "N/A",
        terakhirLogin: document.getElementById("profile-last-login")?.textContent?.replace(/.*\s/, "") || "N/A"
    };

    const content = `DATA PROFIL PENGGUNA\n===================\nNama Lengkap: ${profileData.nama}\nEmail: ${profileData.email}\nNIK: ${profileData.nik}\nRole: ${profileData.role}\nTanggal Bergabung: ${profileData.tanggalBergabung}\nTerakhir Login: ${profileData.terakhirLogin}\n\nDiunduh pada: ${new Date().toLocaleString('id-ID')}`;

    setTimeout(() => {
        const blob = new Blob([content], {
            type: 'text/plain'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profil_${profileData.nama.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
        showMessage("profile-page-message", "Data profil berhasil diunduh", "success");
    }, 1500);
}

// Memuat data pengguna untuk form edit profil
async function loadUserProfileData() {
    try {
        const response = await P({
            action: "get-profile"
        });
        const profileFormCard = document.querySelector('#edit-profile-view .bg-white');

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
            if (profileName) {
                profileName.value = originalProfileData.name;
                profileName.addEventListener('input', checkProfileFormChanges);
            }
            document.getElementById("current-email-display").value = originalProfileData.email;
            document.getElementById("profile-nik").value = originalProfileData.nik;
            document.getElementById("profile-role").value = originalProfileData.role;

            if (userData.avatarUrl) {
                updateProfileFormAvatar(userData.avatarUrl);
            }
            setupEmailChangeButtons();
            checkProfileFormChanges();
            showMessage("settings-message", "Data profil berhasil dimuat", "success");
        } else {
            showMessage("settings-message", "Gagal memuat data profil", "error");
        }
        document.getElementById('profile-loading').classList.add('hidden');
        document.getElementById('profile-header').classList.remove('hidden');
        if (profileFormCard) profileFormCard.classList.remove('hidden');

    } catch (error) {
        document.getElementById('profile-loading').classList.add('hidden');
        document.getElementById('profile-header').classList.remove('hidden');
        const profileFormCard = document.querySelector('#edit-profile-view .bg-white');
        if (profileFormCard) profileFormCard.classList.remove('hidden');
        showMessage("settings-message", "Terjadi kesalahan saat memuat data", "error");
    }
}

// Memperbarui avatar di form edit profil
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

// Memeriksa perubahan pada form profil untuk mengaktifkan/menonaktifkan tombol simpan
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

// Memeriksa perubahan pada form ganti kata sandi
function checkPasswordFormChanges() {
    const oldPassword = document.getElementById("old-password");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    const changeBtn = document.getElementById("change-password-btn");
    if (!oldPassword || !newPassword || !confirmPassword || !changeBtn) return;
    const hasChanges = oldPassword.value.trim() !== '' || newPassword.value.trim() !== '' || confirmPassword.value.trim() !== '';
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

// Mengatur listener untuk form ganti password
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


// Menyiapkan tombol-tombol untuk fungsionalitas ganti email
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

// Fungsi untuk memperbarui profil secara langsung (jika tidak ada perubahan email)
async function updateProfileDirectly(newName, newEmail, saveBtn, saveText, saveSpinner, saveIcon) {
    saveBtn.disabled = true;
    saveText.textContent = "Menyimpan...";
    saveSpinner.classList.remove("hidden");
    saveIcon.classList.add("hidden");
    showMessage("settings-message", "Menyimpan perubahan...", "info");

    try {
        let avatarUploadSuccess = true;
        let newAvatarUrl = null;

        if (pendingAvatarFile) {
            showMessage("settings-message", "Mengupload foto profil...", "info");
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
                showMessage("settings-message", "Gagal mengupload foto: " + (avatarResponse.message || "Unknown error"), "error");
            }
        }

        if (avatarUploadSuccess) {
            showMessage("settings-message", "Menyimpan informasi profil...", "info");
            const response = await P({
                action: "edit-profile",
                username: newName,
                email: newEmail
            });
            if (response.success) {
                showMessage("settings-message", "Profil berhasil diperbarui!", "success");
                document.getElementById("user-name").textContent = newName;
                document.getElementById("welcome-title").textContent = `Selamat datang, ${newName}!`;
                localStorage.setItem("userName", newName);
                if (newAvatarUrl) {
                    updateUserAvatar(newAvatarUrl);
                    localStorage.setItem("avatarUrl", newAvatarUrl);
                }
                originalProfileData.name = newName;
                originalProfileData.email = newEmail;
                hasAvatarChanged = false;
                pendingAvatarFile = null;
                document.getElementById("avatar-file").value = '';
                checkProfileFormChanges();
            } else {
                showMessage("settings-message", response.message || "Gagal menyimpan perubahan", "error");
            }
        }
    } catch (error) {
        showMessage("settings-message", "Terjadi kesalahan saat menyimpan", "error");
    } finally {
        saveBtn.disabled = false;
        saveText.textContent = "Simpan Perubahan";
        saveSpinner.classList.add("hidden");
        saveIcon.classList.remove("hidden");
    }
}


// Mulai timer untuk verifikasi email
function startEmailTimer(seconds) {
    clearInterval(emailTimer);
    let timeLeft = seconds;
    const timerElement = document.getElementById("email-timer");

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay();

    emailTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(emailTimer);
            emailVerificationSent = false;
            document.getElementById("send-email-verification").classList.remove("hidden");
            const verifyBtn = document.getElementById("verify-email-btn");
            verifyBtn.disabled = true;
            verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
            document.getElementById("resend-email-verification").classList.add("hidden");
            showMessage("email-verification-message", "Kode verifikasi telah kedaluwarsa", "error");
        }
    }, 1000);
}
