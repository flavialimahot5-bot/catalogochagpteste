import { authorize, failure, localMode } from '@/lib/auth';
export async function GET(request:Request) {try{authorize(request);return Response.json({local:localMode(),storage:localMode()||!!process.env.BLOB_READ_WRITE_TOKEN});}catch(e){return failure(e);}}
