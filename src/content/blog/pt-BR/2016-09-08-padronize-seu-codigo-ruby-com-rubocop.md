---
author: Gabriel Pereira
pubDatetime: 2016-09-08T02:44:08Z
title: Padronize seu código Ruby com Rubocop
postSlug: padronize-seu-codigo-ruby-com-rubocop
featured: false
draft: false
tags:
  - rubocop
  - ruby
  - atom
  - sublime-text-3
ogImage: ""
description: Padronize seu código Ruby com Rubocop
lang: "pt-BR"
---

Recentemente, no time que estou trabalhando, notei durante os [code reviews](https://en.wikipedia.org/wiki/Code_review) muitas ponderações relacionadas a estilo do código. Como por exemplo:

- uso de aspas simples ou duplas para definir strings;
- uso de espaços na definição de hashes;
- tamanho máximo da linha;
- etc ...

Em nosso time utilizamos Ruby como principal linguagem, portanto nada melhor que se basear no [Guia de Estilo Ruby](https://github.com/bbatsov/ruby-style-guide).

Porém, também é importante utilizar uma ferramenta que nos ajude a garantir que esse estilo esteja sendo aplicado, e para isso temos o [Rubocop](https://github.com/bbatsov/rubocop).

## Rubocop

[Rubocop](https://github.com/bbatsov/rubocop) é um analisador estático que nos auxilia a validar e aplicar um padrão de estilo em nosso código Ruby, baseando-se no [Guia de Estilo Ruby](https://github.com/bbatsov/ruby-style-guide)

### Instalando

```bash
$ gem install rubocop
```

![gem-install-rubocop](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-25-at-22-26-42.png)

As regras do Rubocop podem ser configuradas ou desabilitadas através do arquivo `.rubocop.yml`, que deve estar na raiz do projeto com as configurações desejadas.

Segue abaixo um exemplo do arquivo `.rubocop.yml` com algumas configurações:

```yaml
inherit_from: .rubocop_todo.yml

AllCops:
  Exclude:
    - db/schema.rb
    - db/migrate/*
    - bin/*
  RunRailsCops: true

Documentation:
  Enabled: false

DotPosition:
  EnforcedStyle: trailing

Style/EmptyLinesAroundBlockBody:
  Enabled: false

Style/EmptyLinesAroundModuleBody:
  Enabled: false

Style/EmptyLinesAroundClassBody:
  Enabled: false

Style/EmptyLinesAroundMethodBody:
  Enabled: false
```

Por exemplo, essa configuração está desconsiderando que linhas vazias entre o início e fim de módulos e blocos sejam violações.

```yml
Style/EmptyLinesAroundBlockBody:
  Enabled: false

Style/EmptyLinesAroundModuleBody:
  Enabled: false
```

### Configurando seu editor

O Rubocop fornece algumas formas para validar seu código Ruby, que podem ser analisadas mais detalhadamente através de seu [Docs](http://rubocop.readthedocs.io/en/latest/basic_usage/#basic-usage). Porém, para extrair maior produtividade quanto ao seu uso, recomendo que tenha-o configurado no seu editor.

#### Sublime Text 3

Iremos instalar os pacotes necessários para a configuração do Rubocop através do [Package Control](https://packagecontrol.io/installation), portanto antes dos próximos passos, será necessário sua instalação.

Será necessário a instação dos seguintes pacotes:

- [SublimeLinter](https://packagecontrol.io/packages/SublimeLinter)
- [SublimeLinter-rubocop](https://packagecontrol.io/packages/SublimeLinter-rubocop)

Basicamente, a instalação desses dois pacotes é o suficiente para ter o SublimeText integrado ao Rubocop. Porém, se você utiliza o [rbenv](https://github.com/rbenv/rbenv) para instalar e gerenciar o Ruby em sua máquina, será necessário informar o `PATH` do Ruby ao SublimeLinter:

```bash
Tools > SublimeLinter > Open User Settings
```

![tools-sublime-linter](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-23-39-52.png)

```json
{
    "user": {
        "paths": {
            "linux": [],
            "osx": ["~/.rbenv/shims"],
            "windows": []
...
```

![sublime-config](/assets/img/posts/2016/09/08/Screen_Shot_2016-08-31_at_23_41_40.png)

Obs1.: Nesse caso estou aplicando a configuração em um OSX, caso seu sistema operacional seja outro, basta mudar a configuração para `linux` ou `windows`. Você pode verificar a configuração completa [aqui](https://gist.github.com/gabrielpedepera/c158ecc39f594224a9c41ba0fce53113).

Obs2.: É necessário restartar o Sublime Text para que a configuração seja aplicada e o SublimeLinter comece a funcionar (Demorei um pouco pra descobrir isso..). Portanto, basta fechar e abrir novamente o editor.

Você vai saber que a integração funcionou quando abrir seu editor e verificar algumas marcações amarelas no seu código:

![violations-sublime](/assets/img/posts/2016/09/08/sublimeLinter.png)

Ao fixar o cursor em uma determinada linha, que está sendo apontada pela marcação, é possível verificar no rodapé do editor a respectiva violação.

![violation-rubocop-sublime](/assets/img/posts/2016/09/08/line.png)

#### Atom

No Atom, vamos utilizar os seguintes plugins:

- [linter](https://github.com/steelbrain/linter)
- [linter-rubocop](https://github.com/AtomLinter/linter-rubocop)

Vamos realizar a instalação via linha de comando, a qual eu acho mais simples.

```bash
$ apm install linter
$ apm install linter-rubocop
```

![apm-linter-rubocop](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-22-49-15.png)

Após a instalação será necessário configurar `PATH` do rubocop. Para isso, podemos editar diretamente o arquivo de configuração em `~/.atom/config.cson`, ou através do menu:

```bash
Atom > Config...
```

![atom-config](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-22-36-08.png)

Agora vamos verificar onde está o rubocop, através do comando `which`:

```bash
$ which rubocop
```

![which](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-22-38-30.png)

Porém, se você como eu estiver utilizando o `rbenv` deverá executar o seguinte comando:

```bash
$ rbenv which rubocop
```

![which-rbenv](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-22-56-03.png)

E adicionar a seguinte configuração, com o respectivo `PATH`:

```json
"linter-rubocop":
    command: "/Users/gabriel/.rbenv/versions/2.3.1/bin/rubocop"
```

![config-rubocop](/assets/img/posts/2016/09/08/Screen-Shot-2016-08-31-at-23-08-36.png)

Semelhante ao Sublime Text 3, também será necessário restartar seu editor, fechando e abrindo novamente o mesmo.

E utilizando o mesmo arquivo como exemplo, podemos ver a integração do rubocop ao Atom:

![atom-rubocop-integrate](/assets/img/posts/2016/09/08/Screen_Shot_2016-08-31_at_23_24_32.png)

O plugin do Atom oferece algumas funcionalidades legais a mais que ao do Sublime.

Um placeholder informando o tipo da violação:

![atom-paceholder](/assets/img/posts/2016/09/08/Screen_Shot_2016-08-31_at_23_24_12.png)

Um contador e um painel detalhando as violações:
![count-violations](/assets/img/posts/2016/09/08/Screen_Shot_2016-08-31_at_23_43_34.png)

## Conclusão

Se você está desenvolvendo código e espera que outros possam ler e trabalhar com ele, então é muito importante escolher um estilo consistente e garantir que seja aplicado. Ter uma ferramenta que o auxilie a aplicar esse estilo integrada ao seu editor, é essencial para manter seu código padronizado no momento em que o mesmo está sendo produzido, mantendo um código padronizado você terá menos erros e uma avaliação mais eficaz. Caso esteja desenvolvendo código Ruby, utilize o [Guia de Estilo Ruby](https://github.com/bbatsov/ruby-style-guide) e o [Rubocop](https://github.com/bbatsov/rubocop) para verificar se o mesmo está sendo aplicado.
