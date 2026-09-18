import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {unlink} from 'node:fs/promises';
const origin='http://127.0.0.1:3000',id=crypto.randomUUID(),name=`Publicar todos teste ${id}`;
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 const products=Array.from({length:7},(_,i)=>({id:`original_${i}`,title:`Produto ${i}`,description:'Descrição',brand:'Teste',price:'19.90',currency:'BRL',link:'https://example.com/oferta',image_link:'https://example.com/frame.jpg',video_link:`https://example.com/video-${i}.mp4`,availability:'in stock',condition:'new',fileName:`video-${i}.mp4`}));
 const created=await page.request.post(origin+'/api/catalogs',{data:{id,name,products}});assert.equal(created.status(),200);const catalog=await created.json();
 assert.equal((await page.request.post(origin+'/api/drafts',{data:{catalogId:id,copies:1000,operationId:crypto.randomUUID()}})).status(),200);
 await page.goto(origin);await page.locator('.catalog-open').filter({hasText:name}).click();
 const publish=page.getByRole('button',{name:'Publicar todos',exact:true});await publish.waitFor();
 await publish.click();await page.getByText('7.000 produtos publicados. Todos estão no catálogo e no feed.',{exact:true}).waitFor({timeout:60000});
 assert.equal(await publish.isDisabled(),true);
 const rows=await(await page.request.get(origin+'/api/catalogs')).json();const saved=rows.find(c=>c.id===id);assert.equal(saved.products.length,7007);assert.deepEqual(saved.products.slice(0,7),products);
 assert.ok(catalog.feedUrl.endsWith('.csv'));
 const feed=await page.request.get(catalog.feedUrl);assert.match(feed.headers()['content-type'],/text\/csv/);
 const csv=await feed.text();assert.equal(csv.trimEnd().split('\r\n').length,7008);assert.equal(csv.split('\r\n')[0].split(',').length,44);
 const xml=await(await page.request.get(catalog.feedUrl.replace('.csv','.xml'))).text();assert.equal((xml.match(/<item>/g)||[]).length,7007);
 assert.equal((await(await page.request.get(origin+`/api/drafts?catalogId=${id}`)).json()).total,0);
 assert.equal(await page.locator('.video-select').count(),25);
 const retry=await page.request.put(origin+'/api/drafts',{data:{catalogId:id}});assert.equal(retry.status(),200);assert.equal((await retry.json()).total,7007);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'test-results/publish-all-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: 7000 drafts published through button, originals preserved, 7007 CSV rows and legacy XML items, drafts cleared, retry safe, 25 visible products, mobile layout.');
}finally{
 await browser.close();
 for(const file of [`catalogs/${id}.json`,`feeds/${id}.xml`,`feeds/${id}.csv`,`drafts/${id}.json`])await unlink(new URL(`../.local-data/${file}`,import.meta.url)).catch(()=>{});
}
