import { publishCatalog } from '@/lib/publish-catalog';
import { authorize, failure } from '@/lib/auth';
import { catalogSchema } from '@/lib/catalog';
import { catalogList } from '@/lib/storage';
export const runtime='nodejs';
export async function GET(request:Request) {try{authorize(request);return Response.json(await catalogList());}catch(e){return failure(e);}}
export async function POST(request:Request) {
  try {
    authorize(request);
    const catalog=catalogSchema.parse(await request.json());
    const saved=await publishCatalog(catalog,new URL(request.url).origin);
    return Response.json(saved);
  }catch(e){return failure(e);}
}
