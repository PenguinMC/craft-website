// Build pipeline for CRAFT Flight Training site.
// Reads source files from repo root, minifies HTML (and inline CSS/JS), and
// writes the production bundle to ./_dist. Vercel is configured to serve
// _dist as the deploy output.
//
// Why this exists:
//  - Smaller wire size = faster page loads = better Core Web Vitals
//  - Stripped comments + collapsed whitespace make the served HTML harder to
//    casually read/copy. (Real protection is the LICENSE; this is a perf win
//    with a side benefit.)
//  - Source files in the repo stay readable for editing.

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const SRC = __dirname;
const OUT = path.join(SRC, '_dist');

// Files/folders that should NOT be copied to the production output.
const SKIP = new Set([
  '_dist', 'node_modules', '.git', '.gitignore', '.github',
  'build.js', 'package.json', 'package-lock.json', 'yarn.lock', 'api',
  'README.md', 'LICENSE.md', 'deploy.bat',
]);

const HTML_OPTS = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  // Keep IE conditionals just in case
  ignoreCustomComments: [/^\s*\[if\s+/, /<!\[endif\]/],
  minifyCSS: true,
  minifyJS: true,
  removeRedundantAttributes: true,
  collapseBooleanAttributes: true,
  useShortDoctype: true,
  // Be conservative — keep attribute quotes to avoid breaking edge cases.
  removeAttributeQuotes: false,
  // Keep JSON-LD intact: html-minifier-terser handles application/ld+json by default.
  decodeEntities: false,
  sortAttributes: false,
  sortClassName: false,
};

async function copyOrMinify(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (SKIP.has(entry)) continue;
      await copyOrMinify(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }
  // single file
  if (src.endsWith('.html')) {
    const raw = fs.readFileSync(src, 'utf8');
    try {
      const min = await minify(raw, HTML_OPTS);
      fs.writeFileSync(dst, min);
      const pct = Math.round((1 - min.length / raw.length) * 100);
      const name = path.relative(SRC, src);
      console.log(`  HTML  ${name.padEnd(28)} ${(raw.length / 1024).toFixed(1).padStart(6)} KB -> ${(min.length / 1024).toFixed(1).padStart(6)} KB  (-${pct}%)`);
    } catch (e) {
      console.warn(`  WARN  ${path.relative(SRC, src)}: minify failed (${e.message}); copying raw`);
      fs.copyFileSync(src, dst);
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

(async () => {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log('Building CRAFT site -> _dist/');
  console.log('---');

  for (const entry of fs.readdirSync(SRC)) {
    if (SKIP.has(entry)) continue;
    await copyOrMinify(path.join(SRC, entry), path.join(OUT, entry));
  }

  console.log('---');
  console.log('Build complete.');
})().catch((e) => {
  console.error('Build failed:', e);
  process.exit(1);
});
