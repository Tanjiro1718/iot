// API Configuration
const API_BASE_URL = (() => {
    const override = localStorage.getItem('api_base_url');
    if (override) return override;

    const isHttp = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http');
    if (isHttp) return `${window.location.origin}/api`;

    return 'http://localhost:5000/api';
})();

// Global app state
let appState = {
    user: null,
    token: null,
    currentPage: 'login'
};

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        appState.token = savedToken;
        appState.user = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLoginPage();
    }
});

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (appState.token) {
        headers['Authorization'] = `Bearer ${appState.token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        const responseText = await response.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                if (!response.ok) {
                    throw new Error(`Request failed (${response.status}). Server returned non-JSON response from ${url}.`);
                }
                throw new Error(`Invalid JSON response from ${url}.`);
            }
        }

        if (!response.ok) {
            throw new Error((data && data.error) || `Request failed (${response.status})`);
        }

        return data || {};
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Global SweetAlert helpers
function hasSwal() {
    return typeof Swal !== 'undefined';
}

async function swalAlert(icon, title, text = '') {
    if (hasSwal()) {
        await Swal.fire({
            icon,
            title,
            text,
            confirmButtonColor: '#1fa65a'
        });
        return;
    }

    alert([title, text].filter(Boolean).join('\n'));
}

async function swalConfirm(title, text, confirmButtonText = 'Confirm') {
    if (hasSwal()) {
        const result = await Swal.fire({
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            confirmButtonText,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
        });
        return result.isConfirmed;
    }

    return confirm(text || title);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Navigation
function navigateTo(page) {
    appState.currentPage = page;
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    switch (page) {
        case 'dashboard':
            showDashboard();
            break;
        case 'cards':
            showCardsManagement();
            break;
        case 'register-card':
            showRegisterCard();
            break;
        case 'schedule':
            showScheduleManagement();
            break;
        case 'access-logs':
            showAccessLogs();
            break;
        case 'users':
            showUsersManagement();
            break;
        default:
            showDashboard();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const contentDiv = document.getElementById('content');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    contentDiv.insertBefore(alertDiv, contentDiv.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    appState.token = null;
    appState.user = null;
    showLoginPage();
}

// Update navigation sidebar
function updateNavbar() {
    const sidebar = document.getElementById('navbar');
    
    if (!appState.user) {
        sidebar.innerHTML = '';
        return;
    }
    
    let navLinks = `
        <div class="sidebar-brand">
            <div class="brand-logo-container">
                <div class="brand-logo">
                    <img src="/images/ISU1logo.png" alt="ISU Logo" class="logo-img">
                </div>
                <div class="brand-text">
                    <div class="brand-title">IoT Access<br>Control</div>
                    <div class="brand-project">OJT 1 • ${appState.user.role.toUpperCase()}</div>
                </div>
            </div>
        </div>
        <ul class="sidebar-nav">
            <li><a onclick="navigateTo('dashboard')" class="nav-link"><i class="fas fa-chart-line"></i>Dashboard</a></li>
            <li><a onclick="navigateTo('cards')" class="nav-link"><i class="fas fa-credit-card"></i>My Cards</a></li>
            <li><a onclick="navigateTo('schedule')" class="nav-link"><i class="fas fa-calendar"></i>Schedule</a></li>
    `;
    
    if (appState.user.role === 'admin') {
        navLinks += `
            <li><div class="sidebar-divider"></div></li>
            <li><a onclick="navigateTo('users')" class="nav-link"><i class="fas fa-users"></i>Manage Users</a></li>
            <li><a onclick="navigateTo('access-logs')" class="nav-link"><i class="fas fa-list"></i>Access Logs</a></li>
        `;
    }
    
    navLinks += `</ul>`;
    
    sidebar.innerHTML = navLinks + `
        <div class="sidebar-user-info">
            <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
    `;
    
    // Mark active nav link
    const currentPage = appState.currentPage;
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (currentPage === 'dashboard' && link.textContent.includes('Dashboard')) {
            link.classList.add('active');
        } else if (currentPage === 'cards' && link.textContent.includes('Cards')) {
            link.classList.add('active');
        } else if (currentPage === 'schedule' && link.textContent.includes('Schedule')) {
            link.classList.add('active');
        } else if (currentPage === 'users' && link.textContent.includes('Manage Users')) {
            link.classList.add('active');
        } else if (currentPage === 'access-logs' && link.textContent.includes('Access Logs')) {
            link.classList.add('active');
        }
    });
}
