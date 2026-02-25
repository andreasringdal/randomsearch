var STORAGE_KEYS = {
    ENABLED_ENGINES: 'rs_enabledEngines',
    KNOWN_ENGINES: 'rs_knownEngines',
    LAST_NEW_ENGINE_PROMPT: 'rs_lastNewEnginePrompt'
};
// ---- Storage helpers ----
function storageGet(key) {
    try {
        var value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : null;
    } catch (e) {
        return null;
    }
}
function storageSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
// ---- Preferences ----
function getEnabledEngines() {
    return storageGet(STORAGE_KEYS.ENABLED_ENGINES);
}
function setEnabledEngines(shortcuts) {
    storageSet(STORAGE_KEYS.ENABLED_ENGINES, shortcuts);
}
function getKnownEngines() {
    return storageGet(STORAGE_KEYS.KNOWN_ENGINES);
}
function setKnownEngines(shortcuts) {
    storageSet(STORAGE_KEYS.KNOWN_ENGINES, shortcuts);
}
function hasConfiguredEngines() {
    return getEnabledEngines() !== null;
}
// ---- New engine detection ----
function detectNewEngines(allEngines) {
    var known = getKnownEngines();
    if (!known) return [];
    return allEngines.filter(function(e) {
        return !known.includes(e.shortcut);
    });
}
function wasPromptedToday() {
    var last = storageGet(STORAGE_KEYS.LAST_NEW_ENGINE_PROMPT);
    if (!last) return false;
    return last === new Date().toISOString().split('T')[0];
}
function markPromptedToday() {
    storageSet(STORAGE_KEYS.LAST_NEW_ENGINE_PROMPT, new Date().toISOString().split('T')[0]);
}
// ---- Engine loading ----
async function loadSearchEngines() {
    try {
        var response = await fetch('engines.json');
        var data = await response.json();
        return data.engines;
    } catch (error) {
        console.error('Error loading search engines:', error);
        return [];
    }
}
// ---- Search helpers ----
function getRandomSearchEngine(engines) {
    var randomIndex = Math.floor(Math.random() * engines.length);
    return engines[randomIndex];
}
function getSearchEngineByShortcut(engines, shortcut) {
    return engines.find(function(engine) {
        return engine.shortcut === shortcut;
    });
}
function formatSearchUrl(engine, query) {
    return engine.urlTemplate.replace('%s', encodeURIComponent(query));
}
function getQueryFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}
// ---- Application state ----
var allEngines = [];
var pendingQuery = null;
var pendingEngine = null;
// ---- UI helpers ----
function showModal(id) {
    document.getElementById(id).classList.add('active');
}
function hideModal(id) {
    document.getElementById(id).classList.remove('active');
}
function renderEngineCheckboxes(containerId, engines, checkedShortcuts)
{
    var container = document.getElementById(containerId);
    container.innerHTML = engines.map(function(e) {
        var checked = checkedShortcuts.includes(e.shortcut) ? 'checked'
: '';
        return '<label class="engine-item">' +
            '<input type="checkbox" value="' + e.shortcut + '" ' + check
ed + '>' +
            '<span class="engine-name">' + e.displayName + '</span>' +
            '<span class="engine-shortcut">!' + e.shortcut + '</span>' +
            '</label>';
    }).join('');
}
function getCheckedValues(containerId) {
    return Array.from(
        document.querySelectorAll('#' + containerId + ' input[type="checkbox"]:checked')
    ).map(function(cb) { return cb.value; });
}
function populateDropdown() {
    var dropdown = document.getElementById('engineDropdown');
    dropdown.innerHTML = allEngines.map(function(e) {
        return '<button type="button" class="dropdown-item" role="menuitem" data-shortcut="' + e.shortcut + '">' +
            '<span>' + e.displayName + '</span>' +
            '<span class="shortcut">!' + e.shortcut + '</span>' +
            '</button>';
    }).join('');
}
// ---- Search flow ----
function executeSearch(query, specificEngine) {
    var enabledShortcuts = getEnabledEngines() || allEngines.map(function(e) { return e.shortcut; });
    var enabledEngines = allEngines.filter(function(e) { return enabledShortcuts.includes(e.shortcut); });
    var selectedEngine = specificEngine || null;
    if (!selectedEngine && query.startsWith('!')) {
        var shortcut = query.substring(1).split(' ')[0];
        var remainingQuery = query.substring(shortcut.length + 2);
        selectedEngine = getSearchEngineByShortcut(allEngines, shortcut);
        if (selectedEngine) {
            query = remainingQuery;
        }
    }
    if (!selectedEngine) {
        if (enabledEngines.length === 0) {
            console.error('No engines enabled');
            return;
        }
        selectedEngine = getRandomSearchEngine(enabledEngines);
    }
    window.location.href = formatSearchUrl(selectedEngine, query);
}
function resolvePending() {
    if (pendingQuery) {
        var q = pendingQuery;
        var e = pendingEngine;
        pendingQuery = null;
        pendingEngine = null;
        attemptSearch(q, e);
    }
}
function attemptSearch(query, specificEngine) {
    // Dropdown picks bypass configuration checks
    if (specificEngine) {
        executeSearch(query, specificEngine);
        return;
    }
    if (!hasConfiguredEngines()) {
        pendingQuery = query;
        pendingEngine = null;
        openSettingsModal(true);
        return;
    }
    var newEngines = detectNewEngines(allEngines);
    if (newEngines.length > 0 && !wasPromptedToday()) {
        pendingQuery = query;
        pendingEngine = null;
        openNewEnginesModal(newEngines);
        return;
    }
    executeSearch(query, null);
}
// ---- Settings modal ----
function openSettingsModal(isFirstTime) {
    var title = document.getElementById('settingsTitle');
    title.textContent = isFirstTime
        ? 'Welcome! Configure Your Search Engines'
        : 'Configure Search Engines';
    var enabled = getEnabledEngines() || allEngines.map(function(e) { return e.shortcut; });
    renderEngineCheckboxes('engineList', allEngines, enabled);
    showModal('settingsOverlay');
}
function saveSettings() {
    var checked = getCheckedValues('engineList');
    if (checked.length === 0) {
        alert('Please select at least one search engine.');
        return;
    }
    setEnabledEngines(checked);
    setKnownEngines(allEngines.map(function(e) { return e.shortcut; }));
    hideModal('settingsOverlay');
    resolvePending();
}
function closeSettings() {
    hideModal('settingsOverlay');
    pendingQuery = null;
    pendingEngine = null;
}
// ---- New engines modal ----
function openNewEnginesModal(newEngines) {
    markPromptedToday();
    renderEngineCheckboxes('newEngineList', newEngines, newEngines.map(function(e) { return e.shortcut; }));
    showModal('newEnginesOverlay');
}
function saveNewEngines() {
    var enabled = getEnabledEngines() || [];
    var known = getKnownEngines() || [];
    document.querySelectorAll('#newEngineList input[type="checkbox"]').forEach(function(cb) {
        if (!known.includes(cb.value)) {
            known.push(cb.value);
        }
        if (cb.checked && !enabled.includes(cb.value)) {
            enabled.push(cb.value);
        }
    });
    setEnabledEngines(enabled);
    setKnownEngines(known);
    hideModal('newEnginesOverlay');
    resolvePending();
}
function dismissNewEngines() {
    hideModal('newEnginesOverlay');
    resolvePending();
}
// ---- Initialization ----
async function init() {
    var searchForm = document.getElementById('searchForm');
    var searchInput = document.getElementById('searchInput');
    allEngines = await loadSearchEngines();
    populateDropdown();
    // Dropdown toggle
    var dropdownToggle = document.getElementById('dropdownToggle');
    var dropdown = document.getElementById('engineDropdown');
    dropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('show');
        dropdownToggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
    });
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        var item = e.target.closest('.dropdown-item');
        if (!item) return;
        dropdown.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
        var shortcut = item.dataset.shortcut;
        var engine = getSearchEngineByShortcut(allEngines, shortcut);
        var query = searchInput.value.trim();
        if (!query) {
            searchInput.focus();
            return;
        }
        attemptSearch(query, engine);
    });
    // Settings modal
    document.getElementById('openSettings').addEventListener('click', function(e) {
        e.preventDefault();
        if (document.getElementById('settingsOverlay').classList.contains('active')) return;
        openSettingsModal(false);
    });
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('settingsCancel').addEventListener('click',closeSettings);
    document.getElementById('selectAll').addEventListener('click', function() {
        document.querySelectorAll('#engineList input[type="checkbox"]').
        forEach(function(cb) { cb.checked = true; });
    });
    document.getElementById('deselectAll').addEventListener('click', function() {
        document.querySelectorAll('#engineList input[type="checkbox"]').
        forEach(function(cb) { cb.checked = false; });
    });
    // New engines modal
    document.getElementById('saveNewEngines').addEventListener('click',saveNewEngines);
    document.getElementById('newEnginesClose').addEventListener('click', dismissNewEngines);
    document.getElementById('dismissNewEngines').addEventListener('click', dismissNewEngines);
    // Form submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var query = searchInput.value.trim();
        if (query) {
            attemptSearch(query, null);
        }
    });
    // Handle URL query and proactive new engine check
    var urlQuery = getQueryFromUrl();
    if (urlQuery) {
        searchInput.value = urlQuery;
        attemptSearch(urlQuery, null);
    } else if (hasConfiguredEngines()) {
        var newEngines = detectNewEngines(allEngines);
        if (newEngines.length > 0 && !wasPromptedToday()) {
            openNewEnginesModal(newEngines);
        }
    }
}
document.addEventListener('DOMContentLoaded', init);