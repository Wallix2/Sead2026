
"use strict";

// ---------------------------------------------
// 1. HELPERS AND SAVED DATA
// ---------------------------------------------

const $ = (selector) => document.querySelector(selector);

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Unable to save. Check your browser storage.");
  }
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

let toastTimeout;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ---------------------------------------------
// 2. APPLICATION STATE
// ---------------------------------------------

const today = getTodayKey();

let tasks = loadData("studyspace-tasks", []);
let totalPoints = loadData("studyspace-total-points", 0);
let dailyPoints = loadData("studyspace-daily-points", {
  date: today,
  points: 0
});
let dailyGoal = loadData("studyspace-daily-goal", 100);
let sessions = loadData("studyspace-sessions", 0);
let filter = "all";


// ---------------------------------------------
// 3. DATE AND GREETING
// ---------------------------------------------

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();

  let greeting = "Ready to focus?";

  if (hour < 12) greeting = "Good morning, achiever ☀";
  else if (hour < 18) greeting = "Good afternoon, achiever ✨";
  else greeting = "Good evening, achiever 🌙";

  $("#greeting").textContent = greeting;

  $("#today-date").textContent = now.toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  );

  $("#year").textContent = now.getFullYear();
}

updateGreeting();
// ---------------------------------------------
// 7. INITIALIZE THE PAGE
// ---------------------------------------------

renderTimer();
renderTasks();
renderProgress();
renderStats();
renderSessionCount();
