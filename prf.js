// =======================
// PROFILE MANAGEMENT
// =======================

// Profile page functionality
function initProfilePage() {
    const profilePageBtn = document.getElementById("profile-page-btn");
    const backToDashboardFromProfile = document.getElementById("back-to-dashboard-from-profile");
    const editProfileFromPage = document.getElementById("edit-profile-from-page");
    const editProfileBtnPage = document.getElementById("edit-profile-btn-page");
    const changePasswordBtnPage = document.getElementById("change-password-btn-page");
    const downloadProfileBtn = document.getElementById("download-profile-btn");
    
    if (profilePageBtn) {
        profilePageBtn.addEventListener("click", showProfilePage);
    }
    
    if (backToDashboardFromProfile) {
        backToDashboardFromProfile.addEventListener("click", () => {
            if (typeof backToDashboard === 'function') {
                backToDashboard();
            }
        });
    }
    
    if (editProfileFromPage) {
        editProfileFromPage.addEventListener("click", () => {
            if (typeof showEditProfile === 'function') {
                showEditProfile('profile');
            }
        });
    }
    
    if (editProfileBtnPage) {
        editProfileBtnPage.addEventListener("click", () => {
            if (typeof showEditProfile === 'function') {
                showEditProfile('profile');
            }
        });
    }
    
    if (changePasswordBtnPage) {
        changePasswordBtnPage.addEventListener("click", () => {
            if (typeof showChangePassword === 'function') {
                showChangePassword('profile');
            }
        });
    }
    
    if (downloadProfileBtn) {
        downloadProfileBtn.addEventListener("click", downloadProfileData);
    }
}

// Show profile page
function showProfilePage() {
    if (typeof currentPage !== 'undefined' && currentPage === 'profile') {
        return;
    }
    
    if (typeof setCurrentPage === 'function') {
        setCurrentPage('profile');
    }
    
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('settings-content').classList.add('hidden');
    document.getElementById('profile-content').classList.remove('hidden');
    
    document.getElementById('profile-page-loading').classList.remove('hidden');
    document.getElementById('profile-page-header').classList.add('hidden');
    
    const profileCard = document.querySelector('#profile-content .max-w-4xl');
    if (profileCard) {
        profileCard.classList.add('hidden');
    }
    
    const profileDropdown = document.getElementById("profile-dropdown");
    if (profileDropdown) {
        profileDropdown.classList.add('hidden');
    }
    
    setTimeout(() => {
        loadProfilePageData();
    }, 800);
}

// Load profile page data
async function loadProfilePageData() {
    try {
        const response = await P({ action: "get-profile" });
        
        if (response.success) {
            const userData = response.data;
            
            const profilePageName = document.getElementById("profile-page-name");
            const profilePageRole = document.getElementById("profile-page-role");
            const profileDisplayName = document.getElementById("profile-display-name");
            const profileDisplayEmail = document.getElementById("profile-display-email");
            const profileDisplayNik = document.getElementById("profile-display-nik");
            const profileDisplayRoleBadge = document.getElementById("profile-display-role-badge");
            const profileJoinDate = document.getElementById("profile-join-date");
            const profileLastLogin = document.getElementById("profile-last-login");
            
            if (profilePageName) profilePageName.textContent = userData.name || userData.username || "User";
            if (profilePageRole) profilePageRole.textContent = userData.role || "User";
            if (profileDisplayName) profileDisplayName.textContent = userData.name || userData.username || "User";
            if (profileDisplayEmail) {
                profileDisplayEmail.innerHTML = `<i class="fas fa-envelope mr-2 text-gray-500"></i>${userData.email || "Tidak tersedia"}`;
            }
            if (profileDisplayNik) {
                profileDisplayNik.innerHTML = `<i class="fas fa-id-card mr-2 text-gray-500"></i>${userData.nik || "Tidak tersedia"}`;
            }
            if (profileDisplayRoleBadge) {
                profileDisplayRoleBadge.innerHTML = `<i class="fas fa-shield-alt mr-2"></i>${userData.role || "User"}`;
            }
            if (profileJoinDate) {
                const joinDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID') : "Tidak tersedia";
                profileJoinDate.textContent = joinDate;
            }
            if (profileLastLogin) {
                const lastLogin = userData.lastLogin ? new Date(userData.lastLogin).toLocaleString('id-ID') : "Sekarang";
                profileLastLogin.innerHTML = `<i class="fas fa-clock mr-2 text-gray-500"></i>${lastLogin}`;
            }
            
            if (userData.avatarUrl) {
                updateProfilePageAvatar(userData.avatarUrl);
            }
            
            document.getElementById('profile-page-loading').classList.add('hidden');
            document.getElementById('profile-page-header').classList.remove('hidden');
            
            const profileCard = document.querySelector('#profile-content .max-w-4xl');
            if (profileCard) {
                profileCard.classList.remove('hidden');
            }
            
            if (typeof showMessage === 'function') {
                showMessage("profile-page-message", "Profil berhasil dimuat", "success");
            }
        } else {
            document.getElementById('profile-page-loading').classList.add('hidden');
            document.getElementById('profile-page-header').classList.remove('hidden');
            
            const profileCard = document.querySelector('#profile-content .max-w-4xl');
            if (profileCard) {
                profileCard.classList.remove('hidden');
            }
            
            if (typeof showMessage === 'function') {
                showMessage("profile-page-message", "Gagal memuat data profil", "error");
            }
        }
    } catch (error) {
        document.getElementById('profile-page-loading').classList.add('hidden');
        document.getElementById('profile-page-header').classList.remove('hidden');
        
        const profileCard = document.querySelector('#profile-content .max-w-4xl');
        if (profileCard) {
            profileCard.classList.remove('hidden');
        }
        
        if (typeof showMessage === 'function') {
            showMessage("profile-page-message", "Terjadi kesalahan saat memuat data", "error");
        }
    }
}

// Update avatar in profile page
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

// Download profile data function
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
    
    const content = `DATA PROFIL PENGGUNA
===================

Nama Lengkap: ${profileData.nama}
Email: ${profileData.email}
NIK: ${profileData.nik}
Role: ${profileData.role}
Tanggal Bergabung: ${profileData.tanggalBergabung}
Terakhir Login: ${profileData.terakhirLogin}

Diunduh pada: ${new Date().toLocaleString('id-ID')}
`;
    
    setTimeout(() => {
        const blob = new Blob([content], { type: 'text/plain' });
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
        
        if (typeof showMessage === 'function') {
            showMessage("profile-page-message", "Data profil berhasil diunduh", "success");
        }
    }, 1500);
}
