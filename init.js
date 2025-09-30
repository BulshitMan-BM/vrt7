// ===========================================
// BAGIAN 4: INISIALISASI & MANAJEMEN SESI
// ===========================================

// Inisialisasi semua fungsionalitas saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi mode gelap
    initializeDarkMode();

    // Inisialisasi fungsionalitas otentikasi
    handleRealLogin();
    handleRealOTP();
    handleRealLogout();

    // Penanganan input OTP login
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            if (Array.from(otpInputs).every(inp => inp.value.length === 1)) {
                document.getElementById("otp-form").dispatchEvent(new Event('submit'));
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Menutup overlay OTP
    document.getElementById("close-otp").addEventListener("click", () => {
        document.getElementById("otp-overlay").classList.add("hidden");
        clearInterval(otpTimer);
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
    });
    
    // Penanganan input OTP verifikasi email
    const emailOtpInputs = document.querySelectorAll('.email-otp-input');
    emailOtpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < emailOtpInputs.length - 1) {
                emailOtpInputs[index + 1].focus();
            }
            const allFilled = Array.from(emailOtpInputs).every(inp => inp.value.length === 1);
            const verifyBtn = document.getElementById("verify-email-btn");
            if (allFilled && emailVerificationSent) {
                verifyBtn.disabled = false;
                verifyBtn.classList.remove("opacity-50", "cursor-not-allowed", "hover:bg-green-700");
            } else {
                verifyBtn.disabled = true;
                verifyBtn.classList.add("opacity-50", "cursor-not-allowed");
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                emailOtpInputs[index - 1].focus();
            }
        });
    });

    // Event listener untuk tombol-tombol di dashboard dan settings
    const sidebarToggle = document.getElementById('sidebarToggle');
    const headerToggle = document.getElementById('headerToggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (headerToggle) headerToggle.addEventListener('click', toggleSidebar);

    const mobileBackdrop = document.getElementById('mobileBackdrop');
    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', () => {
            if (window.innerWidth < 768 && !isCollapsed) {
                toggleSidebar();
            }
        });
    }

    document.querySelectorAll('.menu-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const arrowId = targetId.replace('-submenu', '-arrow');
            if (isCollapsed) {
                toggleSidebar();
                setTimeout(() => toggleSubmenu(targetId, arrowId), 300);
            } else {
                toggleSubmenu(targetId, arrowId);
            }
        });
    });
    
    // Event listener untuk dropdown profil
    const profileBtn = document.getElementById("profile-btn");
    const profileDropdown = document.getElementById("profile-dropdown");
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });
        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // Event listener navigasi halaman
    document.getElementById("profile-page-btn")?.addEventListener("click", showProfilePage);
    document.getElementById("back-to-dashboard-from-profile")?.addEventListener("click", backToDashboard);
    document.getElementById("edit-profile-from-page")?.addEventListener("click", () => { currentPage = 'settings'; showEditProfile('profile'); });
    document.getElementById("edit-profile-btn-page")?.addEventListener("click", () => { currentPage = 'settings'; showEditProfile('profile'); });
    document.getElementById("change-password-btn-page")?.addEventListener("click", () => { currentPage = 'settings'; showChangePassword('profile'); });
    document.getElementById("download-profile-btn")?.addEventListener("click", downloadProfileData);
    document.getElementById("settings-menu")?.addEventListener("click", showSettingsMenu);
    document.getElementById("profile-settings-btn")?.addEventListener("click", showSettingsMenu);
    document.getElementById("show-edit-profile")?.addEventListener("click", () => showEditProfile('settings'));
    document.getElementById("show-change-password")?.addEventListener("click", () => showChangePassword('settings'));
    document.getElementById("back-to-dashboard")?.addEventListener("click", backToDashboard);
    document.getElementById("back-to-settings-menu")?.addEventListener("click", backToSettingsMenu);
    document.getElementById("back-to-settings-menu-2")?.addEventListener("click", () => {
        if (window.changePasswordSource === 'profile') {
            currentPage = 'profile';
            document.getElementById('settings-content').classList.add('hidden');
            document.getElementById('profile-content').classList.remove('hidden');
            window.changePasswordSource = null;
        } else {
            backToSettingsMenu();
        }
    });

    // Event listener form-form
    document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
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
            showMessage("settings-message", "Nama tidak boleh kosong", "error");
            return;
        }
        await updateProfileDirectly(newName, currentEmail, saveBtn, saveText, saveSpinner, saveIcon);
    });

    document.getElementById("password-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById("old-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const changeBtn = document.getElementById("change-password-btn");
        const changeText = document.getElementById("change-password-text");
        const changeSpinner = document.getElementById("change-password-spinner");
        const changeIcon = document.getElementById("change-password-icon");

        if (!oldPassword || !newPassword || !confirmPassword) {
            showMessage("settings-message", "Semua kolom password wajib diisi", "error");
            return;
        }
        if (newPassword.length < 8) {
            showMessage("settings-message", "Password baru minimal 8 karakter", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage("settings-message", "Konfirmasi password tidak cocok", "error");
            return;
        }

        changeBtn.disabled = true;
        changeText.textContent = "Mengubah...";
        changeSpinner.classList.remove("hidden");
        changeIcon.classList.add("hidden");
        showMessage("settings-message", "Mengubah password...", "info");

        try {
            const response = await P({
                action: "change-password",
                oldPassword: oldPassword,
                newPassword: newPassword
            });
            if (response.success) {
                showMessage("settings-message", "Password berhasil diubah! Silakan login ulang.", "success");
                document.getElementById("password-form").reset();
                setTimeout(() => {
                    C();
                    showLogin();
                    showMessage("login-message", "Password telah diubah, silakan login kembali", "info");
                }, 3000);
            } else {
                showMessage("settings-message", response.message || "Gagal mengubah password", "error");
                changeBtn.disabled = false;
                changeText.textContent = "Ganti Password";
                changeSpinner.classList.add("hidden");
                changeIcon.classList.remove("hidden");
            }
        } catch (error) {
            showMessage("settings-message", "Terjadi kesalahan saat mengubah password", "error");
            changeBtn.disabled = false;
            changeText.textContent = "Ganti Password";
            changeSpinner.classList.add("hidden");
            changeIcon.classList.remove("hidden");
        }
    });
    
    // Event listener untuk unggah avatar
    const uploadAvatarBtn = document.getElementById("upload-avatar-btn");
    const avatarFileInput = document.getElementById("avatar-file");
    if (uploadAvatarBtn && avatarFileInput) {
        uploadAvatarBtn.addEventListener("click", () => avatarFileInput.click());
        avatarFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                showMessage("settings-message", "Ukuran file maksimal 2MB", "error");
                avatarFileInput.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                showMessage("settings-message", "File harus berupa gambar", "error");
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
                showMessage("settings-message", "Foto dipilih. Klik 'Simpan Perubahan' untuk mengupload", "info");
            };
            reader.readAsDataURL(file);
        });
    }

    // Event listener untuk tombol toggle password
    document.getElementById("toggle-password")?.addEventListener("click", () => {
        const passwordInput = document.getElementById("password");
        const passwordIcon = document.getElementById("password-icon");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordIcon.className = "fas fa-eye-slash";
        } else {
            passwordInput.type = "password";
            passwordIcon.className = "fas fa-eye";
        }
    });

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

    // Event listener untuk toggle mode gelap
    document.getElementById("darkModeToggle")?.addEventListener("click", toggleDarkMode);
    document.getElementById("dashboardDarkModeToggle")?.addEventListener("click", toggleDarkMode);

    // Inisialisasi responsivitas dashboard
    handleResize();
    window.addEventListener('resize', handleResize);
});

