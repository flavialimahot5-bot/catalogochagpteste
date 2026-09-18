import { randomUUID } from 'node:crypto';
import { productSchema, type Product } from './catalog';
export const MAX_DRAFTS=10000;
export type Draft=Product & {source_product_id:string};
export type DraftStore={products:Draft[];operations:string[]};
export function originalProducts(products:Product[]) {
 const videos=new Set<string>();
 return products.filter(p=>{if(p.source_product_id||videos.has(p.video_link))return false;videos.add(p.video_link);return true;});
}
export function duplicateDrafts(products:Product[],copies:number,existing:DraftStore,operationId:string):DraftStore {
 if(existing.operations.includes(operationId))return existing;
 if(!Number.isSafeInteger(copies)||copies<1||copies>1000)throw new Error('Informe de 1 a 1.000 cópias por criativo.');
 const originals=originalProducts(products);
 if(!originals.length)throw new Error('Envie pelo menos um criativo original antes de duplicar.');
 if(existing.products.length+originals.length*copies>MAX_DRAFTS)throw new Error('O limite é de 10.000 rascunhos por catálogo.');
 const added=originals.flatMap(original=>Array.from({length:copies},()=>({...productSchema.parse(original),id:`item_${randomUUID()}`,source_product_id:original.id})));
 return {products:[...existing.products,...added],operations:[...existing.operations,operationId]};
}
