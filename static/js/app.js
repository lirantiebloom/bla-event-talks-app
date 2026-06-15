// Application State
let releaseNotes = [];
let currentFilter = 'all';
let currentSearch = '';
let activeUpdateForTweet = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterChips = document.querySelectorAll('.filter-chip');
const feedContainer = document.getElementById('feed-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const appHeader = document.getElementById('app-header');

// Stats Elements
const countTotal = document.getElementById('count-total');
const countFeatures = document.getElementById('count-features');
const countChanges = document.getElementById('count-changes');
const countOthers = document.getElementById('count-others');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charProgress = document.getElementById('char-progress');
const closeModalBtn = document.getElementById('close-modal-btn');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const tweetCharBar = document.querySelector('.tweet-character-bar');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
    
    // Add scroll styling to header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            appHeader.classList.add('scrolled');
        } else {
            appHeader.classList.remove('scrolled');
        }
    });
});

// Event Listeners Setup
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search inputs
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = currentSearch.length > 0 ? 'flex' : 'none';
        renderFeed();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        renderFeed();
    });
    
    // Filter chip clicks
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-type');
            renderFeed();
        });
    });
    
    // Tweet Modal controls
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });
    
    tweetTextarea.addEventListener('input', updateCharCount);
    
    copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    postTweetBtn.addEventListener('click', postTweetToX);
}

// Fetch data from Flask API
async function fetchReleaseNotes() {
    showState('loading');
    refreshBtn.classList.add('refreshing');
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`Server returned code ${response.status}`);
        }
        const data = await response.json();
        releaseNotes = data;
        
        updateStats();
        renderFeed();
        showState('content');
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.textContent = `Error details: ${error.message}`;
        showState('error');
    } finally {
        refreshBtn.classList.remove('refreshing');
        // Initialize Lucide icons on newly rendered/state elements
        lucide.createIcons();
    }
}

// Update Dashboard Statistics Card Counters
function updateStats() {
    let total = 0;
    let features = 0;
    let changes = 0;
    let others = 0;
    
    releaseNotes.forEach(entry => {
        entry.updates.forEach(update => {
            total++;
            const type = update.type.toLowerCase();
            if (type.includes('feature')) {
                features++;
            } else if (type.includes('change')) {
                changes++;
            } else {
                others++;
            }
        });
    });
    
    animateCounter(countTotal, total);
    animateCounter(countFeatures, features);
    animateCounter(countChanges, changes);
    animateCounter(countOthers, others);
}

// Simple counter animation
function animateCounter(element, target) {
    let current = 0;
    const duration = 800; // ms
    const stepTime = Math.max(Math.floor(duration / (target || 1)), 15);
    
    if (target === 0) {
        element.textContent = '0';
        return;
    }
    
    const timer = setInterval(() => {
        current++;
        element.textContent = current;
        if (current >= target) {
            clearInterval(timer);
            element.textContent = target; // Ensure exact value at end
        }
    }, stepTime);
}

// Display/Hide States (loading, content, error, empty)
function showState(state) {
    loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    feedContainer.style.display = state === 'content' ? 'flex' : 'none';
    errorState.style.display = state === 'error' ? 'flex' : 'none';
    emptyState.style.display = state === 'empty' ? 'flex' : 'none';
    
    if (state === 'content') {
        const hasVisibleContent = feedContainer.children.length > 0;
        if (!hasVisibleContent) {
            feedContainer.style.display = 'none';
            emptyState.style.display = 'flex';
        }
    }
}

