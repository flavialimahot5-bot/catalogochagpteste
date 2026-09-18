import test from 'node:test';
import assert from 'node:assert/strict';
import { buildXml, catalogSchema, type Catalog } from '../lib/catalog';
import { authorize, AuthError } from '../lib/auth';
import { generateDefaults, inferProductType } from '../lib/generate';
test('category is inferred for old feeds and custom categories are XML escaped',()=>{
 assert.match(inferProductType('jogo-panelas'),/Cozinha/);
 assert.match(buildXml({...fixture,products:[{...fixture.products[0],link:'https://example.com/panelas'}]}),/<g:product_type>Casa e jardim &gt;/);
 assert.match(buildXml({...fixture,products:[{...fixture.products[0],product_type:'Casa & Jardim > Panelas'}]}),/<g:product_type>Casa &amp; Jardim &gt; Panelas<\/g:product_type>/);
 assert.equal(inferProductType('xyz'), 'Produtos > Outros');
});
test('automatic data publishes ARS and preserves explicit currency selection',()=>{
 for(const currency of ['ARS','BRL','USD','EUR'] as const){const generated=generateDefaults('https://example.com/jogo-panelas',currency);const data={...fixture,products:[{...fixture.products[0],...generated}]};assert.equal(catalogSchema.safeParse(data).success,true);assert.match(buildXml(data),new RegExp(`<g:price>\\d+\\.90 ${currency}</g:price>`));assert.ok(generated.title.includes('Jogo panelas'));}
 assert.throws(()=>generateDefaults('javascript:alert(1)'),/http/);
 assert.throws(()=>buildXml({...fixture,products:[fixture.products[0],{...fixture.products[0],id:'item_2',currency:'ARS'}]}),/mesma moeda/);
});
const fixture:Catalog={id:'79fa7e0c-0864-4f43-9c7f-4b0d2276a8d4',name:'Catálogo & oferta',products:[{id:'item_1',title:'Café & chá <especial>',description:'Descrição "boa"\u0001',brand:'Marca',price:'19.9',currency:'BRL',link:'https://example.com/?a=1&b=2',image_link:'https://example.com/frame.jpg',video_link:'https://example.com/video.mp4',availability:'in stock',condition:'new',fileName:'teste.mp4'}]};
test('RSS escapes data, keeps video/image and formats currency',()=>{const xml=buildXml(fixture);assert.match(xml,/<g:title>Café &amp; chá &lt;especial&gt;<\/g:title>/);assert.match(xml,/<g:price>19.90 BRL<\/g:price>/);assert.match(xml,/<g:video_link>https:\/\/example.com\/video.mp4<\/g:video_link>/);assert.match(xml,/<g:image_link>https:\/\/example.com\/frame.jpg<\/g:image_link>/);assert.ok(!xml.includes('\u0001'));});
test('cannot publish invalid prices, missing brand, unsafe URLs or duplicate IDs',()=>{for(const patch of [{price:'-1'},{price:'0'},{price:'NaN'},{brand:''},{link:'javascript:alert(1)'},{image_link:'data:image/png,abc'}])assert.equal(catalogSchema.safeParse({...fixture,products:[{...fixture.products[0],...patch}]}).success,false);assert.throws(()=>buildXml({...fixture,products:[fixture.products[0],fixture.products[0]]}),/ID único/);});
test('cloud administration rejects missing or incorrect credentials',()=>{const old=process.env.ADMIN_SECRET;try{process.env.ADMIN_SECRET='a'.repeat(32);assert.throws(()=>authorize(new Request('https://example.com')),AuthError);assert.throws(()=>authorize(new Request('https://example.com',{headers:{Authorization:'Bearer wrong'}})),AuthError);assert.doesNotThrow(()=>authorize(new Request('https://example.com',{headers:{Authorization:`Bearer ${'a'.repeat(32)}`}})));}finally{if(old===undefined)delete process.env.ADMIN_SECRET;else process.env.ADMIN_SECRET=old;}});
