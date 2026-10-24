/* Global delegated action + form registries. */
const actions = new Map();
const forms = new Map();
const inputs = new Map();

export function register(name, fn) { actions.set(name, fn); }
export function registerForm(name, fn) { forms.set(name, fn); }
export function onInput(name, fn) { inputs.set(name, fn); }

export function getAction(name) { return actions.get(name); }
export function getForm(name) { return forms.get(name); }
export function getInput(name) { return inputs.get(name); }

const draggables = new Set();
export function registerDrag(name, fn) { draggables.add(name); }

export function bindGlobal(root, ctx) {
  root.addEventListener('click', (ev) => {
    const tab = ev.target.closest('[data-tab]');
    if (tab && !tab.hasAttribute('data-act')) { /* handled by screens */ }
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const name = t.getAttribute('data-act');
    const fn = actions.get(name);
    if (!fn) return;
    // let checkbox/select changes breathe
    ev.preventDefault();
    try { fn({ el: t, ev, data: { ...t.dataset }, ctx }); } catch (e) {
      console.error('action failed', name, e);
      ctx.toast('Something went wrong. Please try again.', 'bad');
    }
  });

  root.addEventListener('submit', (ev) => {
    const form = ev.target.closest('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const fn = forms.get(form.getAttribute('data-form'));
    if (!fn) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const all = {};
    new FormData(form).forEach((v, k) => {
      if (k.endsWith('[]')) { all[k.slice(0, -2)] = all[k.slice(0, -2)] || []; all[k.slice(0, -2)].push(v); }
      else all[k] = v;
    });
    try { fn({ data: { ...data, ...all }, el: form, ev, ctx }); } catch (e) {
      console.error('form failed', e);
      ctx.toast('Could not save. Please try again.', 'bad');
    }
  });

  root.addEventListener('input', (ev) => {
    const t = ev.target.closest('[data-input]');
    if (!t) return;
    const fn = inputs.get(t.getAttribute('data-input'));
    if (!fn) return;
    fn({ el: t, value: t.value, checked: t.checked, data: { ...t.dataset }, ev, ctx });
  });

  root.addEventListener('change', (ev) => {
    const t = ev.target.closest('[data-change]');
    if (!t) return;
    const fn = actions.get(t.getAttribute('data-change'));
    if (!fn) return;
    fn({ el: t, value: t.value, checked: t.checked, data: { ...t.dataset }, ev, ctx });
  });
}
