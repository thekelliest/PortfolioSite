// Password gate for everything under /work/.
//
// The password itself is NOT in this file. It lives in the Cloudflare Pages
// dashboard as an environment variable named CFP_PASSWORD. Nothing secret is
// ever committed to GitHub, and no case study HTML is sent to the browser
// until the password checks out.

const COOKIE = 'kr_work';
const DAYS   = 14;

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.CFP_PASSWORD;

  // Fail closed: no password configured means nobody gets in.
  if (!password) {
    return page('Not configured', 'This area is not available right now.', 503);
  }

  const token = await hash(password);

  // Someone submitting the login form.
  if (request.method === 'POST') {
    const form  = await request.formData();
    const tried = String(form.get('password') || '');

    if (await matches(tried, password)) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': new URL(request.url).pathname,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`
        }
      });
    }
    return login(true);
  }

  // Already unlocked?
  const cookies = request.headers.get('Cookie') || '';
  const found   = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE + '='));
  if (found && found.slice(COOKIE.length + 1) === token) {
    return await next();
  }

  return login(false);
}

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kr-work:' + text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compare hashes rather than raw strings so the check doesn't leak length.
async function matches(a, b) {
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function login(failed) {
  return page(
    'These case studies are private',
    "Enter the password to view them. Don't have one? Reach out and I'm happy to share it.",
    failed ? 401 : 401,
    true,
    failed
  );
}

function page(heading, blurb, status, form = false, failed = false) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Private — Kellie Rogers</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    background:#f2f0e9;color:#0a0a0a;
    font-family:"Space Grotesk",sans-serif;
    min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  }
  .box{background:#f2f0e9;border:2px solid #0a0a0a;padding:44px 36px;max-width:440px;width:100%;text-align:center;}
  .mark{font-family:"JetBrains Mono",monospace;font-size:2.4rem;color:#c4451a;font-weight:700;margin-bottom:8px;}
  h1{font-size:1.3rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;letter-spacing:-0.01em;}
  p{font-size:0.9rem;color:#555;margin-bottom:24px;line-height:1.5;}
  form{display:flex;border:2px solid #0a0a0a;}
  input{
    flex:1;border:0;padding:14px;font-family:"Space Grotesk",sans-serif;
    font-size:0.95rem;background:#fff;color:#0a0a0a;outline:none;min-width:0;
  }
  button{
    border:0;border-left:2px solid #0a0a0a;background:#0a0a0a;color:#f2f0e9;
    padding:14px 20px;font-family:"Space Grotesk",sans-serif;font-size:0.8rem;
    font-weight:700;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;
  }
  button:hover{background:#c4451a;}
  .err{font-family:"JetBrains Mono",monospace;font-size:0.78rem;color:#c4451a;margin-top:14px;}
  .back{font-size:0.8rem;font-weight:600;text-transform:uppercase;margin-top:24px;display:inline-block;color:inherit;text-decoration:none;}
  .back:hover{color:#c4451a;}
</style>
</head>
<body>
  <div class="box">
    <div class="mark">*</div>
    <h1>${heading}</h1>
    <p>${blurb}</p>
    ${form ? `<form method="POST" autocomplete="off">
      <input type="password" name="password" placeholder="Password" autofocus>
      <button type="submit">Unlock</button>
    </form>` : ''}
    ${failed ? '<div class="err">Wrong password — try again.</div>' : ''}
    <a href="/" class="back">&larr; Back to work</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
