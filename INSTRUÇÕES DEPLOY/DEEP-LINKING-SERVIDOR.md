# Deep Linking — configuração do servidor

O JavaScript só cuida da History API. Para `https://seu-dominio/projetos/legacy-server`
funcionar em **acesso direto / F5 / link compartilhado**, o servidor precisa responder
essa URL com o conteúdo do `index.html`:

- status **200** (não redirecionar, a URL deve permanecer `/projetos/legacy-server`);
- **somente** para os slugs válidos (o `id` de cada projeto em `js/projects.js`);
- qualquer outra URL inexistente continua dando **404** (o `404.html` do site).

Slugs atuais: `legacy-server`.
**Todo projeto novo em `projects.js` exige adicionar o slug nas regras abaixo.**

> O arquivo `_headers` só é lido por Netlify e Cloudflare Pages. Na Vercel e no
> Nginx ele é ignorado, então os headers de segurança/cache precisam ser
> recriados (incluídos abaixo).

---

## 1. Vercel

Crie `vercel.json` na raiz do projeto (ao lado de `index.html`):

```json
{
  "rewrites": [
    { "source": "/projetos/:slug(legacy-server)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'sha256-jUZxtWpw4DV0IQhRX5H3ru1e1dp8mw4R5M/IbwaAJK8='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://cdn.simpleicons.org; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000" }
      ]
    },
    { "source": "/", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/projetos/(.*)", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/(.*)\\.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/css/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }] },
    { "source": "/js/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=2592000" }] }
  ]
}
```

Para vários projetos, separe os slugs por `|`:
`"/projetos/:slug(legacy-server|outro-projeto)"`.

Passos:

1. Faça commit do `vercel.json` e dê push (ou `vercel --prod`).
2. Framework Preset: **Other**. Build Command e Output Directory: deixe vazios (site estático na raiz).
3. A Vercel serve o `404.html` da raiz automaticamente para rotas inexistentes.

Teste:

```bash
curl -I https://seu-dominio/projetos/legacy-server   # esperado: 200, content-type text/html
curl -I https://seu-dominio/projetos/inexistente     # esperado: 404
```

Use a URL **sem** barra final como canônica.

---

## 2. Nginx Proxy Manager (NPM)

O NPM é um **proxy reverso**: ele não serve arquivos, só encaminha para um
*upstream* (por exemplo, um container nginx que serve o site). Por isso há duas
formas; use a **A** se você controla o container do site, ou a **B** se só
pode mexer no NPM.

### A) Regra no nginx que serve o site (recomendado)

No `nginx.conf` / `default.conf` do container do site (`root` apontando para a pasta com `index.html`):

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Deep linking: só slugs válidos viram index.html (200, URL mantida)
    location ~ ^/projetos/(legacy-server)/?$ {
        try_files /index.html =404;
    }

    # Todo o resto: arquivo real ou 404 com a página personalizada
    location / {
        try_files $uri $uri/ =404;
    }
    error_page 404 /404.html;

    # Headers de segurança (equivalentes ao _headers)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'sha256-jUZxtWpw4DV0IQhRX5H3ru1e1dp8mw4R5M/IbwaAJK8='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://cdn.simpleicons.org; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

Observações:

- `add_header` dentro de um `location` **substitui** os do nível `server`. Se
  você adicionar `add_header Cache-Control ...` em algum `location`, repita
  os headers de segurança nele.
- Cache (opcional): `no-cache` para HTML e `/projetos/`, `max-age=3600` para
  `/css/` e `/js/`, `max-age=2592000` para `/assets/`, como no `_headers`.

No NPM, o Proxy Host só aponta para esse container (Forward Hostname/IP e Port
do container, SSL com Let's Encrypt, *Force SSL* e *HTTP/2* ligados). Nada
especial é necessário.

### B) Regra direto no NPM (quando o upstream não tem a regra)

1. Abra o Proxy Host do site → aba **Advanced** → campo **Custom Nginx Configuration**.
2. Cole (ajuste `legacy-server` e use a mesma lista de slugs do `projects.js`):

```nginx
location ~ ^/projetos/(legacy-server)/?$ {
    rewrite ^ /index.html break;
    proxy_pass $forward_scheme://$server:$port;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

3. Salve. O NPM valida a configuração; se der erro, ele mostra o motivo no próprio modal.

Observações:

- `$forward_scheme`, `$server` e `$port` são variáveis que o NPM já define no
  Proxy Host. Se a sua versão não definir, troque por o endereço fixo do
  upstream, por exemplo `proxy_pass http://192.168.0.10:8080;`.
- Os headers de segurança do `_headers` não são aplicados pelo NPM. Para
  incluí-los aqui, cole os `add_header ... always;` do bloco da opção A no
  mesmo campo (nível do server, fora do `location`) e repita-os dentro do
  `location` acima, porque `add_header` em `location` substitui os herdados.
- Se o upstream devolver 404 para `/index.html`, confira se o site está na raiz do container.

Teste (da sua rede ou de fora):

```bash
curl -I https://seu-dominio/projetos/legacy-server   # esperado: 200, content-type text/html
curl -I https://seu-dominio/projetos/inexistente     # esperado: 404
curl -I https://seu-dominio/js/projects.js           # esperado: 200, content-type javascript
```

---

## Checklist final

- [ ] `/projetos/legacy-server` abre o projeto no modal (acesso direto e F5).
- [ ] `/projetos/qualquer-outra-coisa` mostra o `404.html`.
- [ ] CSS, JS e imagens carregam em `/projetos/legacy-server` (o `<base href="/">` do `index.html` cuida dos caminhos relativos).
- [ ] Ao adicionar um projeto em `js/projects.js`, o slug novo entrou nas regras do servidor.
