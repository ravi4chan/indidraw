import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (!["sw.js", "_headers", "_redirects"].includes(entry.name))
      files.push(p);
  }
  return files;
}
const files = await walk("dist");
const hash = createHash("sha256");
for (const file of files.sort()) hash.update(await readFile(file));
hash.update("navigation-response-v2");
const cache = `indidraw-${hash.digest("hex").slice(0, 16)}`;
const urls = files.map((p) => "/" + p.slice(5));
await writeFile(
  "dist/sw.js",
  `
const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try { await cache.addAll(ASSETS); } catch(error) { await caches.delete(CACHE); throw error; }
 // Wait for old tabs to close; never replace an active editor mid-session.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys()) if(key.startsWith('indidraw-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   const shell=await cache.match('/index.html');
   // Hosts may redirect /index.html to /. Safari rejects redirected cached
   // responses for navigation. Construct a response without redirect metadata.
   if(shell)return new Response(shell.body,{status:shell.status,statusText:shell.statusText,headers:shell.headers});
   return fetch(event.request);
  }
  return (await cache.match(event.request,{ignoreVary:true}))||fetch(event.request);
 })());
});
`,
);
console.log(`Offline cache: ${urls.length} assets; ${cache}`);
