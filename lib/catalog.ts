import { z } from 'zod';
import { inferProductType } from './generate';

const httpUrl = z.string().url().refine(v => /^https?:\/\//i.test(v), 'Use uma URL http ou https.');
export const productSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(1,'Informe o título.').max(500),
  description: z.string().trim().min(1,'Informe a descrição.').max(10000),
  brand: z.string().trim().min(1,'Informe a marca.').max(150),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Informe um preço válido.').refine(v => Number(v)>0,'O preço deve ser maior que zero.'),
  currency: z.enum(['ARS','BRL','USD','EUR']),
  link: httpUrl,
  image_link: httpUrl,
  video_link: httpUrl,
  availability: z.enum(['in stock','out of stock','preorder','available','discontinued']),
  condition: z.enum(['new','used','refurbished']),
  fileName: z.string().max(250),
  product_type: z.string().trim().max(750).optional(),
  source_product_id: z.string().max(100).optional(),
});
export const catalogSchema = z.object({id:z.string().uuid(), name:z.string().trim().min(1).max(100), products:z.array(productSchema).max(100)});
export type Product = z.infer<typeof productSchema>;
export type Catalog = z.infer<typeof catalogSchema> & {updatedAt?:string; feedUrl?:string};
export function escapeXml(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
}
export function buildXml(catalog: Catalog) {
  const valid=catalogSchema.parse(catalog);
  const ids=valid.products.map(p=>p.id);
  if(new Set(ids).size!==ids.length) throw new Error('Cada item precisa ter um ID único.');
  if(new Set(valid.products.map(p=>p.currency)).size>1) throw new Error('Todos os itens precisam usar a mesma moeda do catálogo TikTok.');
  return `<?xml version="1.0" encoding="utf-8"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n  <channel>\n    <title>${escapeXml(valid.name)}</title>\n${valid.products.map(p=>{
    const fields={id:p.id,title:p.title,description:p.description,availability:p.availability,condition:p.condition,price:`${Number(p.price).toFixed(2)} ${p.currency}`,link:p.link,image_link:p.image_link,video_link:p.video_link,brand:p.brand,product_type:p.product_type||inferProductType(p.title+' '+p.link)};
    return `    <item>\n${Object.entries(fields).map(([k,v])=>`      <g:${k}>${escapeXml(v)}</g:${k}>`).join('\n')}\n    </item>`;
  }).join('\n')}\n  </channel>\n</rss>\n`;
}
