import { authorize, failure } from '@/lib/auth';
import { catalogSchema, buildXml } from '@/lib/catalog';
import { catalogList, save } from '@/lib/storage';
export const runtime='nodejs';
export async function GET(request:Request) {try{authorize(request);return Response.json(await catalogList());}catch(e){return failure(e);}}
export async function POST(request:Request) {
  try {
    authorize(request);
    const catalog=catalogSchema.parse(await request.json());
    const xml=buildXml(catalog);
    const origin=new URL(request.url).origin;
    const feedUrl=await save(`feeds/${catalog.id}.xml`,xml,'application/xml; charset=utf-8',origin,true);
    const saved={...catalog,feedUrl,updatedAt:new Date().toISOString()};
    await save(`catalogs/${catalog.id}.json`,JSON.stringify(saved),'application/json',origin,true);
    return Response.json(saved);
  }catch(e){return failure(e);}
}
