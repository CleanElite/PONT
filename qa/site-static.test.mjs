import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
const publicPages=[
  ['index.html','https://pont.city/'],
  ['meniul-zilei/index.html','https://pont.city/meniul-zilei/'],
  ['iesire-in-oras/index.html','https://pont.city/iesire-in-oras/'],
  ['termeni.html','https://pont.city/termeni.html'],
  ['confidentialitate.html','https://pont.city/confidentialitate.html'],
  ['cookies.html','https://pont.city/cookies.html']
];
for(const [path,url] of publicPages){
 test('SEO metadata '+path,()=>{
  const s=read(path);
  assert.match(s,/<meta\s+name="description"\s+content="[^"]{25,}"/i);
  assert.ok(s.includes('<link rel="canonical" href="'+url+'">'),path+' wrong canonical');
  assert.match(s,/<meta property="og:title" content="[^"]+"/i);
  assert.match(s,/<meta property="og:image" content="https:\/\//i);
  assert.match(s,/<meta name="twitter:card" content="summary_large_image">/i);
 });
}
test('crawlable sitemap and robots',()=>{
 const robots=read('robots.txt'),sitemap=read('sitemap.xml');
 assert.match(robots,/Sitemap: https:\/\/pont\.city\/sitemap\.xml/);
 assert.match(robots,/Disallow: \/test\//);
 for(const [,url] of publicPages)assert.ok(sitemap.includes('<loc>'+url+'</loc>'),url);
 assert.ok(existsSync(new URL('../404.html',import.meta.url)));
});
test('public navigation has clean canonical paths',()=>{
 const home=read('index.html');
 assert.ok(home.includes('href="./meniul-zilei/"'));
 assert.ok(home.includes('href="./iesire-in-oras/"'));
 assert.doesNotMatch(home,/href="\.\/(?:meniul-zilei|iesire-in-oras)\/\?v=/);
});
test('offline fails safely: no cached orderable menus',()=>{
 const sw=read('sw.js');
 assert.ok(existsSync(new URL('../offline.html',import.meta.url)));
 assert.ok(sw.includes("cache.match(OFFLINE_PATH)"));
 assert.ok(!sw.includes('cache.put(request'));
});
