 // Global State
        let appData = {
            activities: [],
            stickyNotes: [],
            notes: [],
            stats: {
                points: 0,
                streak: 0,
                totalActivities: 0,
                totalNotes: 0
            },
            timer: {
                minutes: 25,
                seconds: 0,
                isRunning: false,
                interval: null
            },
            apiKey: '',
            aiModel: 'chatgpt',
            theme: 'dark'
        };

        // Load data from localStorage
        function loadData() {
            const saved = localStorage.getItem('studentDashboardData');
            if (saved) {
                appData = { ...appData, ...JSON.parse(saved) };
            }
            updateUI();
        }

        // Save data to localStorage
        function saveData() {
            localStorage.setItem('studentDashboardData', JSON.stringify(appData));
        }

        // Page Navigation
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
            event.target.classList.add('active');
            
            if (pageId === 'dashboard') {
                renderContributionGraph();
            } else if (pageId === 'sticky-notes') {
                renderStickyNotes();
            } else if (pageId === 'notes-manager') {
                renderNotes();
            } else if (pageId === 'analytics') {
                renderCharts();
            }
            
            // Close mobile menu
            document.getElementById('navLinks').classList.remove('active');
        }

        // Toggle Mobile Menu
        function toggleMenu() {
            document.getElementById('navLinks').classList.toggle('active');
        }

        // Initialize Particles
        function initParticles() {
            const container = document.getElementById('particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 3 + 's';
                container.appendChild(particle);
                
                gsap.to(particle, {
                    y: -100,
                    x: Math.random() * 200 - 100,
                    opacity: 0,
                    duration: 3 + Math.random() * 2,
                    repeat: -1,
                    ease: "power1.out"
                });
            }
        }

        // Activity Logging
        function logActivity() {
            const input = document.getElementById('activityInput');
            const category = document.getElementById('activityCategory').value;
            
            if (!input.value.trim()) {
                alert('Please enter an activity');
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const activity = {
                id: Date.now(),
                text: input.value,
                category: category,
                date: today,
                points: 10
            };

            appData.activities.push(activity);
            appData.stats.points += 10;
            appData.stats.totalActivities++;
            
            // Update streak
            updateStreak();
            
            // Check for badges
            checkBadges();
            
            input.value = '';
            saveData();
            updateUI();
            renderContributionGraph();
            
            // Show success animation
            showNotification('Activity logged! +10 points', 'success');
        }

        // Update Streak
        function updateStreak() {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            const todayActivities = appData.activities.filter(a => a.date === today);
            const yesterdayActivities = appData.activities.filter(a => a.date === yesterday);
            
            if (todayActivities.length > 0) {
                if (yesterdayActivities.length > 0 || appData.stats.streak === 0) {
                    appData.stats.streak++;
                }
            }
        }

        // Check and Award Badges
        function checkBadges() {
            const badges = [];
            
            if (appData.stats.totalActivities >= 1 && !hasBadge('First Activity')) {
                badges.push({ name: 'First Activity', icon: '🎉' });
            }
            if (appData.stats.totalActivities >= 10 && !hasBadge('10 Activities')) {
                badges.push({ name: '10 Activities', icon: '🔟' });
            }
            if (appData.stats.streak >= 7 && !hasBadge('Week Warrior')) {
                badges.push({ name: 'Week Warrior', icon: '🔥' });
            }
            if (appData.stats.totalNotes >= 10 && !hasBadge('Note Master')) {
                badges.push({ name: 'Note Master', icon: '📚' });
            }
            
            badges.forEach(badge => {
                if (!appData.badges) appData.badges = [];
                appData.badges.push(badge);
                showNotification(`🏆 New Badge: ${badge.name}!`, 'badge');
            });
        }

        function hasBadge(name) {
            return appData.badges && appData.badges.some(b => b.name === name);
        }

        // Contribution Graph
        function renderContributionGraph() {
            const graph = document.getElementById('contributionGraph');
            const periodLabel = document.getElementById('graphPeriod');
            graph.innerHTML = '';
            
            // Add mobile vertical class on small screens
            if (window.innerWidth <= 768) {
                graph.classList.add('mobile-vertical');
                periodLabel.textContent = '(Last 90 Days)';
            } else {
                graph.classList.remove('mobile-vertical');
                periodLabel.textContent = '(Last Year)';
            }
            
            // Show last 90 days on mobile, 365 on desktop
            const daysToShow = window.innerWidth <= 768 ? 90 : 365;
            
            for (let i = daysToShow - 1; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86400000);
                const dateStr = date.toISOString().split('T')[0];
                const activities = appData.activities.filter(a => a.date === dateStr);
                const level = Math.min(4, Math.floor(activities.length / 2));
                
                const cell = document.createElement('div');
                cell.className = `contribution-cell level-${level}`;
                cell.dataset.date = dateStr;
                cell.dataset.count = activities.length;
                
                cell.addEventListener('mouseenter', (e) => {
                    showTooltip(e, `${dateStr}: ${activities.length} activities`);
                });
                cell.addEventListener('mouseleave', hideTooltip);
                
                // Touch support for mobile
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    showTooltip(e.touches[0], `${dateStr}: ${activities.length} activities`);
                    setTimeout(hideTooltip, 2000);
                });
                
                graph.appendChild(cell);
            }
        }

        // Tooltip
        function showTooltip(e, text) {
            const tooltip = document.getElementById('tooltip');
            tooltip.textContent = text;
            tooltip.style.display = 'block';
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY + 10 + 'px';
        }

        function hideTooltip() {
            document.getElementById('tooltip').style.display = 'none';
        }

        // Timer Functions
        function startTimer() {
            if (appData.timer.isRunning) return;
            
            const duration = parseInt(document.getElementById('timerDuration').value);
            if (appData.timer.minutes === 25 && appData.timer.seconds === 0) {
                appData.timer.minutes = duration;
            }
            
            appData.timer.isRunning = true;
            appData.timer.interval = setInterval(() => {
                if (appData.timer.seconds === 0) {
                    if (appData.timer.minutes === 0) {
                        completeTimer();
                        return;
                    }
                    appData.timer.minutes--;
                    appData.timer.seconds = 59;
                } else {
                    appData.timer.seconds--;
                }
                updateTimerDisplay();
            }, 1000);
        }

        function pauseTimer() {
            appData.timer.isRunning = false;
            clearInterval(appData.timer.interval);
        }

        function resetTimer() {
            pauseTimer();
            appData.timer.minutes = parseInt(document.getElementById('timerDuration').value);
            appData.timer.seconds = 0;
            updateTimerDisplay();
        }

        function completeTimer() {
            pauseTimer();
            appData.stats.points += 25;
            showNotification('🎉 Pomodoro Complete! +25 points', 'success');
            resetTimer();
            saveData();
            updateUI();
        }

        function updateTimerDisplay() {
            const display = document.getElementById('timerDisplay');
            const mins = String(appData.timer.minutes).padStart(2, '0');
            const secs = String(appData.timer.seconds).padStart(2, '0');
            display.textContent = `${mins}:${secs}`;
        }

        // Sticky Notes
        function createStickyNote() {
            const colors = ['#ffeb3b', '#ff9800', '#e91e63', '#9c27b0', '#3f51b5', '#00bcd4'];
            const note = {
                id: Date.now(),
                content: '',
                color: colors[Math.floor(Math.random() * colors.length)],
                x: Math.random() * (window.innerWidth - 300),
                y: Math.random() * (window.innerHeight - 300) + 100
            };
            
            appData.stickyNotes.push(note);
            appData.stats.totalNotes++;
            saveData();
            renderStickyNotes();
            checkBadges();
        }

        function renderStickyNotes() {
            const container = document.getElementById('stickyNotesContainer');
            const existing = container.querySelectorAll('.sticky-note');
            existing.forEach(el => el.remove());
            
            appData.stickyNotes.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.className = 'sticky-note';
                noteEl.style.backgroundColor = note.color;
                noteEl.style.left = note.x + 'px';
                noteEl.style.top = note.y + 'px';
                noteEl.innerHTML = `
                    <div class="note-header">
                        <span style="cursor: move;">📌</span>
                        <button onclick="deleteStickyNote(${note.id})" style="background: transparent; border: none; color: #000; cursor: pointer; font-size: 1.2rem;">×</button>
                    </div>
                    <textarea class="note-content" onblur="updateStickyNote(${note.id}, this.value)">${note.content}</textarea>
                `;
                
                makeNoteMovable(noteEl, note);
                container.appendChild(noteEl);
            });
        }

        function makeNoteMovable(element, note) {
            let isDragging = false;
            let startX, startY;
            
            const startDrag = (e) => {
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                
                if (e.target.classList.contains('note-content')) return;
                isDragging = true;
                startX = clientX - note.x;
                startY = clientY - note.y;
                element.style.zIndex = 1000;
            };
            
            const moveDrag = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                
                note.x = clientX - startX;
                note.y = clientY - startY;
                element.style.left = note.x + 'px';
                element.style.top = note.y + 'px';
            };
            
            const endDrag = () => {
                if (isDragging) {
                    isDragging = false;
                    saveData();
                }
            };
            
            // Mouse events
            element.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', moveDrag);
            document.addEventListener('mouseup', endDrag);
            
            // Touch events for mobile
            element.addEventListener('touchstart', startDrag);
            document.addEventListener('touchmove', moveDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        }

        function updateStickyNote(id, content) {
            const note = appData.stickyNotes.find(n => n.id === id);
            if (note) {
                note.content = content;
                saveData();
            }
        }

        function deleteStickyNote(id) {
            appData.stickyNotes = appData.stickyNotes.filter(n => n.id !== id);
            saveData();
            renderStickyNotes();
        }

        // Notes Manager
        function openAddNoteModal() {
            document.getElementById('addNoteModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('addNoteModal').classList.remove('active');
        }

        function saveNote() {
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            const tags = document.getElementById('noteTags').value;
            
            if (!title || !content) {
                alert('Please fill in title and content');
                return;
            }
            
            const note = {
                id: Date.now(),
                title: title,
                content: content,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                date: new Date().toLocaleDateString()
            };
            
            appData.notes.push(note);
            saveData();
            renderNotes();
            closeModal();
            
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            document.getElementById('noteTags').value = '';
        }

        function renderNotes() {
            const grid = document.getElementById('notesGrid');
            grid.innerHTML = '';
            
            appData.notes.forEach(note => {
                const card = document.createElement('div');
                card.className = 'note-card';
                card.innerHTML = `
                    <h3>${note.title}</h3>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        ${note.tags.map(tag => `<span style="padding: 0.3rem 0.8rem; background: var(--primary-blue); border-radius: 15px; font-size: 0.8rem;">${tag}</span>`).join('')}
                    </div>
                    <small style="color: var(--text-secondary);">${note.date}</small>
                    <button onclick="deleteNote(${note.id})" style="float: right; background: var(--primary-red); border: none; padding: 0.5rem 1rem; border-radius: 8px; color: white; cursor: pointer;">Delete</button>
                `;
                grid.appendChild(card);
            });
        }

        function deleteNote(id) {
            if (confirm('Delete this note?')) {
                appData.notes = appData.notes.filter(n => n.id !== id);
                saveData();
                renderNotes();
            }
        }

        function searchNotes() {
            const query = document.getElementById('notesSearch').value.toLowerCase();
            const filtered = appData.notes.filter(note => 
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                note.tags.some(tag => tag.toLowerCase().includes(query))
            );
            
            const grid = document.getElementById('notesGrid');
            grid.innerHTML = '';
            
            filtered.forEach(note => {
                const card = document.createElement('div');
                card.className = 'note-card';
                card.innerHTML = `
                    <h3>${note.title}</h3>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        ${note.tags.map(tag => `<span style="padding: 0.3rem 0.8rem; background: var(--primary-blue); border-radius: 15px; font-size: 0.8rem;">${tag}</span>`).join('')}
                    </div>
                    <small style="color: var(--text-secondary);">${note.date}</small>
                    <button onclick="deleteNote(${note.id})" style="float: right; background: var(--primary-red); border: none; padding: 0.5rem 1rem; border-radius: 8px; color: white; cursor: pointer;">Delete</button>
                `;
                grid.appendChild(card);
            });
        }

        // Charts
        let weeklyChart = null;
        let categoryChart = null;

        function renderCharts() {
            // Destroy existing charts
            if (weeklyChart) {
                weeklyChart.destroy();
            }
            if (categoryChart) {
                categoryChart.destroy();
            }

            // Weekly Activity Chart
            const weeklyCtx = document.getElementById('weeklyChart');
            const last7Days = [];
            const activityCounts = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86400000);
                const dateStr = date.toISOString().split('T')[0];
                last7Days.push(date.toLocaleDateString('en', { weekday: 'short' }));
                activityCounts.push(appData.activities.filter(a => a.date === dateStr).length);
            }
            
            weeklyChart = new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Activities',
                        data: activityCounts,
                        borderColor: '#ff3366',
                        backgroundColor: 'rgba(255, 51, 102, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#ff3366',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { 
                            display: true,
                            labels: {
                                color: '#ffffff',
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                color: '#b8b8d0',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#b8b8d0'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
            
            // Category Chart
            const categoryCtx = document.getElementById('categoryChart');
            const categories = ['study', 'project', 'task', 'other'];
            const categoryCounts = categories.map(cat => 
                appData.activities.filter(a => a.category === cat).length
            );
            
            categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Study', 'Project', 'Task', 'Other'],
                    datasets: [{
                        data: categoryCounts,
                        backgroundColor: ['#ff3366', '#3366ff', '#00ff88', '#ffaa00'],
                        borderWidth: 3,
                        borderColor: '#1a1a2e'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                padding: 15,
                                font: {
                                    size: 13
                                }
                            }
                        }
                    }
                }
            });
        }

        // Settings
        function toggleTheme() {
            const toggle = document.getElementById('themeToggle');
            toggle.classList.toggle('active');
            document.body.classList.toggle('light-theme');
            appData.theme = toggle.classList.contains('active') ? 'dark' : 'light';
            saveData();
        }

        function saveApiKey() {
            const key = document.getElementById('apiKeyInput').value;
            const model = document.getElementById('aiModelSelect').value;
            
            if (key) {
                appData.apiKey = key;
                appData.aiModel = model;
                saveData();
                
                const modelNames = {
                    'chatgpt': 'ChatGPT (OpenAI)',
                    'claude': 'Claude (Anthropic)',
                    'gemini': 'Gemini (Google)',
                    'groq': 'Groq'
                };
                
                document.getElementById('aiStatus').textContent = 'AI Enabled ✅';
                document.getElementById('currentAiModel').textContent = modelNames[model];
                showNotification(`AI Configuration Saved! Using ${modelNames[model]}`, 'success');
            } else {
                alert('Please enter an API key');
            }
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const chatbot = document.getElementById('chatbot');
            
            if (!appData.apiKey) {
                alert('Please enter an API key first');
                return;
            }
            
            if (!input.value.trim()) return;
            
            const userMsg = document.createElement('div');
            userMsg.style.cssText = 'padding: 1rem; margin-bottom: 0.5rem; background: var(--primary-blue); border-radius: 10px; text-align: right;';
            userMsg.textContent = input.value;
            chatbot.appendChild(userMsg);
            
            const modelNames = {
                'chatgpt': 'ChatGPT',
                'claude': 'Claude',
                'gemini': 'Gemini',
                'groq': 'Groq'
            };
            
            // Simulate AI response (replace with actual API call)
            setTimeout(() => {
                const aiMsg = document.createElement('div');
                aiMsg.style.cssText = 'padding: 1rem; margin-bottom: 0.5rem; background: var(--card-bg); border-radius: 10px; border: 2px solid var(--primary-blue);';
                aiMsg.innerHTML = `<strong>${modelNames[appData.aiModel]}:</strong><br>This is a demo response. In production, this would connect to the ${modelNames[appData.aiModel]} API to provide real AI-powered assistance!`;
                chatbot.appendChild(aiMsg);
                chatbot.scrollTop = chatbot.scrollHeight;
            }, 1000);
            
            input.value = '';
        }

        function exportData() {
            const dataStr = JSON.stringify(appData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student-dashboard-data.json';
            a.click();
        }

        function resetData() {
            if (confirm('Are you sure? This will delete all your data!')) {
                localStorage.removeItem('studentDashboardData');
                location.reload();
            }
        }

        // Update UI
        function updateUI() {
            document.getElementById('totalPoints').textContent = appData.stats.points;
            document.getElementById('currentStreak').textContent = appData.stats.streak;
            document.getElementById('totalActivities').textContent = appData.stats.totalActivities;
            document.getElementById('totalNotes').textContent = appData.stickyNotes.length + appData.notes.length;
            
            // Update badges
            const badgesContainer = document.getElementById('badgesContainer');
            if (appData.badges && appData.badges.length > 0) {
                badgesContainer.innerHTML = appData.badges.map(badge => 
                    `<div class="badge">${badge.icon} ${badge.name}</div>`
                ).join('');
            }
            
            // Update AI status and model
            if (appData.apiKey) {
                const modelNames = {
                    'chatgpt': 'ChatGPT (OpenAI)',
                    'claude': 'Claude (Anthropic)',
                    'gemini': 'Gemini (Google)',
                    'groq': 'Groq'
                };
                document.getElementById('aiStatus').textContent = 'AI Enabled ✅';
                document.getElementById('currentAiModel').textContent = modelNames[appData.aiModel] || 'Not Set';
                document.getElementById('aiModelSelect').value = appData.aiModel;
            }
        }

        // Notification System
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 1rem 2rem;
                background: ${type === 'success' ? 'var(--success)' : 'var(--gradient)'};
                color: ${type === 'success' ? 'var(--dark-bg)' : 'white'};
                border-radius: 10px;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Initialize
        window.addEventListener('load', () => {
            loadData();
            initParticles();
            renderContributionGraph();
            
            // Re-render graph on resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (document.getElementById('dashboard').classList.contains('active')) {
                        renderContributionGraph();
                    }
                }, 250);
            });
            
            // Apply saved theme
            if (appData.theme === 'light') {
                document.body.classList.add('light-theme');
                document.getElementById('themeToggle').classList.remove('active');
            }
            
            // GSAP Animations
            gsap.from('.hero-content', {
                opacity: 0,
                y: 100,
                duration: 1,
                ease: 'power3.out'
            });
            
            gsap.registerPlugin(ScrollTrigger);
            
            gsap.utils.toArray('.feature-card').forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 80%'
                    },
                    opacity: 0,
                    y: 50,
                    duration: 0.6,
                    delay: i * 0.1
                });
            });
        });