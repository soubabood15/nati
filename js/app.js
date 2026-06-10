

// =========================
// Main Application Entry
// =========================

function initializeApp() {
  initTheme();
  initAgentControls();

  if (typeof initPopup === 'function') {
    initPopup();
  }

  if (typeof initSearch === 'function') {
    initSearch();
  }

  if (typeof showAgentLoginIfNeeded === 'function') {
    showAgentLoginIfNeeded();
  }

  if (typeof getSavedAgentName === 'function' && typeof isAgentOnline === 'function') {
    if (getSavedAgentName() && isAgentOnline() && typeof startAttendanceHeartbeat === 'function') {
      startAttendanceHeartbeat(false);
    } else if (getSavedAgentName() && typeof stopOnlineTimer === 'function') {
      stopOnlineTimer();
    }
  }

  if (typeof updateOnlineTimer === 'function') {
    updateOnlineTimer();
  }

  console.log('Application Initialized');
}

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  function applyTheme(mode) {
    if (mode === 'night') {
      document.body.classList.add('night-mode');
      themeToggle.textContent = '   🌙   ';
    } else {
      document.body.classList.remove('night-mode');
      themeToggle.textContent = '   ☀️   ';
    }
  }

  const savedTheme = localStorage.getItem('knowledgeTheme') || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const isNight = document.body.classList.toggle('night-mode');
    const newTheme = isNight ? 'night' : 'light';
    localStorage.setItem('knowledgeTheme', newTheme);
    applyTheme(newTheme);
  });
}

function initAgentControls() {
  const agentLoginOverlay = document.getElementById('agentLoginOverlay');
  const agentLoginInput = document.getElementById('agentLoginInput');
  const agentPasswordInput = document.getElementById('agentPasswordInput');
  const loginError = document.getElementById('loginError');
  const agentNameDisplay = document.getElementById('agentNameDisplay');
  const agentLivePanel = document.getElementById('agentLivePanel');
  const onlineToggle = document.getElementById('onlineToggle');
  const agentLogoutBtn = document.getElementById('agentLogoutBtn');
  const agentOnlineBtn = document.getElementById('agentOnlineBtn');
  const agentOfflineBtn = document.getElementById('agentOfflineBtn');

  if (agentLoginInput && agentPasswordInput && typeof completeAgentLogin === 'function') {
    agentLoginInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        completeAgentLogin();
      }
    });

    agentPasswordInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        completeAgentLogin();
      }
    });
  }

  if (agentLogoutBtn) {
    agentLogoutBtn.addEventListener('click', () => {
      logoutAgent();
    });
  }

  if (onlineToggle && agentLivePanel) {
    onlineToggle.addEventListener('click', () => {
      agentLivePanel.classList.toggle('show');
      onlineToggle.classList.toggle('active', agentLivePanel.classList.contains('show'));
    });
  }

  if (agentOnlineBtn) {
    agentOnlineBtn.addEventListener('click', () => {
      if (typeof getSavedAgentName === 'function' && !getSavedAgentName()) {
        if (agentLoginOverlay) {
          agentLoginOverlay.classList.add('show');
        }
        setTimeout(() => agentLoginInput?.focus(), 50);
        return;
      }

      if (typeof setAgentOnlineStatus === 'function') {
        setAgentOnlineStatus('online');
      }

      localStorage.setItem('knowledgeAttendanceLastTick', String(Date.now()));

      if (agentLoginOverlay) {
        agentLoginOverlay.classList.remove('show');
      }

      if (typeof startAttendanceHeartbeat === 'function') {
        startAttendanceHeartbeat(false);
      }

      if (typeof updateOnlineTimer === 'function') {
        updateOnlineTimer();
      }
    });
  }

  if (agentOfflineBtn) {
    agentOfflineBtn.addEventListener('click', () => {
      if (typeof tickOnlineSeconds === 'function') tickOnlineSeconds();
      if (typeof sendAttendanceOffline === 'function') sendAttendanceOffline();
      if (typeof setAgentOnlineStatus === 'function') setAgentOnlineStatus('offline');
      if (typeof stopAttendanceTimers === 'function') stopAttendanceTimers();
      if (typeof updateOnlineTimer === 'function') updateOnlineTimer();

      sessionStorage.removeItem('knowledgeAttendanceSessionId');
      sessionStorage.removeItem('knowledgeAttendanceLoginTime');
      localStorage.removeItem('knowledgeAttendanceLastTick');
    });
  }

  if (agentNameDisplay) {
    agentNameDisplay.style.cursor = 'pointer';
    agentNameDisplay.title = 'Change Name';

    agentNameDisplay.addEventListener('click', () => {
      if (agentLoginInput && typeof getSavedAgentName === 'function') {
        agentLoginInput.value = getSavedAgentName();
      }

      if (agentPasswordInput) {
        agentPasswordInput.value = '';
      }

      if (loginError) {
        loginError.classList.remove('show');
        loginError.textContent = '';
      }

      if (agentLoginOverlay) {
        agentLoginOverlay.classList.add('show');
      }

      setTimeout(() => agentPasswordInput?.focus(), 50);
    });
  }
}

function logoutAgent(options = {}) {
  const { showLogin = true } = options;

  if (typeof tickOnlineSeconds === 'function') tickOnlineSeconds();
  if (typeof sendAttendanceOffline === 'function') sendAttendanceOffline();
  if (typeof setAgentOnlineStatus === 'function') setAgentOnlineStatus('offline');
  if (typeof stopAttendanceTimers === 'function') stopAttendanceTimers();

  sessionStorage.removeItem('knowledgeAttendanceSessionId');
  sessionStorage.removeItem('knowledgeAttendanceLoginTime');
  localStorage.removeItem('knowledgeAttendanceLastTick');
  localStorage.removeItem('knowledgeAgentName');
  localStorage.removeItem('knowledgeAttendanceStatus');
  localStorage.removeItem('knowledgeAttendanceTotalSeconds');

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('knowledgeAttendanceTotalSeconds_')) {
      localStorage.removeItem(key);
    }
  });

  if (typeof updateAgentDisplay === 'function') {
    updateAgentDisplay();
  }

  if (typeof updateOnlineTimer === 'function') {
    updateOnlineTimer();
  }

  if (showLogin) {
    sessionStorage.clear();
    window.location.reload();
  }
}

initializeApp();