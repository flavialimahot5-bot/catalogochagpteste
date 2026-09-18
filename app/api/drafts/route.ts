import { z } from 'zod';
import { authorize, failure } from '@/lib/auth';
import { read, save } from '@/lib/storage';
import { catalogSchema, productSchema, buildXml, MAX_CATALOG_PRODUCTS } from '@/lib/catalog';
import { duplicateDrafts, originalProducts, type DraftStore } from '@/lib/duplicates';
import { readDraftStore as loadDrafts } from '@/lib/draft-storage';
export const runtime='nodejs';
export const maxDuration=60;
async function loadCatalog(id:string){return catalogSchema.parse(JSON.parse((await read(`catalogs/${id}.json`)).toString()));}
export async function GET(request:Request){try{
 authorize(request);const url=new URL(request.url);const id=z.string().uuid().parse(url.searchParams.get('catalogId'));
 const page=z.coerce.number().int().min(1).max(400).parse(url.searchParams.get('page')||1);
 const drafts=await loadDrafts(id);const catalog=await loadCatalog(id);
 return Response.json({products:drafts.products.slice((page-1)*25,page*25),total:drafts.products.length,originalCount:originalProducts(catalog.products).length,page});
}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 authorize(request);const input=z.object({catalogId:z.string().uuid(),copies:z.number().int().min(1).max(1000),operationId:z.string().uuid()}).parse(await request.json());
 const catalog=await loadCatalog(input.catalogId);const existing=await loadDrafts(input.catalogId);
 const next=duplicateDrafts(catalog.products,input.copies,existing,input.operationId);
 await save(`drafts/${input.catalogId}.json`,JSON.stringify(next),'application/json',new URL(request.url).origin,true);
 return Response.json({total:next.products.length,added:next.products.length-existing.products.length});
}catch(e){return failure(e);}}
export async function PATCH(request:Request){try{
 authorize(request);const input=z.object({catalogId:z.string().uuid(),product:productSchema,reviewed:z.boolean().default(false)}).parse(await request.json());
 const drafts=await loadDrafts(input.catalogId);const original=drafts.products.find(p=>p.id===input.product.id);
 if(!original)throw new Error('Rascunho não encontrado. Atualize a lista.');
 const product={...input.product,source_product_id:original.source_product_id};
 const origin=new URL(request.url).origin;
 if(input.reviewed){
  const catalog=await loadCatalog(input.catalogId);
  if(catalog.products.length>=MAX_CATALOG_PRODUCTS&&!catalog.products.some(p=>p.id===product.id))throw new Error('Este catálogo atingiu o limite de 10.100 produtos no feed.');
  // Idempotent when an earlier write published the product but did not remove its draft.
  const next={...catalog,products:[...catalog.products.filter(p=>p.id!==product.id),product]};
  const xml=buildXml(next);
  const feedUrl=await save(`feeds/${catalog.id}.xml`,xml,'application/xml; charset=utf-8',origin,true);
  await save(`catalogs/${catalog.id}.json`,JSON.stringify({...next,feedUrl,updatedAt:new Date().toISOString()}),'application/json',origin,true);
  drafts.products=drafts.products.filter(p=>p.id!==product.id);
 }else drafts.products=drafts.products.map(p=>p.id===product.id?product:p);
 await save(`drafts/${input.catalogId}.json`,JSON.stringify(drafts),'application/json',origin,true);
 return Response.json({saved:true,total:drafts.products.length});
}catch(e){return failure(e);}}
export async function PUT(request:Request){try{
 authorize(request);
 const {catalogId}=z.object({catalogId:z.string().uuid()}).parse(await request.json());
 const catalog=await loadCatalog(catalogId);
 const drafts=await loadDrafts(catalogId);
 // Keep existing products and make retries safe after a partially completed write.
 const ids=new Set(catalog.products.map(p=>p.id));
 const added=drafts.products.filter(p=>!ids.has(p.id));
 if(catalog.products.length+added.length>MAX_CATALOG_PRODUCTS)throw new Error('O catálogo comporta até 10.100 produtos. Os rascunhos foram mantidos.');
 const next={...catalog,products:[...catalog.products,...added]};
 const xml=buildXml(next);
 const origin=new URL(request.url).origin;
 const feedUrl=await save(`feeds/${catalogId}.xml`,xml,'application/xml; charset=utf-8',origin,true);
 await save(`catalogs/${catalogId}.json`,JSON.stringify({...next,feedUrl,updatedAt:new Date().toISOString()}),'application/json',origin,true);
 await save(`drafts/${catalogId}.json`,JSON.stringify({...drafts,products:[]}),'application/json',origin,true);
 return Response.json({published:added.length,total:next.products.length});
}catch(e){return failure(e);}}
