import { BlobNotFoundError } from '@vercel/blob';
import { read } from './storage';
import type { DraftStore } from './duplicates';

export async function readDraftStore(id:string,reader:typeof read=read):Promise<DraftStore>{
 try{return JSON.parse((await reader(`drafts/${id}.json`)).toString());}
 catch(error){
  // The SDK inherits Error.name; it is not the exported class name.
  if(error instanceof BlobNotFoundError || (error instanceof Error && 'code' in error && error.code==='ENOENT'))return {products:[],operations:[]};
  throw error;
 }
}
