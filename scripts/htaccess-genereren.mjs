// Genereert dist/.htaccess voor Apache-hosting uit public/_redirects en
// public/_headers, plus host-regels (www, https), nette URL's en een echte
// 404. Draait na de build: node scripts/htaccess-genereren.mjs
import { readFileSync, writeFileSync } from "node:fs";

const redirects = readFileSync("public/_redirects", "utf8")
  .split("\n")
  .map((r) => r.trim())
  .filter((r) => r && !r.startsWith("#"))
  .map((r) => r.split(/\s+/))
  .filter((d) => d.length >= 3);

const regels = [];
for (const [bron, doel] of redirects) {
  if (bron.includes("*")) {
    const basis = bron.replace("/*", "");
    const doelR = doel.replace(":splat", "$1");
    regels.push(`RewriteRule ^${basis.slice(1)}/(.*)$ ${doelR} [R=301,L]`);
    if (doel !== `${basis}/:splat`) regels.push(`RewriteRule ^${basis.slice(1)}/?$ ${doel.replace(":splat", "")} [R=301,L]`);
  } else {
    regels.push(`Redirect 301 ${bron} ${doel}`);
  }
}

const htaccess = `# Gegenereerd door scripts/htaccess-genereren.mjs; niet met de hand bewerken.
RewriteEngine On

# https en www afdwingen
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://www.vision2watch.nl/$1 [R=301,L]
RewriteCond %{HTTP_HOST} ^vision2watch\\.nl$ [NC]
RewriteRule ^(.*)$ https://www.vision2watch.nl/$1 [R=301,L]

# oude adressen
${regels.join("\n")}

# nette URL's: /pad -> /pad/index.html; bestaat het niet: echte 404
DirectoryIndex index.html
ErrorDocument 404 /404.html

# cache per klasse
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set X-Frame-Options "SAMEORIGIN"
  <FilesMatch "\\.(js|css|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(webp|jpe?g|png|svg|mp4)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "\\.(html|xml|txt)$">
    Header set Cache-Control "max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/xml
</IfModule>
`;

writeFileSync("dist/.htaccess", htaccess);
console.log(`dist/.htaccess geschreven (${regels.length} redirectregels).`);
