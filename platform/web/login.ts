import { $, api, saveSession, type Session } from './client.js';

let registering = false;

$('toggle').addEventListener('click', () => {
  registering = !registering;
  $('f-org').style.display = registering ? '' : 'none';
  $('f-name').style.display = registering ? '' : 'none';
  $('title').textContent = registering ? 'Create organisation' : 'Sign in';
  $('toggle').textContent = registering ? 'Already registered? Sign in' : 'New organisation? Create one';
  ($('go') as HTMLButtonElement).textContent = registering ? 'Create →' : 'Sign in →';
});

$('go').addEventListener('click', async () => {
  const msg = $('msg');
  msg.textContent = '';
  try {
    const body = {
      email: ($('email') as HTMLInputElement).value,
      password: ($('password') as HTMLInputElement).value,
      ...(registering
        ? {
            orgName: ($('orgName') as HTMLInputElement).value,
            displayName: ($('displayName') as HTMLInputElement).value,
          }
        : {}),
    };
    const s = await api<Session>(registering ? '/auth/register' : '/auth/login', { body, token: '' });
    saveSession(s);
    location.href = '/app.html';
  } catch (e) {
    msg.textContent = (e as Error).message;
  }
});
