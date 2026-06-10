

// =========================
// System Status / Force Refresh
// =========================

window.SYSTEM_VERSION = '1.12.4';

const SYSTEM_API_URL = 'https://script.google.com/macros/s/AKfycbxex_2mAQYOdF2IIDbPVZ5gCDL9Cghl1owMOLBbT_G920xOATn3-H70nIG-R62huEI7pA/exec';
const SYSTEM_CHECK_INTERVAL = 30000;
const REFRESH_KEY_STORAGE_KEY = 'knowledgeRefreshKey';
const CLOSED_LOGOUT_DONE_KEY = 'knowledgeClosedLogoutDone';

const versionStatus = document.getElementById('versionStatus');
const updateVersionDetails = document.getElementById('updateVersionDetails');
const updateRefreshBtn = document.getElementById('updateRefreshBtn');
const systemClosedOverlay = document.getElementById('systemClosedOverlay');

function forceLogoutAndReload(nextRefreshKey = '') {
  try {
    if (typeof logoutAgent === 'function') {
      logoutAgent({ showLogin: false });
    }
  } catch (e) {}

  if (nextRefreshKey) {
    localStorage.setItem(REFRESH_KEY_STORAGE_KEY, nextRefreshKey);
  }

  window.location.reload();
}

function checkSystemStatus() {
  const callbackName = `systemStatus_${Date.now()}`;
  const script = document.createElement('script');

  window[callbackName] = (result) => {
    delete window[callbackName];
    script.remove();

    if (!result || !result.success) return;

    const serverRefreshKey = String(result.refreshKey || 'initial');
    const systemStatus = String(result.systemStatus || 'OPEN');

    const savedRefreshKey = localStorage.getItem(REFRESH_KEY_STORAGE_KEY) || serverRefreshKey;

    if (!localStorage.getItem(REFRESH_KEY_STORAGE_KEY)) {
      localStorage.setItem(REFRESH_KEY_STORAGE_KEY, serverRefreshKey);
    }

    if (versionStatus) {
      versionStatus.textContent = `Status: ${systemStatus}`;
    }

    if (systemStatus === 'CLOSED') {
      if (systemClosedOverlay) {
        systemClosedOverlay.classList.add('show');
      }

      if (!localStorage.getItem(CLOSED_LOGOUT_DONE_KEY)) {
        localStorage.setItem(CLOSED_LOGOUT_DONE_KEY, '1');
        forceLogoutAndReload(serverRefreshKey);
      }
      return;
    }

    localStorage.removeItem(CLOSED_LOGOUT_DONE_KEY);

    if (systemClosedOverlay) {
      systemClosedOverlay.classList.remove('show');
    }

    if (serverRefreshKey !== savedRefreshKey) {
      if (updateVersionDetails) {
        updateVersionDetails.textContent = `Old: ${savedRefreshKey} | New: ${serverRefreshKey}`;
      }

      forceLogoutAndReload(serverRefreshKey);
    }
  };

  script.src = `${SYSTEM_API_URL}?action=getSystem&callback=${callbackName}&t=${Date.now()}`;
  document.body.appendChild(script);
}

if (updateRefreshBtn) {
  updateRefreshBtn.addEventListener('click', () => {
    window.location.reload(true);
  });
}

checkSystemStatus();
setInterval(checkSystemStatus, SYSTEM_CHECK_INTERVAL);