(() => {
  const slides = window.CampusSlides;
  const container = document.getElementById('slide');
  const count = document.getElementById('slide-count');
  const fill = document.getElementById('progress-fill');
  const toast = document.getElementById('toast');
  const baseUrl = window.__CAMPUSGRAM_URL__ || 'http://localhost:3000';
  let current = 0;
  let toastTimer;
  function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
  function render(index) {
    current = Math.max(0, Math.min(index, slides.length - 1));
    container.innerHTML = slides[current].render();
    window.lucide?.createIcons({ attrs: { 'stroke-width': 1.8 } });
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    fill.style.width = `${((current + 1) / slides.length) * 100}%`;
    history.replaceState(null, '', `#${slides[current].id}`);
    container.querySelector('[data-open-demo]')?.addEventListener('click', openDemo);
  }
  function openDemo() { window.open(baseUrl, '_blank', 'noopener'); showToast('Opening the configured local CampusGram demo…'); }
  function setFromHash() { const match = slides.findIndex(slide => slide.id === location.hash.slice(1)); render(match >= 0 ? match : 0); }
  function move(amount) { render(current + amount); }
  document.getElementById('previous').addEventListener('click', () => move(-1));
  document.getElementById('next').addEventListener('click', () => move(1));
  document.getElementById('demo').addEventListener('click', openDemo);
  document.getElementById('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { showToast('Fullscreen is unavailable in this browser.'); } });
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['ArrowRight', ' '].includes(event.key)) { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { event.preventDefault(); render(0); }
    if (event.key === 'End') { event.preventDefault(); render(slides.length - 1); }
    if (event.key.toLowerCase() === 'f') document.getElementById('fullscreen').click();
    if (event.key.toLowerCase() === 'd') openDemo();
    if (event.key.toLowerCase() === 'p') { window.focus(); showToast('Presentation mode active.'); }
    if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });
  window.addEventListener('hashchange', setFromHash);
  setFromHash();
})();
