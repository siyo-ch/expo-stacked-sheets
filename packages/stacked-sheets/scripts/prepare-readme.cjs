const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const readme = readFileSync(resolve(__dirname, '../../../README.md'), 'utf8');
const githubDemo = /<!-- github-demo:start -->[\s\S]*?<!-- github-demo:end -->/;
const npmDemo = [
  '[![Three drafts in the Notes card overview][demo-cover]][demo-video]',
  '[Watch the 13-second Notes demo][demo-video]',
].join('\n\n');

writeFileSync(resolve(__dirname, '../README.md'), readme.replace(githubDemo, npmDemo));
