const STORAGE_KEY = 'cet6_vocab_progress';

const state = {
    currentMode: 'new',
    currentIndex: 0,
    newWords: [],
    reviewWords: [],
    learned: new Set(),
    showMeaning: false
};

const elements = {
    word: document.getElementById('word'),
    phonetic: document.getElementById('phonetic'),
    meaning: document.getElementById('meaning'),
    example: document.getElementById('example'),
    meaningSection: document.getElementById('meaning-section'),
    hint: document.getElementById('hint'),
    playBtn: document.getElementById('play-btn'),
    wordCard: document.getElementById('word-card'),
    btnForgot: document.getElementById('btn-forgot'),
    btnShow: document.getElementById('btn-show'),
    btnKnow: document.getElementById('btn-know'),
    btnRestart: document.getElementById('btn-restart'),
    modeNew: document.getElementById('mode-new'),
    modeReview: document.getElementById('mode-review'),
    learnedCount: document.getElementById('learned-count'),
    reviewCount: document.getElementById('review-count'),
    remainCount: document.getElementById('remain-count'),
    completeMsg: document.getElementById('complete-msg')
};

function init() {
    loadProgress();
    initNewWords();
    updateStats();
    showCurrentWord();
    bindEvents();
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        state.learned = new Set(data.learned || []);
        state.reviewWords = data.reviewWords || [];
    }
}

function saveProgress() {
    const data = {
        learned: Array.from(state.learned),
        reviewWords: state.reviewWords
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initNewWords() {
    state.newWords = WORDS.filter(w => !state.learned.has(w.word));
}

function showCurrentWord() {
    const wordList = state.currentMode === 'new' ? state.newWords : state.reviewWords;
    
    if (wordList.length === 0 || state.currentIndex >= wordList.length) {
        showComplete();
        return;
    }
    
    const word = wordList[state.currentIndex];
    
    state.showMeaning = false;
    elements.meaningSection.style.display = 'none';
    elements.hint.style.display = 'block';
    
    elements.word.textContent = word.word;
    elements.phonetic.textContent = word.phonetic;
    elements.meaning.textContent = word.meaning;
    elements.example.textContent = word.example ? `📝 ${word.example}` : '';
    
    updateButtonStates();
}

function toggleMeaning() {
    state.showMeaning = !state.showMeaning;
    elements.meaningSection.style.display = state.showMeaning ? 'block' : 'none';
    elements.hint.style.display = state.showMeaning ? 'none' : 'block';
    updateButtonStates();
}

function markKnown() {
    if (!state.showMeaning && state.currentMode === 'new') {
        toggleMeaning();
        return;
    }
    
    const wordList = state.currentMode === 'new' ? state.newWords : state.reviewWords;
    const word = wordList[state.currentIndex];
    
    if (state.currentMode === 'new') {
        state.learned.add(word.word);
        state.reviewWords = state.reviewWords.filter(w => w.word !== word.word);
    } else {
        state.reviewWords = state.reviewWords.filter(w => w.word !== word.word);
        state.currentIndex--;
    }
    
    saveProgress();
    updateStats();
    nextWord();
}

function markForgot() {
    const wordList = state.currentMode === 'new' ? state.newWords : state.reviewWords;
    const word = wordList[state.currentIndex];
    
    state.learned.delete(word.word);
    
    const exists = state.reviewWords.some(w => w.word === word.word);
    if (!exists) {
        state.reviewWords.push(word);
    }
    
    saveProgress();
    updateStats();
    nextWord();
}

function nextWord() {
    state.currentIndex++;
    showCurrentWord();
}

function switchMode(mode) {
    state.currentMode = mode;
    state.currentIndex = 0;
    
    elements.modeNew.classList.toggle('active', mode === 'new');
    elements.modeReview.classList.toggle('active', mode === 'review');
    
    if (mode === 'new') {
        initNewWords();
    }
    
    updateStats();
    showCurrentWord();
}

function updateStats() {
    elements.learnedCount.textContent = state.learned.size;
    elements.reviewCount.textContent = state.reviewWords.length;
    elements.remainCount.textContent = state.newWords.length;
}

function updateButtonStates() {
    const wordList = state.currentMode === 'new' ? state.newWords : state.reviewWords;
    const hasWords = wordList.length > 0 && state.currentIndex < wordList.length;
    
    elements.btnForgot.disabled = !hasWords;
    elements.btnKnow.disabled = !hasWords;
    elements.btnShow.disabled = !hasWords;
    
    if (state.currentMode === 'new' && !state.showMeaning) {
        elements.btnKnow.querySelector('.btn-text').textContent = '认识';
    } else {
        elements.btnKnow.querySelector('.btn-text').textContent = state.currentMode === 'new' ? '认识' : '答对了';
    }
}

function showComplete() {
    elements.completeMsg.style.display = 'block';
}

function restart() {
    state.currentIndex = 0;
    elements.completeMsg.style.display = 'none';
    initNewWords();
    showCurrentWord();
}

function playPronunciation() {
    const wordList = state.currentMode === 'new' ? state.newWords : state.reviewWords;
    if (wordList.length === 0 || state.currentIndex >= wordList.length) return;
    
    const word = wordList[state.currentIndex].word;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function bindEvents() {
    elements.btnKnow.addEventListener('click', markKnown);
    elements.btnForgot.addEventListener('click', markForgot);
    elements.btnShow.addEventListener('click', toggleMeaning);
    elements.wordCard.addEventListener('click', toggleMeaning);
    elements.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playPronunciation();
    });
    elements.btnRestart.addEventListener('click', restart);
    elements.modeNew.addEventListener('click', () => switchMode('new'));
    elements.modeReview.addEventListener('click', () => switchMode('review'));
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'Enter':
                e.preventDefault();
                markKnown();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                markForgot();
                break;
            case ' ':
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                toggleMeaning();
                break;
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
