import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const worker=readFileSync('dist/sw.js','utf8');
const assets=readdirSync('dist/assets').filter(name=>/\.(js|css)$/.test(name));
assert(assets.length>0,'Build contains no executable assets');
for(const file of assets)assert(worker.includes(`/assets/${file}`),`Offline precache is missing ${file}`);
assert(!worker.includes('dormpath-v1'),'Service worker cache must be versioned with the build');
assert(worker.includes('/index.html'),'Offline document must be cached');
console.log(`Offline build check passed: ${assets.length} generated assets precached.`);
