/**
 * Script that queries GitHub API for Erbubar23's latest public repositories
 * and dynamically updates the README.md file.
 */

const fs = require('fs');
const path = require('path');

const USERNAME = 'Erbubar23';
const README_PATH = path.join(__dirname, '..', 'README.md');

// Synth & New Wave language badges
const LANG_ICONS = {
  'C++': '🎛️',
  'C': '⚡',
  'Python': '🐍',
  'JavaScript': '✨',
  'TypeScript': '🔷',
  'HTML': '🌐',
  'Shell': '📟',
  'Rust': '🦀',
  'Assembly': '⚙️'
};

async function fetchLatestRepos() {
  const headers = {
    'User-Agent': 'Erbubar23-Readme-Updater',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/users/${USERNAME}/repos?sort=pushed&direction=desc&per_page=30`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);
  }

  const repos = await res.json();
  
  // Filter out the profile readme repo itself and optionally forks, sort by pushed_at desc
  const originalRepos = repos
    .filter(r => r.name.toLowerCase() !== USERNAME.toLowerCase())
    .sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));

  return originalRepos;
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildMarkdownTable(repos) {
  if (!repos.length) {
    return '_No se encontraron repositorios públicos por el momento._';
  }

  // Top 6 most recently updated/published repositories
  const topRepos = repos.slice(0, 6);

  let md = '| Repositorio | Descripción | Lenguaje | 🌟 Stars | 🔄 Actividad |\n';
  md += '|:---|:---|:---:|:---:|:---:|\n';

  for (const repo of topRepos) {
    const lang = repo.language || 'General';
    const langIcon = LANG_ICONS[lang] || '📦';
    const desc = repo.description 
      ? repo.description.replace(/\|/g, '\\|').trim() 
      : '_Sin descripción_';
    const updated = formatDate(repo.pushed_at || repo.updated_at);
    const forkBadge = repo.fork ? ' `(fork)`' : '';

    md += `| [**${repo.name}**](${repo.html_url})${forkBadge} | ${desc} | ${langIcon} ${lang} | ${repo.stargazers_count} | ${updated} |\n`;
  }

  return md;
}

async function main() {
  try {
    console.log(`Fetching latest public repositories for ${USERNAME}...`);
    const repos = await fetchLatestRepos();
    console.log(`Found ${repos.length} public repositories.`);

    const generatedTable = buildMarkdownTable(repos);

    let readmeContent = fs.readFileSync(README_PATH, 'utf8');

    const startMarker = '<!-- RECENT_REPOS:START -->';
    const endMarker = '<!-- RECENT_REPOS:END -->';

    const startIndex = readmeContent.indexOf(startMarker);
    const endIndex = readmeContent.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find markers in README.md');
      process.exit(1);
    }

    const updatedReadme = 
      readmeContent.substring(0, startIndex + startMarker.length) +
      '\n\n' +
      generatedTable +
      '\n' +
      readmeContent.substring(endIndex);

    fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
    console.log('README.md successfully updated with latest projects!');
  } catch (err) {
    console.error('Error updating README:', err);
    process.exit(1);
  }
}

main();
