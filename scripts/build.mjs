import { cp, mkdir, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const playtest=process.argv.includes('--playtest');
const dist = resolve(root, playtest?'dist-playtest':'dist');
if (!dist.startsWith(root + sep) || dist === root) throw Error('Unsafe output path');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'game'), resolve(dist, 'game'), { recursive: true });
if(!playtest){
  const optional=['growth-lab.js','growth-view.js','growth-art.js','draft-services.js'];
  // Keep shared rules, while excluding the experimental implementation and artwork.
  for(const entry of await readdir(resolve(dist,'game'))){
    if(!entry.endsWith('.js')||optional.includes(entry))continue;
    const file=resolve(dist,'game',entry);let text=await readFile(file,'utf8');
    for(const name of optional)text=text.replaceAll(`'./${name}'`,"'./standard-content.js'");
    await writeFile(file,text);
  }
  await cp(resolve(root,'scripts/standard-content.js'),resolve(dist,'game/standard-content.js'));
  for(const name of [...optional,'growth.css'])await rm(resolve(dist,'game',name));
  const index=resolve(dist,'index.html');await writeFile(index,(await readFile(index,'utf8')).replace(/^.*href="\.\/game\/growth\.css".*\r?\n/m,''));
}
console.log(`One More? ${playtest?'isolated playtest':'standard release'} built: ${dist}`);
