---
author: Gabriel Pereira
pubDatetime: 2020-11-05T00:00:00Z
title: Migrating APIs using Diffy and NGINX
postSlug: migrating-apis-using-diffy-and-nginx
featured: false
draft: false
tags:
  - APIs
  - Diffy
  - NGINX
ogImage: ""
description: Diffy and NGINX for migrating APIs with safety
lang: "en"
---

Recently I had the opportunity to work on a project related to a migration of some APIs that I would like to share a bit about this experience. My idea is not to cover why those APIs were migrated, but the strategy used to have a process safe and successfully done.

In the real context were migrated APIs related to a specific domain from a monolithic Ruby on Rails application to another Ruby on Rails application "API-only" exclusively to this domain-specific. But, my objective now, it will approach migrate an only API using a similar strategy that was used in the real context.

## Knowing our APIs

We will use the image
[https://hub.docker.com/r/diffy/example-service](https://hub.docker.com/r/diffy/example-service "Diffy Example Service") that already contains some APIs implemented, and it's possible to use one of them for our purpose of demonstrating an API migration. We'll also use [Docker](https://www.docker.com "Docker") and [Docker Compose](https://docs.docker.com/compose/ "Docker Compose") to orchestrate our services and our migration process.

Let's learn a little about the services that we're going to use:

- **Primary**: the application which contains distinct APIs and will have one of them migrated;
- **Candidate**: the application that will provide the new API to replace the one currently served by the primary application.

`docker-compose.yml`

```yaml
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
```

Starting the applications:

```bash
$ docker-compose up
```

Let’s do some tests after our applications runs. The primary application will be responding through the port `8080` and the candidate application through the port `8081`. I'm using the [HTTPie](https://httpie.org/ "HTTPie") tool in the screenshots below.

**Primary:**

![Request successfully to the primary application](/assets/uploads/http-app-primaria.jpg "Request to the primary application")

**Candidate:**

![Request successfully to the candidate application](/assets/uploads/http-app-candidate.jpg "Request to the candidate application")

If you take a look at the documentation for the image [https://hub.docker.com/r/diffy/example-service](https://hub.docker.com/r/diffy/example-service "Diffy Example Service") you will notice that there are four distinct APIs available.

- _/success_
- _/regression_
- _/noise_
- _/noisy_regression_

For demonstration purposes, and as mentioned before, we will perform a migration of only one API, which will be the `/success` endpoint. So, we'll keep the endpoints `/regression`, `/noise` and, `/regression_noise` under the responsibility of the primary application, and the `/success` API will become the responsibility of the candidate application. Our strategy will be:

1. Ensure that the `candidate` application is responding with the same data as the `primary` application;
2. Make the `candidate` application responsible for the API `/success` in a transparent way for those who are consuming this API and keep the `primary` application in charge for the other endpoints.

## Diffy

[Twitter](https://twitter.com "Twitter") released this tool as open-source in 2015, publishing with it this [article](https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html "Blog Post Twitter") which explain a bit how how it works. Currently, this repository is archived by Twitter, but since that happened, it has been maintained by the organization [OpenDiffy](https://github.com/opendiffy/diffy "OpenDiffy").

### What's is Diffy

Getting from the own Diffy [README](https://github.com/opendiffy/diffy#what-is-diffy "README Diffy")

> Diffy finds potential bugs in your service using running instances of your new code and your old code side by side. Diffy behaves as a proxy and multicasts whatever requests it receives to each of the running instances. It then compares the responses, and reports any regressions that may surface from those comparisons. The premise for Diffy is that if two implementations of the service return “similar” responses for a sufficiently large and diverse set of requests, then the two implementations can be treated as equivalent and the newer implementation is regression-free.

Besides that, Diffy has a good web interface where you can compare the differences between the stable (primary) and the candidate application. You can also ignore things you don't care about, like differences in headers or even body values ​​that you know will be different.

### Configuring Diffy

Going back to our fictional scenario in which we're simulating the migration of one API, let's add the Diffy tool to help us to achieve our goal.

`docker-compose.yml`

```yaml
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
```

### How does Diffy work?

![An image containing a flowchart showing the Diffy acting as a proxy between the primary and secondary applications and demonstrating the crossing of the responses of each one to provide comparative data between the two applications.](https://cdn.cms-twdigitalassets.com/content/dam/blog-twitter/archive/diffy_testing_serviceswithoutwritingtests96.thumb.1280.1280.png "Diffy's flowchart")

Besides to configure the primary and the candidate application Diffy also allows us to configure a secondary application, which could be a second instance from the same implementation from the application primary. In our case, we'll define the secondary instance as the primary one.

With this configuration, the web interface from Diffy can be accessed via a browser through the URL `http://localhost:3000`.

![An image from Diffy's admin without data](/assets/uploads/diffy-localhost-3000.png "Diffy Admin")

And, we can interact with the Diffy proxy through the URL: `http://localhost:3001`

![An image that contains a request being made for the primary application and obtaining a successful response.](/assets/uploads/success-diffy-test.png "Curl request to the primary application")

![An image that contains a request being made for the candidate application and obtaining a successful response.](/assets/uploads/regression-diffy-test.png "Curl request to the application candidate")

The header `Canonical-Resource` was added to the request, so the Diffy can have a better reference to the API and display it in your interface.

![Diffy Admin image after placing orders showing the data for comparison.](/assets/uploads/diffy-interface-success.png "Diffy Admin with data")
![Diffy Admin image after requests made showing the data that obtained the differences between the primary and the candidate application.](/assets/uploads/diffy-interface-regression.png "Diffy Admin showing the differences")
![Diffy Admin image focusing on exactly the data that was different in the response between a primary application and the candidate.](/assets/uploads/diffy-interface-regression-detailed.png "Diffy Admin showing the specific data differences")

A couple of things to note:

- Diffy does not do any URL rewriting. So your old and new endpoints need to have the same request paths;
- For safety reasons `POST`, `PUT`, `DELETE` are ignored by default.

## NGINX

In a nutshell, we have now three services running:

- The primary application running on port `8080`;
- The candidate application running on port `8081`;
- The Diffy Admin on port `3000` and the Diffy proxy on port `3001`.

The main idea is to keep the primary application reachable through the port `8080`. We don't want to intervene in the already integrated consumers, requesting them any kind of change like an update of a service port for example. Besides that, the NGINX will be a great ally to make the candidate application becomes the primary one.

`docker-compose.yml`

```yaml
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
```

`Dockerfile`

```dockerfile
FROM nginx:stable-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
```

`nginx.conf`

```nginx
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
```

The directory and the files are organized in this structure:

![Image showing that in the directory there are three files at the same level, Dockerfile, docker-compose.yml, and nginx.conf](/assets/uploads/tree-repository.jpg "tree command")

With this configuration, we keep the primary application running on port `8080` as we have planned, and the Diffy Admin accessible via port `3000`. Purposefully, was removed the direct access to the candidate application once that we want to make sure that the application is working completely correctly before expose it externally. It also was removed the direct access to the Diffy proxy to guarantee that all requests are being made in a controlled context, avoiding unpredictable external requests. Which brings us to the next step.

### NGINX Mirror

At this moment, our goal is keeping the primary application responding to all requests and use all these same requests to test our candidate application transparently using Diffy. To help us, we'll use the [Mirror Module](https://nginx.org/en/docs/http/ngx_http_mirror_module.html "Mirror Module") from NGINX:

> The _ngx_http_mirror_module_ module implements mirroring of an original request by creating background mirror subrequests. Responses to mirror subrequests are ignored.

`nginx.conf`

```nginx
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
```

With this configuration, the primary application will still be handling all requests with just a simple difference regarding the endpoint `/success` that will have their requests mirrored to the Diffy too. Therefore we can have reliable data to compare the responses between both applications to validate how trustful is our candidate application. Let's make some tests to check whether all is going as we planned:

When it's performed a request to the endpoint `/success` is possible to see a valid response, and we can also guarantee that the request was mirrored to Diffy looking at the header `X-Will-Mirror` that has been added by us.

![In the image, it is possible to see the header that was added showing that the request was mirrored.](/assets/uploads/success-happy-tester-mirror.png "Cur Request to the endpoint /success")

We can also see that the same header is not added by the server when a request is performed to the endpoint `/regression` what means that this request is not being mirrored to Diffy like from the endpoint `/success`:

![An image showing that the response does not contain the header that was added, that is, this request was not mirrored.](/assets/uploads/regression-happy-tester-mirror.png "Curl request to the endpoint /regression")

We can access the Diffy directly and analyze the data that we have there:

![An image demonstrating a request made previously to be compared via Diffy](/assets/uploads/diffy-testing-success-endpoint.png "Diffy Admin Interface")

So far, so good. With this approach, we can leave our services running for a while, keep monitoring Diffy to check how the candidate application is dealing with the requests, take actions whether required and once that we have confidence in the candidate application, we can move to the next step, which consists of making the candidate application exclusively responsible for the endpoint `/success`.

## Replacing the API

Let's suppose that we spend some days monitoring and everything is ok. All requests from the endpoint `/success` are having the same response from the primary and the candidate applications. So, we just decided that it's time to move on and replace the API completely, again we'll use NGINX to help us with that.

`nginx.conf`

```nginx
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
```

It's possible to see in this configuration that we don't have more the Diffy and the `mirror` available. Once that they achieve their purpose to validate our candidate application, we don't need them anymore. Finally, we can redirect all requests from the endpoint `/success` to the candidate application.

![An image showing that the candidate application is responsible for the endpoint /success](/assets/uploads/success-happy-tester.png "Cur Request to the endpoint /success")

![An image demonstrating that the endpoint /regression remains under the primary application responsibility](/assets/uploads/regression-happy-tester.png "Curl request to the endpoint /regression")

## Conclusion

I tried to cover and reproduce simple and generically the migration process of an API, exploring some tools and strategies that could be helpful to a process like that. I have an understanding of how this process could be more complicated in a real scenario, and for sure, it does not apply to all kinds of API migration. However, I would like to share a bit about these steps, and I hope that could be useful in some way in your API migration.

**Acknowledgment**

A special thanks to [Adriano Lisboa](https://twitter.com/adrianolisboa), [Marcos Brizeno](https://twitter.com/marcosbrizeno), [Michel Aquino](https://github.com/michelaquino), [Rodrigo Pinheiro](https://twitter.com/_rodrigopa_), e [Vitor Albuquerque](https://twitter.com/vrcca) for having reviewed the article before it was published.

**References**

- [https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html](https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html "https://blog.twitter.com/engineering/en_us/a/2015/diffy-testing-services-without-writing-tests.html")
- [Catching Bugs without Writing Tests by Puneet Khanduri (@pzdk) At Agile India 2017](https://www.youtube.com/watch?v=4KJKMDrPeJw)
- [https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/](https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/ "https://www.softwaretestingmagazine.com/videos/regression-testing-with-diffy/")
- [https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30](https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30 "https://medium.com/@rahulmuthu80/mirroring-incoming-web-traffic-with-nginx-fit-devops-d688ddca7d30")
