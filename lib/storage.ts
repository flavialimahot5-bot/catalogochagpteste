import { put, list, head } from '@vercel/blob';
import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { localMode } from './auth';
const root=path.join(process.cwd(),'.local-data');
export async function save(key:string, data:Buffer|string, contentType:string, origin:string, overwrite=false) {
  if(!/^(media|catalogs|feeds)\/[a-zA-Z0-9_.-]+$/.test(key)) throw new Error('Caminho inválido.');
  if(localMode()) {
    const target=path.join(root,key); await mkdir(path.dirname(target),{recursive:true});
    const temp=target+'.'+randomUUID()+'.tmp'; await writeFile(temp,data); await rename(temp,target);
    return `${origin}/api/local/${key}`;
  }
  if(!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Conecte um Vercel Blob Store público ao projeto.');
  return (await put(key,data,{access:'public',addRandomSuffix:false,allowOverwrite:overwrite,contentType,cacheControlMaxAge:60})).url;
}
export async function read(key:string) {
  if(localMode()) return readFile(path.join(root,key));
  const blob=await head(key);
  const result=await fetch(blob.url,{cache:'no-store'});
  if(!result.ok) throw new Error('Não foi possível ler o catálogo.');
  return Buffer.from(await result.arrayBuffer());
}
export async function catalogList() {
  let keys:string[]=[];
  if(localMode()) { try { keys=(await readdir(path.join(root,'catalogs'))).filter(k=>k.endsWith('.json')).map(k=>`catalogs/${k}`); } catch { return []; } }
  else {
    let cursor:string|undefined;
    do {const page=await list({prefix:'catalogs/',cursor,limit:1000});keys.push(...page.blobs.map(b=>b.pathname));cursor=page.hasMore?page.cursor:undefined;} while(cursor);
  }
  const catalogs=[];
  for(let i=0;i<keys.length;i+=10) catalogs.push(...await Promise.all(keys.slice(i,i+10).map(async key=>JSON.parse((await read(key)).toString()))));
  return catalogs.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
