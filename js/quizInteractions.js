/**
 * Multiple-choice interactions only (gap-fill & error-correction are display-only).
 */

export function showQuizFeedback(item, message, kind) {
  const feedback = item.querySelector(".quiz-feedback");
  if (!feedback) return;
  feedback.hidden = false;
  feedback.textContent = message;
  feedback.className = "quiz-feedback " + kind;
}

export function selectMcOption(optionBtn) {
  const item = optionBtn.closest(".mc-item");
  if (!item || item.classList.contains("is-locked")) return;

  item.querySelectorAll(".mc-option").forEach((btn) => {
    btn.classList.remove("is-selected");
    btn.setAttribute("aria-pressed", "false");
  });
  optionBtn.classList.add("is-selected");
  optionBtn.setAttribute("aria-pressed", "true");
}

export function checkMcItem(item) {
  if (item.classList.contains("is-locked")) return;

  const selected = item.querySelector(".mc-option.is-selected");
  if (!selected) {
    showQuizFeedback(item, "Choose an answer first.", "is-neutral");
    return;
  }

  const chosen = parseInt(selected.dataset.optionIndex, 10);
  const correct = parseInt(item.dataset.correct, 10);
  const options = item.querySelectorAll(".mc-option");

  if (chosen === correct) {
    item.classList.add("is-locked");
    options.forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.toggle("is-correct", i === correct);
    });
    item.querySelector(".quiz-check-btn").disabled = true;
    showQuizFeedback(item, "Correct!", "is-success");
  } else {
    selected.classList.add("is-wrong");
    showQuizFeedback(item, "Not quite — try again!", "is-error");
    setTimeout(() => {
      if (!item.classList.contains("is-locked")) {
        selected.classList.remove("is-wrong");
      }
    }, 600);
  }
}

export function handleQuizCheck(btn) {
  const item = btn.closest(".mc-item");
  if (!item) return;
  checkMcItem(item);
}

export function bindQuizInteractions(rootEl) {
  rootEl.addEventListener("click", (e) => {
    const checkBtn = e.target.closest(".quiz-check-btn");
    if (checkBtn && rootEl.contains(checkBtn)) {
      e.stopPropagation();
      handleQuizCheck(checkBtn);
      return;
    }

    const mcOption = e.target.closest(".mc-option");
    if (mcOption && rootEl.contains(mcOption) && !mcOption.disabled) {
      e.stopPropagation();
      selectMcOption(mcOption);
    }
  });
}