// Pemeriksaan sesi instan saat halaman dimuat
(async function() {
    const accessToken = localStorage.getItem("accessToken");
    const tokenExpires = parseInt(localStorage.getItem("tokenExpires") || 0);
    const hasLocalTokens = accessToken && Date.now() < tokenExpires;

    if (hasLocalTokens) {
        showDashboard();
        renderDashboard({
            name: localStorage.getItem("userName") || "User",
            role: localStorage.getItem("userRole") || "User",
            nik: localStorage.getItem("userNik") || "****-****-****-****",
            avatarUrl: localStorage.getItem("avatarUrl")
        });

        setTimeout(async () => {
            try {
                const isSessionValid = await V();
                if (isSessionValid) {
                    const profile = await P({ action: "get-profile" });
                    if (profile.success) {
                        renderDashboard(profile.data);
                    } else {
                        C();
                        showLogin();
                        showMessage("login-message", "Sesi tidak valid, silakan login kembali", "info");
                    }
                } else {
                    C();
                    showLogin();
                    showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
                }
            } catch (error) {
                setTimeout(() => {
                    showMessage("settings-message", "Mode offline - beberapa fitur mungkin terbatas", "info");
                }, 2000);
            }
        }, 100);
    } else {
        showLogin();
    }
})();

// Validasi sesi periodik di latar belakang (setiap 5 menit)
setInterval(async () => {
    const isDashboardVisible = !document.getElementById('dashboard-page').classList.contains('hidden');
    if (isDashboardVisible) {
        try {
            if (!await V()) {
                C();
                showLogin();
                showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
            }
        } catch (error) {
            // Abaikan kesalahan jaringan, jangan logout
        }
    }
}, 5 * 60 * 1000);

// Validasi sesi saat pengguna kembali ke tab
document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) {
        const isDashboardVisible = !document.getElementById('dashboard-page').classList.contains('hidden');
        if (isDashboardVisible) {
            try {
                if (!await V()) {
                    C();
                    showLogin();
                    showMessage("login-message", "Sesi telah berakhir, silakan login kembali", "info");
                }
            } catch (error) {
                // Abaikan kesalahan jaringan
            }
        }
    }
});
