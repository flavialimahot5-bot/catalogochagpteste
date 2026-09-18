import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authorize, failure } from '@/lib/auth';
export async function POST(request:Request) {
  try {
    const body=await request.json() as HandleUploadBody;
    const result=await handleUpload({body,request,onBeforeGenerateToken:async(pathname)=>{
      authorize(request);
      if(!/^media\/[a-f0-9-]+\.(mp4|mov|webm|jpg)$/.test(pathname)) throw new Error('Arquivo inválido.');
      return {allowedContentTypes:['video/mp4','video/quicktime','video/webm','image/jpeg'],maximumSizeInBytes:500*1024*1024,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+60*60*1000};
    },onUploadCompleted:async()=>{}});
    return Response.json(result);
  }catch(e){return failure(e);}
}
