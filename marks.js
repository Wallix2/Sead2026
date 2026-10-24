const marksStorageKey = "cambridge-paper-marks";

// Table and display elements
const marksTable = document.querySelector("#marks-list");
const emptyMarksMessage = document.querySelector("#marks-empty");
const markDialog = document.querySelector("#mark-dialog");
const markForm = document.querySelector("#mark-form");
const markDialogTitle = document.querySelector("#mark-dialog-title");

// Filter and average display elements
const qualificationFilter = document.querySelector("#average-qualification");
const subjectFilter = document.querySelector("#average-subject");
const paperFilter = document.querySelector("#average-paper");
const averageMessage = document.querySelector("#average-result");

// Application state
let paperMarks = loadPaperMarks();
let editingMarkId = null; // Tracks ID if we are editing an existing mark


// ==========================================
// LOCAL STORAGE FUNCTIONS
// ==========================================

// loads saved paper marks from browser localStorage
function loadPaperMarks() {
  const savedMarks = localStorage.getItem(marksStorageKey);

  if (savedMarks === null) {
    return [];
  }

  try {
    const marksFromStorage = JSON.parse(savedMarks);

    if (!Array.isArray(marksFromStorage)) {
      throw new TypeError("Saved paper marks must be a list.");
    }

    return marksFromStorage;
  } catch (error) {
    console.error("Could not load saved paper marks.", error);
    return [];
  }
}

// Saves the current papermarks array to browsers localStorage
function savePaperMarks() {
  localStorage.setItem(marksStorageKey, JSON.stringify(paperMarks));
}


// ==========================================
// UI HELPER FUNCTIONS
// ==========================================

// Helper to create a table cell with text content
function makeTableCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}


// ==========================================
// RENDERING FUNCTIONS
// ==========================================

