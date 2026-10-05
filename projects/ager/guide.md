# Projeto Ager

## Visão geral técnica

Solução de **automação e conformidade sanitária** para o agronegócio, combinando visão computacional e telemetria de campo.

## Componentes

- Inspeção de qualidade via visão computacional (Edge AI)
- Telemetria via *MQTT*
- Dashboards em Grafana

### Pipeline de inspeção

1. Captura de imagem na linha
2. Inferência do modelo (Edge AI)
3. Classificação (conforme / não conforme)
4. Publicação do resultado via MQTT

## Exemplo de configuração

```python
import paho.mqtt.client as mqtt

client = mqtt.Client("ager-edge-01")
client.connect("broker.local", 1883)
client.publish("ager/inspecao", payload)
```

## Especificações

| Componente | Descrição                  |
|------------|------------------------------|
| Modelo     | Classificador Edge AI        |
| Telemetria | MQTT + Grafana                |
| Ambiente   | Campo (agroindústria familiar)|

> Este guia é um template inicial — substitua pelo conteúdo técnico real do Ager.
