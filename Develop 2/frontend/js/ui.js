window.closeModal = function(event, modalElement) {
    if (event.target === modalElement) {
        modalElement.style.display = 'none';
    }
};

function ensureFeedbackContainer() {
  let container = document.getElementById('feedback-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'feedback-container';
    container.className = 'feedback-container';
    document.body.appendChild(container);
  }

  return container;
}

function showFeedback(message, type = 'info') {
  const container = ensureFeedbackContainer();
  const feedback = document.createElement('div');
  feedback.className = `feedback-toast feedback-${type}`;
  feedback.textContent = message;

  container.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add('feedback-hide');
    setTimeout(() => feedback.remove(), 250);
  }, 2500);
}

function setLoadingState(elementId, message = 'Cargando...') {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.innerHTML = `<div class="loading-state">${message}</div>`;
}

function setButtonLoadingState(button, isLoading, loadingText = 'Procesando...') {
  if (!button) {
    return;
  }

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.innerHTML;
  }

  button.disabled = isLoading;
  button.classList.toggle('btn-loading', isLoading);
  button.innerHTML = isLoading ? loadingText : button.dataset.originalText;
}