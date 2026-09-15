// Screvio site animations. Everything here is decoration: with JS off, or for a
// visitor who asked for less motion, every section is simply shown as it is.
(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  /* --- sections fade up as they scroll into view ------------------------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* --- the guide scene: the mascot walks through a fix -------------------- */
  const scene = document.querySelector('[data-guide-scene]');
  if (!scene) return;

  const steps = [
    { pose: 'wave', say: 'Hi! That error has a known fix. Want me to show you?', status: 'Guide available · 5 steps', progress: 0, button: 'Start', fixed: false },
    { pose: 'point', say: 'First, open <b>Tax settings</b> — it’s highlighted for you.', status: 'Step 2 of 5 · Open Tax settings', progress: 40, button: 'Next', fixed: false },
    { pose: 'point', say: 'Pick the right <b>tax code</b>, then press <b>Save</b>.', status: 'Step 4 of 5 · Choose tax code', progress: 80, button: 'Next', fixed: false },
    { pose: 'happy', say: 'All done! Your invoice can be posted now.', status: 'Guide complete', progress: 100, button: 'Done', fixed: true },
  ];

  const q = (sel) => scene.querySelector(sel);
  const poses = scene.querySelectorAll('[data-pose]');
  const bubble = q('[data-say]');
  const status = q('[data-status]');
  const bar = q('[data-progress]');
  const button = q('[data-button]');
  const alert = q('[data-alert]');
  const dots = scene.querySelectorAll('[data-dot]');

  function show(i) {
    const s = steps[i];
    poses.forEach((img) => img.classList.toggle('on', img.dataset.pose === (reduce ? 'idle' : s.pose)));
    bubble.classList.remove('pop');
    void bubble.offsetWidth; // restart the pop animation
    bubble.innerHTML = s.say;
    bubble.classList.add('pop');
    status.textContent = s.status;
    bar.style.width = s.progress + '%';
    button.textContent = s.button;
    alert.classList.toggle('fixed', s.fixed);
    alert.querySelector('span').textContent = s.fixed ? 'Invoice posted successfully' : 'Invoice could not be posted: tax code missing';
    dots.forEach((d, n) => d.classList.toggle('on', n === i));
  }

  let i = 0;
  show(0);
  if (reduce) return;

  // Only run while the scene is on screen, so it is not busy for nobody.
  let timer = null;
  const start = () => { if (!timer) timer = setInterval(() => show((i = (i + 1) % steps.length)), 3600); };
  const stop = () => { clearInterval(timer); timer = null; };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(scene);
  } else {
    start();
  }
  dots.forEach((d, n) => d.addEventListener('click', () => { stop(); show((i = n)); start(); }));
})();

// Contact form. GitHub Pages cannot send mail, so Web3Forms delivers each
// message to support@screvio.in. The access key is public by design: it can
// only send to the address it was issued for.
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  const FALLBACK = ' You can also email support@screvio.in.';

  const say = (text, kind = '') => {
    status.textContent = text;
    status.className = 'form-status ' + kind;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    // A person never sees the trap; only a bot ticks it.
    if (data.get('botcheck')) return;
    const key = form.dataset.accessKey || '';
    if (!key || key.startsWith('YOUR_')) {
      say('The form is not connected yet — please email support@screvio.in.', 'err');
      return;
    }
    data.delete('botcheck');
    data.append('access_key', key);
    data.append('subject', `Screvio website: ${data.get('topic')} — ${data.get('name')}`);
    data.append('from_name', 'Screvio website');

    button.disabled = true;
    say('Sending…');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.success) {
        form.reset();
        say('Thank you! Your message has been sent — we will reply by email soon.', 'ok');
      } else {
        say((out.message || out.body?.message || 'Your message could not be sent.') + FALLBACK, 'err');
      }
    } catch {
      say('Your message could not be sent right now.' + FALLBACK, 'err');
    } finally {
      button.disabled = false;
    }
  });
})();
