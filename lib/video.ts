export async function captureFrame(source:string, seconds?:number):Promise<{blob:Blob;preview:string;time:number;duration:number;width:number;height:number}> {
 const video=document.createElement('video');video.preload='auto';video.muted=true;video.playsInline=true;video.crossOrigin='anonymous';
 try {
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Não foi possível abrir o vídeo em 30 segundos.')),30000);video.onloadeddata=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(new Error('Este vídeo não abre no navegador. Converta para MP4 (H.264).'));};video.src=source;});
  const duration=video.duration;
  if(!Number.isFinite(duration)||duration<=0)throw new Error('O vídeo não tem uma duração válida.');
  if(video.videoWidth<500||video.videoHeight<500)throw new Error('Use um vídeo com pelo menos 500 × 500 px para gerar a imagem do catálogo.');
  const time=Math.min(seconds??Math.min(1,duration*.2),Math.max(0,duration-.05));
  if(time>0)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Não foi possível capturar esse momento.')),15000);video.onseeked=()=>{clearTimeout(timer);resolve();};video.currentTime=time;});
  const canvas=document.createElement('canvas');const ratio=Math.min(1,1920/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.round(video.videoWidth*ratio);canvas.height=Math.round(video.videoHeight*ratio);
  if(canvas.width<500||canvas.height<500){canvas.width=video.videoWidth;canvas.height=video.videoHeight;}
  canvas.getContext('2d')!.drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar a imagem.')),'image/jpeg',.92));
  return {blob,preview:URL.createObjectURL(blob),time,duration,width:canvas.width,height:canvas.height};
 }finally{video.pause();video.removeAttribute('src');video.load();}
}
