# Legacy NAS

## Visão geral técnica

Infraestrutura NAS de alta disponibilidade construída sobre **hardware legado** (notebook Acer ES1-511 reaproveitado).

## Stack

- Linux
- Docker / Docker Compose
- Nginx (proxy reverso)
- ZFS (armazenamento)
- Grafana + InfluxDB (monitoramento)

### Organização dos serviços

1. Containers isolados por serviço via Docker Compose
2. Nginx roteando por subdomínio/porta
3. ZFS garantindo integridade e snapshots do armazenamento

## Exemplo — trecho de `docker-compose.yml`

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
```

## Especificações

| Item          | Detalhe                        |
|---------------|----------------------------------|
| Hardware base | Acer ES1-511 (reaproveitado)     |
| Storage       | ZFS                               |
| Monitoramento | Grafana + InfluxDB                |

Documentado em episódios no [repositório do projeto](https://github.com/Sllvalitz).

> Este guia é um template inicial — substitua pelo conteúdo técnico real do Legacy NAS.
