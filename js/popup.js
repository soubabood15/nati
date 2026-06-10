

// =========================
// Popup / Case Details
// =========================

const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');
const popupImageBox = document.getElementById('popupImageBox');
const popupImage = document.getElementById('popupImage');
const closePopup = document.getElementById('closePopup');

window.currentCaseButton = null;

function getSeverityFromButton(button) {
  const text = `${button.dataset.title || ''} ${button.dataset.desc || ''}`.toLowerCase();

  if (
    text.includes('payment') ||
    text.includes('refund') ||
    text.includes('not received') ||
    text.includes('damaged') ||
    text.includes('wrong order') ||
    text.includes('مبلغ') ||
    text.includes('استرجاع') ||
    text.includes('لم يستلمه')
  ) {
    return 'High';
  }

  if (
    text.includes('late') ||
    text.includes('missing') ||
    text.includes('unavailable') ||
    text.includes('cancel') ||
    text.includes('تأخير') ||
    text.includes('ناقص') ||
    text.includes('إلغاء')
  ) {
    return 'Medium';
  }

  return 'Low';
}

function getEscalationFromButton(button) {
  const text = `${button.dataset.title || ''} ${button.dataset.desc || ''}`.toLowerCase();

  if (
    text.includes('payment') ||
    text.includes('refund') ||
    text.includes('not received') ||
    text.includes('صعّد') ||
    text.includes('ارفع') ||
    text.includes('الدعم التقني') ||
    text.includes('المدفوعات') ||
    text.includes('المالية')
  ) {
    return 'Yes';
  }

  return 'No';
}

function getRefundFromButton(button) {
  const text = `${button.dataset.title || ''} ${button.dataset.desc || ''}`.toLowerCase();

  if (
    text.includes('refund') ||
    text.includes('استرجاع') ||
    text.includes('missing item') ||
    text.includes('wrong order') ||
    text.includes('damaged') ||
    text.includes('مبلغ') ||
    text.includes('ناقص') ||
    text.includes('تالف')
  ) {
    return 'Yes';
  }

  return 'No';
}

function buildPopupCards(description, severity = 'Low', escalation = 'No', refund = 'No') {
  const cleanDescription = description.replaceAll('\\n', '\n');
  const lines = cleanDescription
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  let html = '';
  const severityClass = `severity-${severity.toLowerCase()}`;
  const escalationClass = escalation.toLowerCase() === 'yes' ? 'escalation-yes' : 'escalation-no';
  const refundClass = refund.toLowerCase() === 'yes' ? 'refund-yes' : 'refund-no';

  html += `
    <div class="case-meta-row">
      <span class="severity-badge ${severityClass}">Priority: ${severity}</span>
      <span class="escalation-badge ${escalationClass}">Escalation: ${escalation}</span>
      <span class="refund-badge ${refundClass}">Refund: ${refund}</span>
    </div>

    <div class="info-card">
      <span class="info-card-title">Was this case helpful?</span>
      <div class="feedback-row">
        <button class="feedback-btn like" id="caseLikeBtn" type="button">✅ Helpful</button>
        <button class="feedback-btn dislike" id="caseDislikeBtn" type="button">⚠️ Needs Fix</button>
      </div>
      <div class="feedback-form" id="feedbackForm">
        <textarea id="feedbackText" placeholder="اكتب ملاحظتك: شو الغلط أو شو لازم يتعدل؟"></textarea>
        <button class="feedback-submit" id="submitFeedback" type="button">Save Feedback</button>
      </div>
      <div class="feedback-message" id="feedbackMessage">Thanks, feedback saved.</div>
    </div>
  `;

  lines.forEach((line) => {
    if (line.startsWith('المشكلة:')) {
      html += `
        <div class="info-card issue-card">
          <span class="info-card-title">المشكلة</span>
          ${line.replace('المشكلة:', '').trim()}
        </div>
      `;
    } else if (/^\d+\./.test(line)) {
      const stepNumber = line.match(/^\d+/)[0];
      const stepText = line.replace(/^\d+\.\s*/, '');
      html += `
        <div class="info-card step-card">
          <span class="info-card-title">الخطوة ${stepNumber}</span>
          ${stepText}
        </div>
      `;
    } else if (line.startsWith('رد مقترح:')) {
      const replyText = line.replace('رد مقترح:', '').trim();
      html += `
        <div class="info-card reply-card">
          <span class="info-card-title">رد مقترح</span>
          <div class="reply-copy-text">${replyText}</div>
          <button class="copy-reply-btn" type="button" data-reply="${encodeURIComponent(replyText)}">Copy Reply</button>
        </div>
      `;
    } else if (!line.includes('خطوات التعامل')) {
      html += `
        <div class="info-card">
          ${line}
        </div>
      `;
    }
  });

  return html || '<div class="info-card">لا يوجد شرح مضاف لهذا الزر.</div>';
}

function openCaseFromButton(button) {
  if (!button) return;

  window.currentCaseButton = button;

  const title = button.dataset.title || button.textContent;
  const desc = button.dataset.desc || 'لا يوجد شرح مضاف لهذا الزر.';
  const img = button.dataset.img || '';
  const severity = button.dataset.severity || 'Low';
  const escalation = button.dataset.escalation || 'No';
  const refund = button.dataset.refund || 'No';

  popupTitle.textContent = title;
  popupDesc.innerHTML = buildPopupCards(desc, severity, escalation, refund);

  if (typeof attachFeedbackHandlers === 'function') {
    attachFeedbackHandlers();
  }

  if (img.trim() !== '') {
    popupImage.src = img;
    popupImageBox.classList.add('has-image');
  } else {
    popupImage.removeAttribute('src');
    popupImageBox.classList.remove('has-image');
  }

  if (typeof saveRecentCase === 'function') {
    saveRecentCase(title);
  }

  if (typeof renderRecentCases === 'function') {
    renderRecentCases();
  }

  popupOverlay.classList.add('active');
}

function closeCasePopup() {
  if (popupOverlay) {
    popupOverlay.classList.remove('active');
  }
}

function initPopup() {
  const actionButtons = document.querySelectorAll('.action-btn');

  actionButtons.forEach((button, index) => {
    button.dataset.caseId = button.dataset.caseId || `case-${index}`;
    button.dataset.severity = button.dataset.severity || getSeverityFromButton(button);
    button.dataset.escalation = button.dataset.escalation || getEscalationFromButton(button);
    button.dataset.refund = button.dataset.refund || getRefundFromButton(button);

    button.addEventListener('click', () => {
      openCaseFromButton(button);
    });
  });

  if (closePopup) {
    closePopup.addEventListener('click', closeCasePopup);
  }

  if (popupOverlay) {
    popupOverlay.addEventListener('click', (event) => {
      if (event.target === popupOverlay) {
        closeCasePopup();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCasePopup();
    }
  });

  if (popupDesc) {
    popupDesc.addEventListener('click', async (event) => {
      const copyBtn = event.target.closest('.copy-reply-btn');
      if (!copyBtn) return;

      const replyText = decodeURIComponent(copyBtn.dataset.reply || '');
      if (!replyText) return;

      try {
        await navigator.clipboard.writeText(replyText);
      } catch (error) {
        const tempInput = document.createElement('textarea');
        tempInput.value = replyText;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      copyBtn.textContent = 'Copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Reply';
      }, 1200);
    });
  }
}