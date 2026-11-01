// Contact form: client-side validation, one submission at a time, JSON response.
// The server (contact.php) re-validates everything; this is for fast feedback.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(data) {
  if (String(data.get('name') || '').trim().length < 2) return ['name', 'Please enter your name.'];
  if (!String(data.get('topic') || '')) return ['topic', 'Please choose a topic.'];
  if (!EMAIL.test(String(data.get('email') || '').trim())) return ['email', 'Please enter a valid email address.'];
  if (String(data.get('message') || '').trim().length < 10) return ['message', 'Please add a little more detail to your message.'];
  return null;
}

// Links such as /?topic=booking&message=...#connect pre-fill the form.
// Values are assigned as plain text and the topic must match an existing option.
function prefill(form) {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic');
  if (topic && [...form.elements.topic.options].some((o) => o.value === topic)) form.elements.topic.value = topic;
  const message = params.get('message');
  if (message && !form.elements.message.value) form.elements.message.value = message.slice(0, 600);
}

export function initContactForm() {
  const form = document.querySelector('[data-inquiry-form]');
  if (!form) return;
  prefill(form);
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  let sending = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    const data = new FormData(form);
    const problem = validate(data);
    if (problem) {
      status.textContent = problem[1];
      form.elements[problem[0]]?.focus();
      return;
    }

    sending = true;
    button.disabled = true;
    status.textContent = 'Sending…';
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'The inquiry could not be sent.');
      form.reset();
      status.textContent = result.message;
    } catch (error) {
      status.textContent = error.message || 'The inquiry could not be sent. Please try again.';
    } finally {
      sending = false;
      button.disabled = false;
    }
  });
}
