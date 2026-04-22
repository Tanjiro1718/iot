// Dashboard and Main Functions

let usersCache = [];
let instructorsCache = [];
let roomsCache = [];

function countGrantedLogs(logs = []) {
    return logs.filter(log => log.access_result === 'granted').length;
}

function isCurrentClass(schedule) {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Convert JS Sunday-first to Monday-first
    const currentTime = now.toTimeString().slice(0, 5);

    return schedule.day_of_week === currentDay &&
        schedule.start_time <= currentTime &&
        currentTime <= schedule.end_time;
}

function renderInstructorDashboard(contentDiv, user, cards, schedules, logs) {
    const totalCards = cards.length;
    const registeredCards = cards.filter(card => card.is_registered).length;
    const activeSchedules = schedules.filter(schedule => schedule.is_active !== false).length;
    const classesToday = schedules.filter(schedule => {
        const today = (new Date().getDay() + 6) % 7;
        return schedule.day_of_week === today;
    }).length;
    const ongoingClasses = schedules.filter(isCurrentClass).length;
    const totalLogs = logs.length;
    const grantedAccess = countGrantedLogs(logs);
    const recentLogs = logs.slice(0, 5);

    contentDiv.innerHTML = `
        <div class="card">
            <div class="card-title"><i class="fas fa-chalkboard-teacher"></i> Instructor Dashboard</div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-user-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${user.username}</div>
                        <div class="stat-label">Instructor Account</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${classesToday}</div>
                        <div class="stat-label">Classes Today</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${ongoingClasses}</div>
                        <div class="stat-label">Ongoing Class Now</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-door-open"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${grantedAccess}</div>
                        <div class="stat-label">Granted Access</div>
                    </div>
                </div>
            </div>

            <hr style="margin: 2rem 0; border: none; border-top: 2px solid #ddd;">

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="stats-box">
                    <h4><i class="fas fa-list-check"></i> Teaching Summary</h4>
                    <div class="stat-row">
                        <span>Active Schedules:</span>
                        <strong>${activeSchedules}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Cards Registered:</span>
                        <strong>${registeredCards}/${totalCards}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Access Success Rate:</span>
                        <strong>${totalLogs > 0 ? ((grantedAccess / totalLogs) * 100).toFixed(1) : 0}%</strong>
                    </div>
                </div>

                <div class="stats-box">
                    <h4><i class="fas fa-id-badge"></i> Profile</h4>
                    <div class="stat-row">
                        <span>Full Name:</span>
                        <strong>${user.full_name}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Email:</span>
                        <strong>${user.email}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Status:</span>
                        <strong style="color: #ffffff;"><i class="fas fa-check-circle"></i> Active</strong>
                    </div>
                </div>
            </div>

            <h3 style="margin-bottom: 1rem;"><i class="fas fa-history"></i> Recent Access Activity</h3>
            ${recentLogs.length === 0 ? '<p>No access records available yet.</p>' : `
                <table class="table" style="margin-bottom: 2rem;">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Result</th>
                            <th>Reason</th>
                            <th>Door</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentLogs.map(log => `
                            <tr>
                                <td>${new Date(log.attempted_at).toLocaleString()}</td>
                                <td><span style="color: #ffffff; font-weight: bold;">${log.access_result.toUpperCase()}</span></td>
                                <td>${log.reason || '-'}</td>
                                <td>${log.door_location || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}

            <h3 style="margin-bottom: 1rem;"><i class="fas fa-star"></i> Quick Navigation</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                <button class="btn btn-primary" onclick="navigateTo('schedule')" style="text-align: left;"><i class="fas fa-calendar"></i> Manage Schedule</button>
                <button class="btn btn-primary" onclick="navigateTo('cards')" style="text-align: left;"><i class="fas fa-credit-card"></i> View My Cards</button>
            </div>
        </div>
    `;
}

async function showDashboard() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await apiRequest('/auth/profile', { method: 'GET' });
        const cardsResponse = await apiRequest('/cards/my-cards', { method: 'GET' });
        const user = response.user;

        if (user.role === 'instructor') {
            const [scheduleResponse, myLogsResponse] = await Promise.all([
                apiRequest('/schedule/my-schedule', { method: 'GET' }).catch(() => ({ schedules: [] })),
                apiRequest(`/access/logs?user_id=${user.id}&limit=50`, { method: 'GET' }).catch(() => ({ logs: [] }))
            ]);

            renderInstructorDashboard(
                contentDiv,
                user,
                cardsResponse.cards || [],
                scheduleResponse.schedules || [],
                myLogsResponse.logs || []
            );
            return;
        }

        const logsResponse = await apiRequest('/access/logs', { method: 'GET' }).catch(() => ({ logs: [] }));
        
        // Get statistics
        const totalCards = cardsResponse.cards?.length || 0;
        const registeredCards = cardsResponse.cards?.filter(c => c.is_registered).length || 0;
        const totalLogs = logsResponse.logs?.length || 0;
        const grantedAccess = countGrantedLogs(logsResponse.logs || []);
        
        let dashboardHTML = `
            <div class="card">
                <div class="card-title"><i class="fas fa-chart-pie"></i> Dashboard</div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-circle"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${response.user.username}</div>
                            <div class="stat-label">Account</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-tag"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${response.user.role.toUpperCase()}</div>
                            <div class="stat-label">Account Type</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-credit-card"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${registeredCards}/${totalCards}</div>
                            <div class="stat-label">Cards Registered</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-door-open"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${grantedAccess}</div>
                            <div class="stat-label">Successful Access</div>
                        </div>
                    </div>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 2px solid #ddd;">
                
                <h3 style="margin-bottom: 1.5rem;"><i class="fas fa-chart-bar"></i> Statistics</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    <div class="stats-box">
                        <h4><i class="fas fa-list-check"></i> Summary</h4>
                        <div class="stat-row">
                            <span>Total Cards:</span>
                            <strong>${totalCards}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Access Logs:</span>
                            <strong>${totalLogs}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Success Rate:</span>
                            <strong>${totalLogs > 0 ? ((grantedAccess/totalLogs)*100).toFixed(1) : 0}%</strong>
                        </div>
                    </div>
                    
                    <div class="stats-box">
                        <h4><i class="fas fa-info-circle"></i> Account Information</h4>
                        <div class="stat-row">
                            <span>Full Name:</span>
                            <strong>${response.user.full_name}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Email:</span>
                            <strong>${response.user.email}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Status:</span>
                            <strong style="color: #ffffff;"><i class="fas fa-check-circle"></i> Active</strong>
                        </div>
                    </div>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 2px solid #ddd;">
                
                <h3 style="margin-bottom: 1.5rem;"><i class="fas fa-chart-line"></i> Access Analytics</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div class="chart-container" style="position: relative; height: 300px;">
                        <canvas id="accessChart"></canvas>
                    </div>
                    <div class="chart-container" style="position: relative; height: 300px;">
                        <canvas id="cardChart"></canvas>
                    </div>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 2px solid #ddd;">
                
                <h3 style="margin-bottom: 1.5rem;"><i class="fas fa-star"></i> Quick Navigation</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                    <button class="btn btn-primary" onclick="navigateTo('cards')" style="text-align: left;"><i class="fas fa-credit-card"></i> View My Cards</button>
                    <button class="btn btn-primary" onclick="navigateTo('schedule')" style="text-align: left;"><i class="fas fa-calendar"></i> Manage Schedule</button>
                    ${response.user.role === 'admin' ? `
                        <button class="btn btn-warning" onclick="navigateTo('users')" style="text-align: left;"><i class="fas fa-users"></i> Manage Users</button>
                        <button class="btn btn-warning" onclick="navigateTo('access-logs')" style="text-align: left;"><i class="fas fa-list"></i> View Access Logs</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = dashboardHTML;
        
        // Initialize charts after DOM is ready
        setTimeout(() => {
            const deniedAccess = totalLogs - grantedAccess;
            
            // Access Chart (Pie Chart)
            const accessCtx = document.getElementById('accessChart');
            if (accessCtx) {
                new Chart(accessCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Granted', 'Denied'],
                        datasets: [{
                            data: [grantedAccess, deniedAccess],
                            backgroundColor: ['#1fa65a', '#e74c3c'],
                            borderColor: ['#27ae60', '#c0392b'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 13, weight: 'bold' },
                                    padding: 15,
                                    usePointStyle: true,
                                    color: '#ffffff'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(13, 58, 50, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#1fa65a',
                                borderWidth: 1,
                                callbacks: {
                                    label: function(context) {
                                        const total = grantedAccess + deniedAccess;
                                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                        return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // Card Chart (Bar Chart)
            const cardCtx = document.getElementById('cardChart');
            if (cardCtx) {
                new Chart(cardCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Registered', 'Unregistered'],
                        datasets: [{
                            label: 'Cards Count',
                            data: [registeredCards, totalCards - registeredCards],
                            backgroundColor: ['#1fa65a', '#95a5a6'],
                            borderColor: ['#27ae60', '#7f8c8d'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    font: { size: 13, weight: 'bold' },
                                    color: '#ffffff'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(13, 58, 50, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#1fa65a',
                                borderWidth: 1,
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.parsed.x;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: { stepSize: 1, color: '#ffffff' },
                                grid: { color: 'rgba(31, 166, 90, 0.1)' }
                            },
                            y: {
                                ticks: { color: '#ffffff' },
                                grid: { color: 'rgba(31, 166, 90, 0.1)' }
                            }
                        }
                    }
                });
            }
        }, 100);
        
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading dashboard: ${error.message}</div>`;
    }
}

async function showCardsManagement() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await apiRequest('/cards/my-cards', { method: 'GET' });
        const isInstructor = appState.user && appState.user.role === 'instructor';
        
        let cardsHTML = `
            <div class="card">
                <div class="card-title">My RFID Cards</div>
        `;
        
        if (response.cards.length === 0) {
            cardsHTML += '<p>No cards assigned yet. Please contact an admin to register and assign your RFID card.</p>';
        } else {
            cardsHTML += `<table class="table"><thead><tr><th>Card ID</th><th>Name</th><th>Status</th><th>Registered</th>${isInstructor ? '' : '<th>Action</th>'}</tr></thead><tbody>`;
            
            response.cards.forEach(card => {
                cardsHTML += `
                    <tr>
                        <td>${card.card_id}</td>
                        <td>${card.card_name}</td>
                        <td><span class="badge badge-${card.is_registered ? 'success' : 'danger'}">${card.status}</span></td>
                        <td>${card.registered_at ? new Date(card.registered_at).toLocaleDateString() : 'Not registered'}</td>
                        ${isInstructor ? '' : `<td><button class="btn btn-danger btn-sm" onclick="deregisterCard(${card.id})">Deregister</button></td>`}
                    </tr>
                `;
            });
            
            cardsHTML += '</tbody></table>';
        }
        
        cardsHTML += '</div>';
        contentDiv.innerHTML = cardsHTML;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading cards: ${error.message}</div>`;
    }
}

async function showRegisterCard() {
    updateNavbar();
    const contentDiv = document.getElementById('content');

    if (appState.user.role !== 'admin') {
        contentDiv.innerHTML = '<div class="alert alert-warning">Card registration is managed by admins in the Admin Dashboard.</div>';
        return;
    }

    contentDiv.innerHTML = `
        <div class="card" style="max-width: 600px;">
            <div class="card-title">Register New RFID Card</div>
            <form onsubmit="handleRegisterCard(event)">
                <div class="form-group">
                    <label for="card-id">Card ID (RFID UID)</label>
                    <input type="text" id="card-id" placeholder="e.g., 12AB34CD" required>
                    <small style="color: #ffffff;">Please scan your RFID card or enter the card UID manually</small>
                </div>
                <div class="form-group">
                    <label for="card-name">Card Name (Optional)</label>
                    <input type="text" id="card-name" placeholder="e.g., Main Card">
                </div>
                <button type="submit" class="btn btn-success">Register Card</button>
                <button type="button" class="btn btn-secondary" onclick="navigateTo('cards')" style="margin-left: 10px;">Cancel</button>
            </form>
        </div>
    `;
}

async function handleRegisterCard(event) {
    event.preventDefault();
    
    try {
        const card_id = document.getElementById('card-id').value;
        const card_name = document.getElementById('card-name').value;
        
        const response = await apiRequest('/cards/register', {
            method: 'POST',
            body: JSON.stringify({ card_id, card_name })
        });
        
        await swalAlert('success', 'Card Registered', 'RFID card registered successfully.');
        navigateTo('cards');
    } catch (error) {
        await swalAlert('error', 'Registration Failed', error.message);
    }
}

async function deregisterCard(cardId) {
    const confirmed = await swalConfirm('Deregister Card?', 'This will remove the card registration.', 'Deregister');
    if (!confirmed) return;
    
    try {
        await apiRequest(`/cards/${cardId}/deregister`, {
            method: 'POST'
        });
        
        await swalAlert('success', 'Card Deregistered', 'The card was deregistered successfully.');
        navigateTo('cards');
    } catch (error) {
        await swalAlert('error', 'Deregistration Failed', error.message);
    }
}

async function showScheduleManagement() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    
    if (appState.user.role !== 'instructor' && appState.user.role !== 'admin') {
        contentDiv.innerHTML = '<div class="alert alert-warning">Only instructors can manage schedules</div>';
        return;
    }
    
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const isAdmin = appState.user.role === 'admin';
        let response;

        if (isAdmin) {
            const [schedulesResponse, instructorsResponse, roomsResponse] = await Promise.all([
                apiRequest('/schedule?limit=200', { method: 'GET' }),
                apiRequest('/users/?role=instructor&limit=200', { method: 'GET' }),
                apiRequest('/schedule/rooms', { method: 'GET' })
            ]);
            response = schedulesResponse;
            instructorsCache = instructorsResponse.users || [];
            roomsCache = roomsResponse.rooms || [];
        } else {
            const [schedulesResponse, roomsResponse] = await Promise.all([
                apiRequest('/schedule/my-schedule', { method: 'GET' }),
                apiRequest('/schedule/rooms', { method: 'GET' })
            ]);
            response = schedulesResponse;
            instructorsCache = [];
            roomsCache = roomsResponse.rooms || [];
        }

        const roomsBadge = roomsCache.length > 0
            ? roomsCache.map(room => `<span class="badge badge-success" style="margin-right: 0.5rem; margin-bottom: 0.5rem; display: inline-block;">${escapeHtml(room.name)}</span>`).join('')
            : '<span style="color:#ffffff;">No rooms registered yet.</span>';
        
        let scheduleHTML = `
            <div class="card">
                <div class="card-title">Teaching Schedule</div>
                <div style="margin-bottom: 1rem;">
                    <button class="btn btn-success" onclick="showAddScheduleForm()">Add Schedule</button>
                    ${isAdmin ? '<button class="btn btn-primary" onclick="showAddRoomForm()" style="margin-left: 10px;">Add Room</button>' : ''}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Registered Rooms:</strong>
                    <div style="margin-top: 0.5rem;">${roomsBadge}</div>
                </div>
        `;
        
        if (response.schedules.length === 0) {
            scheduleHTML += '<p>No schedules added yet.</p>';
        } else {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            scheduleHTML += `<table class="table"><thead><tr>${isAdmin ? '<th>Instructor</th>' : ''}<th>Day</th><th>Time</th><th>Room</th><th>Action</th></tr></thead><tbody>`;
            
            response.schedules.forEach(schedule => {
                scheduleHTML += `
                    <tr>
                        ${isAdmin ? `<td>${schedule.instructor_name || schedule.instructor_username || ('User #' + schedule.user_id)}</td>` : ''}
                        <td>${days[schedule.day_of_week]}</td>
                        <td>${schedule.start_time} - ${schedule.end_time}</td>
                        <td>${schedule.location || '-'}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editSchedule(${schedule.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${schedule.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            scheduleHTML += '</tbody></table>';
        }
        
        scheduleHTML += '</div>';
        contentDiv.innerHTML = scheduleHTML;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading schedule: ${error.message}</div>`;
    }
}

function showAddScheduleForm() {
    const contentDiv = document.getElementById('content');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const isAdmin = appState.user && appState.user.role === 'admin';

    if (roomsCache.length === 0) {
        swalAlert('warning', 'No Rooms Registered', isAdmin ? 'Add a room first before creating schedules.' : 'No rooms are available yet. Please ask admin to add rooms.');
        return;
    }

    const instructorOptions = instructorsCache
        .map(instructor => `<option value="${instructor.id}">${escapeHtml(instructor.full_name)} (${escapeHtml(instructor.username)})</option>`)
        .join('');
    const roomOptions = roomsCache
        .map(room => `<option value="${escapeHtml(room.name)}">${escapeHtml(room.name)}</option>`)
        .join('');
    
    let formHTML = `
        <div class="card" style="max-width: 600px;">
            <div class="card-title">Add Teaching Schedule</div>
            <form onsubmit="handleAddSchedule(event)">
                <div class="form-group">
                    <label for="schedule-day">Day of Week</label>
                    <select id="schedule-day" required>
                        ${days.map((day, index) => `<option value="${index}">${day}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-start">Start Time</label>
                    <input type="time" id="schedule-start" required>
                </div>
                <div class="form-group">
                    <label for="schedule-end">End Time</label>
                    <input type="time" id="schedule-end" required>
                </div>
                <div class="form-group">
                    <label for="schedule-room">Room</label>
                    <select id="schedule-room" required>
                        ${roomOptions}
                    </select>
                </div>
                ${isAdmin ? `
                <div class="form-group">
                    <label for="schedule-user">Instructor</label>
                    <select id="schedule-user" required>
                        ${instructorOptions || '<option value="">No instructors found</option>'}
                    </select>
                </div>
                ` : ''}
                <button type="submit" class="btn btn-success">Add Schedule</button>
                <button type="button" class="btn btn-secondary" onclick="navigateTo('schedule')" style="margin-left: 10px;">Cancel</button>
            </form>
        </div>
    `;
    
    contentDiv.innerHTML = formHTML;
}

async function handleAddSchedule(event) {
    event.preventDefault();
    
    try {
        const isAdmin = appState.user && appState.user.role === 'admin';
        const day_of_week = parseInt(document.getElementById('schedule-day').value);
        const start_time = document.getElementById('schedule-start').value;
        const end_time = document.getElementById('schedule-end').value;
        const location = document.getElementById('schedule-room').value;
        const payload = { day_of_week, start_time, end_time, location };

        if (isAdmin) {
            const selectedUserId = parseInt(document.getElementById('schedule-user').value, 10);
            if (!selectedUserId) {
                await swalAlert('warning', 'Instructor Required', 'Please select an instructor for this schedule.');
                return;
            }
            payload.user_id = selectedUserId;
        }
        
        await apiRequest('/schedule/add', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        await swalAlert('success', 'Schedule Added', 'Teaching schedule added successfully.');
        navigateTo('schedule');
    } catch (error) {
        await swalAlert('error', 'Add Schedule Failed', error.message);
    }
}

async function deleteSchedule(scheduleId) {
    const confirmed = await swalConfirm('Delete Schedule?', 'This schedule will be permanently deleted.', 'Delete');
    if (!confirmed) return;
    
    try {
        await apiRequest(`/schedule/${scheduleId}`, {
            method: 'DELETE'
        });
        
        await swalAlert('success', 'Schedule Deleted', 'Schedule deleted successfully.');
        navigateTo('schedule');
    } catch (error) {
        await swalAlert('error', 'Delete Failed', error.message);
    }
}

async function editSchedule(scheduleId) {
    try {
        const details = await apiRequest(`/schedule/${scheduleId}`, { method: 'GET' });
        const schedule = details.schedule;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const isAdmin = appState.user && appState.user.role === 'admin';

        let instructorOptions = '';
        if (roomsCache.length === 0) {
            const roomsResponse = await apiRequest('/schedule/rooms', { method: 'GET' });
            roomsCache = roomsResponse.rooms || [];
        }
        const roomOptions = roomsCache
            .map(room => `<option value="${escapeHtml(room.name)}" ${room.name === (schedule.location || '') ? 'selected' : ''}>${escapeHtml(room.name)}</option>`)
            .join('');

        if (isAdmin) {
            if (instructorsCache.length === 0) {
                const instructorsResponse = await apiRequest('/users/?role=instructor&limit=200', { method: 'GET' });
                instructorsCache = instructorsResponse.users || [];
            }
            instructorOptions = instructorsCache
                .map(instructor => `<option value="${instructor.id}" ${instructor.id === schedule.user_id ? 'selected' : ''}>${escapeHtml(instructor.full_name)} (${escapeHtml(instructor.username)})</option>`)
                .join('');
        }

        const dayOptions = days
            .map((day, index) => `<option value="${index}" ${index === schedule.day_of_week ? 'selected' : ''}>${day}</option>`)
            .join('');

        const result = await Swal.fire({
            title: 'Edit Schedule',
            html: `
                <div style="display: grid; gap: 0.75rem; text-align: left;">
                    <label for="swal-schedule-day">Day</label>
                    <select id="swal-schedule-day" class="swal2-input" style="margin: 0; width: 100%;">${dayOptions}</select>
                    <label for="swal-schedule-start">Start Time</label>
                    <input id="swal-schedule-start" class="swal2-input" type="time" value="${escapeHtml(schedule.start_time)}" style="margin: 0; width: 100%;">
                    <label for="swal-schedule-end">End Time</label>
                    <input id="swal-schedule-end" class="swal2-input" type="time" value="${escapeHtml(schedule.end_time)}" style="margin: 0; width: 100%;">
                    <label for="swal-schedule-location">Room</label>
                    <select id="swal-schedule-location" class="swal2-input" style="margin: 0; width: 100%;">${roomOptions}</select>
                    ${isAdmin ? `
                    <label for="swal-schedule-user">Instructor</label>
                    <select id="swal-schedule-user" class="swal2-input" style="margin: 0; width: 100%;">${instructorOptions}</select>
                    ` : ''}
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            confirmButtonColor: '#1fa65a',
            preConfirm: () => {
                const day_of_week = parseInt(document.getElementById('swal-schedule-day').value, 10);
                const start_time = document.getElementById('swal-schedule-start').value;
                const end_time = document.getElementById('swal-schedule-end').value;
                const location = document.getElementById('swal-schedule-location').value;
                const updated = { day_of_week, start_time, end_time, location };

                if (!start_time || !end_time) {
                    Swal.showValidationMessage('Start time and end time are required.');
                    return null;
                }

                if (isAdmin) {
                    const selectedUser = parseInt(document.getElementById('swal-schedule-user').value, 10);
                    if (!selectedUser) {
                        Swal.showValidationMessage('Please select an instructor.');
                        return null;
                    }
                    updated.user_id = selectedUser;
                }

                return updated;
            }
        });

        if (!result.isConfirmed || !result.value) return;

        await apiRequest(`/schedule/${scheduleId}`, {
            method: 'PUT',
            body: JSON.stringify(result.value)
        });

        await swalAlert('success', 'Schedule Updated', 'Schedule information has been updated.');
        navigateTo('schedule');
    } catch (error) {
        await swalAlert('error', 'Update Failed', error.message);
    }
}

async function showAddRoomForm() {
    if (!appState.user || appState.user.role !== 'admin') {
        await swalAlert('error', 'Admin Required', 'Only admins can add rooms.');
        return;
    }

    const result = await Swal.fire({
        title: 'Add Room',
        input: 'text',
        inputLabel: 'Room Name',
        inputPlaceholder: 'e.g., Room 101',
        showCancelButton: true,
        confirmButtonText: 'Add Room',
        confirmButtonColor: '#1fa65a',
        preConfirm: (value) => {
            if (!value || !value.trim()) {
                Swal.showValidationMessage('Room name is required.');
                return null;
            }
            return value.trim();
        }
    });

    if (!result.isConfirmed || !result.value) return;

    try {
        await apiRequest('/schedule/rooms', {
            method: 'POST',
            body: JSON.stringify({ name: result.value })
        });

        await swalAlert('success', 'Room Added', `Room "${result.value}" was added.`);
        navigateTo('schedule');
    } catch (error) {
        await swalAlert('error', 'Add Room Failed', error.message);
    }
}

async function showAccessLogs() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    
    if (appState.user.role !== 'admin') {
        contentDiv.innerHTML = '<div class="alert alert-warning">Admin access required</div>';
        return;
    }
    
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await apiRequest('/access/logs?limit=50', { method: 'GET' });
        
        let logsHTML = `
            <div class="card">
                <div class="card-title">Access Logs</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Result</th>
                            <th>Reason</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        response.logs.forEach(log => {
            const resultClass = log.access_result === 'granted' ? 'success' : 'danger';
            logsHTML += `
                <tr>
                    <td>${new Date(log.attempted_at).toLocaleString()}</td>
                    <td>${log.user_id || 'Unknown'}</td>
                    <td><span style="color: #ffffff; font-weight: bold;">${log.access_result.toUpperCase()}</span></td>
                    <td>${log.reason || '-'}</td>
                    <td>${log.door_location || '-'}</td>
                </tr>
            `;
        });
        
        logsHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        contentDiv.innerHTML = logsHTML;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading logs: ${error.message}</div>`;
    }
}

async function showUsersManagement() {
    updateNavbar();
    const contentDiv = document.getElementById('content');
    
    if (appState.user.role !== 'admin') {
        contentDiv.innerHTML = '<div class="alert alert-warning">Admin access required</div>';
        return;
    }
    
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await apiRequest('/users/?limit=100', { method: 'GET' });
        usersCache = response.users || [];
        
        let usersHTML = `
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-title">Add New User</div>
                <form onsubmit="handleAddNewUser(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="new-username">Username</label>
                            <input type="text" id="new-username" required>
                        </div>
                        <div class="form-group">
                            <label for="new-email">Email</label>
                            <input type="email" id="new-email" required>
                        </div>
                        <div class="form-group">
                            <label for="new-fullname">Full Name</label>
                            <input type="text" id="new-fullname" required>
                        </div>
                        <div class="form-group">
                            <label for="new-role">Role</label>
                            <select id="new-role">
                                <option value="instructor">Instructor</option>
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="new-password">Password</label>
                            <input type="password" id="new-password" required>
                        </div>
                        <div class="form-group">
                            <label for="new-card-id">RFID Card ID</label>
                            <input type="text" id="new-card-id" placeholder="e.g., 12AB34CD" required>
                            <small style="color: #ffffff;">Required: card must be assigned when creating the account</small>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">Create User</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-title">User Management</div>
                <div class="form-group" style="max-width: 420px; margin-bottom: 1rem;">
                    <label for="users-search">Search Users</label>
                    <input type="text" id="users-search" placeholder="Search by username, name, email, or role" oninput="filterUsersTable()">
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
        `;
        
        response.users.forEach(user => {
            const statusClass = user.is_active ? 'success' : 'danger';
            const searchableText = `${user.username} ${user.full_name} ${user.email} ${user.role} ${user.is_active ? 'active' : 'inactive'}`.toLowerCase();
            usersHTML += `
                <tr data-search="${searchableText}">
                    <td>${user.username}</td>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><span style="color: #ffffff;">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="viewUserInfo(${user.id})">View</button>
                        <button class="btn btn-primary btn-sm" onclick="editUserInfo(${user.id})">Edit Info</button>
                        ${user.is_active ? `<button class="btn btn-danger btn-sm" onclick="deactivateUser(${user.id})">Deactivate</button>` : `<button class="btn btn-success btn-sm" onclick="activateUser(${user.id})">Activate</button>`}
                    </td>
                </tr>
            `;
        });
        
        usersHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        contentDiv.innerHTML = usersHTML;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading users: ${error.message}</div>`;
    }
}

async function deactivateUser(userId) {
    const confirmed = await swalConfirm('Deactivate User?', 'This user will be blocked from logging in.', 'Deactivate');
    if (!confirmed) return;
    
    try {
        await apiRequest(`/users/${userId}/deactivate`, {
            method: 'POST'
        });
        
        await swalAlert('success', 'User Deactivated', 'User account has been deactivated.');
        navigateTo('users');
    } catch (error) {
        await swalAlert('error', 'Action Failed', error.message);
    }
}

async function activateUser(userId) {
    const confirmed = await swalConfirm('Activate User?', 'This user will be allowed to log in again.', 'Activate');
    if (!confirmed) return;
    
    try {
        await apiRequest(`/users/${userId}/activate`, {
            method: 'POST'
        });
        
        await swalAlert('success', 'User Activated', 'User account has been activated.');
        navigateTo('users');
    } catch (error) {
        await swalAlert('error', 'Action Failed', error.message);
    }
}

async function handleAddNewUser(event) {
    event.preventDefault();
    
    try {
        const username = document.getElementById('new-username').value;
        const email = document.getElementById('new-email').value;
        const full_name = document.getElementById('new-fullname').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;
        const card_id = document.getElementById('new-card-id').value.trim();

        if (!card_id) {
            await swalAlert('warning', 'RFID Card Required', 'RFID Card ID is required when creating a user.');
            return;
        }
        
        // Create user account
        const userResponse = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, full_name, password, role })
        });
        
        try {
            await apiRequest('/cards/register', {
                method: 'POST',
                body: JSON.stringify({ 
                    card_id: card_id,
                    card_name: `Card for ${full_name}`,
                    user_id: userResponse.user_id
                })
            });
            await swalAlert('success', 'User Created', `User ${username} and RFID card ${card_id} were registered.`);
        } catch (cardError) {
            await swalAlert('warning', 'Card Registration Failed', `User was created, but card registration failed: ${cardError.message}`);
        }
        
        navigateTo('users');
    } catch (error) {
        await swalAlert('error', 'Create User Failed', error.message);
    }
}

function filterUsersTable() {
    const searchInput = document.getElementById('users-search');
    const rows = document.querySelectorAll('#users-table-body tr');
    const query = (searchInput?.value || '').trim().toLowerCase();

    rows.forEach(row => {
        const text = row.getAttribute('data-search') || '';
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

async function editUserInfo(userId) {
    const user = usersCache.find(u => u.id === userId);
    if (!user) {
        await swalAlert('error', 'User Not Found', 'User not found in current list.');
        return;
    }

    let existingCard = null;
    try {
        const cardsResponse = await apiRequest(`/cards/?user_id=${userId}&limit=10`, { method: 'GET' });
        existingCard = (cardsResponse.cards || [])[0] || null;
    } catch (error) {
        existingCard = null;
    }

    const result = await Swal.fire({
        title: 'Edit User Information',
        html: `
            <div style="display: grid; gap: 0.75rem; text-align: left;">
                <label for="swal-user-username">Username</label>
                <input id="swal-user-username" class="swal2-input" value="${escapeHtml(user.username)}" style="margin: 0; width: 100%;">
                <label for="swal-user-fullname">Full Name</label>
                <input id="swal-user-fullname" class="swal2-input" value="${escapeHtml(user.full_name)}" style="margin: 0; width: 100%;">
                <label for="swal-user-email">Email</label>
                <input id="swal-user-email" class="swal2-input" type="email" value="${escapeHtml(user.email)}" style="margin: 0; width: 100%;">
                <label for="swal-user-role">Role</label>
                <select id="swal-user-role" class="swal2-input" style="margin: 0; width: 100%;">
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="instructor" ${user.role === 'instructor' ? 'selected' : ''}>Instructor</option>
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                </select>
                <label for="swal-user-password">New Password (Optional)</label>
                <input id="swal-user-password" class="swal2-input" type="password" placeholder="Leave blank to keep current" style="margin: 0; width: 100%;">
                <label for="swal-user-card-id">RFID Card ID</label>
                <input id="swal-user-card-id" class="swal2-input" value="${escapeHtml(existingCard ? existingCard.card_id : '')}" placeholder="e.g., 12AB34CD" style="margin: 0; width: 100%;">
                <label for="swal-user-card-name">Card Name</label>
                <input id="swal-user-card-name" class="swal2-input" value="${escapeHtml(existingCard ? (existingCard.card_name || '') : '')}" placeholder="e.g., Main Card" style="margin: 0; width: 100%;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Update',
        confirmButtonColor: '#1fa65a',
        preConfirm: () => {
            const username = document.getElementById('swal-user-username').value.trim();
            const full_name = document.getElementById('swal-user-fullname').value.trim();
            const email = document.getElementById('swal-user-email').value.trim();
            const role = document.getElementById('swal-user-role').value;
            const password = document.getElementById('swal-user-password').value;
            const card_id = document.getElementById('swal-user-card-id').value.trim();
            const card_name = document.getElementById('swal-user-card-name').value.trim();

            if (!username || !full_name || !email) {
                Swal.showValidationMessage('Username, full name, and email are required.');
                return null;
            }

            if (!card_id) {
                Swal.showValidationMessage('RFID Card ID is required.');
                return null;
            }

            return { username, full_name, email, role, password, card_id, card_name };
        }
    });

    if (!result.isConfirmed || !result.value) return;

    try {
        const { card_id, card_name, ...userPayload } = result.value;
        await apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userPayload)
        });

        await apiRequest(`/cards/user/${userId}/primary`, {
            method: 'PUT',
            body: JSON.stringify({ card_id, card_name })
        });

        await swalAlert('success', 'User Updated', 'User information updated successfully.');
        navigateTo('users');
    } catch (error) {
        await swalAlert('error', 'Update Failed', error.message);
    }
}

async function viewUserInfo(userId) {
    const user = usersCache.find(u => u.id === userId);
    if (!user) {
        await swalAlert('error', 'User Not Found', 'User not found in current list.');
        return;
    }

    await Swal.fire({
        title: 'User Details',
        html: `
            <div style="text-align: left; line-height: 1.7;">
                <p><strong>Username:</strong> ${escapeHtml(user.username)}</p>
                <p><strong>Full Name:</strong> ${escapeHtml(user.full_name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                <p><strong>Role:</strong> ${escapeHtml(user.role)}</p>
                <p><strong>Status:</strong> ${user.is_active ? 'Active' : 'Inactive'}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonColor: '#1fa65a'
    });
}
