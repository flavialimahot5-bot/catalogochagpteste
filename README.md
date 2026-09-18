# FeedStudio

Painel em português para transformar vídeos e links de ofertas em catálogos TikTok XML (RSS), seguindo o template fornecido. Next.js + Vercel Blob, sem banco de dados adicional.

## Fluxo

1. Informe link da oferta, marca e preço reais. O preço não é inventado.
2. Envie um ou mais vídeos. Cada criativo gera um item independente, com ID UUID persistente, nome a partir do arquivo, descrição básica e uma sugestão fictícia de marca quando não informada. A geração é local, sem API de IA ou extração da página da oferta.
3. O navegador captura um frame automaticamente, gera JPG e envia vídeo + imagem. É possível capturar outro segundo do vídeo. MP4/H.264 é o mais compatível; MOV e WebM dependem do codec suportado no navegador. Fonte mínima 500 × 500 px; a imagem não é ampliada.
4. Revise os dados individualmente e confirme a revisão. O frame precisa representar adequadamente o produto; a captura não reconhece o conteúdo da cena. Não há garantia de aprovação pelo TikTok.
5. Publique e copie a URL para **Data Feed URL**. Também é possível baixar o XML.
6. Em **Meus catálogos**, reabra, edite e publique mantendo a mesma URL e os IDs dos itens existentes. Alterações podem levar pelo menos 60 segundos para refletir no cache do Blob, além da frequência de leitura do TikTok.

## Rodar localmente

```sh
npm install
npm run dev
```

Abra http://127.0.0.1:3000. Sem token Blob e fora da Vercel, os arquivos ficam em `.local-data/`, ignorada pelo Git. Esse modo permite testar captura, hospedagem local, exportação e reabertura, mas **seus links locais não funcionam no TikTok**. O servidor fica restrito ao computador. Catálogos criados localmente precisam ser reenviados/publicados no ambiente de produção; não há migração automática. Rascunhos não publicados não persistem ao recarregar a página.

## Deploy na Vercel

1. Envie este projeto para um repositório e importe na Vercel (framework Next.js). Ou use `npx vercel` nesta pasta com sua conta autenticada.
2. Em **Storage**, conecte um **Blob Store público** ao projeto. Confirme a variável `BLOB_READ_WRITE_TOKEN` para Production (e Preview/Development se necessário).
3. Em **Settings → Environment Variables**, defina `ADMIN_SECRET` com uma chave aleatória de no mínimo 32 caracteres. Nunca use prefixo `NEXT_PUBLIC_` para segredos. Gere uma chave com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Faça novo deploy. Entre no painel com a chave definida. Ela fica apenas no sessionStorage desta aba e é enviada via HTTPS para autorizar operações de escrita/leitura administrativa. Este é um painel de operador único; não é um SaaS multiusuário.
5. Envie vídeos e publique o catálogo. A URL pública do XML é servida diretamente pelo Blob. Mídias e feeds devem permanecer acessíveis sem login para o TikTok.

Os uploads em produção são diretos do navegador ao Blob, em multipart, com autorização do servidor (máximo definido pelo app: 500 MB por vídeo, 100 itens por catálogo). Não passam pelo limite de corpo das funções Vercel. Somente formatos de mídia permitidos podem receber tokens; o namespace dos uploads não permite sobrescrever feeds ou catálogos.

Vídeos, frames, XML e os registros JSON dos catálogos ficam públicos em caminhos com UUID. Não inclua dados privados. Apagar um item do catálogo não apaga o arquivo original do Blob; arquivos órfãos/frames substituídos podem ser removidos pelo painel Storage quando não forem mais referenciados. Custos de armazenamento e transferência seguem sua conta Vercel. Edição concorrente do mesmo catálogo usa a última publicação concluída; recomendado um único operador/aba por catálogo.

## Verificação

```sh
npm test
npm run typecheck
npm run build
```

O XML inclui todos os campos obrigatórios do template e `g:video_link`. Campos opcionais sem informação são omitidos; não são inventados GTIN, dimensões comerciais, frete ou identificadores de app.

Referências: [Upload direto do Vercel Blob](https://vercel.com/docs/vercel-blob/client-upload), [SDK Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk).
