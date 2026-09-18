import {buildCsv,buildXml,type Catalog} from './catalog';
import {save} from './storage';

export async function publishCatalog(catalog:Catalog,origin:string){
 const csv=buildCsv(catalog);
 const xml=buildXml(catalog);
 // Continue updating previously registered XML URLs while CSV becomes the primary feed.
 await save(`feeds/${catalog.id}.xml`,xml,'application/xml; charset=utf-8',origin,true);
 const feedUrl=await save(`feeds/${catalog.id}.csv`,csv,'text/csv; charset=utf-8',origin,true);
 const saved={...catalog,feedUrl,updatedAt:new Date().toISOString()};
 await save(`catalogs/${catalog.id}.json`,JSON.stringify(saved),'application/json',origin,true);
 return saved;
}
