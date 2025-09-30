// =======================
// PROFILE PAGE LOGIC
// =======================

// Variabel global untuk menyimpan data profil agar tidak fetch berulang kali
let currentProfileData = null;

/**
 * Inisialisasi event listener untuk halaman profil.
 */
function initProfile() {
    const downloadProfileBtn = document.getElementById("download-profile-btn");
    if (downloadProfileBtn) {
        downloadProfileBtn.addEventListener("click", downloadProfileData);
    }
    
    // Tambahkan listener lain yang spesifik untuk halaman profil di sini
}

async function loadProfilePageData() {
    const profileCard = document.querySelector('#profile-content .max-w-4xl');
    
    // Tampilkan loading
    document.getElementById('profile-page-loading').classList.remove('hidden');
    document.getElementById('profile-page-header').classList.add('hidden');
    if (profileCard) profileCard.classList.add('hidden');

    try {
        const response = await P({ action: "get-profile" });
        if (response.success) {
            currentProfileData = response.data; // Simpan data
            
            // Perbarui elemen UI halaman profil
            document.getElementById("profile-page-name").textContent = currentProfileData.name || "User";
            document.getElementById("profile-page-role").textContent = currentProfileData.role || "User";
            document.getElementById("profile-display-name").textContent = currentProfileData.name || "User";
            document.getElementById("profile-display-email").innerHTML = `<i class="fas fa-envelope mr-2 text-gray-500"></i>${currentProfileData.email || "N/A"}`;
            document.getElementById("profile-display-nik").innerHTML = `<i class="fas fa-id-card mr-2 text-gray-500"></i>${currentProfileData.nik || "N/A"}`;
            document.getElementById("profile-display-role-badge").innerHTML = `<i class="fas fa-shield-alt mr-2"></i>${currentProfileData.role || "User"}`;
            
            const joinDate = currentProfileData.createdAt ? new Date(currentProfileData.createdAt).toLocaleDateString('id-ID') : "N/A";
            document.getElementById("profile-join-date").textContent = joinDate;

            const lastLogin = currentProfileData.lastLogin ? new Date(currentProfileData.lastLogin).toLocaleString('id-ID') : "Sekarang";
            document.getElementById("profile-last-login").innerHTML = `<i class="fas fa-clock mr-2 text-gray-500"></i>${lastLogin}`;
            
            updateProfilePageAvatar(currentProfileData.avatarUrl);
            showMessage("profile-page-message", "Profil berhasil dimuat", "success");
        } else {
            showMessage("profile-page-message", "Gagal memuat data profil", "error");
        }
    } catch (error) {
        showMessage("profile-page-message", "Terjadi kesalahan saat memuat data", "error");
    } finally {
        // Sembunyikan loading dan tampilkan konten
        document.getElementById('profile-page-loading').classList.add('hidden');
        document.getElementById('profile-page-header').classList.remove('hidden');
        if (profileCard) profileCard.classList.remove('hidden');
    }
}

function updateProfilePageAvatar(avatarUrl) {
    const avatar = document.getElementById("profile-page-avatar");
    const fallback = document.getElementById("profile-page-avatar-fallback");
    if (!avatar || !fallback) return;

    if (avatarUrl) {
        const processedUrl = `${W}/avatar?url=${encodeURIComponent(avatarUrl)}`;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            avatar.src = processedUrl;
            avatar.style.display = "block";
            fallback.style.display = "none";
        };
        img.onerror = () => {
            avatar.style.display = "none";
            fallback.style.display = "flex";
        };
        img.src = processedUrl;
    } else {
        avatar.style.display = "none";
        fallback.style.display = "flex";
    }
}

function downloadProfileData() {
    const downloadBtn = document.getElementById("download-profile-btn");
    const originalText = downloadBtn.innerHTML;

    // Status loading
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengunduh...';

    const content = `DATA PROFIL PENGGUNA
===================
Nama Lengkap: ${currentProfileData?.name || "N/A"}
Email: ${currentProfileData?.email || "N/A"}
NIK: ${currentProfileData?.nik || "N/A"}
Role: ${currentProfileData?.role || "N/A"}
Tanggal Bergabung: ${currentProfileData?.createdAt ? new Date(currentProfileData.createdAt).toLocaleDateString('id-ID') : "N/A"}
Terakhir Login: ${currentProfileData?.lastLogin ? new Date(currentProfileData.lastLogin).toLocaleString('id-ID') : "N/A"}

Diunduh pada: ${new Date().toLocaleString('id-ID')}`;

    setTimeout(() => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profil_${(currentProfileData?.name || "user").replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Kembalikan tombol
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
        showMessage("profile-page-message", "Data profil berhasil diunduh", "success");
    }, 1500);
}
