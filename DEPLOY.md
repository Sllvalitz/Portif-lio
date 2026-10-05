# Deploy — Portfólio (Anderson da Silva)

## Status
Site 100% estático (HTML + CSS + JS puro, sem build step, sem backend).
Não depende de Node/PHP/etc. — qualquer servidor que sirva arquivos
estáticos funciona.

## Estrutura esperada
```
/portfolio.html
/css/*.css
/js/*.js
/assets/imagens/*   (hand.png, img1.png, img2.jpg, etc.)
```
Todos os caminhos no HTML/CSS são relativos (`./css/...`, `./js/...`,
`./assets/imagens/...`), então a pasta inteira pode ser jogada direto
na raiz servida pelo Nginx — sem reescrever nada.

## Dependências externas (CDN)
- Google Fonts (`fonts.googleapis.com`)
- GSAP 3.12.2 via `cdnjs.cloudflare.com`

Se o servidor pessoal não tiver saída à internet liberada para esses
domínios, isso precisa ser resolvido (self-host das fontes/GSAP) antes
do deploy — me avisa se for o caso.

## Nginx (pendente de detalhes do seu servidor)
Ainda não sei: domínio/subdomínio, se vai atrás de reverse proxy
(o Legacy Server já roda outros serviços via Nginx), se quer HTTPS via
Let's Encrypt, e se `portfolio.html` deve virar `index.html` na raiz
do site. Quando você passar isso, preencho aqui o `server{}` block e
os passos de deploy (systemd/Docker, se for o caso).






## Guias técnicas dos projetos (modal "Visão Geral" / "Guia do Projeto")

Cada projeto do carrossel busca seu conteúdo em tempo de execução (via
`fetch`, sem build step) na seguinte estrutura, na raiz do site:

```
/projects/
  protec/
    guide.md        (Markdown — renderizado na guia "Guia do Projeto")
    guide.pdf        (opcional — botão "VER GUIA EM PDF" só aparece se existir)
    images/          (galeria própria da guia "Visão Geral")
      image-01.jpg
      image-02.jpg
  ager/
    guide.md
    guide.pdf
    images/
  legacy-nas/
    guide.md
    guide.pdf
    images/
```

- `guide.md` já vem com um template de exemplo por projeto — substitua pelo
  conteúdo técnico real.
- `guide.pdf` é opcional: o botão de download só é exibido se o arquivo
  responder OK a uma checagem HEAD; se não existir, a interface não quebra.
- As imagens da galeria (`images/`) precisam ser referenciadas manualmente
  no array `images: []` de cada projeto, dentro do `<script>` de
  `portfolio.html` (não há duplicação de dados — os caminhos apontam
  diretamente para os arquivos aqui).
- Como o carregamento é via `fetch`, **isso só funciona servido por HTTP**
  (Nginx), não abrindo o `portfolio.html` direto do sistema de arquivos.
