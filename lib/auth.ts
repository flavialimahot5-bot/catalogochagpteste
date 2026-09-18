import { timingSafeEqual } from 'node:crypto';
export const localMode = () => !process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN;
export function authorize(request: Request) {
  const secret=process.env.ADMIN_SECRET;
  if(!secret) { if(localMode()) return; throw new Error('Configure ADMIN_SECRET na Vercel.'); }
  if(secret.length<32) throw new Error('ADMIN_SECRET precisa ter pelo menos 32 caracteres.');
  const received=request.headers.get('authorization')?.replace(/^Bearer /,'') || '';
  const a=Buffer.from(received), b=Buffer.from(secret);
  if(a.length!==b.length || !timingSafeEqual(a,b)) throw new AuthError();
}
export class AuthError extends Error { constructor(){super('Entre com sua chave de acesso.');} }
export function failure(error:unknown) {
  if(error instanceof AuthError) return Response.json({error:error.message},{status:401});
  if(error instanceof Error && error.name==='ZodError') return Response.json({error:'Confira os campos obrigatórios, os links e o preço dos itens.'},{status:400});
  console.error(error);
  return Response.json({error:error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'},{status:400});
}
