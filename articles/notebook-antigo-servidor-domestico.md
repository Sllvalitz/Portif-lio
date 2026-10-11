## Por que reaproveitar um notebook

Um notebook antigo já vem com placa-mãe, memória, armazenamento, rede e até uma "bateria de emergência" embutida. Para um servidor doméstico que fica ligado o dia todo, isso é um ponto de partida melhor do que parece: o consumo é baixo, o espaço ocupado é pequeno e o custo inicial é praticamente zero.

No caso do Legacy Server, a base é a placa-mãe de um Acer ES1-511. Este texto organiza o raciocínio por trás desse tipo de projeto: o que avaliar, como estruturar o sistema e quais cuidados valem a pena desde o começo.

## O que avaliar antes de começar

Nem todo notebook antigo serve. Uma checagem rápida evita retrabalho:

- **Armazenamento:** SSD faz muita diferença para o sistema e para os bancos de dados dos serviços.
- **Memória RAM:** containers somam consumo; verifique se é possível ampliar.
- **Rede:** porta Ethernet é preferível a Wi-Fi para um servidor.
- **Temperatura:** limpe o cooler e troque a pasta térmica antes de deixar a máquina ligada 24/7.
- **Bateria:** uma bateria inchada deve ser removida, nunca ignorada.

## Sistema base: Debian sem ambiente gráfico

Para um servidor, quanto menos coisa rodando, melhor. Uma instalação mínima do Debian, sem desktop, deixa a maior parte da memória livre para os serviços. Depois da instalação, o primeiro passo é atualizar tudo:

```bash
sudo apt update
sudo apt full-upgrade
sudo apt install ufw curl git
```

Também vale configurar acesso por chave SSH e desativar o login por senha assim que a chave estiver funcionando.

## Docker como camada de serviços

A ideia central é manter o sistema operacional enxuto e colocar cada serviço em seu próprio container. Isso facilita atualizar, mover e remover aplicações sem sujar o sistema base. Instale o Docker Engine seguindo a [documentação oficial para o Debian](https://docs.docker.com/engine/install/debian/).

Um serviço de exemplo, descrito em um arquivo `compose.yaml`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    ports:
      - "8096:8096"
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /srv/media:/media:ro
```

Painéis como o CasaOS ajudam a visualizar e instalar aplicações, mas o arquivo Compose continua sendo a fonte de verdade: ele é texto, pode ser versionado e documenta exatamente como o serviço sobe.

## Organização de pastas e configuração

Com mais de três ou quatro serviços, a bagunça aparece rápido. Uma convenção simples já resolve:

```text
/srv/
├── containers/
│   ├── jellyfin/
│   │   ├── compose.yaml
│   │   └── config/
│   └── adguard/
│       ├── compose.yaml
│       └── data/
├── media/
└── backup/
```

Regras que ajudam:

1. Uma pasta por serviço, com o `compose.yaml` dentro.
2. Dados persistentes sempre em volumes mapeados para dentro dessa pasta.
3. Segredos fora do repositório, em arquivos `.env` ignorados pelo Git.

## Acesso e rede

Três peças costumam aparecer em um servidor doméstico:

- **Proxy reverso** (como o Nginx Proxy Manager) para acessar serviços por nome e com SSL, em vez de decorar portas.
- **VPN** (como o [Tailscale](https://tailscale.com/kb)) para acessar a rede de casa de fora, sem abrir portas no roteador.
- **Filtro DNS** (como o AdGuard Home) para bloquear rastreadores e domínios indesejados em toda a rede.

Antes de expor qualquer coisa à internet, pergunte se a VPN já resolve o caso. Quase sempre resolve.

## Segurança em camadas

Nenhuma ferramenta isolada protege um servidor. O que funciona é combinar camadas simples:

- **Firewall (UFW):** bloqueia tudo que chega e libera só o necessário.
- **CrowdSec:** reage a tentativas repetidas de acesso suspeito.
- **ClamAV:** varredura de arquivos, útil principalmente em pastas compartilhadas.
- **Lynis:** auditoria periódica que sugere melhorias de configuração.

Um ponto de atenção: o Docker publica portas manipulando o `iptables` diretamente e pode contornar regras do UFW. Revise quais portas estão realmente expostas, em vez de confiar apenas na lista do firewall.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp
sudo ufw enable
```

Ajuste a faixa de rede para a sua, e só ative o firewall depois de confirmar que a regra do SSH está correta.

## Backup

Um servidor sem backup é um experimento. A regra 3-2-1 é um bom guia: três cópias dos dados, em dois tipos de mídia, com uma delas fora de casa. O Rclone cobre bem a parte remota, e seu [modo `crypt`](https://rclone.org/crypt/) criptografa os arquivos antes de enviá-los.

> Um backup que nunca foi restaurado é só uma esperança. Teste a restauração de tempos em tempos.

## Manutenção e documentação

Documente enquanto monta, não depois. Registrar cada decisão (por que esta porta, por que este volume) transforma o servidor em algo que você consegue reconstruir. Uma rotina mínima de manutenção inclui:

1. Atualizar o sistema e as imagens dos containers.
2. Conferir o espaço em disco e a saúde do armazenamento.
3. Rodar a auditoria de segurança e revisar o que ela apontar.
4. Verificar se o backup mais recente existe e abre.

## Limitações e próximos passos

Hardware reaproveitado tem limites: processamento modesto, componentes antigos e nenhuma redundância de fonte ou de disco. Para o uso doméstico isso costuma bastar, mas vale planejar o que fazer quando algo falhar, e isso reforça a importância do backup.

Entre os próximos passos naturais estão automatizar a manutenção com scripts, monitorar o servidor com alertas simples e documentar tudo em um repositório público, como foi feito no projeto Legacy Server.
