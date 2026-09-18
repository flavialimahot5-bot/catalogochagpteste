import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 await page.goto('http://127.0.0.1:3000');
 await page.getByRole('button',{name:'Novo catálogo',exact:true}).waitFor();
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 // Generate a real decodable moving video; no external fixture or offer required.
 const bytes=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;
  const ctx=canvas.getContext('2d');const stream=canvas.captureStream(20);const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});const chunks=[];
  recorder.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))));
  recorder.start();let frame=0;const timer=setInterval(()=>{ctx.fillStyle='#19392d';ctx.fillRect(0,0,720,1280);ctx.fillStyle='#b7ef79';ctx.fillRect(80,100+frame*3,560,300);ctx.fillStyle='#fff';ctx.font='40px Arial';ctx.fillText('CRIATIVO DE TESTE',120,750);frame++;},50);
  await new Promise(r=>setTimeout(r,2200));clearInterval(timer);recorder.stop();stream.getTracks().forEach(t=>t.stop());return done;
 });
 await writeFile('test-results/criativo.webm',Buffer.from(bytes));
 const suffix=Date.now();const nameA=`Cozinha ${suffix}`,nameB=`Moda ${suffix}`;
 async function create(name){
  await page.getByRole('button',{name:'Novo catálogo',exact:true}).click();
  await page.getByLabel('Nome do novo catálogo').fill(name);
  await page.getByRole('button',{name:'Criar catálogo',exact:true}).click();
  await page.getByRole('heading',{name,exact:true}).waitFor();
  return page.getByLabel('Data Feed URL',{exact:true}).inputValue();
 }
 async function add(link,name){
  await page.getByRole('textbox',{name:'Link da oferta *',exact:true}).fill(link);
  await page.locator('input[type=file]').setInputFiles('test-results/criativo.webm');
  await page.getByText(`1 produto(s) salvo(s) em ${name}, com imagem e vídeo hospedados.`,{exact:true}).waitFor({timeout:60000});
 }
 const feedA=await create(nameA);const idA=await page.getByLabel('Catálogo selecionado').inputValue();
 assert.ok(!(await (await page.request.get(feedA)).text()).includes('<item>'));
 await add('https://example.com/panelas?a=1&b=2',nameA);
 const first=await (await page.request.get(feedA)).text();
 assert.match(first,/<g:price>\d+\.90 BRL<\/g:price>/);
 assert.match(first,/<g:product_type>Casa e jardim &gt;/);
 assert.match(first,/a=1&amp;b=2/);
 assert.equal(await page.locator('.product-preview img').evaluate(img=>img.naturalWidth),720);
 await page.getByText('Ajustar dados do criativo (opcional)',{exact:true}).click();
 await page.getByLabel('Momento da imagem (segundos)').fill('1.5');
 await page.getByRole('button',{name:'Capturar outro frame'}).click();
 await page.getByText('Nova imagem capturada e hospedada.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
 await page.getByText('Catálogo salvo localmente.',{exact:false}).waitFor();
 const firstSaved=await (await page.request.get(feedA)).text();
 // A second offer appends to A and must not replace the first offer's URL or ID.
 await add('https://example.com/frigideira',nameA);
 const two=await (await page.request.get(feedA)).text();
 assert.equal((two.match(/<item>/g)||[]).length,2);
 assert.ok(two.includes(firstSaved.match(/<item>[\s\S]*?<\/item>/)[0]));
 assert.match(two,/https:\/\/example.com\/frigideira/);
 const feedB=await create(nameB);const idB=await page.getByLabel('Catálogo selecionado').inputValue();
 assert.notEqual(feedA,feedB);assert.notEqual(idA,idB);
 await add('https://example.com/camiseta',nameB);
 const b=await (await page.request.get(feedB)).text();assert.equal((b.match(/<item>/g)||[]).length,1);assert.ok(!b.includes('frigideira'));
 assert.equal(await (await page.request.get(feedA)).text(),two);
 await page.getByLabel('Catálogo selecionado').selectOption(idA);
 assert.equal(await page.locator('.video-row').count(),2);
 assert.equal(await page.getByLabel('Data Feed URL',{exact:true}).inputValue(),feedA);
 await page.getByText('Ajustar dados do criativo (opcional)',{exact:true}).click();
 await page.getByLabel('Nome do produto',{exact:true}).fill('Produto revisado & atualizado');
 await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
 await page.getByText('Catálogo salvo localmente.',{exact:false}).waitFor();
 const updated=await (await page.request.get(feedA)).text();assert.match(updated,/Produto revisado &amp; atualizado/);
 assert.equal(updated.match(/<g:id>(.*?)<\/g:id>/)[1],first.match(/<g:id>(.*?)<\/g:id>/)[1]);
 assert.equal(await (await page.request.get(feedB)).text(),b);
 assert.equal(await page.evaluate(xml=>new DOMParser().parseFromString(xml,'application/xml').querySelectorAll('parsererror').length,updated),0);
 const imageUrl=updated.match(/<g:image_link>(.*?)<\/g:image_link>/)[1];assert.equal((await page.request.get(imageUrl)).status(),200);
 await page.reload();
 await page.locator('.catalog-open').filter({hasText:nameA}).click();
 assert.equal(await page.locator('.video-row').count(),2);
 await page.getByLabel('Catálogo selecionado').selectOption(idB);
 assert.equal(await page.locator('.video-row').count(),1);
 await page.screenshot({path:'test-results/filled-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Meus catálogos',exact:true}).click();
 await page.locator('.catalog-card').filter({hasText:nameB}).waitFor();
 await page.screenshot({path:'test-results/catalogs-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: named empty catalogs, separate feeds, three video uploads, frame replacement, automatic persistence, independent offer links, selection, reload, stable IDs/URLs and mobile layout.');
}finally{await browser.close();}
