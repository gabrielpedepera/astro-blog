---
author: Gabriel Pereira
pubDatetime: 2017-07-09T20:03:22Z
title: Ambiente de desenvolvimento com Vagrant e Ansible
postSlug: ambiente-de-desenvolvimento-com-vagrant-e-ansible
featured: false
draft: false
tags:
  - vagrant
  - virtualbox
  - ruby
  - ubuntu
  - rails
  - ansible
ogImage: ""
description: Ambiente de desenvolvimento com Vagrant e Ansible
lang: "pt-BR"
---

O [Vagrant](https://www.vagrantup.com) é uma ferramenta para construir e gerenciar máquinas virtuais. Com um fluxo de trabalho fácil de usar e foco na automação, o Vagrant reduz o tempo de configuração do ambiente de desenvolvimento e faz com que a desculpa "funciona na minha máquina" se torne uma desculpa do passado.

[Ansible](http://ansible.com) é uma ferramenta que automatiza o provisionamento de software, gerenciamento de configuração e implantação.

Para o provisionamento desse ambiente foram utilizados as seguintes ferramentas e versões:

- Vagrant: 1.9.3
- Virtual Box: 5.1.22
- Ansible: 2.3.0.0
- Box: [bento/ubuntu-16.04](https://atlas.hashicorp.com/bento/boxes/ubuntu-16.04)

Na máquina virtual serão instalados:

- RBenv (com o plugin [ruby-build](https://github.com/rbenv/ruby-build))
- Ruby: 2.4.1
- NVM
- Node.js: 8.0.0
- Passenger
- NGINX
- Postgresql
- Redis
- Memcached
- Elasticsearch
- Java (Dependência do Elasticsearch)

## Primeiros Passos

Não vou entrar em detalhes do processo de instalação do [Vagrant](https://www.vagrantup.com/downloads.html), [Virtual Box](https://www.virtualbox.org/wiki/Downloads) e [Ansible](http://docs.ansible.com/ansible/intro_installation.html), mas saiba que são necessários para dar continuidade ao processo de provisionamento que irá ser abordardado nesse tutorial.

Para iniciar uma nova máquina virtual, execute o comando:

```bash
$ cd ~
$ mkdir -p workspace/development-box
$ cd workspace/development-box
$ vagrant init bento/ubuntu-16.04
```

Obs: Nesse tutorial irei utilizar o diretório `workspace/development-box` para os arquivos referentes ao provisionamento do máquina virutal e `workspace` como diretório compartilhado com a máquina virtual, contendo a(s) aplicação(ões). Mas você pode escolher os diretórios que mais lhe agradar.

![vagrant-init](/assets/img/posts/2017/07/09/vagrant-init-1.gif)

Abra o arquivo `Vagrantfile` gerado pelo comando anterior. Para editá-lo como o exemplo abaixo:

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = '2'.freeze

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = 'bento/ubuntu-16.04'
  config.vm.network 'private_network', ip: '192.168.50.4'
  config.ssh.forward_agent = true

  config.vm.define 'development' do |dev|
    dev.vm.synced_folder '~/workspace', '/home/vagrant/workspace'

    dev.vm.provision 'ansible' do |ansible|
      ansible.playbook = 'playbook.yml'
      ansible.host_key_checking = false
      ansible.extra_vars = { ansible_ssh_user: 'vagrant' }
      ansible.sudo = true
    end
  end
end
```

### Provisionamento

O Vagrantfile assume que a(s) aplicação(ões) fica(m) em `~/workspace`. Você pode definir o nome que quiser para sua máquina virtual, porém aqui estamos criando a máquina chamada `development`.

Agora, podemos começar a construir o nosso `playbook.yml` que nosso Vagrantfile irá utilizar. Nós vamos reaproveitar alguns [roles](http://docs.ansible.com/ansible/playbooks_roles.html) para nos ajudar:

```bash
$ ansible-galaxy install zzet.rbenv abtris.nginx-passenger jpnewman.redis fanatid.nvm geerlingguy.elasticsearch geerlingguy.memcached geerlingguy.postgresql -p roles/
```

![ansible-galaxy](/assets/img/posts/2017/07/09/ansible-galaxy-1.gif)

Crie o arquivo `~/workspace/development-box/playbook.yml` e o edite conforme abaixo:

```yml
- hosts: all
  vars:
    rbenv:
      env: user
      version: v1.1.0
      default_ruby: 2.4.1
      rubies:
        - version: 2.4.1
    rbenv_users: ["vagrant"]
    rbenv_plugins:
      - {
          name: "ruby-build",
          repo: "https://github.com/rbenv/ruby-build.git",
          version: "master",
        }
    nvm:
      user: vagrant
      version: v0.33.0
      node_version: "7.0.0"

    postgresql_users:
      - name: vagrant
        password: vagrant
        role_attr_flags: CREATEDB,CREATEROLE,SUPERUSER

  roles:
    - zzet.rbenv
    - abtris.nginx-passenger
    - jpnewman.redis
    - fanatid.nvm
    - geerlingguy.elasticsearch
    - geerlingguy.memcached
    - geerlingguy.postgresql
```

#### Instalando pacotes básicos

Criando um `role` para definir os pacotes básicos que queremos instalar:

```bash
$ mkdir -p roles/dependencies/tasks/ && touch roles/dependencies/tasks/main.yml
```

Edite o arquivo `roles/dependencies/tasks/main.yml`, como abaixo:

```yml
- name: Install dependencies
  apt: name={{ item }} state=present
  with_items:
    - autoconf
    - automake
    - bison
    - build-essential
    - git
    - imagemagick
    - libc6-dev
    - libffi-dev
    - libreadline6
    - libreadline6-dev
    - libssl-dev
    - libgdbm3
    - libgdbm-dev
    - libpq-dev
    - libtool
    - libmysqlclient-dev
    - libncurses5-dev
    - libxml2-dev
    - libxslt-dev
    - libxslt1-dev
    - libyaml-dev
    - ncurses-dev
    - sqlite3
    - zlib1g
    - zlib1g-dev
```

Fique a vontade para adicionar pacotes que seja necessário para seu ambiente de desenvolvimento ou remover pacotes que julgue desnecessário.

#### Configurando locale para UTF-8

Seguindo uma dica do [@akitaonrails](https://twitter.com/akitaonrails), que foi publicada em seu [blog](http://www.akitaonrails.com/2016/09/21/ubuntu-16-04-lts-xenial-on-vagrant-on-vmware-fusion):

![http://www.akitaonrails.com/2016/09/21/ubuntu-16-04-lts-xenial-on-vagrant-on-vmware-fusion](/assets/img/posts/2017/07/09/Screen-Shot-2017-06-20-at-22-22-39.png)

Para configurar o locale da sua máquina virtual para UTF-8, basta editar o arquivo `playbook.yml` como abaixo:

```yml
- hosts: all
  vars:
    rbenv:
      env: user
      version: v1.1.0
      default_ruby: 2.4.1
      rubies:
        - version: 2.4.1
    rbenv_users: ["vagrant"]
    rbenv_plugins:
      - {
          name: "ruby-build",
          repo: "https://github.com/rbenv/ruby-build.git",
          version: "master",
        }
    nvm:
      user: vagrant
      version: v0.33.0
      node_version: "7.0.0"

    postgresql_users:
      - name: vagrant
        password: vagrant
        role_attr_flags: CREATEDB,CREATEROLE,SUPERUSER

  roles:
    - zzet.rbenv
    - abtris.nginx-passenger
    - jpnewman.redis
    - fanatid.nvm
    - geerlingguy.elasticsearch
    - geerlingguy.memcached
    - geerlingguy.postgresql

  tasks:
    - name: Set locale en_US.UTF-8
      locale_gen:
        name: en_US.UTF-8
        state: present

    - name: Set locale en_US.UTF-8 in /etc/environment
      become: true
      blockinfile:
        dest: /etc/environment
        block: |
          LC_ALL=en_US.UTF-8
          LANG=en_US.UTF-8
```

#### Configurando o NGINX

Agora vamos configurar nosso virtual host com o NGINX e o Passenger. Crie o arquivo `roles/nginx/tasks/main.yml`:

```bash
$ mkdir -p roles/nginx/tasks/ && touch roles/nginx/tasks/main.yml
```

e edite-o como abaixo:

```yml
- name: Read passenger configuration
  register: passenger_root
  command: passenger-config --root
  changed_when: false

- name: Add passenger configuration
  template:
    src: passenger.conf.j2
    dest: /etc/nginx/conf.d/passenger.conf
  notify: nginx reload

- name: Add virtualhost configuration
  template:
    src: virtualhost.conf.j2
    dest: /etc/nginx/sites-available/{{ item.server_name }}
  with_items: "{{ virtual_hosts }}"
  notify: nginx reload

- name: Disable virtualhosts
  file:
    path: /etc/nginx/sites-enabled/{{ item.server_name }}
    state: absent
  when: item.disabled is defined
  with_items: "{{ virtual_hosts }}"
  notify: nginx reload

- name: Remove virtualhost default
  file:
    path: /etc/nginx/sites-enabled/default
    state: absent
  notify: nginx reload

- name: Enable virtualhosts
  file:
    src: /etc/nginx/sites-available/{{ item.server_name }}
    dest: /etc/nginx/sites-enabled/{{ item.server_name }}
    state: link
  when: item.disabled is not defined
  with_items: "{{ virtual_hosts }}"
  notify: nginx reload
```

E agora devemos criar os templates mencionados no arquivo:

```bash
$ mkdir -p roles/nginx/templates && touch roles/nginx/templates/virtualhost.conf.j2 && touch roles/nginx/templates/passenger.conf.j2
```

```nginx
# roles/nginx/templates/virtualhost.conf.j2

server {
    listen 80;
    server_name {{ item.server_name }};
    passenger_ruby /home/vagrant/.rbenv/versions/{{ item.ruby_version }}/bin/ruby;
    passenger_enabled on;
    rails_env {{ item.rails_env }};
    root {{ item.root }}/public;
}
```

```nginx
# roles/nginx/templates/passenger.conf.j2

passenger_root {{ passenger_root.stdout }};
passenger_ruby /home/vagrant/.rbenv/shims/ruby;
```

Nós também precisamos adicionar os virtual hosts para o NGINX, para isso crie o diretório `vars` e o arquivo `virtual_hosts.yml`:

```bash
$ mkdir -p vars && touch vars/virtual_hosts.yml
```

E edite-o como abaixo:

```yml
virtual_hosts:
  - server_name: localhost.rails_app.dev
    root: /home/vagrant/workspace/rails_app
    ruby_version: 2.4.1
    rails_env: development
```

Caso tenha necessidade de adicionar mais aplicações, basta seguir o padrão apresentado especificando a versão de ruby que deseja utilizar.

### Últimos Passos

Após essas últimas configurações, devemos atualizar nosso `playbook.yml` criado anteriormente. Adicionando o role NGINX, os virtual hosts e também uma task para a instalação da gem `bundler`. Deixando-o da seguinte forma:

```yml
- hosts: all
  vars:
    rbenv:
      env: user
      version: v1.1.0
      default_ruby: 2.4.1
      rubies:
        - version: 2.4.1
    rbenv_users: ["vagrant"]
    rbenv_plugins:
      - {
          name: "ruby-build",
          repo: "https://github.com/rbenv/ruby-build.git",
          version: "master",
        }
    nvm:
      user: vagrant
      version: v0.33.0
      node_version: "7.0.0"

    postgresql_users:
      - name: vagrant
        password: vagrant
        role_attr_flags: CREATEDB,CREATEROLE,SUPERUSER

  vars_files:
    - vars/virtual_hosts.yml

  roles:
    - zzet.rbenv
    - abtris.nginx-passenger
    - jpnewman.redis
    - fanatid.nvm
    - geerlingguy.elasticsearch
    - geerlingguy.memcached
    - geerlingguy.postgresql
    - nginx

  tasks:
    - name: Set locale en_US.UTF-8
      locale_gen:
        name: en_US.UTF-8
        state: present

    - name: Set locale en_US.UTF-8 in /etc/environment
      become: true
      blockinfile:
        dest: /etc/environment
        block: |
          LC_ALL=en_US.UTF-8
          LANG=en_US.UTF-8

    - name: Install bundler
      become_user: vagrant
      command: bash -lc 'gem install bundler'
```

#### Iniciando a máquina virtual

Vamos iniciar nossa máquina virtual e o provisionamento da mesma através do comando:

```bash
$ vagrant up --provision
```

Obs.: Isso pode demorar um pouquinho, principalmente se sua conexão de internet for igual a minha. =/

Ao terminar o provisionamento, podemos acessar nossa máquina virtual através do comando:

```bash
$ vagrant ssh
```

#### Configurando sua aplicação Rails

Com o intuito de exemplificar a configuração de uma aplicação Rails, vou utilizar as seguintes aplicações como exemplo:

```bash
vagrant@vagrant:~$ git clone git@github.com:gabrielpedepera/rails_app ~/workspace/rails_app
vagrant@vagrant:~$ cd ~/workspace/rails_app
vagrant@vagrant:~$ bundle install
vagrant@vagrant:~$ rbenv rehash
vagrant@vagrant:~$ rails db:create
```

#### Acessando sua aplicação

No começo desse tutorial adicionamos o IP 192.168.50.4 ao `Vagrantfile`, e agora em nossa máquina local, vamos referenciar os `server_names` dos virtual hosts. Para isso adicione as linhas abaixo ao arquivo `/etc/hosts`:

```vi
192.168.50.4 localhost.rails_app.dev
```

E basta acessar a URL em seu navegador:

http://localhost.rails_app.dev
![rails_app](/assets/img/posts/2017/07/09/Screen-Shot-2017-07-09-at-16-57-24.png)

Você pode conferir todo o resultado e código gerado no [Github](https://github.com/gabrielpedepera/development-box).

#### Conclusão

Meu intuito aqui é apenas demonstrar mais uma forma de criar e manter um ambiente de desenvolvimento de forma sustentável e automatizado. Sei que existem outras ferramentas de [provisionamento](https://www.vagrantup.com/docs/provisioning/), e outros tecnologias como o [Docker](https://www.docker.com). Não irei realizar comparações aqui, mas sugiro que dê uma olhada nelas, experimente, faça suas considerações e opte para a que mais atender sua necessidade. Atualmente essa forma vem me atendendo muito bem, porém já estou uma olhada em algo com o [Docker](https://www.docker.com), e quem sabe seja o próximo assunto a ser demonstrado por aqui. =]
