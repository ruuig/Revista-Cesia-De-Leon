// Arma la versión publicable de la revista en la carpeta dist/ (para Render u otro hosting estático).
// Uso: node build.js
const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'dist');

const head = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}' +
  'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
fs.writeFileSync(path.join(out, 'index.html'), head + page + '</body></html>');

for (const dir of ['css', 'js', 'img']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
}
console.log('Listo: dist/ generado');
