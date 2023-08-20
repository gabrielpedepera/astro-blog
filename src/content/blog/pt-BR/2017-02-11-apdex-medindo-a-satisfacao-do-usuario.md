---
author: Gabriel Pereira
pubDatetime: 2017-02-11T18:46:33Z
title: "Apdex: Medindo a Satisfação do Usuário"
postSlug: apdex-medindo-a-satisfacao-do-usuario
featured: false
draft: false
tags:
  - apdex
  - newrelic
  - metricas
ogImage: ""
description: "Apdex: Medindo a Satisfação do Usuário"
lang: "pt-BR"
---

No time que estou trabalhando atualmente, o [New Relic APM](https://newrelic.com/application-monitoring) é uma das ferramentas que mais utilizamos para monitorar nossas aplicações em ambiente de produção. Ele oferece visualizações agrupadas para diagnóstico rápido de problemas, permitindo ser analisado solicitações específicas sobre métricas de desempenho por tempo de resposta, throughput e tamanho de transferência de dados.

Em relação as métricas relacionadas ao desempenho por tempo de resposta, um dado muito interessante que a ferramenta nos oferece, é o Apdex (Application Performance Index), Índice de Desempenho da Aplicação, o qual vamos nos aprofundar a seguir, para entender como funciona sobre essa interessante métrica.

### Visão Geral

O Apdex é um padrão para medir a satisfação dos usuários em relação ao tempo de resposta de aplicações e serviços web. Trata-se de uma solução simplificada de SLA (Service Level Agreement) que proporciona aos responsáveis técnicos das aplicações uma visão melhor do grau de satisfação dos usuários, ao contrário de métricas tradicionais, como o tempo médio de resposta, que podem ser distorcidas por algumas respostas muito longas.

A essência do Apdex é medir a felicidade do usuário. Com que frequência os usuários estão satisfeitos com o desempenho da minha aplicação? Com que freqüência eles toleram o desempenho lento e quão freqüentemente eles estão frustrados?

### Como funciona

Deve ser definido um tempo de resposta (T), em segundos, o qual você julga ser aceitável para sua aplicação.

Esse valor é uma variável, devido a cada aplicação ter suas características. Por exemplo, uma aplicação com APIs simples deve ter um tempo de resposta baixo. Já uma aplicação com integrações a vários Web Services, pode ter um tempo de resposta um pouco mais alto, devido a depender da resposta de terceiros.

### Níveis

O índice baseia-se em três níveis relacionados ao tempo de resposta da aplicação:

- **Satisfeito:** O usuário é totalmente produtivo. O tempo de resposta da aplicação é menor ou igual ao tempo (T) definido como aceitável.

- **Tolerante:** O usuário nota atraso de desempenho em respostas, mas continua o processo. Se enquadra nesse nível tempos de respostas maiores que T e menores ou iguais a 4T.

- **Frustrado:**: O desempenho com um tempo de resposta maior que 4T segundos é inaceitável e os usuários podem abandonar o processo.

Vamos analisar uma aplicação da qual foi definido um tempo de resposta de 1.2 segundos, por exemplo:

<table class="table">
  <thead>
    <tr>
      <th width="150"><b>Nível</b></th>
      <th width="150"><b>Intervalo</b></th>
      <th width="150"><b>Tempo de Resposta</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Satisfeito</td>
      <td>T ou menos</td>
      <td>&lt;= 1.2 segundos</td>
    </tr>
    <tr>
      <td>Tolerante</td>
      <td>&gt;T, &lt;= 4T</td>
      <td>Entre 1.2 e 4.8 segundos</td>
    </tr>
    <tr>
      <td>Frustrado</td>
      <td>&gt; 4T</td>
      <td>Mais que 4.8 segundos</td>
    </tr>
  </tbody>
</table>

### A fórmula

A fórmula do Apdex é definida pela quantidade de requisições satisfeitas, mais a metade das requisições de tolerância mais nenhuma das requisições frustradas, dividido por todas as requisições:

<div align="center">
<pre>
<span style="border-bottom: 1px solid black; padding-bottom: 5px;">
Requisições Satisfeitas + Requisições Toleradas / 2</span>
Total de Requisições
</pre>
</div>

Como resultado temos o indíce em uma escala uniforme de 0 a 1 (0 = nenhum usuário satisfeito, 1 = todos os usuários satisfeitos).

#### Exemplo

- Durante um período de 2 minutos um servidor processa 200 requisições.
- Foi definido um tempo de resposta aceitável de T = 0.5 segundos (500 ms).
- 170 dos pedidos foram tratados dentro de 500ms, de modo que eles são classificados como **Satisfeitos**.
- 20 das solicitações foram tratadas entre 500ms e 2 segundos (2000 ms), portanto, eles são classificados como **Tolerantes**.
- Os restantes 10 não foram manuseados adequadamente ou demoraram mais de 2 segundos, então eles são classificados como **Frustrados**.

A pontuação Apdex resultante é:

<div align="center">
<pre>(170 + (20 / 2)) / 200 = <b>0.9</b></pre>
</div>

### Concluindo

O Apdex pode ser tornar um ponto de referência crítico para medir a satisfação do cliente e o desempenho de curto e longo prazo de sua aplicação. Ao definir um objetivo relevante e realizável, você pode verificar flutuações na satisfação do cliente que são difíceis de detectar. Se os clientes experimentam um número crescente de respostas mais lentas do que ideais, você verá isso refletido imediatamente no gráfico do Apdex, enquanto o tempo de resposta médio pode não mudar muito.

#### Leia mais sobre

- [https://docs.newrelic.com/docs/apm/new-relic-apm/apdex/apdex-measuring-user-satisfaction](https://docs.newrelic.com/docs/apm/new-relic-apm/apdex/apdex-measuring-user-satisfaction)
