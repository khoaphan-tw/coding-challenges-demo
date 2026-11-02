<?php
// Dev only (local demo stack): signs in to the local Postgres automatically, so the
// map demo's "Database" buttons open straight on the right rows. Never ship this.
return new class extends Adminer\Plugin {
	function credentials() {
		return array('postgres', 'postgres', 'postgres');
	}

	function login($login, $password) {
		return true;
	}

	// On the login page: remember the deep link, fill the form and submit it.
	// After login Adminer lands on the database page: go back to the deep link.
	function head($dark = null) {
		echo Adminer\script(<<<'JS'
addEventListener('DOMContentLoaded', () => {
  const pw = document.querySelector('input[name="auth[password]"]');
  const back = sessionStorage.getItem('demo-target');
  if (pw && !document.querySelector('.error')) {
    sessionStorage.setItem('demo-target', location.href);
    const f = pw.form, set = (n, v) => { const el = f.querySelector(`[name="auth[${n}]"]`); if (el) el.value = v; };
    set('driver', 'pgsql'); set('server', 'postgres'); set('username', 'postgres'); pw.value = 'postgres';
    set('db', new URLSearchParams(location.search).get('db') || '');
    f.submit();
  } else if (back) {
    sessionStorage.removeItem('demo-target');
    if (back !== location.href) location.replace(back);
  }
});
JS);
		return null;
	}
};
