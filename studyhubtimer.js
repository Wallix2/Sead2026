//these are all the variables used as well as functions
const display = document.getElementById('timerDisplay');
const ring = document.getElementById('timerRing');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const timerMinutesInput = document.getElementById('timerMinutesInput');
const sessionInput = document.getElementById('sessionInput');
const goalInput = document.getElementById('goalInput');
const streakInput = document.getElementById('streakInput');

// this is where the default modes are defined
const defaultModes = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

//this is what the focus mode does
let activeMode = 'focus';
let totalSeconds = defaultModes[activeMode] * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let isRunning = false;

function clampMinutes(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultModes[activeMode];
  }
  return Math.min(180, Math.max(1, Math.round(parsed)));
}

//This is where the time is updated, the progress is updated, and the display is updated
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateProgress() {
  const percent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  ring.style.setProperty('--progress', Math.min(100, Math.max(0, percent)));
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  updateProgress();
}

function syncButtons() {
  modeButtons.forEach((button) => {
    const matches = button.dataset.mode === activeMode;
    button.classList.toggle('active', matches);
  });
}

function updateTimerInput() {
  timerMinutesInput.value = String(defaultModes[activeMode]);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
  startPauseBtn.textContent = 'Start';
}

function playCompletionSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.0001;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

  oscillator.start(now);
  oscillator.stop(now + 2.0);
}

function handleComplete() {
  stopTimer();
  playCompletionSound();
  if (remainingSeconds <= 0) {
    remainingSeconds = totalSeconds;
    updateDisplay();
  }
}

// This is where the ticking motion works
function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    updateDisplay();
  }

  if (remainingSeconds <= 0) {
    handleComplete();
  }
}

function startTimer() {
  if (isRunning) {
    stopTimer();
    return;
  }

  isRunning = true;
  startPauseBtn.textContent = 'Pause';
  timerId = setInterval(tick, 1000);
}

function setMode(modeKey, minutes = defaultModes[modeKey]) {
  const safeMinutes = clampMinutes(minutes);
  activeMode = modeKey;
  defaultModes[modeKey] = safeMinutes;
  totalSeconds = safeMinutes * 60;
  remainingSeconds = totalSeconds;

  syncButtons();
  updateTimerInput();
  updateDisplay();
}

function resetTimer() {
  stopTimer();
  remainingSeconds = totalSeconds;
  updateDisplay();
}

startPauseBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

timerMinutesInput.addEventListener('input', (event) => {
  const nextMinutes = clampMinutes(event.target.value);
  setMode(activeMode, nextMinutes);
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const modeKey = button.dataset.mode;
    const minutes = Number(button.dataset.minutes) || defaultModes[modeKey];
    setMode(modeKey, minutes);
  });
});

sessionInput.addEventListener('input', () => {
  if (sessionInput.value === '') {
    sessionInput.value = '0';
  }
});

goalInput.addEventListener('input', () => {
  if (goalInput.value === '') {
    goalInput.value = '0';
  }
});

streakInput.addEventListener('input', () => {
  if (streakInput.value === '') {
    streakInput.value = '0';
  }
});

updateTimerInput();
updateDisplay();
