import test from 'node:test';
import assert from 'node:assert/strict';
import {duplicateDrafts, originalProducts} from '../lib/duplicates';
import {buildXml,type Product} from '../lib/catalog';
const originals:Product[]=Array.from({length:6},(_,i)=>({id:`item_${i}`,title:`Produto ${i}`,description:'Descrição original',brand:'Marca original',price:'19.90',currency:'BRL',link:`https://example.com/oferta-${i}`,image_link:`https://example.com/frame-${i}.jpg`,video_link:`https://example.com/video-${i}.mp4`,availability:'in stock',condition:'new',fileName:`video-${i}.mp4`}));
test('6 originals times 1000 makes 6000 independent drafts preserving original data',()=>{
 const catalog={id:crypto.randomUUID(),name:'Teste',products:originals};const xml=buildXml(catalog);
 const result=duplicateDrafts(originals,1000,{products:[],operations:[]},'op1');
 assert.equal(result.products.length,6000);assert.equal(new Set(result.products.map(p=>p.id)).size,6000);
 for(const p of result.products){const original=originals.find(o=>o.id===p.source_product_id)!;assert.equal(p.brand,original.brand);assert.equal(p.link,original.link);assert.equal(p.video_link,original.video_link);assert.equal(p.price,original.price);}
 assert.equal(buildXml(catalog),xml);
 assert.equal(duplicateDrafts(originals,1000,result,'op1'),result);
 assert.equal(originalProducts([...originals,result.products[0]]).length,6);
 assert.throws(()=>duplicateDrafts(originals,1000,result,'op2'),/10.000/);
});
test('only uploaded originals count and invalid quantities are rejected',()=>{
 assert.equal(originalProducts([...originals,{...originals[0],id:'same_video'}]).length,6);
 for(const amount of [0,-1,1.2,1001,NaN])assert.throws(()=>duplicateDrafts(originals,amount,{products:[],operations:[]},'op'));
 assert.throws(()=>duplicateDrafts([],1,{products:[],operations:[]},'op'));
});
