import { randomUUID } from 'node:crypto';
import { authorize, failure, localMode } from '@/lib/auth';
import { save } from '@/lib/storage';
export async function POST(request:Request) {
 try {
  if(!localMode()) return new Response('Not found',{status:404});
  authorize(request);
  const form=await request.formData(); const file=form.get('file');
  if(!(file instanceof File)) throw new Error('Selecione um arquivo.');
  const ext:Record<string,string>={'video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm','image/jpeg':'jpg'};
  if(!ext[file.type]||file.size>500*1024*1024) throw new Error('Formato inválido ou arquivo maior que 500 MB.');
  const url=await save(`media/${randomUUID()}.${ext[file.type]}`,Buffer.from(await file.arrayBuffer()),file.type,new URL(request.url).origin);
  return Response.json({url});
 }catch(e){return failure(e);}
}
