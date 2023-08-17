---
author: Gabriel Pereira
pubDatetime: 2018-02-18T23:09:00Z
title: "Visual Studio Code + Rubocop"
postSlug: vscode-com-rubocop
featured: false
draft: false
tags:
  - vscode
  - visual studio code
  - rubocop
ogImage: ""
description: "Visual Studio Code + Rubocop"
lang: "pt-BR"
---

Nos últimos 4 anos vinha utilizando o [Sublime Text](https://www.sublimetext.com/) como meu editor padrão de desenvolvimento, porém recentemente optei por trocá-lo e venho utilizando o [Visual Studio Code](https://code.visualstudio.com/) como meu editor de desenvolvimento padrão, nunca fui um grande fã da Microsoft, mas posso realmente dizer que estou muito satisfeito com o editor, e todo o ecosistema dele me agrada muito, por ser [open-source](https://github.com/Microsoft/vscode), pelos [plugins e temas disponíveis](https://marketplace.visualstudio.com/VSCode), a performance e a forma como que é atualizado, gosto muito dos documentos de releases liberados a cada [atualização](https://code.visualstudio.com/updates/).

Faz algum tempo que não programava em `ruby`, e estava estudando um pouco esse final de semana o framework de testes [minitest](https://github.com/seattlerb/minitest) (aqui outra mudança, pois estou mais familiarizado com o [rspec](https://github.com/rspec/rspec), e durante esse processo senti falta da integração com o rubocop direto no editor, algo que utlizava [antes](/2016/09/08/padronize-seu-codigo-ruby-com-rubocop.html). E por isso, resolvi fazer uma pausa e integrá-lo ao editor, onde novamente fui surpreendido pela facilidade com que consegui fazer isso.

![meme-zagalo](/public/img/posts/2018/02/18/meme-zagalo.jpg)

Primeira coisa que fiz foi verificar a [documentação do rubocop e suas integrações com outras ferramentas](http://rubocop.readthedocs.io/en/latest/integration_with_other_tools/#visual-studio-code), a qual referencia o seguinte [plugin](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby) para realizar esse trabalho:

![extension-ruby-vs-code](/assets/imjges/extension-ruby-vs-code.png)

Após a instalação foi necessário habilitar as configurações necessárias para o rubocop funcionar, para fazer isso adicione a configuração abaixo no JSON das opções ("user settings") do seu Visutal Studio Code (`cmd + , `ou `Code > Preferences > Settings`):

```json
"ruby.lint": {
  "reek": true,
  "rubocop": true,
  "ruby": true,
  "fasterer": true,
  "debride": true,
  "ruby-lint": true
}
```

![rubocop-settings](/public/img/posts/2018/02/18/rubocop-settings.png)

Feito isso reiniciei o editor (na verdade eu fechei e abri novamente em seguida) e _voilà_:

![rubocop-vscode](/public/img/posts/2018/02/18/rubocop-lint-vscode.png)

## Conclusão

Terminando deixo um tweet do [@mauriciojr](https://twitter.com/mauriciojr) que muito me fez refletir sobre quanto o uso de uma ferramenta, como a de analisador estático, seja qual ela for, é importante, e que também acho que resume bastante o que me motivou a escrita desse post.

<blockquote class="twitter-tweet tw-align-center" data-lang="en"><p lang="en" dir="ltr">If the only comment you’ll make in a PR is about import ordering or variable naming, do not make it, it has no value and brings only noise to the conversation. Formatting should either be performed by a tool or not a subject at all.</p>&mdash; Maurício Linhares (@mauriciojr) <a href="https://twitter.com/mauriciojr/status/964295874351435776?ref_src=twsrc%5Etfw">February 16, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
