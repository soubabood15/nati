

// =========================
// Authentication
// =========================

const AGENT_LOGIN_URL = 'https://script.google.com/macros/s/AKfycbzGi3SloTQSfCjU0bdBUQUuZx5Cs4cyQ-b0iUMAl9-U14rXTee-bfwx4ETDW5iN0rNPEA/exec';
const AGENT_NAME_STORAGE_KEY = 'knowledgeAgentName';

const agentLoginOverlay = document.getElementById('agentLoginOverlay');
const agentLoginInput = document.getElementById('agentLoginInput');
const agentPasswordInput = document.getElementById('agentPasswordInput');
const loginError = document.getElementById('loginError');
const agentLoginBtn = document.getElementById('agentLoginBtn');
const agentNameDisplay = document.getElementById('agentNameDisplay');
const agentLiveName = document.getElementById('agentLiveName');

function getSavedAgentName() {
    return localStorage.getItem(AGENT_NAME_STORAGE_KEY) || '';
}

function saveAgentName(name) {
    localStorage.setItem(AGENT_NAME_STORAGE_KEY, name.trim());
}

function updateAgentDisplay() {
    const agentName = getSavedAgentName();

    if (agentNameDisplay) {
        agentNameDisplay.textContent = agentName ? `Welcome Back, ${agentName}` : 'Welcome Back';
    }

    if (agentLiveName) {
        agentLiveName.textContent = agentName || 'Not logged in';
    }
}

function showAgentLoginIfNeeded() {
    updateAgentDisplay();

    if (!getSavedAgentName()) {
        agentLoginOverlay.classList.add('show');
    } else {
        agentLoginOverlay.classList.remove('show');
    }
}

function loginWithJsonp(name, password) {
    return new Promise((resolve, reject) => {
        const callbackName = `agentLoginCallback_${Date.now()}`;
        const script = document.createElement('script');

        window[callbackName] = (result) => {
            delete window[callbackName];
            script.remove();
            resolve(result);
        };

        script.onerror = () => {
            delete window[callbackName];
            script.remove();
            reject(new Error('Login failed'));
        };

        script.src = `${AGENT_LOGIN_URL}?action=login&agentName=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}&callback=${callbackName}`;
        document.body.appendChild(script);
    });
}

async function completeAgentLogin() {
    const name = agentLoginInput.value.trim();
    const password = agentPasswordInput.value.trim();

    if (!name || !password) return;

    try {
        const result = await loginWithJsonp(name, password);

        if (!result.success) {
            loginError.textContent = result.message || 'Login failed';
            loginError.classList.add('show');
            return;
        }

        saveAgentName(result.agentName || name);
        updateAgentDisplay();
        agentLoginOverlay.classList.remove('show');

        if (typeof startAttendanceHeartbeat === 'function') {
            startAttendanceHeartbeat(true);
        }
    } catch (e) {
        loginError.textContent = e.message;
        loginError.classList.add('show');
    }
}

if (agentLoginBtn) {
    agentLoginBtn.addEventListener('click', completeAgentLogin);
}