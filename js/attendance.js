// =========================
// Attendance / Online Tracking
// =========================

const ATTENDANCE_API_URL = 'https://script.google.com/macros/s/AKfycbwLyic-ucQbjZOJI4EwxzSDuHpqL25YutfFtWckJhVgAZGzUHhMT5xEXmb8eFYMweGG/exec';
const ATTENDANCE_INTERVAL = 30 * 1000;

const ATTENDANCE_SESSION_KEY = 'knowledgeAttendanceSessionId';
const ATTENDANCE_STATUS_KEY = 'knowledgeAttendanceStatus';
const ATTENDANCE_ONLINE_SINCE_KEY = 'knowledgeAttendanceOnlineSince';
const ATTENDANCE_LAST_TICK_KEY = 'knowledgeAttendanceLastTick';
const ATTENDANCE_TOTAL_SECONDS_KEY = 'knowledgeAttendanceTotalSeconds';

let attendanceTimerId = null;
let onlineTimerId = null;
let offlineAlreadySent = false;

const agentOnlineTimer = document.getElementById('agentOnlineTimer');
const agentTodayTotalTimer = document.getElementById('agentTodayTotalTimer');
const agentOnlineBtn = document.getElementById('agentOnlineBtn');
const agentOfflineBtn = document.getElementById('agentOfflineBtn');

function getSavedAgentName() {
  return localStorage.getItem('knowledgeAgentName') || '';
}

function isAgentOnline() {
  return localStorage.getItem(ATTENDANCE_STATUS_KEY) === 'online';
}

function setAgentOnlineStatus(status) {
  localStorage.setItem(ATTENDANCE_STATUS_KEY, status);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayTotalSecondsKey() {
  return `${ATTENDANCE_TOTAL_SECONDS_KEY}_${getTodayKey()}`;
}

function createNewAttendanceSession() {
  const sessionId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  localStorage.setItem(ATTENDANCE_SESSION_KEY, sessionId);
  return sessionId;
}

function getAttendanceSessionId() {
  let sessionId = localStorage.getItem(ATTENDANCE_SESSION_KEY);

  if (!sessionId) {
    sessionId = createNewAttendanceSession();
  }

  return sessionId;
}

function getOnlineSince() {
  return Number(localStorage.getItem(ATTENDANCE_ONLINE_SINCE_KEY) || Date.now());
}

function getOnlineSeconds() {
  if (!isAgentOnline()) {
    return Math.max(0, Number(localStorage.getItem(getTodayTotalSecondsKey()) || 0));
  }

  const onlineSince = getOnlineSince();
  return Math.max(0, Math.floor((Date.now() - onlineSince) / 1000));
}

function saveCurrentOnlineSeconds() {
  localStorage.setItem(getTodayTotalSecondsKey(), String(getOnlineSeconds()));
}

function tickOnlineSeconds() {
  if (!isAgentOnline()) return;

  saveCurrentOnlineSeconds();
  localStorage.setItem(ATTENDANCE_LAST_TICK_KEY, String(Date.now()));
}

function formatOnlineTimer(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateOnlineTimer() {
  if (!agentOnlineTimer) return;

  tickOnlineSeconds();

  agentOnlineTimer.textContent = isAgentOnline() ? 'Online' : 'Offline';

  if (agentTodayTotalTimer) {
    agentTodayTotalTimer.textContent = formatOnlineTimer(getOnlineSeconds());
  }
}

function startOnlineTimer() {
  if (agentOnlineBtn) agentOnlineBtn.disabled = true;
  if (agentOfflineBtn) agentOfflineBtn.disabled = false;

  updateOnlineTimer();

  if (onlineTimerId) {
    clearInterval(onlineTimerId);
  }

  onlineTimerId = setInterval(updateOnlineTimer, 1000);
}

function stopOnlineTimer() {
  if (onlineTimerId) {
    clearInterval(onlineTimerId);
    onlineTimerId = null;
  }

  if (agentOnlineTimer) {
    agentOnlineTimer.textContent = 'Offline';
  }

  if (agentTodayTotalTimer) {
    agentTodayTotalTimer.textContent = formatOnlineTimer(getOnlineSeconds());
  }

  if (agentOnlineBtn) agentOnlineBtn.disabled = false;
  if (agentOfflineBtn) agentOfflineBtn.disabled = true;
}

function sendAttendanceEvent(eventType) {
  const agentName = getSavedAgentName();
  if (!agentName) return;

  const sessionId = getAttendanceSessionId();
  const onlineSince = getOnlineSince();
  const now = Date.now();
  const onlineSeconds = getOnlineSeconds();
  const onlineTimeISO = new Date(onlineSince).toISOString();
  const eventTimeISO = new Date(now).toISOString();

  const callbackName = `attendanceCallback_${eventType}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const script = document.createElement('script');
  const timeout = setTimeout(cleanup, 10000);

  function cleanup() {
    clearTimeout(timeout);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    delete window[callbackName];
  }

  window[callbackName] = cleanup;
  script.onerror = cleanup;

  const params = new URLSearchParams({
    action: eventType,
    agentName,
    sessionId,
    onlineDate: getTodayKey(),
    onlineSince: String(onlineSince),
    onlineTime: onlineTimeISO,
    eventTime: eventTimeISO,
    offlineTime: eventType === 'offline' ? eventTimeISO : '',
    onlineSeconds: String(onlineSeconds),
    totalOnlineSeconds: String(onlineSeconds),
    duration: formatOnlineTimer(onlineSeconds),
    version: window.SYSTEM_VERSION || '1.12.4',
    page: 'Knowledge Base',
    callback: callbackName,
    t: String(Date.now())
  });

  script.src = `${ATTENDANCE_API_URL}?${params.toString()}`;
  document.body.appendChild(script);
}

function startAttendanceHeartbeat(isLoginEvent = false) {
  const wasAlreadyOnline = isAgentOnline() && localStorage.getItem(ATTENDANCE_ONLINE_SINCE_KEY);

  offlineAlreadySent = false;
  setAgentOnlineStatus('online');

  if (!wasAlreadyOnline) {
    localStorage.setItem(ATTENDANCE_ONLINE_SINCE_KEY, String(Date.now()));
    createNewAttendanceSession();
  }

  localStorage.setItem(ATTENDANCE_LAST_TICK_KEY, String(Date.now()));

  if (!wasAlreadyOnline || isLoginEvent) {
    sendAttendanceEvent('online');
  }

  if (attendanceTimerId) {
    clearInterval(attendanceTimerId);
  }

  attendanceTimerId = setInterval(tickOnlineSeconds, ATTENDANCE_INTERVAL);
  startOnlineTimer();
}

function sendAttendanceHeartbeat() {
  tickOnlineSeconds();
}

function sendAttendanceOffline() {
  if (offlineAlreadySent) return;
  offlineAlreadySent = true;

  const agentName = getSavedAgentName();
  if (!agentName) return;

  tickOnlineSeconds();
  saveCurrentOnlineSeconds();
  sendAttendanceEvent('offline');

  setAgentOnlineStatus('offline');
  localStorage.removeItem(ATTENDANCE_ONLINE_SINCE_KEY);
  localStorage.removeItem(ATTENDANCE_LAST_TICK_KEY);
  localStorage.removeItem(ATTENDANCE_SESSION_KEY);

  stopAttendanceTimers();
}

function stopAttendanceTimers() {
  if (attendanceTimerId) {
    clearInterval(attendanceTimerId);
    attendanceTimerId = null;
  }

  stopOnlineTimer();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isAgentOnline()) {
    tickOnlineSeconds();
    updateOnlineTimer();
  }
});