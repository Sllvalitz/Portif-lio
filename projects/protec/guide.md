# Projeto Protec

## Visão geral técnica

Sistema de segurança industrial para monitoramento contínuo de **sinais vitais** de operadores, com alertas em tempo real.

## Arquitetura

O firmware roda sobre *RTOS* em um ESP32, publicando leituras via MQTT para o dashboard de gestão.

### Sensores integrados

- Frequência cardíaca
- Temperatura corporal
- Aceleração / impacto (queda)

### Fluxo de dados

1. Sensor lê o sinal vital
2. ESP32 empacota e envia via MQTT
3. Dashboard consome e dispara alerta se necessário

## Exemplo de payload

```json
{
  "device_id": "protec-01",
  "heart_rate": 78,
  "temp_c": 36.6,
  "fall_detected": false
}
```

Trecho de leitura do sensor em C++: use `analogRead(PIN_HR)` para capturar o sinal bruto.

## Especificações

| Componente     | Modelo      | Observação                |
|----------------|-------------|----------------------------|
| MCU            | ESP32-WROOM | Wi-Fi + BLE integrados     |
| Sensor cardíaco| MAX30102    | I2C                        |
| Protocolo      | MQTT        | QoS 1                      |

Mais detalhes no [repositório do projeto](https://github.com/Sllvalitz).

> Este guia é um template inicial — substitua pelo conteúdo técnico real do Protec.