// Clears and re-renders the marks table with sorted data and action buttons
function renderPaperMarks() {
  marksTable.replaceChildren();
  emptyMarksMessage.hidden = paperMarks.length > 0;

  // Sort marks by year (descending) and then session (alphabetically)
  const sortedMarks = [...paperMarks].sort((first, second) =>
    second.year - first.year || first.session.localeCompare(second.session)
  );

  sortedMarks.forEach((mark) => {
    const row = document.createElement("tr");
    
    // Format subject name to include subject code if available
    const subjectName = mark.subjectCode
      ? `${mark.subject} (${mark.subjectCode})`
      : mark.subject;
      
    const percentage = (Number(mark.obtained) / Number(mark.total)) * 100;

    // Append standard mark data cells
    row.append(
      makeTableCell(mark.qualification),
      makeTableCell(subjectName),
      makeTableCell(`${mark.session} ${mark.year}`),
      makeTableCell(`Paper ${mark.paper}${mark.variant}`),
      makeTableCell(`${mark.obtained} / ${mark.total}`),
      makeTableCell(`${percentage.toFixed(1)}%`)
    );

    // Create action buttons cell (Edit & Remove)
    const actionsCell = makeTableCell("");
    
    // Edit button
    const editButton = document.createElement("button");
    editButton.className = "row-action";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute(
      "aria-label",
      `Edit ${mark.subject} ${mark.session} ${mark.year} paper ${mark.paper}${mark.variant}`
    );
    editButton.addEventListener("click", () => openMarkDialog(mark));

    // Remove button
    const removeButton = document.createElement("button");
    removeButton.className = "row-action remove-btn";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${mark.subject} ${mark.session} ${mark.year} paper ${mark.paper}${mark.variant}`
    );
    removeButton.addEventListener("click", () => {
      paperMarks = paperMarks.filter((savedMark) => savedMark.id !== mark.id);
      savePaperMarks();
      renderPaperMarks();
    });

    actionsCell.append(editButton, removeButton);
    row.append(actionsCell);
    marksTable.append(row);
  });

  // Refresh dropdown filters whenever the table updates
  updateAverageFilters();
}


// ==========================================
// FILTER & AVERAGE CALCULATIONS
// ==========================================

// Updates filter dropdown options based on available data
function updateAverageFilters() {
  const oldSubject = subjectFilter.value;
  const oldPaper = paperFilter.value;

  // Populate qualification dropdown
  const qualifications = [...new Set(paperMarks.map((mark) => mark.qualification))].sort();
  fillSelect(qualificationFilter, qualifications, "No qualifications");

  // Filter subjects matching selected qualification
  const marksForQualification = paperMarks.filter(
    (mark) => mark.qualification === qualificationFilter.value
  );
  const subjects = [
    ...new Map(marksForQualification.map((mark) => {
      const subjectKey = mark.subjectCode || mark.subject.toLowerCase();
      const subjectLabel = mark.subjectCode
        ? `${mark.subject} (${mark.subjectCode})`
        : mark.subject;
      return [subjectKey, { value: subjectKey, label: subjectLabel }];
    })).values()
  ];

  fillSelect(subjectFilter, subjects, "No subjects");
  if (subjects.some((subject) => subject.value === oldSubject)) {
    subjectFilter.value = oldSubject;
  }

  // Filter papers matching selected qualification and subject
  const marksForSubject = marksForQualification.filter(
    (mark) => (mark.subjectCode || mark.subject.toLowerCase()) === subjectFilter.value
  );
  const papers = [...new Set(marksForSubject.map((mark) => mark.paper))].sort();

  fillSelect(
    paperFilter,
    papers.map((paper) => ({ value: paper, label: `Paper ${paper}` })),
    "No papers"
  );
  if (papers.includes(oldPaper)) {
    paperFilter.value = oldPaper;
  }

  showAverage();
}

// Helper function to populate a <select> element with options
function fillSelect(select, options, emptyLabel) {
  select.replaceChildren();

  if (options.length === 0) {
    select.add(new Option(emptyLabel, ""));
    select.disabled = true;
    return;
  }

  options.forEach((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    select.add(new Option(label, value));
  });

  select.disabled = false;
}

// Calculates and displays the weighted average for the selected paper criteria
function showAverage() {
  const attempts = paperMarks.filter((mark) =>
    mark.qualification === qualificationFilter.value &&
    (mark.subjectCode || mark.subject.toLowerCase()) === subjectFilter.value &&
    mark.paper === paperFilter.value
  );

  if (attempts.length === 0) {
    averageMessage.textContent = "Add a past paper mark to calculate an average.";
    return;
  }

  // Add the marks together so papers with different totals are weighted fairly.
  const marksEarned = attempts.reduce(
    (sum, mark) => sum + Number(mark.obtained),
    0
  );
  const marksAvailable = attempts.reduce(
    (sum, mark) => sum + Number(mark.total),
    0
  );
  const average = (marksEarned / marksAvailable) * 100;
  const attemptLabel = attempts.length === 1 ? "attempt" : "attempts";

  averageMessage.textContent =
    `Average: ${average.toFixed(1)}% across ${attempts.length} ${attemptLabel} ` +
    `(${marksEarned} / ${marksAvailable} marks).`;
}


// ==========================================
// DIALOG / MODAL FORM MANAGEMENT
// ==========================================

// Opens the dialog modal for creating a new mark or editing an existing one
function openMarkDialog(mark) {
  editingMarkId = mark ? mark.id : null;
  markDialogTitle.textContent = mark ? "Edit past paper mark" : "Add past paper mark";

  // Pre-fill form fields if editing, otherwise set default values
  markForm.elements.qualification.value = mark ? mark.qualification : "IGCSE";
  markForm.elements.subject.value = mark ? mark.subject : "";
  markForm.elements.subjectCode.value = mark ? mark.subjectCode : "";
  markForm.elements.session.value = mark ? mark.session : "May/June";
  markForm.elements.year.value = mark ? mark.year : new Date().getFullYear();
  markForm.elements.paper.value = mark ? mark.paper : "1";
  markForm.elements.variant.value = mark ? mark.variant : "1";
  markForm.elements.obtained.value = mark ? mark.obtained : "";
  markForm.elements.total.value = mark ? mark.total : "";

  markDialog.showModal();
  markForm.elements.subject.focus();
}


// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================

// Open modal to add a new mark
document.querySelector("#add-mark-btn").addEventListener("click", () => {
  openMarkDialog(null);
});

// Close modal when cancel button is clicked
document.querySelector("#cancel-mark-btn").addEventListener("click", () => {
  markDialog.close();
});

// Trigger updates when filter dropdowns change
qualificationFilter.addEventListener("change", updateAverageFilters);
subjectFilter.addEventListener("change", updateAverageFilters);
paperFilter.addEventListener("change", showAverage);

// Handle form submission for saving/updating a mark
markForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(markForm);
  const marksEarned = Number(formData.get("obtained"));
  const marksAvailable = Number(formData.get("total"));

  // Validate that obtained marks don't exceed total marks
  if (marksEarned > marksAvailable) {
    markForm.elements.obtained.setCustomValidity(
      "Marks obtained cannot be greater than the total marks."
    );
    markForm.elements.obtained.reportValidity();
    markForm.elements.obtained.addEventListener(
      "input",
      () => markForm.elements.obtained.setCustomValidity(""),
      { once: true }
    );
    return;
  }

  // Construct updated or new mark object
  const updatedMark = {
    id: editingMarkId || crypto.randomUUID(),
    qualification: formData.get("qualification"),
    subject: formData.get("subject").trim(),
    subjectCode: formData.get("subjectCode").trim(),
    session: formData.get("session"),
    year: Number(formData.get("year")),
    paper: formData.get("paper"),
    variant: formData.get("variant"),
    obtained: marksEarned,
    total: marksAvailable
  };

  // Update existing mark or add new one to array
  if (editingMarkId) {
    paperMarks = paperMarks.map((mark) =>
      mark.id === editingMarkId ? updatedMark : mark
    );
  } else {
    paperMarks.push(updatedMark);
  }

  savePaperMarks();
  renderPaperMarks();
  markDialog.close();
});

// Initial application load render
renderPaperMarks();
