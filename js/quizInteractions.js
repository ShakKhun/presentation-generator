/**
 * Multiple-choice interactions only (gap-fill & error-correction are display-only).
 */

export function playSuccessSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var now = ctx.currentTime;
    [[523.25, 0, 0.12], [659.25, 0.07, 0.12], [783.99, 0.14, 0.12], [1046.5, 0.21, 0.22]].forEach(function(t) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = t[0];
      gain.gain.setValueAtTime(0.001, now + t[1]);
      gain.gain.exponentialRampToValueAtTime(0.22, now + t[1] + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t[1] + t[2]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t[1]);
      osc.stop(now + t[1] + t[2] + 0.06);
    });
    setTimeout(function() { ctx.close(); }, 600);
  } catch (_) {}
}

export function playErrorSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var now = ctx.currentTime;
    [[180, 0, 0.12], [140, 0.10, 0.15]].forEach(function(t) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = t[0];
      gain.gain.setValueAtTime(0.001, now + t[1]);
      gain.gain.exponentialRampToValueAtTime(0.14, now + t[1] + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t[1] + t[2]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t[1]);
      osc.stop(now + t[1] + t[2] + 0.06);
    });
    setTimeout(function() { ctx.close(); }, 600);
  } catch (_) {}
}

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
    playSuccessSound();
  } else {
    selected.classList.add("is-wrong");
    showQuizFeedback(item, "Not quite — try again!", "is-error");
    playErrorSound();
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

export function revealOralAnswer(btn) {
  const item = btn.closest(".oral-item");
  if (!item) return;

  const answer = item.querySelector(".duo-card-answer");
  if (!answer) return;

  answer.hidden = false;
  btn.hidden = true;
  playSuccessSound();
}

export function bindQuizInteractions(rootEl) {
  rootEl.addEventListener("click", (e) => {
    const oralAnswerBtn = e.target.closest(".oral-answer-btn");
    if (oralAnswerBtn && rootEl.contains(oralAnswerBtn)) {
      e.stopPropagation();
      revealOralAnswer(oralAnswerBtn);
      return;
    }

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