// Render the Main Release Feed
function renderFeed() {
    feedContainer.innerHTML = '';
    
    releaseNotes.forEach(entry => {
        // Filter the updates in this entry
        const filteredUpdates = entry.updates.filter(update => {
            const matchesFilter = 
                currentFilter === 'all' || 
                update.type.toLowerCase().includes(currentFilter);
                
            const matchesSearch = 
                currentSearch === '' || 
                update.plain_text.toLowerCase().includes(currentSearch) ||
                update.type.toLowerCase().includes(currentSearch) ||
                entry.date.toLowerCase().includes(currentSearch);
                
            return matchesFilter && matchesSearch;
        });
        
        // If there are matching updates, render this date group
        if (filteredUpdates.length > 0) {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `
                <h3 class="date-title">${entry.date}</h3>
                <div class="date-line"></div>
            `;
            dateGroup.appendChild(dateHeader);
            
            filteredUpdates.forEach(update => {
                const typeClass = getBadgeTypeClass(update.type);
                const card = document.createElement('div');
                card.className = `update-card glass ${typeClass}`;
                
                // Construct HTML content safe for embedding
                card.innerHTML = `
                    <div class="card-header">
                        <span class="badge ${typeClass}">
                            <i data-lucide="${getBadgeIcon(update.type)}"></i>
                            ${update.type}
                        </span>
                        <div class="card-actions">
                            <button class="btn-icon btn-tweet" title="Share update on X (Twitter)" data-id="${update.id}">
                                <i data-lucide="twitter"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${update.body}
                    </div>
                `;
                
                // Add click listener for Twitter sharing
                const tweetBtn = card.querySelector('.btn-tweet');
                tweetBtn.addEventListener('click', () => {
                    openTweetModal(entry, update);
                });
                
                dateGroup.appendChild(card);
            });
            
            feedContainer.appendChild(dateGroup);
        }
    });
    
    // Update active states and re-instantiate lucide icons
    lucide.createIcons();
    showState('content');
}

// Helpers for UI badges
function getBadgeTypeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'feature';
    if (t.includes('change')) return 'change';
    if (t.includes('deprecation')) return 'deprecation';
    return 'update'; // general updates
}

function getBadgeIcon(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'sparkles';
    if (t.includes('change')) return 'sliders';
    if (t.includes('deprecation')) return 'alert-triangle';
    return 'info';
}

// Tweet Modal Logic
function openTweetModal(entry, update) {
    activeUpdateForTweet = { entry, update };
    
    // Generate pre-populated tweet
    const maxLen = 280;
    const prefix = `🚀 BigQuery ${update.type} (${entry.date}):\n`;
    const suffix = `\n\nSource: `;
    const link = entry.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes';
    
    const reservedLen = prefix.length + suffix.length + link.length;
    const maxBodyLen = maxLen - reservedLen;
    
    let bodyText = update.plain_text;
    if (bodyText.length > maxBodyLen) {
        bodyText = bodyText.substring(0, maxBodyLen - 3) + '...';
    }
    
    tweetTextarea.value = `${prefix}${bodyText}${suffix}${link}`;
    
    // Show Modal
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // lock background scrolling
    updateCharCount();
    
    setTimeout(() => {
        tweetTextarea.focus();
    }, 100);
}

function closeTweetModal() {
    tweetModal.classList.add('fade-out');
    // Simple transition close
    setTimeout(() => {
        tweetModal.style.display = 'none';
        tweetModal.classList.remove('fade-out');
        document.body.style.overflow = 'auto'; // unlock background scrolling
        activeUpdateForTweet = null;
    }, 200);
}

function updateCharCount() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = `${len} / 280`;
    
    // Progress percentage
    const percent = Math.min((len / 280) * 100, 100);
    charProgress.style.width = `${percent}%`;
    
    // Warning classes
    tweetCharBar.classList.remove('warning', 'danger');
    if (len > 280) {
        tweetCharBar.classList.add('danger');
        postTweetBtn.disabled = true;
    } else if (len > 250) {
        tweetCharBar.classList.add('warning');
        postTweetBtn.disabled = false;
    } else {
        postTweetBtn.disabled = len === 0;
    }
}

// Copy Tweet Text to Clipboard
async function copyTweetToClipboard() {
    try {
        await navigator.clipboard.writeText(tweetTextarea.value);
        showToast('Tweet copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy text.', true);
    }
}

// Open X/Twitter Intent
function postTweetToX() {
    const text = tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeTweetModal();
}

// Toast Alert Manager
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    
    const toastIcon = toast.querySelector('.toast-icon');
    if (isError) {
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.style.color = 'var(--color-deprecation)';
    } else {
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.style.color = 'var(--color-feature)';
    }
    lucide.createIcons();
    
    toast.style.display = 'flex';
    
    // Fade out timer
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
