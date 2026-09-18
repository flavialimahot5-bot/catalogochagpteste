# FeedStudio

Painel em português para transformar vídeos e links de ofertas em catálogos TikTok XML (RSS), seguindo o template fornecido. Next.js + Vercel Blob, sem banco de dados adicional.

## Fluxo

Abra **Meus catálogos → Novo catálogo**, escolha um nome e clique em **Criar catálogo**. O catálogo é salvo imediatamente, mesmo vazio, com uma URL própria. Depois selecione-o para adicionar produtos. Você pode alternar entre catálogos pelo seletor no topo ou pela lista, que mostra a quantidade de produtos e o link de cada feed. Catálogos já existentes continuam acessíveis.

### Link exclusivo por criativo

Cada novo vídeo gera um produto com um caminho aleatório permanente no mesmo domínio da oferta: `https://loja.example/oferta` vira `https://loja.example/oferta/ctv-<uuid>`. Seis vídeos geram seis produtos e seis caminhos diferentes. Parâmetros de rastreamento e fragmento são preservados. O link é salvo uma única vez: reabrir, republicar e regenerar sugestões não o alteram. Produtos antigos mantêm seus links. A edição manual do link individual continua disponível.

A página de destino precisa aceitar esses caminhos e mostrar/redirecionar para a mesma oferta, conforme a configuração do site de destino. Este painel não cria domínios nem altera o roteamento de sites externos. Diferenciar URLs não garante aprovação ou duração de contas no TikTok.

1. Dentro do catálogo selecionado, informe somente o link da nova oferta. Esse campo não modifica os links dos produtos existentes. Em Ajustes opcionais, é possível definir marca, preço e moeda manualmente. Novos catálogos usam BRL por padrão; a moeda precisa corresponder ao catálogo TikTok. Catálogos antigos preservam a moeda salva.
2. Envie um ou mais vídeos. Cada criativo gera um item independente, com ID UUID persistente, título a partir do endereço da oferta e um complemento aleatório, descrição básica, sugestão fictícia de marca e preço aleatório. Os vídeos do mesmo lote compartilham os dados comerciais. A geração é local, sem API de IA ou extração da página da oferta. Os valores gerados são sugestões, não dados verificados do produto. Ajuste-os quando necessário para corresponder à página de venda; não há garantia de aprovação do TikTok.
3. O navegador captura um frame automaticamente, gera JPG e envia vídeo + imagem. É possível capturar outro segundo do vídeo. MP4/H.264 é o mais compatível; MOV e WebM dependem do codec suportado no navegador. Fonte mínima 500 × 500 px; a imagem não é ampliada.
4. Os dados ficam disponíveis em Ajustar dados do criativo. O frame precisa representar adequadamente o produto; a captura não reconhece o conteúdo da cena. Não há checkbox obrigatório para publicar.
5. Ao terminar o upload, os novos produtos são salvos automaticamente no catálogo selecionado e seu feed é atualizado. Cole a URL em **Data Feed URL** no TikTok. Também é possível baixar o XML. Se ocorrer falha ao salvar depois do upload, os itens continuam na tela para tentar novamente com **Salvar alterações**.
6. Em **Meus catálogos**, reabra e edite. Clique em **Salvar alterações** após editar produtos, renomear o catálogo, trocar frames ou remover itens, mantendo a mesma URL e os IDs dos itens existentes. Um catálogo também pode ser salvo vazio após remover seu último produto. Alterações podem levar pelo menos 60 segundos para refletir no cache do Blob, além da frequência de leitura do TikTok.

Para corrigir um catálogo existente em ARS que deveria usar BRL: abra **Meus catálogos → catálogo → Ajustes do catálogo → Moeda do catálogo TikTok → BRL** e publique novamente. Essa seleção aplica a moeda a todos os itens, sem converter numericamente os preços. O botão Regenerar sugestões gera novos textos, marca e preço, preservando IDs e links das mídias; apenas abrir ou republicar não regenera os dados.

O XML também inclui `product_type`, sugerido por palavras no link/título (por exemplo, panelas → utensílios de cozinha). Quando não há informação suficiente, usa `Produtos > Outros`; a sugestão é editável e não é classificação por IA. Catálogos antigos recebem esse campo ao serem republicados, mesmo sem reenviar os vídeos. O campo livre `product_type` atende à alternativa indicada pelo TikTok; não são inventados IDs da taxonomia Google.

## Rodar localmente

### Duplicação de rascunhos

Dentro do catálogo, use **Cópias para edição → Duplicar**. A quantidade é por criativo original: 6 originais × 1.000 criam 6.000 rascunhos, além dos 6 produtos do catálogo. Os originais são contados por URL de vídeo; cópias já revisadas não são contadas novamente. Limites: 1.000 cópias por criativo em cada operação e 10.000 rascunhos armazenados por catálogo.

Cada cópia ganha um ID e mantém marca, preço, link e mídias do original. Os vídeos não são reenviados. Os rascunhos são armazenados em JSON separado (`drafts/`) e não entram no RSS ao duplicar. A lista mostra 25 por página. Clique em um rascunho para editar e salvar; para inserir um produto no feed, confirme sua revisão individual e clique em **Adicionar ao feed**. O limite existente de 100 produtos publicados por catálogo permanece; os milhares de rascunhos ficam separados desse limite. Uma mesma tentativa de duplicação usa um identificador para evitar duplicatas em retries.

Use uma aba/operador por catálogo durante alterações: armazenamento Blob não fornece transações entre arquivos, e alterações simultâneas não têm resolução automática de conflitos. Os rascunhos ficam fora do feed, mas seu JSON usa o mesmo armazenamento público do projeto; não inclua dados privados.

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

### Atualizações automáticas pelo GitHub

Repositório: https://github.com/flavialimahot5-bot/catalogochagpteste — branch de produção: `main`.

Na Vercel, importe esse repositório e mantenha `main` como Production Branch. Com a integração GitHub conectada e os deployments habilitados, cada novo push nessa branch dispara um build e deploy de produção. Não é necessário criar GitHub Actions ou configurar um Deploy Hook.

Defina `BLOB_READ_WRITE_TOKEN` e `ADMIN_SECRET` em Production antes do primeiro deploy funcional. Mudanças locais só chegam à Vercel depois de commit e push para o GitHub. Se a Vercel exigir associação do autor à equipe, conecte a conta GitHub `flavialimahot5-bot` à conta Vercel proprietária do projeto.

Referência: [Integração oficial Vercel + GitHub](https://vercel.com/docs/git/vercel-for-github).

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
