---
author: Gabriel Pereira
pubDatetime: 2020-10-28T23:09:00Z
title: Migrando APIs utilizando Diffy e NGINX
postSlug: migrando-apis-utilizando-diffy-e-nginx/
featured: false
draft: false
tags:
  - vscode
  - visual studio code
  - rubocop
ogImage: "/uploads/diffy-diagram.png"
description: Diffy e NGINX para migrar APIs com confiança.
---

Recentemente tive a oportunidade de participar de um projeto envolvendo a migração de algumas APIs das quais gostaria de compartilhar um pouco sobre essa experiência. Minha ideia não é abordar o motivo pelo qual essas APIs foram migradas, mas sim a estratégia que foi utilizada para que esse processo fosse executado de maneira segura e bem sucedida.

No contexto original foram migradas algumas APIs relacionadas a um específico domínio de uma aplicação monolítica Ruby on Rails para uma outra aplicação Ruby on Rails, porém "API-only" dedicada apenas a esse domínio em questão. Porém, meu objetivo por agora será abordar a migração de apenas uma API fictícia utilizando uma estratégia semelhante a que foi utilizada no contexto original.

## Conhecendo nossas APIs

Nossa aplicação fictícia será baseada na imagem: [https://hub.docker.com/r/diffy/example-service](https://hub.docker.com/r/diffy/example-service "https://hub.docker.com/r/diffy/example-service"), e vamos utilizar [Docker](https://www.docker.com "Docker") e [Docker Compose](https://docs.docker.com/compose/ "Docker Compose") para orquestrar os serviços e nossa migração.

Vamos conhecer um pouco das nossas aplicações:

- **Primária**: aplicação que possui distintas APIs e nesse contexto terá apenas uma API migrada;
- **Candidata**: aplicação que irá prover uma nova API da qual substuirá a atual servida pela aplicação primária.

`docker-compose.yml`

    version: "3"
    services:
      primary:
        image: diffy/example-service:production
        container_name: primary
        ports:
          - 8080:5000
      candidate:
        image: diffy/example-service:candidate
        container_name: candidate
        ports:
          - 8081:5000

Iniciando as aplicações:

```bash
$ docker-compose up
```

Vamos fazer alguns testes após levantar as aplicações, a aplicação primária está respondendo através da porta `8080` e a aplicação candidata na porta `8081`.

Nos screenshots estou utilizando o [HTTPie](https://httpie.org/ "HTTPie").

**Primária:**

![Imagem que contém um request sendo feito para a aplicação primária e obtendo uma resposta de sucesso.](/uploads/http-app-primaria.jpg "Curl request para a aplicação primária.")

**Candidata:**

![Imagem que contém um request sendo feito para a aplação candidata e obtendo uma resposta de sucesso.](/uploads/http-app-candidate.jpg "Curl request para a aplicação candidata")

Se você verificar a documentação da imagem [https://hub.docker.com/r/diffy/example-service](https://hub.docker.com/r/diffy/example-service "https://hub.docker.com/r/diffy/example-service") vai perceber que a mesma disponibiliza 4 endpoints:

- _/success_
- _/regression_
- _/noise_
- _/noisy_regression_

Por fins de demonstração, vamos realizar a migração de apenas uma API, que no caso será a `/success`. Ou seja, vamos manter as APIs `/regression`, `/noise`, e `/regression_noise` sob a responsabilidade da aplicação primária, e a API `/success` passará a ser de responsabilidade da aplicação candidata. Nossa estratégia será:

1. Garantir que a API da aplicação `candidata` esteja respondendo com os mesmos dados que a API da aplicação `primária`, que será substituída;
2. Fazer com que a aplicação `candidata` se torne responsável pela API em questão de forma transparente para os serviços que estão consumindo a mesma, e manter a aplicação `primária` responsável aos demais endpoints.

## Diffy

O [Twitter](https://twitter.com "Twitter") tornou essa ferramenta pública em 2015, publicando junto esse [artigo](https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html "Blog Post Twitter") do qual explica um pouco do seu funcionamento. Atualmente a mesma está arquivada pelo Twitter, porém vem sido mantida pela organização [OpenDiffy](https://github.com/opendiffy/diffy "OpenDiffy").

Retirando do próprio [README](https://github.com/opendiffy/diffy#what-is-diffy "README Diffy") do Diffy e em uma tradução livre:

> Diffy encontra potenciais bugs em seu serviço acessando instâncias do seu serviço onde contém sua nova implementação e sua antiga implementação lado a lado. Diffy se comporta como um proxy repassando qualquer requisição que receba para cada uma das instâncias (nova e antiga implementação). Em seguida, ele compara as respostas e relata quaisquer diferenças que possam surgir. A premissa do Diffy é que se duas implementações do serviço retornam respostas “semelhantes” para um conjunto suficientemente grande e diverso de solicitações, então as duas implementações podem ser tratadas como equivalentes e a implementação mais recente é livre de regressão.

Além disso, gostaria de adicionar que o Diffy tem uma boa interface web onde você pode comparar as diferenças entra sua aplicação estável (primária) e a aplicação candidata. Você também pode configurar para ignorar coisas das quais não quer se preocupar, como diferenças nos cabeçalhos ou até mesmo valores na resposta da requisição que você sabe que serão realmente diferentes na nova implementação.

### Configurando o Diffy

Voltando ao nosso cenário fictício do qual estamos simulando a migração de uma API, vamos adicionar a ferramenta Diffy para nos ajudar a alcançar o nosso objetivo.

`docker-compose.yml`

    version: "3"
    services:
      primary:
        image: diffy/example-service:production
        container_name: primary
        ports:
          - 8080:5000
      candidate:
        image: diffy/example-service:candidate
        container_name: candidate
        ports:
          - 8081:5000
      diffy:
        image: diffy/diffy
        container_name: diffy
        ports:
          - 3000:8888
          - 3001:8880
        command: >
          -master.primary='primary:5000'
          -master.secondary='primary:5000'
          -candidate='candidate:5000'
          -service.protocol='http'
          -serviceName='Diffy Testing Service'
          -proxy.port=:8880
          -admin.port=:8881
          -http.port=:8888
          -rootUrl='localhost:8888'
          -summary.email=''
        links:
          - primary
          - candidate

Este fluxograma ilustra como o Diffy funciona:

![Imagem contendo um fluxograma da qual mosta o Diffy agindo como um proxy entre as aplicações primária e secundária, e demonstrando o cruzamento das respostas de cada uma para fornecer dados comparativos entre as duas aplicações.](https://cdn.cms-twdigitalassets.com/content/dam/blog-twitter/archive/diffy_testing_serviceswithoutwritingtests96.thumb.1280.1280.png "Fluxograma do funcionamento do Diffy")

Além de poder configurar a aplicação primária e candidata, o Diffy também permite que seja configurada uma aplicação secundária, da qual seria uma segunda instância contendo a mesma implementação da aplicação primária.

No nosso caso, vamos definir a mesma instância da aplicação primária como secundária e por isso em nosso `docker-compose.yml`, ambas configurações estão apontando para a aplicação primária.

Com essa configuração a interface web do Diffy pode ser acessada via browser através da URL `http://localhost:3000`

![Imagem do Admin do Diffy sem nenhum dado](/uploads/diffy-localhost-3000.png "Diffy Admin")

E podemos interagir com o Diffy proxy através da URL: `http://localhost:3001`

![Imagem que contém um request sendo feito para a aplicação primária e obtendo uma resposta de sucesso.](/uploads/success-diffy-test.png "Curl request para a aplicação primária")

![Imagem que contém um request sendo feito para a aplicação candidata e obtendo uma resposta de sucesso.](/uploads/regression-diffy-test.png "Curl request para a aplicação candidata")

Na requisição eu também adicionei o header `Canonical-Resource` apenas para referenciar a API que estava utilizando, essa informação é útil para que o Diffy possa exibir em sua interface também.

![Imagem do Diffy Admin depois de serem realizados os requests demonstrando os dados para comparação.](/uploads/diffy-interface-success.png "Diffy Admin com dados")![Imagem do Diffy Admin depois de serem realizados os requests demonstrando os dados que obtiveram diferenças entre a aplicação primária e candidata.](/uploads/diffy-interface-regression.png "Diffy Admin focando os requests com diferenças")![Imagem do Diffy Admin focando exatamente no dado que foi diferente na resposta entre a aplicação primária e candidata.](/uploads/diffy-interface-regression-detailed.png "Diffy Admin com foco nos dados que foram diferentes")

Algumas coisas a serem observadas:

- A ferramenta Diffy não oferece nenhuma funcionalidade de `rewriting`. Ou seja, sua antiga e nova API devem possuir os mesmos `paths`;
- [Por padrão (e por segurança)](https://github.com/opendiffy/diffy/blob/master/QUICKSTART.md#faqs), o Diffy não realiza proxy de requisições que não sejam do verbo `GET`.

## NGINX

Basicamente, no nosso cenário fictício atual temos três serviços expostos via diferentes portas:

- Aplicação primária na porta `8080`;
- Aplicação candidata na porta `8081`;
- Diffy Admin na porta `3000` e o Diffy Proxy na porta `3001`

A ideia é manter a aplicação primária acessível através da porta `8080`, pois não queremos interferir nos consumidores que já estão utilizando esse serviço, sendo necessário que os mesmos tenham que realizar alguma alteração do lado deles, como atualizar a porta do serviço por exemplo. Além disso, o NGINX será um grande aliado para realizar a mudança em que a aplicação candidata se tornar primária.

Sendo assim, vamos aplicar algumas mudanças na forma como estamos expondo nossos serviços:

`docker-compose.yml`

    version: "3"
    services:
      primary:
        image: diffy/example-service:production
        container_name: primary
      candidate:
        image: diffy/example-service:candidate
        container_name: candidate
      diffy:
        image: diffy/diffy
        container_name: diffy
        ports:
          - 3000:8888
        command: >
          -master.primary='primary:5000'
          -master.secondary='primary:5000'
          -candidate='candidate:5000'
          -service.protocol='http'
          -serviceName='Diffy Testing Service'
          -proxy.port=:8880
          -admin.port=:8881
          -http.port=:8888
          -rootUrl='localhost:8888'
          -summary.email=''
        links:
          - primary
          - candidate
      proxy-reverse:
        build: .
        container_name: proxy-reverse
        ports:
          - 8080:80
        links:
          - primary
          - candidate
          - diffy

`Dockerfile`

    FROM nginx:stable-alpine

    COPY ./nginx.conf /etc/nginx/conf.d/default.conf

`nginx.conf`

    upstream primary {
      server primary:5000;
    }

    upstream candidate {
      server candidate:5000;
    }

    upstream diffy {
      server diffy:8880;
    }

    server {
      listen 80;
      server_name "nginx-diffy-proxy";

      location / {
        proxy_pass http://primary;
      }
    }

O diretório e os arquivos estão organizados nessa estrutura:

![Imagem mostrando que o no diretório existem três arquivos no mesmo nível, sendo o Dockerfile, o docker-compose.yml e o nginx.conf](/uploads/tree-repository.jpg "Comando tree")

Com essa configuração, nós continuamos com a aplicação primária acessível via porta `8080` como havíamos planejado e apenas o Diffy Admin acessível através da porta `3000`. Propositalmente foi removido o acesso da aplicação candidata, uma vez que queremos garantir que a mesma esteja funcionando corretamente antes de deixá-la exposta. Também foi removido o acesso externo ao Diffy Proxy com o intuito de garantir que todas as requisições ao mesmo sejam realizadas dentro do nosso contexto, evitando possíveis ruídos de requisições externas. O que nos leva a próxima etapa do nosso processo.

### NGINX Mirror

Nosso objetivo nesse momento será manter a aplicação primária respondendo as requisições, e utilizar dessas mesmas para testar nossa aplicação candidata de forma transparente aos consumidores, utlizando o Diffy. Para nos auxiliar nesse processo vamos utilizar o [Módulo Mirror](https://nginx.org/en/docs/http/ngx_http_mirror_module.html "Módulo Mirror") do NGINX, que possui essa descrição (em uma tradução livre) em sua documentação:

> O módulo _ngx_http_mirror_module_ implementa o espelhamento de uma solicitação original criando sub-solicitações em segundo plano. As respostas das sub-solicitações espelhadas são ignoradas.

Analisando essa descrição, podemos perceber que está muito relacionado com o nosso objetivo, e por isso vamos utilizá-lo. Sendo assim vamos configurar o módulo mirror a nossa configuração do NGINX.

`nginx.conf`

    upstream primary {
      server primary:5000;
    }

    upstream candidate {
      server candidate:5000;
    }

    upstream diffy {
      server diffy:8880;
    }

    # Retrieve the request path for proxy it to Diffy via header
    map $request_uri $request_uri_no_parameters {
      "~^(?P<path>.*?)(\?.*)*$" $path;
    }

    server {
      listen 80;
      server_name "nginx-diffy-proxy";

      location / {
        proxy_pass http://primary;
      }

      location /success {
        # Mirroring only /success endpoint
        mirror /mirror;
        mirror_request_body on;

        # Header to identify that the request was mirrored
        add_header X-Will-Mirror 'Yes';
        proxy_pass http://primary;
      }

      location = /mirror {
        internal;

        proxy_set_header Canonical-Resource $request_uri_no_parameters;
        proxy_set_header X-Original-Host $host;

        proxy_pass http://diffy$request_uri;
      }
    }

Com essa configuração todos os endpoints continuam a ser respondidos pela nossa aplicação primária, porém as requisições que são feitas para o endpoint `/success` são espelhadas para o Diffy, que irá fazer a comparação das respostas entre a aplicação primária e candidata e fornecer dados sobre as mesmas, nos dando insumos para avaliar o quanto confiável está nossa aplicação candidata. Vamos checar se nossa configuração ficou correta, e que tudo está a correr como o planejado.

Ao realizar uma requisição para o endpoint `/success` podemos verificar que o mesmo está respondendo corretamente, e também podemos verificar que a requisição foi espelhada para o Diffy através do header `X-Will-Mirror` do qual adicionamos em nossa configuração:

![Na imagem é possível ver o header que foi adicionado demonstrando que a requisição foi espelhada.](/uploads/success-happy-tester-mirror.png "Cur Request para o endpoint /success")

Podemos notar que o mesmo header não é adicionado ao endpoint `/regression`, ou seja, o mesmo não é espelhado para o Diffy como o endpoint `/success`:

![Imagem mostrando que a resposta não contém o header que foi adicionado, ou seja, essa requisição não foi espelhada.](/uploads/regression-happy-tester-mirror.png "Curl request para o endpoint /regression")

Também podemos acessar o Diffy e verificar se os dados estão lá para serem analisados:

![Imagem demonstrando a requisição feita anteriormente para ser comparada via o Diffy](/uploads/diffy-testing-success-endpoint.png "Diffy Admin Interface")

Voilà!! Até então tudo funcionando como planejado. Com isso, podemos deixar nossos serviços funcionando por um tempo, monitorar via Diffy como nossa aplicação candidata está se comportando e aplicar mudanças se necessárias. Uma vez que tenhamos confiança em nossa aplicação candidata, podemos prosseguir para o próximo passo, do qual seria de fato tornar nossa aplicação candidata exclusivamente responsável pelo endpoint `/success`.

## Substituindo nossa API

Vamos supor que passamos alguns dias monitorando o Diffy e tudo está correndo bem, todas as requisições realizadas para o endpoint `/success` estão obtendo a mesma resposta nas aplicação primária e na aplicação candidata. Sendo assim, decidimos que é a hora de substituir a API completamente, e para isso vamos realizar mais alguns ajustes na nossa configuração do NGINX.

`nginx.conf`

    upstream primary {
      server primary:5000;
    }

    upstream candidate {
      server candidate:5000;
    }

    server {
      listen 80;
      server_name "nginx-diffy-proxy";

      location / {
        proxy_pass http://primary;
      }

      location /success {
        # Header to identify that the request
        # It is being handled by the candidate service
        add_header X-Candidate-Service 'Yes';
        proxy_pass http://candidate;
      }
    }

Com essa configuração, foi removido o Diffy e a configuração `mirror` do nosso cenário, uma vez que já o utilizamos do seu propósito para validar que nossa aplicação candidata está apta. Sendo assim, finalmente podemos direcionar todas as requisições do endpoint `/success` para a aplicação candidata.

![Imagem demonstrando que a aplicação candidata está sendo responsável pelo endpoint /success](/uploads/success-happy-tester.png "Cur Request para o endpoint /success")

![Imagem demonstrando que o endpoint /regression continua sobre responsabilidade da aplicação primária.](/uploads/regression-happy-tester.png "Curl request para o endpoint /regression")

## Conclusão

Tentei abordar e reproduzir de uma maneira mais genérica o processo de uma migração de API, explorando algumas ferramentas e estratégias que podem realmente ser úteis nesse processo. Tenho plena consciência do quanto esse processo é mais complicado em um cenário real, e com certeza esse processo não se aplica a todo o tipo de migração. Entretanto gostaria de compartilhar um pouco desse processo e suas etapas, e espero que possa ser útil de alguma forma na migração da sua API.

**Agradecimentos**

Um obrigado especial para [Adriano Lisboa](https://twitter.com/adrianolisboa), [Marcos Brizeno](https://twitter.com/marcosbrizeno), [Michel Aquino](https://github.com/michelaquino), [Rodrigo Pinheiro](https://twitter.com/_rodrigopa_), e [Vitor Albuquerque](https://twitter.com/vrcca) por terem revisado o artigo antes de ser publicado.

**Referências**

- [https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html](https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html "https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html")
- [Catching Bugs without Writing Tests by Puneet Khanduri (@pzdk) At Agile India 2017](https://www.youtube.com/watch?v=4KJKMDrPeJw)
- [https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/](https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/ "https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/")
- [https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30](https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30 "https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30")
