import type { Product } from './catalog';

export function inferProductType(text:string) {
 const value=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/panela|cozinha|frigideira|cookware|kitchen/.test(value))return 'Casa e jardim > Cozinha e sala de jantar > Utensílios de cozinha';
 if(/camiseta|roupa|vestido|calca|shirt|clothing/.test(value))return 'Vestuário e acessórios > Roupas';
 if(/tenis|sapato|calcado|shoes/.test(value))return 'Vestuário e acessórios > Calçados';
 if(/perfume|maquiagem|cosmetic|skincare/.test(value))return 'Saúde e beleza > Cuidados pessoais';
 if(/fone|celular|eletronic|headphone/.test(value))return 'Eletrônicos';
 if(/brinquedo|toy/.test(value))return 'Brinquedos e jogos';
 return 'Produtos > Outros';
}

export function generateDefaults(link:string,currency:Product['currency']='ARS') {
 const url=new URL(link);
 if(!['http:','https:'].includes(url.protocol))throw new Error('Informe um link de oferta http ou https.');
 const seed=crypto.randomUUID();
 const words=decodeURIComponent(url.pathname.split('/').filter(Boolean).pop()||url.hostname.split('.')[0]).replace(/\.(html?|php)$/i,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const base=words?words.charAt(0).toUpperCase()+words.slice(1):'Produto';
 const brand=`Studio ${['Aurora','Nativa','Lume','Nova','Viva'][parseInt(seed[0],16)%5]}`;
 const title=`${base} — ${['Essencial','Seleção','Original','Especial','Coleção'][parseInt(seed[1],16)%5]}`.slice(0,500);
 const price=(currency==='ARS'?1000+parseInt(seed.slice(0,4),16)%9000:10+parseInt(seed.slice(0,4),16)%90)+.9;
 return {title,description:`${title}. Veja as características, o preço vigente e as condições de compra na página da oferta.`,brand,price:price.toFixed(2),currency,product_type:inferProductType(words)};
}
