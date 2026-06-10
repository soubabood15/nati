

// =========================
// Case Feedback
// =========================

const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbweQEGbF94_94FOHfLMZWv3bB7w-TEdllymGF1QGX7S2RUQzVOUguDZU_MGHCRj0NZ7Wg/exec';

async function saveCaseFeedback(type, note = '') {
  if (!window.currentCaseButton) return;

  const agentName = typeof getSavedAgentName === 'function' ? getSavedAgentName() : '';
  const cleanAgentName = agentName || 'Not provided';

  const feedbackItem = {
    date: new Date().toISOString(),
    agentName: cleanAgentName,
    agent_name: cleanAgentName,
    agent: cleanAgentName,
    AgentName: cleanAgentName,
    'Agent Name': cleanAgentName,
    caseTitle: window.currentCaseButton.dataset.title || window.currentCaseButton.textContent.trim(),
    visibleName: window.currentCaseButton.textContent.trim(),
    rating: type,
    feedback: note,
    severity: window.currentCaseButton.dataset.severity || 'Low',
    escalation: window.currentCaseButton.dataset.escalation || 'No',
    refund: window.currentCaseButton.dataset.refund || 'No'
  };

  const feedback = JSON.parse(localStorage.getItem('caseFeedback') || '[]');
  feedback.push(feedbackItem);
  localStorage.setItem('caseFeedback', JSON.stringify(feedback));

  if (!GOOGLE_SHEET_WEB_APP_URL) return;

  try {
    await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(feedbackItem)
    });
  } catch (error) {
    console.error('Google Sheet feedback send failed:', error);
  }
}

function attachFeedbackHandlers() {
  const likeBtn = document.getElementById('caseLikeBtn');
  const dislikeBtn = document.getElementById('caseDislikeBtn');
  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackText = document.getElementById('feedbackText');
  const submitFeedback = document.getElementById('submitFeedback');
  const feedbackMessage = document.getElementById('feedbackMessage');

  if (!likeBtn || !dislikeBtn || !feedbackForm || !feedbackText || !submitFeedback) return;

  likeBtn.addEventListener('click', () => {
    saveCaseFeedback('Like');
    feedbackForm.classList.remove('show');
    feedbackMessage.textContent = 'Thanks, feedback saved.';
    feedbackMessage.classList.add('show');
  });

  dislikeBtn.addEventListener('click', () => {
    feedbackForm.classList.add('show');
    feedbackText.focus();
    feedbackMessage.classList.remove('show');
  });

  submitFeedback.addEventListener('click', () => {
    const note = feedbackText.value.trim();
    saveCaseFeedback('Dislike', note || 'No comment provided');
    feedbackText.value = '';
    feedbackForm.classList.remove('show');
    feedbackMessage.textContent = 'Thanks, feedback saved.';
    feedbackMessage.classList.add('show');
  });
}