# Open Graph — Auditoria futura (migração para Nginx Proxy Manager)

Quando você migrar para hospedagem própria via Nginx Proxy Manager, a auditoria de Open Graph
será a mesma — **as meta tags no `<head>` não mudam**. Só o que muda é o domínio.

Atual: `https://portifolio-ten-roan-52.vercel.app/`  
Futuro: `https://seu-dominio.com/` (ou IP do servidor, se sem DNS)

## Como chamar Claude para atualizar o Open Graph na migração

**Envie para Claude:**

1. **O arquivo `index.html` do site** (atual, com todas as mudanças aplicadas).
2. **Sua nova URL (domínio ou IP com https)**, por exemplo:
   - `https://ansilabs.com/`
   - `https://192.168.x.x/`
   - `https://portfolio.seu-servidor.local/`
3. **A imagem de preview** (`og-preview.jpg`), OU confirme que continuará em `/assets/`.

**Instruções prontas para enviar:**

> "Preciso atualizar o Open Graph do meu portfólio para migração para Nginx Proxy Manager.
> 
> Url atual (Vercel): https://portifolio-ten-roan-52.vercel.app/
> Url nova: https://seu-dominio-aqui.com/ (SUBSTITUA)
> 
> Estou reenviando o index.html atual e o arquivo de preview da imagem (og-preview.jpg).
> 
> Por favor:
> 1. Atualize todos os og:url, og:image (e variações) com a nova URL
> 2. Confirme se a imagem continuará em /assets/ ou se foi movida
> 3. Verifique se não há duplicação ou conflito nas tags
> 4. Forneça o index.html atualizado
> 
> Contexto: o site é 100% estático, hospedado em Nginx Proxy Manager atrás de um servidor próprio. Deep Linking continua ativo (/projetos/legacy-server). Cache: html=no-cache, css/js=1h, assets=30 dias."

## Checklist antes de chamar Claude

- [ ] Novo domínio/URL confirmado (com https)
- [ ] HTTPS ativo no Nginx (certificado Let's Encrypt)
- [ ] `/assets/og-preview.jpg` está acessível publicamente em `https://seu-dominio/assets/og-preview.jpg`
- [ ] Arquivo `index.html` copiado para o novo servidor e funcionando
- [ ] Deep Linking configurado no Nginx (confira `DEEP-LINKING-SERVIDOR.md`)

## O que Claude vai fazer

1. Ler seu `index.html` atual.
2. Substituir **todos** os `https://portifolio-ten-roan-52.vercel.app/` por sua URL nova.
3. Confirmar se a imagem continua em `/assets/` ou foi movida.
4. Verificar para não duplicar tags nem deixar URLs quebradas.
5. Testar os previews nos Debuggers (Facebook, LinkedIn, Twitter).

## Arquivos afetados

- **`index.html`**: meta tags Open Graph e canonical. É o **único** arquivo que muda.
- **`/assets/og-preview.jpg`**: a imagem. Só muda de local se você a mover.
- **Tudo mais** (`js/`, `css/`, `404.html`, `_headers`, Deep Linking): sem mudanças.

## Debuggers para testar após a migração

Use esses para forçar atualização do cache e confirmar o preview:

- **Facebook**: https://developers.facebook.com/tools/debug/
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **Twitter/X**: https://cards-dev.twitter.com/validator
- **WhatsApp / Discord**: Adicione `?v=1` ou `?v=2` ao link (força refresh no cache do cliente)

Cole a URL do seu portfólio em cada um e veja o preview gerado. Se aparecer errado, volte aqui e me chame de novo.

## Salvos localmente

Se você guardar esses em um lugar seguro, não precisa perder tempo procurando depois:

- `index.html` (atual, com OG configurado)
- `DEEP-LINKING-SERVIDOR.md` (configuração Nginx para Deep Linking)
- `og-preview.jpg` (1200×630)
- Este arquivo (`AUDIT-OG-FUTURO-NPM.md`)

Tudo pronto para migração sem perder nada.
