'use client';
import {useEffect,useRef,useState} from 'react';
import {Copy, ChevronLeft, ChevronRight, LoaderCircle, Radio, X} from 'lucide-react';
import type {Product} from '@/lib/catalog';
type Page={products:Product[];total:number;originalCount:number;page:number};
export default function DraftManager({catalogId,productCount,disabled,onPublished,onBusyChange}:{catalogId:string;productCount:number;disabled:boolean;onPublished:()=>Promise<void>;onBusyChange:(busy:boolean)=>void}){
 const [data,setData]=useState<Page>({products:[],total:0,originalCount:0,page:1});
 const [modal,setModal]=useState(false),[copies,setCopies]=useState('1000'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[editing,setEditing]=useState<Product|null>(null),[reviewed,setReviewed]=useState(false),[show,setShow]=useState(false);
 const operation=useRef<string|null>(null);
 async function request(method:string,body?:unknown,page=1){const response=await fetch(method==='GET'?`/api/drafts?catalogId=${catalogId}&page=${page}`:'/api/drafts',{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${sessionStorage.getItem('feedstudio-key')||''}`},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível concluir.');return result;}
 async function load(page=1){const result=await request('GET',undefined,page);setData(result);}
 useEffect(()=>{let alive=true;request('GET').then(result=>{if(alive)setData(result);}).catch(e=>{if(alive)setMessage(e.message);});return()=>{alive=false;};},[catalogId,productCount]); // Component is keyed by catalog; requests never replace another catalog.
 async function open(){setBusy(true);setMessage('');try{await load();setModal(true);operation.current=null;}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function duplicate(){setBusy(true);setMessage('');try{
  operation.current??=crypto.randomUUID();
  const result=await request('POST',{catalogId,copies:Number(copies),operationId:operation.current});
  await load();setShow(true);setModal(false);operation.current=null;setMessage(`${result.total.toLocaleString('pt-BR')} rascunhos salvos. Use Publicar todos para adicionar as cópias ao catálogo.`);
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function save(publish:boolean){if(!editing)return;setBusy(true);setMessage('');try{
  await request('PATCH',{catalogId,product:editing,reviewed:publish&&reviewed});
  await load(Math.min(data.page,Math.max(1,Math.ceil((data.total-(publish?1:0))/25))));
  if(publish)await onPublished();setEditing(null);setReviewed(false);setMessage(publish?'Produto revisado adicionado ao feed.':'Rascunho salvo. Ele continua fora do feed.');
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function publishAll(){
  if(busy||disabled||!data.total)return;
  setBusy(true);onBusyChange(true);setMessage('');
  try{
   const result=await request('PUT',{catalogId});
   await load();await onPublished();
   setMessage(`${result.published.toLocaleString('pt-BR')} produtos publicados. Todos estão no catálogo e no feed.`);
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);onBusyChange(false);}
 }
 async function changePage(page:number){setBusy(true);try{await load(page);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 const amount=Number(copies),additional=data.originalCount*amount;
 const invalid=!Number.isSafeInteger(amount)||amount<1||amount>1000||!data.originalCount||data.total+additional>10000;
 return <section className="panel draft-panel"><div className="panel-title"><div><h2>Cópias para edição</h2><span className="count">{data.total.toLocaleString('pt-BR')} rascunhos</span></div><button className="secondary" disabled={disabled||busy} onClick={open}><Copy size={15}/> Duplicar</button></div><div className="panel-body">
 <p className="generation-note">Multiplique os produtos dos criativos originais como rascunhos. As cópias mantêm marca, preço, link e mídias; só o ID muda. Edite as cópias se precisar ou publique todos os rascunhos de uma vez.</p>
 {disabled&&<p>Salve as alterações do catálogo antes de trabalhar com as cópias.</p>}
 {message&&<p className="notice" role="status">{message}</p>}
 <div className="draft-actions"><button className="primary" disabled={busy||disabled||!data.total} onClick={publishAll}>{busy?<LoaderCircle className="spin" size={16}/>:<Radio size={16}/>} Publicar todos</button><button className="text-button" disabled={busy||disabled} onClick={async()=>{setBusy(true);try{await load();setShow(v=>!v);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>{show?'Ocultar rascunhos':'Ver rascunhos'}</button></div>
 {show&&<><div className="video-list">{data.products.map(p=><button className="video-row draft-row" disabled={busy||disabled} key={p.id} onClick={()=>{setEditing({...p});setReviewed(false);}}><img src={p.image_link} alt="" loading="lazy"/><span><strong>{p.title}</strong><small>{p.id}</small></span><span className="count">Editar rascunho</span></button>)}</div>{!data.products.length&&<p className="generation-note">Nenhum rascunho nesta página.</p>}<div className="draft-pagination"><button className="secondary" aria-label="Página anterior de rascunhos" disabled={busy||data.page<=1} onClick={()=>changePage(data.page-1)}><ChevronLeft size={16}/></button><span>Página {data.page} de {Math.max(1,Math.ceil(data.total/25))}</span><button className="secondary" aria-label="Próxima página de rascunhos" disabled={busy||data.page*25>=data.total} onClick={()=>changePage(data.page+1)}><ChevronRight size={16}/></button></div></>}
 </div>
 {modal&&<div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-label="Duplicar produtos" onSubmit={e=>{e.preventDefault();void duplicate();}}><button type="button" className="modal-close icon-button" disabled={busy} aria-label="Fechar duplicação" onClick={()=>setModal(false)}><X/></button><h2>Duplicar produtos</h2><p><strong>{data.originalCount} criativo(s) original(is)</strong> neste catálogo. Cópias anteriores não entram na multiplicação.</p><label>Cópias por criativo<input type="number" min="1" max="1000" step="1" required value={copies} disabled={busy} onChange={e=>{setCopies(e.target.value);operation.current=null;}}/></label><p className="duplicate-total">{data.originalCount} × {Number.isFinite(amount)?amount:0} = <strong>{Number.isFinite(additional)?additional.toLocaleString('pt-BR'):0} novos rascunhos</strong></p><p>Limite: 10.000 rascunhos por catálogo. Depois, use Publicar todos para adicionar as cópias ao feed.</p>{message&&<p role="alert">{message}</p>}<button className="primary" disabled={busy||invalid} type="submit">{busy?<LoaderCircle className="spin" size={16}/>:<Copy size={16}/>} Criar rascunhos</button></form></div>}
 {editing&&<div className="modal-backdrop"><form className="modal draft-editor" role="dialog" aria-modal="true" aria-label="Editar rascunho" onSubmit={e=>{e.preventDefault();void save(false);}}><button className="modal-close icon-button" type="button" disabled={busy} aria-label="Fechar edição" onClick={()=>setEditing(null)}><X/></button><h2>Editar rascunho</h2><fieldset disabled={busy} className="workspace-fields">{(['title','brand','price','link','description','product_type'] as const).map(field=><label key={field}>{{title:'Nome do produto',brand:'Marca',price:'Preço',link:'Link da oferta',description:'Descrição',product_type:'Categoria'}[field]}<input required={field!=='product_type'} value={editing[field]||''} onChange={e=>{setEditing({...editing,[field]:e.target.value});setReviewed(false);}}/></label>)}<label className="review-check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/><span>Revisei este produto e confirmei seus dados para inclusão no feed.</span></label><div className="draft-actions"><button className="secondary" type="submit">Salvar rascunho</button><button className="primary" type="button" disabled={!reviewed} onClick={()=>save(true)}>Adicionar ao feed</button></div></fieldset>{message&&<p role="alert">{message}</p>}</form></div>}
 </section>;
}
