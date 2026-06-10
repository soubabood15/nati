

// =========================
// Search / Quick Access / Recently Opened
// =========================

const quickAccessList = document.getElementById('quickAccessList');
const recentList = document.getElementById('recentList');
const searchInput = document.getElementById('knowledgeSearch');
const noResults = document.getElementById('noResults');
const sections = document.querySelectorAll('.section');
const groupBoxes = document.querySelectorAll('.group-box');
const groupButtons = document.querySelectorAll('.group-btn');

function getActionButtons() {
  return document.querySelectorAll('.action-btn');
}

function findButtonByTitle(title) {
  return Array.from(getActionButtons()).find((button) => (button.dataset.title || button.textContent) === title);
}

function saveRecentCase(title) {
  let recent = JSON.parse(localStorage.getItem('recentCases') || '[]');
  recent = recent.filter((item) => item !== title);
  recent.unshift(title);
  recent = recent.slice(0, 5);
  localStorage.setItem('recentCases', JSON.stringify(recent));
}

function renderRecentCases() {
  if (!recentList) return;

  const recent = JSON.parse(localStorage.getItem('recentCases') || '[]');
  recentList.innerHTML = '';

  if (recent.length === 0) {
    recentList.innerHTML = '<div class="mini-empty">No recently opened cases yet</div>';
    return;
  }

  recent.forEach((title) => {
    const chip = document.createElement('button');
    chip.className = 'mini-chip';
    chip.type = 'button';
    chip.textContent = title;
    chip.addEventListener('click', () => {
      if (typeof openCaseFromButton === 'function') {
        openCaseFromButton(findButtonByTitle(title));
      }
    });
    recentList.appendChild(chip);
  });
}

function renderQuickAccess() {
  if (!quickAccessList) return;

  const importantCases = Array.from(getActionButtons())
    .filter((button) => {
      const severity = (button.dataset.severity || '').toLowerCase();
      const escalation = (button.dataset.escalation || '').toLowerCase();
      return severity === 'high' || escalation === 'yes';
    })
    .slice(0, 6);

  quickAccessList.innerHTML = '';

  if (importantCases.length === 0) {
    quickAccessList.innerHTML = '<div class="mini-empty">No quick access cases yet</div>';
    return;
  }

  importantCases.forEach((button) => {
    const chip = document.createElement('button');
    chip.className = 'mini-chip';
    chip.type = 'button';
    chip.textContent = button.textContent.trim();
    chip.addEventListener('click', () => {
      if (typeof openCaseFromButton === 'function') {
        openCaseFromButton(button);
      }
    });
    quickAccessList.appendChild(chip);
  });
}

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .trim();
}

function getButtonSearchText(button) {
  return [
    button.textContent,
    button.dataset.title,
    button.dataset.desc
  ].join(' ');
}

function clearHighlights() {
  getActionButtons().forEach((button) => {
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  });
}

function highlightButtonText(button, query) {
  if (!query) return;

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent.trim();
  }

  const original = button.dataset.originalText;
  const normalizedOriginal = normalizeText(original);
  const index = normalizedOriginal.indexOf(query);

  if (index === -1) {
    button.textContent = original;
    return;
  }

  const before = original.slice(0, index);
  const match = original.slice(index, index + query.length);
  const after = original.slice(index + query.length);
  button.innerHTML = `${before}<mark class="search-highlight">${match}</mark>${after}`;
}

function resetSearchView() {
  groupBoxes.forEach((group) => {
    group.classList.remove('hidden-by-search', 'search-open');
  });

  getActionButtons().forEach((button) => {
    button.classList.remove('hidden-by-search');
  });

  document.querySelectorAll('.empty-state').forEach((emptyState) => {
    emptyState.classList.remove('hidden-by-search');
  });

  sections.forEach((section) => {
    section.classList.remove('hidden-by-search');
  });
}

function filterKnowledgeBase() {
  if (!searchInput) return;

  const query = normalizeText(searchInput.value);
  clearHighlights();
  resetSearchView();

  let anyResult = false;

  if (query === '') {
    if (noResults) noResults.classList.remove('show');
    clearHighlights();
    return;
  }

  sections.forEach((section) => {
    let sectionHasResult = false;
    const sectionTitle = normalizeText(section.querySelector('h2')?.textContent || '');

    section.querySelectorAll('.group-box').forEach((group) => {
      const groupTitle = normalizeText(group.querySelector('.group-btn')?.textContent || '');
      const groupMatches = groupTitle.includes(query) || query.includes(groupTitle);
      let groupHasResult = groupMatches || sectionTitle.includes(query);

      group.querySelectorAll('.action-btn').forEach((button) => {
        const buttonText = normalizeText(getButtonSearchText(button));
        const buttonMatches = buttonText.includes(query);

        if (buttonMatches || groupMatches || sectionTitle.includes(query)) {
          button.classList.remove('hidden-by-search');
          highlightButtonText(button, query);
          groupHasResult = true;
        } else {
          button.classList.add('hidden-by-search');
        }
      });

      group.querySelectorAll('.empty-state').forEach((emptyState) => {
        const emptyText = normalizeText(emptyState.textContent);
        const emptyMatches = emptyText.includes(query) || groupMatches || sectionTitle.includes(query);

        if (emptyMatches) {
          emptyState.classList.remove('hidden-by-search');
          groupHasResult = true;
        } else {
          emptyState.classList.add('hidden-by-search');
        }
      });

      if (groupHasResult) {
        group.classList.remove('hidden-by-search');
        group.classList.add('search-open');
        sectionHasResult = true;
        anyResult = true;
      } else {
        group.classList.add('hidden-by-search');
      }
    });

    if (sectionHasResult) {
      section.classList.remove('hidden-by-search');
    } else {
      section.classList.add('hidden-by-search');
    }
  });

  if (noResults) {
    noResults.classList.toggle('show', !anyResult);
  }
}

function initGroupButtons() {
  groupButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentGroup = button.closest('.group-box');
      const parentBox = button.closest('.empty-box');

      if (!currentGroup || !parentBox) return;

      parentBox.querySelectorAll('.group-box').forEach((group) => {
        if (group !== currentGroup) {
          group.classList.remove('active');
        }
      });

      currentGroup.classList.toggle('active');
    });
  });
}

function initSearchBox() {
  if (!searchInput) return;

  const searchBox = searchInput.closest('.search-box');

  if (searchBox) {
    searchBox.addEventListener('click', () => {
      searchBox.classList.add('open');
      searchInput.focus();
    });

    searchInput.addEventListener('focus', () => {
      searchBox.classList.add('open');
    });

    searchInput.addEventListener('blur', () => {
      if (searchInput.value.trim() === '') {
        searchBox.classList.remove('open');
      }
    });
  }

  searchInput.addEventListener('input', filterKnowledgeBase);
}

function initSearch() {
  initGroupButtons();
  initSearchBox();
  renderQuickAccess();
  renderRecentCases();
}