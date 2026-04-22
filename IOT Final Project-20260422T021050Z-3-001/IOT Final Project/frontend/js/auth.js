// Authentication Functions

function showLoginPage() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-title">Login</div>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="login-username">Username</label>
                        <input type="text" id="login-username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Login</button>
                </form>
            </div>
        </div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        appState.token = response.access_token;
        appState.user = response.user;
        
        localStorage.setItem('access_token', appState.token);
        localStorage.setItem('user', JSON.stringify(appState.user));
        
        showDashboard();
    } catch (error) {
        await swalAlert('error', 'Login Failed', error.message);
    }
}


