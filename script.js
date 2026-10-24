// key we use for browser local storage
const reminderStorageKey = "study-reminders";

// default data to show when the user first opens the app
const sampleReminders = [
  {
    id: "physics-paper-2",
    title: "Physics Paper 2",
    details: "CIE A Level - 9702",
    date: "2026-10-12",
    type: "Exam"
  },
  {
    id: "maths-paper-2",
    title: "Maths Paper 2",
    details: "CIE A Level - 9709",
    date: "2026-10-18",
    type: "Exam"
  },
  {
    id: "computer-science-paper-2",
    title: "Computer Science Paper 2",
    details: "CIE A Level - 9618",
    date: "2026-10-25",
    type: "Exam"
  },
  {
    id: "maths-coursework",
    title: "Maths Coursework",
    details: "CIE A Level - 9709",
    date: "2026-11-02",
    type: "Deadline"
  },
  {
    id: "physics-practical",
    title: "Physics Practical",
    details: "CIE A Level - 9702",
    date: "2026-11-10",
    type: "Deadline"
  }
];

// grabbing our DOM elements so we can actually manipulate the page
const reminderList = document.querySelector("#reminders-list");
const reminderDialog = document.querySelector("#reminder-dialog");
const reminderForm = document.querySelector("#reminder-form");
const reminderDialogTitle = document.querySelector("#dialog-title");

// app state
let reminders = loadReminders();
let editingReminderId = null; // keeps track of whether we're editing or making a fresh one

// try to grab stuff from localstorage, fallback to sample data if it's empty or borked
function loadReminders() {
  const savedReminders = localStorage.getItem(reminderStorageKey);

  if (savedReminders === null) {
    return sampleReminders;
  }

  try {
    const remindersFromStorage = JSON.parse(savedReminders);

    if (!Array.isArray(remindersFromStorage)) {
      throw new TypeError("Saved reminders must be a list.");
    }

    return remindersFromStorage;
  } catch (error) {
    console.error("Could not load saved reminders.", error);
    return sampleReminders;
  }
}

// dumps our current reminders array into local storage
function saveReminders() {
  localStorage.setItem(reminderStorageKey, JSON.stringify(reminders));
}

// turns "2026-10-12" into parts we can slap onto the calendar badge UI
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return {
    day: String(date.getDate()),
    month: date.toLocaleString("en", { month: "short" }).toUpperCase()
  };
}

// clears the old list and redraws everything sorted by date
function renderReminders() {
  reminderList.replaceChildren();

  // sort chronologically (earliest dates first)
  const sortedReminders = [...reminders].sort((first, second) =>
    first.date.localeCompare(second.date)
  );

  // handle empty state if the user deleted everything
  if (sortedReminders.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "No reminders yet. Add one to get started.";
    reminderList.append(emptyMessage);
    return;
  }

  sortedReminders.forEach((reminder) => {
    const { day, month } = formatDate(reminder.date);
    
    // build the main card element
    const reminderRow = document.createElement("article");
    reminderRow.className = "reminder-item";

    // build the date badge box on the left
    const dateBadge = document.createElement("div");
    dateBadge.className = "date-badge";

    const dayLabel = document.createElement("span");
    dayLabel.className = "date-num";
    dayLabel.textContent = day;

    const monthLabel = document.createElement("span");
    monthLabel.className = "date-month";
    monthLabel.textContent = month;
    dateBadge.append(dayLabel, monthLabel);

    // middle section: title & extra details
    const reminderInfo = document.createElement("div");
    reminderInfo.className = "reminder-info";

    const title = document.createElement("h3");
    title.textContent = reminder.title;

    const details = document.createElement("p");
    details.textContent = reminder.details;
    reminderInfo.append(title, details);

    // tag for whether it's an exam or deadline
    const typeLabel = document.createElement("span");
    typeLabel.className = `tag ${reminder.type === "Exam" ? "tag-exam" : "tag-deadline"}`;
    typeLabel.textContent = reminder.type;

    // buttons container (edit / remove)
    const actions = document.createElement("div");
    actions.className = "reminder-actions";

    const editButton = document.createElement("button");
    editButton.className = "row-action";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${reminder.title}`);
    editButton.addEventListener("click", () => openReminderDialog(reminder));

    const removeButton = document.createElement("button");
    removeButton.className = "row-action remove-btn";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${reminder.title}`);
    removeButton.addEventListener("click", () => {
      // filter out the one we clicked delete on
      reminders = reminders.filter((savedReminder) => savedReminder.id !== reminder.id);
      saveReminders();
      renderReminders();
    });

    actions.append(editButton, removeButton);
    reminderRow.append(dateBadge, reminderInfo, typeLabel, actions);
    reminderList.append(reminderRow);
  });
}

// pops open the modal. if we pass a reminder object, it populates it for editing. otherwise, it's blank.
function openReminderDialog(reminder) {
  editingReminderId = reminder ? reminder.id : null;
  reminderDialogTitle.textContent = reminder ? "Edit reminder" : "Add reminder";

  reminderForm.elements.title.value = reminder ? reminder.title : "";
  reminderForm.elements.details.value = reminder ? reminder.details : "";
  reminderForm.elements.date.value = reminder ? reminder.date : "";
  reminderForm.elements.type.value = reminder ? reminder.type : "Exam";

  reminderDialog.showModal();
  reminderForm.elements.title.focus();
}

// hook up the "add new" button at the bottom
document.querySelector("#footer-add-btn").addEventListener("click", () => {
  openReminderDialog(null);
});

// close the modal when cancel is clicked
document.querySelector("#cancel-btn").addEventListener("click", () => {
  reminderDialog.close();
});

// handle form submission (handles both creating and updating)
reminderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(reminderForm);
  const updatedReminder = {
    id: editingReminderId || crypto.randomUUID(),
    title: formData.get("title").trim(),
    details: formData.get("details").trim(),
    date: formData.get("date"),
    type: formData.get("type")
  };

  if (editingReminderId) {
    // update existing item in array
    reminders = reminders.map((reminder) =>
      reminder.id === editingReminderId ? updatedReminder : reminder
    );
  } else {
    // push a brand new one onto the array
    reminders.push(updatedReminder);
  }

  saveReminders();
  renderReminders();
  reminderDialog.close();
});

// kick things off by rendering on page load
renderReminders();
