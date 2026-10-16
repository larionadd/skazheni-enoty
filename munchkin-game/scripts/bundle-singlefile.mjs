import fs from 'fs';
import path from 'path';

const distDir = 'e:/gravaty/munchkin-game/dist';
const assetsDir = path.join(distDir, 'assets');

const files = fs.readdirSync(assetsDir);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('Missing css or js file in dist/assets');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');

const htmlContent = `<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>ХАПУГИ: Підземелля Бюрократії</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bangers&display=swap" rel="stylesheet">
    <style>
${cssContent}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
${jsContent}
    </script>
  </body>
</html>`;

fs.writeFileSync('e:/gravaty/munchkin-game/play.html', htmlContent, 'utf-8');
fs.writeFileSync('e:/gravaty/munchkin-game/dist/play.html', htmlContent, 'utf-8');
console.log('play.html standalone bundle generated successfully!');
