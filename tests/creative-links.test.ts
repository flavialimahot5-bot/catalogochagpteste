import test from 'node:test';
import assert from 'node:assert/strict';
import { creativeOfferUrl } from '../lib/generate';
import { buildXml, type Catalog } from '../lib/catalog';
test('six creatives have six distinct paths on the same offer domain, preserving tracking',()=>{
 const links=Array.from({length:6},()=>creativeOfferUrl('https://loja.example/oferta/?utm_source=tiktok&ref=abc#comprar'));
 assert.equal(new Set(links).size,6);
 for(const link of links){const url=new URL(link);assert.equal(url.origin,'https://loja.example');assert.match(url.pathname,/^\/oferta\/ctv-[a-f0-9]{32}$/);assert.equal(url.search,'?utm_source=tiktok&ref=abc');assert.equal(url.hash,'#comprar');}
});
test('root URLs work and unsafe schemes are rejected',()=>{
 assert.match(creativeOfferUrl('https://loja.example'),/^https:\/\/loja.example\/ctv-[a-f0-9]{32}$/);
 assert.throws(()=>creativeOfferUrl('javascript:alert(1)'));
 assert.throws(()=>creativeOfferUrl('https://user:password@loja.example'));
});
test('saved creative links stay unchanged when publishing again',()=>{
 const link=creativeOfferUrl('https://loja.example/?a=1&b=2');
 const catalog:Catalog={id:crypto.randomUUID(),name:'Teste',products:[{id:'item_1',title:'Produto',description:'Descrição',brand:'Marca',price:'19.90',currency:'BRL',link,image_link:'https://loja.example/frame.jpg',video_link:'https://loja.example/video.mp4',availability:'in stock',condition:'new',fileName:'video.mp4'}]};
 const xml=buildXml(catalog);assert.equal(buildXml(JSON.parse(JSON.stringify(catalog))),xml);assert.ok(xml.includes(link.replaceAll('&','&amp;')));
});
