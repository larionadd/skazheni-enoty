// Automated GitHub + GitHub Pages deployment script.
import { spawnSync, execSync } from 'node:child_process';
import { writeFileSync, copyFileSync, existsSync } from 'node:fs';

const cred = spawnSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n',
  encoding: 'utf8',
});
const user = (cred.stdout.match(/username=(.+)/) || [])[1]?.trim() || 'larionadd';
const token = (cred.stdout.match(/password=(.+)/) || [])[1]?.trim();
if (!token) {
  console.error('No GitHub token found in git credential manager');
  process.exit(1);
}

const repo = 'skazheni-enoty';
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': repo,
  'Content-Type': 'application/json',
};

// 1. Create repository if it doesn't exist
const createRes = await fetch('https://api.github.com/user/repos', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: repo,
    description: 'Скажені Єноти: Нічний Дожор — мобільна онлайн карткова гра для подорожей',
    homepage: `https://${user}.github.io/${repo}/`,
    private: false,
  }),
});
console.log('Repo check/create HTTP:', createRes.status);

// 1.5. Sync styles and build dist/
copyFileSync('src/client/styles.css', 'public/styles.css');
copyFileSync('src/client/styles.css', 'styles.css');
console.log('Building project with Vite...');
execSync('npm.cmd run build', { stdio: 'inherit' });
copyFileSync('src/client/styles.css', 'dist/styles.css');

// 2. Ensure .nojekyll in dist/
writeFileSync('dist/.nojekyll', '');

// 3. Commit and push main branch
const remoteUrl = `https://github.com/${user}/${repo}.git`;
try {
  execSync('git remote remove origin', { stdio: 'ignore' });
} catch {}
execSync(`git remote add origin ${remoteUrl}`);
execSync('git branch -M main');
execSync('git add -A');
try {
  execSync('git commit -m "Initial release: Скажені Єноти: Нічний Дожор"');
} catch {}
execSync('git push -u origin main --force', { stdio: 'inherit' });

// 4. Push dist/ to gh-pages branch
execSync('git init', { cwd: 'dist' });
execSync('git checkout -B gh-pages', { cwd: 'dist' });
execSync('git add -A', { cwd: 'dist' });
try {
  execSync('git commit -m "Deploy GitHub Pages"', { cwd: 'dist' });
} catch {}
try {
  execSync('git remote remove origin', { cwd: 'dist', stdio: 'ignore' });
} catch {}
execSync(`git remote add origin ${remoteUrl}`, { cwd: 'dist' });
execSync('git push -u origin gh-pages --force', { cwd: 'dist', stdio: 'inherit' });

// 5. Enable GitHub Pages on gh-pages branch
const pagesRes = await fetch(`https://api.github.com/repos/${user}/${repo}/pages`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    source: { branch: 'gh-pages', path: '/' },
  }),
});
console.log('GitHub Pages enable HTTP:', pagesRes.status);
console.log(`Live URL: https://${user}.github.io/${repo}/`);
