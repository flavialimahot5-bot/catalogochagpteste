import { localMode } from '@/lib/auth';
import { read } from '@/lib/storage';
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}) {
 if(!localMode()) return new Response('Not found',{status:404});
 const key=(await params).path.join('/');
 if(!/^(media|feeds)\/[a-zA-Z0-9_-]+\.(jpg|mp4|mov|webm|xml)$/.test(key)) return new Response('Not found',{status:404});
 try {
  const bytes=await read(key);
  const mime:Record<string,string>={jpg:'image/jpeg',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',xml:'application/xml; charset=utf-8'};
  const headers={'Content-Type':mime[key.split('.').pop()!],'Accept-Ranges':'bytes','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
  const range=request.headers.get('range');
  if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match)return new Response(null,{status:416}); const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):bytes.length-1,bytes.length-1);if(start>end)return new Response(null,{status:416});return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':String(end-start+1)}});}
  return new Response(bytes,{headers});
 }catch{return new Response('Not found',{status:404});}
}
