const fs = require('fs');
const path = require('path');

const chartsDir = path.join(__dirname, 'components', 'charts');
const files = fs.readdirSync(chartsDir).filter(f => f.endsWith('.tsx'));

const replacements = [
  { search: /"#1e293b"/g, replace: '"var(--border)"' },
  { search: /"#111827"/g, replace: '"var(--card)"' },
  { search: /"#94a3b8"/g, replace: '"var(--muted-foreground)"' },
  { search: /"#e2e8f0"/g, replace: '"var(--foreground)"' },
  { search: /"#0a0e17"/g, replace: '"var(--background)"' },
];

for (const file of files) {
  const filePath = path.join(chartsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let changed = false;
  for (const r of replacements) {
    if (r.search.test(content)) {
      content = content.replace(r.search, r.replace);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
