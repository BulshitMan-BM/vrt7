// =======================
// UTILITY FUNCTIONS
// =======================

// Show message function
function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    const icon = document.getElementById(containerId + '-icon');
    const text = document.getElementById(containerId + '-text');
    
    if (container && icon && text) {
        container.classList.remove('hidden');
        text.textContent = message;
        
        if (type === 'success') {
            container.className = 'mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
            icon.className = 'fas fa-check-circle mr-2';
        } else if (type === 'error') {
            container.className = 'mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
            icon.className = 'fas fa-exclamation-circle mr-2';
        } else if (type === 'info') {
            container.className = 'mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
            icon.className = 'fas fa-info-circle mr-2';
        }
        
        if (type !== 'info') {
            setTimeout(() => {
                container.classList.add('hidden');
            }, 5000);
        }
    }
}

// Update user avatar function
function updateUserAvatar(avatarUrl) {
    const avatarElement = document.getElementById("sidebarAvatar");
    const fallbackElement = document.getElementById("sidebarProfileFallback");
    
    if (avatarUrl && avatarElement && fallbackElement) {
        avatarElement.style.display = "none";
        fallbackElement.style.display = "flex";
        
        const processedUrl = `https://pemanis.bulshitman1.workers.dev/avatar?url=${encodeURIComponent(avatarUrl)}`;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = function() {
            avatarElement.src = processedUrl;
            avatarElement.style.display = "block";
            fallbackElement.style.display = "none";
        };
        
        img.onerror = function() {
            avatarElement.style.display = "none";
            fallbackElement.style.display = "flex";
        };
        
        img.src = processedUrl;
        
    } else {
        if (avatarElement) {
            avatarElement.style.display = "none";
        }
        if (fallbackElement) {
            fallbackElement.style.display = "flex";
        }
    }
}

// Reset user avatars function
function resetUserAvatars() {
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const sidebarFallback = document.getElementById("sidebarProfileFallback");
    
    if (sidebarAvatar) {
        sidebarAvatar.src = "";
        sidebarAvatar.style.display = "none";
    }
    if (sidebarFallback) {
        sidebarFallback.style.display = "flex";
        sidebarFallback.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    const profileAvatar = document.getElementById("profileAvatar");
    const profileFallback = document.getElementById("profileAvatarFallback");
    
    if (profileAvatar) {
        profileAvatar.src = "";
        profileAvatar.style.display = "none";
    }
    if (profileFallback) {
        profileFallback.style.display = "flex";
        profileFallback.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// Navigation helper functions
function showDashboard() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');
    document.getElementById('settings-content').classList.add('hidden');
    document.getElementById('profile-content').classList.add('hidden');
    document.body.className = 'h-full bg-gray-50 dark:bg-gray-900 font-sans';
}

function showLogin() {
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.body.className = 'h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800';
}

// Current page tracking
let currentPage = 'dashboard';

function setCurrentPage(page) {
    currentPage = page;
}

function backToDashboard() {
    currentPage = 'dashboard';
    document.getElementById('settings-content').classList.add('hidden');
    document.getElementById('profile-content').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');
}

// Render dashboard function
function renderDashboard(userData = null) {
    const avatarUrl = localStorage.getItem("avatarUrl");
    
    const userName = userData?.userData?.name || userData?.name || userData?.username || "Administrator";
    const userRole = userData?.userData?.role || userData?.role || "Admin";
    const userNik = userData?.userData?.nik || userData?.nik || document.getElementById("nik")?.value || "****-****-****-****";
    const userAvatarUrl = userData?.avatarUrl || avatarUrl;
    
    localStorage.setItem("userName", userName);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("userNik", userNik);
    
    document.getElementById("welcome-title").innerText = `Selamat datang, ${userName}!`;
    document.getElementById("user-name").innerText = userName;
    document.getElementById("user-role").innerText = userRole;
    
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
        welcomeMsg.innerText = `Kelola dashboard Anda dengan mudah dan efisien.`;
    }
    
    if (userAvatarUrl) {
        updateUserAvatar(userAvatarUrl);
    }
}

// Dark mode functionality
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateAllThemeIcons(isDark);
}

function updateAllThemeIcons(isDark) {
    const loginThemeIcon = document.getElementById('themeIcon');
    const dashboardThemeIcon = document.getElementById('dashboardThemeIcon');
    
    if (isDark) {
        if (loginThemeIcon) loginThemeIcon.className = 'fas fa-sun';
        if (dashboardThemeIcon) dashboardThemeIcon.className = 'fas fa-sun';
    } else {
        if (loginThemeIcon) loginThemeIcon.className = 'fas fa-moon';
        if (dashboardThemeIcon) dashboardThemeIcon.className = 'fas fa-moon';
    }
}

function initializeDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    updateAllThemeIcons(isDark);
}
