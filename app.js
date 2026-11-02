(() => {
  const KEY = 'lifeos-ai-v1';
  const blank = { goals: [], tasks: [], transactions: [], learning: [], opportunities: [] };
  let data = { ...blank };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') data = { ...blank, ...saved };
  } catch (_) {}
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);
  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { toast('Could not save on this device.'); } render(); };
  let toastTimer;
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function go(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    const active = document.querySelector('[data-page="' + page + '"]');
    $('pageCrumb').textContent = active ? active.textContent.trim() : 'Overview';
    $('sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 700 && $('sidebar').classList.contains('open') && !e.target.closest('#sidebar') && !e.target.closest('#menuToggle')) $('sidebar').classList.remove('open');
  });
  $('todayDate').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase();

  $('goalForm').addEventListener('submit', e => {
    e.preventDefault(); const title = $('goalInput').value.trim(); if (!title) return;
    data.goals.unshift({ id: uid(), title, date: $('goalDate').value, done: false }); e.target.reset(); save(); toast('Goal added.');
  });
  $('taskForm').addEventListener('submit', e => {
    e.preventDefault(); const title = $('taskInput').value.trim(); if (!title) return;
    data.tasks.unshift({ id: uid(), title, date: $('taskDate').value, done: false }); e.target.reset(); save(); toast('Task added.');
  });
  $('moneyForm').addEventListener('submit', e => {
    e.preventDefault(); const title = $('moneyDesc').value.trim(), amount = Number($('moneyAmount').value);
    if (!title || !Number.isFinite(amount) || amount <= 0) return;
    data.transactions.unshift({ id: uid(), title, amount, type: $('moneyType').value, date: new Date().toISOString().slice(0,10) }); e.target.reset(); save(); toast('Transaction saved.');
  });
  $('learningForm').addEventListener('submit', e => {
    e.preventDefault(); const title = $('learningInput').value.trim(); if (!title) return;
    data.learning.unshift({ id: uid(), title, done: false }); e.target.reset(); save(); toast('Milestone added.');
  });
  $('opportunityForm').addEventListener('submit', e => {
    e.preventDefault(); const title = $('opportunityInput').value.trim(); if (!title) return;
    data.opportunities.unshift({ id: uid(), title, date: new Date().toISOString().slice(0,10) }); e.target.reset(); save(); toast('Opportunity saved.');
  });

  function row(title, sub, done, action, id, kind, extra = '') {
    return '<div class="list-item ' + (done ? 'completed' : '') + '"><button class="check-btn ' + (done ? 'done' : '') + '" data-action="' + action + '" data-kind="' + kind + '" data-id="' + id + '" aria-label="Toggle complete">' + (done ? '✓' : '') + '</button><div class="list-main">' + safe(title) + '<span class="list-sub">' + safe(sub || '') + '</span></div>' + extra + '<button class="remove-btn" data-action="remove" data-kind="' + kind + '" data-id="' + id + '" aria-label="Remove">×</button></div>';
  }
  function render() {
    const activeGoals = data.goals.filter(x => !x.done).length;
    const completedTasks = data.tasks.filter(x => x.done).length;
    const income = data.transactions.filter(x => x.type === 'income').reduce((s,x) => s + Number(x.amount), 0);
    const expenses = data.transactions.filter(x => x.type === 'expense').reduce((s,x) => s + Number(x.amount), 0);
    const learningPct = data.learning.length ? Math.round(data.learning.filter(x => x.done).length / data.learning.length * 100) : 0;
    $('statGoals').textContent = activeGoals;
    $('statTasks').textContent = completedTasks;
    $('statBalance').textContent = money(income - expenses);
    $('statLearning').textContent = learningPct + '%';
    $('moneyIncome').textContent = money(income); $('moneyExpense').textContent = money(expenses); $('moneyNet').textContent = money(income - expenses);
    $('learningPercent').textContent = learningPct + '% complete'; $('learningRingText').textContent = learningPct + '%';
    $('learningRing').style.background = 'conic-gradient(#b4ccdf ' + (learningPct * 3.6) + 'deg,#29394b 0deg)';
    $('taskCount').textContent = data.tasks.length + (data.tasks.length === 1 ? ' task' : ' tasks');

    $('goalList').innerHTML = data.goals.length ? data.goals.map(g => row(g.title, (g.date ? 'Target: ' + g.date : 'No target date') + (g.done ? ' · Completed' : ' · In progress'), g.done, 'toggle', g.id, 'goals')).join('') : 'No goals added yet.';
    $('taskList').innerHTML = data.tasks.length ? data.tasks.map(t => row(t.title, (t.date ? 'Due: ' + t.date : 'No due date') + (t.done ? ' · Completed' : ' · Pending'), t.done, 'toggle', t.id, 'tasks')).join('') : 'Nothing on your list. Add one useful next action.';
    $('moneyList').innerHTML = data.transactions.length ? data.transactions.map(t => '<div class="list-item"><div class="list-main">' + safe(t.title) + '<span class="list-sub">' + safe(t.date) + '</span></div><strong class="' + (t.type === 'income' ? 'type-income' : 'type-expense') + '">' + (t.type === 'income' ? '+' : '−') + money(t.amount) + '</strong><button class="remove-btn" data-action="remove" data-kind="transactions" data-id="' + t.id + '" aria-label="Remove">×</button></div>').join('') : 'No transactions recorded.';
    $('learningList').innerHTML = data.learning.length ? data.learning.map(l => row(l.title, l.done ? 'Completed' : 'In progress', l.done, 'toggle', l.id, 'learning')).join('') : 'Add a milestone to start tracking.';
    $('opportunityList').innerHTML = data.opportunities.length ? data.opportunities.map(o => '<div class="list-item"><div class="list-main">' + safe(o.title) + '<span class="list-sub">Saved ' + safe(o.date) + '</span></div><button class="remove-btn" data-action="remove" data-kind="opportunities" data-id="' + o.id + '" aria-label="Remove">×</button></div>').join('') : 'No opportunities saved yet.';
    const pending = data.tasks.filter(t => !t.done).slice(0, 4);
    $('overviewTasks').innerHTML = pending.length ? pending.map(t => '<div class="preview-item"><button class="check-btn" data-action="toggle" data-kind="tasks" data-id="' + t.id + '" aria-label="Complete task"></button><span>' + safe(t.title) + '<small>' + safe(t.date ? 'Due ' + t.date : 'No due date') + '</small></span></div>').join('') : '<div class="empty-state">No pending tasks. Add your first task to get moving.</div>';
    const goals = data.goals.slice(0, 3);
    $('overviewGoals').innerHTML = goals.length ? goals.map(g => '<div class="goal-preview"><div class="preview-item"><span>' + safe(g.title) + '</span><small>' + (g.done ? 'Done' : 'Active') + '</small></div><div class="goal-bar"><span style="width:' + (g.done ? 100 : 12) + '%"></span></div></div>').join('') : '<div class="empty-state">Your goals will appear here.</div>';
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const { action, kind, id } = btn.dataset; const list = data[kind]; if (!Array.isArray(list)) return;
    const index = list.findIndex(x => x.id === id); if (index < 0) return;
    if (action === 'remove') { list.splice(index, 1); toast('Item removed.'); }
    else if (action === 'toggle' && 'done' in list[index]) { list[index].done = !list[index].done; toast(list[index].done ? 'Marked complete.' : 'Marked as active.'); }
    save();
  });
  $('exportBackup').addEventListener('click', () => {
    const backup = { app: 'LIFEOS AI', version: 1, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lifeos-ai-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  });

  $('importBackup').addEventListener('click', () => $('backupFile').click());
  $('backupFile').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Backup file is larger than 2 MB.');
      const backup = JSON.parse(await file.text());
      const keys = ['goals', 'tasks', 'transactions', 'learning', 'opportunities'];
      if (!backup || backup.app !== 'LIFEOS AI' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') {
        throw new Error('This is not a supported LIFEOS AI backup.');
      }
      if (!keys.every(key => Array.isArray(backup.data[key]))) throw new Error('Backup data is incomplete or invalid.');
      const validItems = keys.every(key => backup.data[key].every(item => {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.title !== 'string') return false;
        if (key === 'goals' || key === 'tasks' || key === 'learning') return typeof item.done === 'boolean';
        if (key === 'transactions') return Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && ['income', 'expense'].includes(item.type);
        return true;
      }));
      if (!validItems) throw new Error('Backup contains invalid records.');
      if (!confirm('Restore this backup? Your current LIFEOS data on this device will be replaced.')) return;
      data = JSON.parse(JSON.stringify(backup.data));
      save();
      toast('Backup restored successfully.');
    } catch (error) {
      toast(error.message || 'Could not restore this backup.');
    } finally {
      event.target.value = '';
    }
  });

  render();
})();