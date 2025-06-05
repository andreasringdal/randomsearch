// Load search engines from engines.json
async function loadSearchEngines() {
    try {
        const response = await fetch('engines.json');
        const data = await response.json();
        return data.engines;
    } catch (error) {
        console.error('Error loading search engines:', error);
        return [];
    }
}

// Get a random search engine from the list
function getRandomSearchEngine(engines) {
    const randomIndex = Math.floor(Math.random() * engines.length);
    return engines[randomIndex];
}

// Get search engine by shortcut
function getSearchEngineByShortcut(engines, shortcut) {
    return engines.find(engine => engine.shortcut === shortcut);
}

// Format the search URL with the query
function formatSearchUrl(engine, query) {
    return engine.urlTemplate.replace('%s', encodeURIComponent(query));
}

// Get query from URL parameters
function getQueryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}

async function performSearch(query) {
    const engines = await loadSearchEngines();
    if (engines.length === 0) {
        console.error('No search engines available');
        return;
    }

    let selectedEngine;
    if (query.startsWith('!')) {
        const shortcut = query.substring(1).split(' ')[0];
        const remainingQuery = query.substring(shortcut.length + 2);
        selectedEngine = getSearchEngineByShortcut(engines, shortcut);
        if (selectedEngine) {
            query = remainingQuery;
        }
    }

    if (!selectedEngine) {
        selectedEngine = getRandomSearchEngine(engines);
    }

    const searchUrl = formatSearchUrl(selectedEngine, query);
    window.location.href = searchUrl;
}

// Initialize the search functionality
async function init() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    // Check for query in URL
    const urlQuery = getQueryFromUrl();
    if (urlQuery) {
        searchInput.value = urlQuery;
        await performSearch(urlQuery);
    }

    // Handle form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            await performSearch(query);
        }
    });
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
