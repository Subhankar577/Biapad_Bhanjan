/* Runtime bridge: populated by app.js, imported by every screen to avoid
   circular imports. */
export const R = {
  state: null,
  save: () => {},
  refresh: () => {},
  go: (hash) => { location.hash = hash; },
  toast: () => {},
  openSheet: () => {},
  closeSheet: () => {},
  refreshSheet: () => {},
  confetti: () => {},
  ensurePlan: () => {},
  openSession: () => {}
};
export const lang = () => document.documentElement.getAttribute('data-lang') || 'en';
