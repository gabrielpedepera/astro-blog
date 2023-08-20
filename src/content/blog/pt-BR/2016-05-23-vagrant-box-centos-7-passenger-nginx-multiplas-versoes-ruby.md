---
author: Gabriel Pereira
pubDatetime: 2016-05-23T03:49:02Z
title: "Criando sua Vagrant Box: CentOS 7 + Passenger + NGINX + Múltiplas Versões Ruby (rbenv) e Rails"
postSlug: vagrant-box-centos-7-passenger-nginx-multiplas-versoes-ruby
featured: false
draft: false
tags:
  - vagrant
  - centos
  - virtualbox
ogImage: ""
description: "Criando sua Vagrant Box: CentOS 7 + Passenger + NGINX + Múltiplas Versões Ruby (rbenv) e Rails"
lang: "pt-BR"
---

Para a customização dessa box foram utilizadas as seguintes tecnologias e versões:

- CentOS 7
- Vagrant: 1.8.1
- Virtual Box: 5.0.20 r106931
- Phusion Passenger: 5.0.28
- NGINX: 1.10.0
- Ruby: 2.1.3 e 1.9.3-p550
- Rails: 4.2.6 e 3.2.22.2

Antes de iniciar o processo será necessário ter instalado o [Vagrant](https://www.vagrantup.com) e [Virtual Box](https://www.virtualbox.org). Também será necessário instalar o plugin [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest)

```bash
$ vagrant plugin install vagrant-vbguest
```

![vagrant-vbguest](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-21-37-02.png)

Essa customização será realizada a partir da box [centos/7](https://atlas.hashicorp.com/centos/boxes/7).

```bash
$ vagrant init centos/7
```

Esse comando irá criar o Vagrantfile. Porém será necessário adicionar a configuração `config.ssh.insert_key = false`. Essa configuração é importante para continuar usando a chave pública padrão do Vagrant.

Segue abaixo Vagrantfile que utilizei para essa customização com mais algumas configurações. Nesse arquivo estou definindo o IP 192.168.50.4, `config.vm.network :private_network, ip: "192.168.50.4"`, e os diretórios que serão sincronizados entre a máquina local e a virtual `config.vm.synced_folder "~/workspace", "/var/www", nfs: true`. Para esse compartilhamento de diretórios estou utilizando a tecnologia [NFS](https://en.wikipedia.org/wiki/Network_File_System), lembrando que a mesma não funciona no Windows como host.

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  config.vm.box = "centos/7"
  config.ssh.insert_key = false
  config.vm.network :private_network, ip: "192.168.50.4"
  config.vm.synced_folder "~/workspace", "/var/www", nfs: true
end
```

```bash
$ vagrant up --provider virtualbox
```

Iniciando a máquina, na primeira vez que for executado, será realizado o download da box, e por isso poderá demorar um pouco.

![Download Box](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-22-14-50.png)

O próximo passo é acessar o seu servidor por SSH.

```bash
$ vagrant box ssh
```

![vagrant-ssh](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-22-16-49.png)

Caso tenha problemas nessa etapa, recomendo esse [tutorial](https://nandovieira.com.br/usando-o-vagrant-como-ambiente-de-desenvolvimento-no-windows), escrito pelo [@fnando](https://twitter.com/@fnando).

### Dentro da Box

Geralmente antes de começar a instalar os novos pacotes, vamos atualizar os já existentes.

```bash
$ sudo yum update
```

#### Ruby

Para trabalhar com diferentes versões de Ruby, vamos utilizar o [rbenv](https://github.com/rbenv/rbenv)

Instalando dependências:

```bash
sudo yum install -y git-core zlib zlib-devel gcc-c++ patch readline readline-devel libyaml-devel libffi-devel openssl-devel make bzip2 autoconf automake libtool bison curl sqlite-devel libcurl-devel
```

Instalando **rbenv**:

```bash
cd ~
git clone git://github.com/sstephenson/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
```

Instalando **ruby-build**:

```bash
git clone git://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
echo 'export PATH="$HOME/.rbenv/plugins/ruby-build/bin:$PATH"' >> ~/.bash_profile
```

```bash
$ source ~/.bash_profile
```

Finalmente, instalando o **ruby**.

Nessa box vamos instalar duas versões do ruby, uma antiga (1.9.3-p550) e a mais atual até o momento que era escrito esse tutorial (2.3.1). Porém, vamos definir o ruby 2.3.1 como a versão global.

Instalando ruby 2.3.1, e definindo como a versão global (Isso pode demorar um pouco).

```bash
$ rbenv install 2.3.1
$ rbenv global 2.3.1
```

Verificar se o ruby foi instalado corretamente.

```bash
$ ruby -v
```

![rbenv-ruby2.3.1](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-22-42-59.png)

Instalando o ruby 1.9.3-p550.

```bash
$ rbenv install 1.9.3-p550
```

Obs.: Esse tutorial está utilizando o ruby 1.9.3 apenas como finalidade de exemplo, lembrando que essa versão está descontinuada, e não deve ser utilizada em ambientes de produção, pois não há mais suporte a mesma.

![rbenv-ruby1.9.3](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-03-15.png)

Verificando as versões instaladas.

```bash
$ rbenv versions
```

![rbenv-versions](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-03-55.png)

Dica: Caso você não queira realizar o download da documentação de toda `gem` que instalar, já que esse processo pode ser demorado. Você pode desabilitar isso, através desse comando.

```bash
$ echo "gem: --no-document" > ~/.gemrc
```

Você também vai querer instalar a gem `bundler`, para gerenciar as dependências de suas aplicações.

```bash
$ gem install bundler
```

#### Passenger + NGINX

Vamos utilizar a instalação do Passenger através da gem, compilando o NGINX.

```bash
$ gem install passenger -v 5.0.28
```

Será necessário aplicar permissões ao diretório `/home/vagrant`, e ao diretórios onde suas aplicações vão estar, nesse exemplo em `/var/www/`.

```bash
$ sudo chmod o+x /home/vagrant
$ sudo chmod o+x /var/www
```

Quando instalamos a gem `passenger`, também foi instalado o binário `passenger-install-nginx-module`, o qual iremos utilizar para instalar o `NGINX`, porém como vamos utilizar o mesmo junto com o `rbenv`, por isso é necessário que sua execução siga as seguintes etapas:

```bash
$ export ORIG_PATH="$PATH"
$ sudo -s -E
$ export PATH="$ORIG_PATH"
$ /home/vagrant/.rbenv/versions/2.3.1/bin/ruby /home/vagrant/.rbenv/versions/2.3.1/lib/ruby/gems/2.3.0/gems/passenger-5.0.28/bin/passenger-install-nginx-module
```

![passenger-install-nginx-module](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-09-58.png)

Agora é só seguir as instruções conforme sua necessidade.

- Ruby é a linguagem que desejamos;

![passenger-ruby](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-11-11.png)

- A opção 1, irá realizar o download, compilar e instalar o NGINX para nós;

![passenger-nginx](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-11-45.png)

- Vamos manter o diretório `/opt/nginx`, como sugerido, portanto basta apertar `enter`;

![passenger-directory](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-12-22.png)

- E por fim criar o arquivo `/opt/nginx/conf/nginx.conf`.

![passenger-nginx-conf](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-34-42.png)

Agora vamos adicionar o `systemd` **nginx.service** ao `systemctl` do CentOS, para isso deve salvar o arquivo abaixo em `/lib/systemd/system/nginx.service`.

```nginx.service
[Unit]
Description=The nginx HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/opt/nginx/logs/nginx.pid
ExecStartPre=/opt/nginx/sbin/nginx -t
ExecStart=/opt/nginx/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

E depois iniciar e habilitar o serviço:

```bash
$ sudo systemctl start nginx.service
$ sudo systemctl enable nginx.service
```

Você pode verificar a situação do NGINX através do comando:

```bash
$ sudo service nginx status
```

![nginx-status](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-24-at-23-37-24.png)

Se ainda estiver como `root`, podemos voltar a utilizar o usuário `vagrant`, e recarregar as configurações contidas no `.bash_profile`.

```bash
$ su vagrant
$ source ~/.bash_profile
```

#### Aplicações Ruby on Rails

Para exemplificar vamos utilizar duas aplicações, [dummy](http://github.com/gabrielpedepera/dummy) utilizando `ruby 2.1.3` e `rails 4.2.6`, e [dummy_old](http://github.com/gabrielpedepera/dummy_old), utilizando `ruby 1.9.3-p550` e `rails 3.2.22.2`.

```bash
$ git clone https://github.com/gabrielpedepera/dummy.git /var/www/dummy

$ git clone https://github.com/gabrielpedepera/dummy_old.git /var/www/dummy_old
```

Para instalar as dependências utilize o comando `bundle install` em cada aplicação (Lembre-se de instalar o `bundler` em cada versão do ruby).

```bash
$ cd /var/www/dummy
$ gem install bundler
$ bundle install
```

```bash
$ cd /var/www/dummy_old
$ gem install bundler
$ bundle install
```

Substitua o conteúdo do arquivo `/opt/nginx/conf/nginx.conf` abaixo (Essa edição deve ser utilizada com o usuário **root**):

```nginx
worker_processes  1;
error_log  /opt/nginx/logs/nginx-error.log info;
pid        /opt/nginx/logs/nginx.pid;

events {
    worker_connections  1024;
}

http {
    passenger_root /home/vagrant/.rbenv/versions/2.3.1/lib/ruby/gems/2.3.0/gems/passenger-5.0.28;

    include       mime.types;
    default_type  application/octet-stream;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /opt/nginx/logs/nginx-access.log  main;
    sendfile        on;
    tcp_nopush     on;
    tcp_nodelay    on;
    keepalive_timeout  15;
    server_names_hash_bucket_size 256;
    server_names_hash_max_size 512;
    gzip              on;
    gzip_proxied      any;
    gzip_http_version 1.1;
    gzip_comp_level   9;
    gzip_min_length   0;
    gzip_buffers      16 8k;
    gzip_types        image/png image/jpg image/jpeg
                      image/gif application/javascript text/plain text/css
                      application/json application/x-javascript text/xml
                      application/xml application/xml+rss text/javascript
                      application/atom+xml application/x-shockwave-flash;

    gzip_vary         off;
    gzip_disable      "MSIE [1-6].(?!.*SV1)";
    gzip_static       on;
    output_buffers   1 32k;
    postpone_output  1460;

    server {
      listen 80;
      server_name localhost.dummy;
      passenger_ruby /home/vagrant/.rbenv/versions/2.3.1/bin/ruby;
      passenger_enabled on;
      rails_env development;
      root /var/www/dummy/public;

            send_timeout 1200;
            proxy_read_timeout 2400;
            proxy_send_timeout 2400;
            proxy_connect_timeout 120;
            client_header_timeout 900;
            client_body_timeout 900;
    }

    server {
      listen 80;
      server_name localhost.dummy_old;
      passenger_ruby /home/vagrant/.rbenv/versions/1.9.3-p550/bin/ruby;
      passenger_enabled on;
      rails_env development;
      root /var/www/dummy_old/public;

            send_timeout 1200;
            proxy_read_timeout 2400;
            proxy_send_timeout 2400;
            proxy_connect_timeout 120;
            client_header_timeout 900;
            client_body_timeout 900;
    }
}
```

Reinicialize o serviço NGINX.

```bash
$ sudo service nginx restart
```

No começo desse tutorial adicionamos o IP `192.168.50.4` ao Vagrantfile, e nesse momento vamos adicionar a seguinte linha ao arquivo `/etc/hosts` de sua máquina local.

```bash
192.168.50.4 localhost.dummy localhost.dummy_old
```

Agora é possível acessar as aplicações através do navegador. Veja que é possível verificar as versões de ruby e rails diferentes.

Dummy - http://localhost.dummy: (ruby 2.1.3 + rails 4.2.6):

![dummy](/assets/img/posts/2016/05/23/Screen_Shot_2016-08-24_at_23_59_53.png)

Dummy Old - http://localhost.dummy_old: (ruby 1.9.3-p550 + rails 3.2.22.2):

![dummy-old](/assets/img/posts/2016/05/23/Screen_Shot_2016-08-25_at_00_02_26.png)

#### Exportando a nova box

Terminada as customizações, agora vamos limpar os dados do yum, o histórico de comandos e desligar o servidor.

```bash
$ sudo yum clean all
$ cat /dev/null > ~/.bash_history && sudo shutdown -h now
```

Para empacotar a nova VM, deve se utilizar o comando abaixo, o argumento `--base`recebe o nome da VM no VirtualBox, e `--output` o nome do arquivo a ser gerado.

![virtual-box](/assets/img/posts/2016/05/23/Screen_Shot_2016-08-25_at_00_07_46.png)

```bash
$ vagrant package --base workspace_default_1472086496235_78098 --output vagrant-centos7.box
```

![virtual-box](/assets/img/posts/2016/05/23/Screen-Shot-2016-08-25-at-00-16-54.png)

Se tudo ocorreu bem, você terá uma nova VM provisionada pelo Vagrant, já podendo ser utilizada.

```bash
$ vagrant box add vagrant-centos7 vagrant-centos7.box
$ vagrant init vagrant-centos7
$ vagrant up
```
