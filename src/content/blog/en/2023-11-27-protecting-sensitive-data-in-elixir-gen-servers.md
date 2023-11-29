---
author: Gabriel Pereira
pubDatetime: 2020-11-05T00:00:00Z
title: Protecting sensitive data in Elixir GenServers
postSlug: protecting-sensitive-data-in-elixir-gen-servers
featured: false
draft: true
tags:
  - Elixir
  - GenServers
  - Security
ogImage: ""
description: Protecting sensitive data in Elixir GenServers
lang: "en"
---

In Elixir, [GenServers](https://hexdocs.pm/elixir/GenServer.html) are a common way to maintain state and handle concurrent processes. However, when these GenServers hold sensitive data, such as credentials or personal information, it’s crucial to ensure this data is protected. Sensitive data, if exposed, can lead to serious security breaches, including data leaks and unauthorized access. These breaches can have far-reaching consequences, such as loss of customer trust, damage to your brand’s reputation, and potential legal liabilities.

In this blog post, we’ll explore two techniques to protect sensitive data in Elixir GenServers: implementing the `Inspect` protocol for structs and implementing the `format_status/2` callback.

To illustrate this, let’s take a look at a GenServer that is handling some sensitive data. (I ended up writing a GenServer quite long for a blog post. However, I hope that this example can help to understand the different ways of hiding sensitive data in a GenServer, and the trade-offs involved in each approach)

<script src="https://gist.github.com/gabrielpedepera/57d5014330a446a00bdf4827262f14c7.js"></script>

Basically this GenServer acts like a diligent security guard managing a special “security token” that expires every 15 minutes. It doesn’t wait for the token to expire, but proactively starts a countdown to refresh the token just before expiration. When another process requests the token via the `get_security_token` function, it ensures the token is valid before handing it over. This creates a seamless cycle of token issuance, countdown, and renewal, ensuring a valid token is always available.

```bash
❯ iex security_token_manager.ex
Erlang/OTP 26 [erts-14.1] [source] [64-bit] [smp:10:10] [ds:10:10:10] [async-threads:1] [jit]

Interactive Elixir (1.15.6) - press Ctrl+C to exit (type h() ENTER for help)
iex(1)> {:ok, pid} = SecurityTokenManager.start_link()
{:ok, #PID<0.116.0>}
iex(2)> SecurityTokenManager.get_security_token()
"8QVrN1ohPPdiWHfnmEr+ln4VQ4Y="
```

While it effectively manages the lifecycle of security tokens, it does have a potential security concern. The GenServer stores sensitive data, such as the `access_key`, `secret_access`, and `security_token`, in its state. This data could potentially be leaked through logging tools when some error is raised for example.

![Error log output from the SecurityTokenManager GenServer. The server is terminating due to a RuntimeError that occurred while trying to fetch a security token. The error details, including the function calls leading to the error and the state that reveals sensitive data, are displayed.](/assets/uploads/error-terminal.png "Error Terminal")

Or via the `:sys.get_status/1` function, which can access the state of a running process.

```bash
iex(3)> :sys.get_status(pid)
{:status, #PID<0.116.0>, {:module, :gen_server},
 [
   [
     "$initial_call": {SecurityTokenManager, :init, 1},
     "$ancestors": [#PID<0.115.0>, #PID<0.107.0>]
   ],
   :running,
   #PID<0.115.0>,
   [],
   [
     header: ~c"Status for generic server Elixir.SecurityTokenManager",
     data: [
       {~c"Status", :running},
       {~c"Parent", #PID<0.115.0>},
       {~c"Logged events", []}
     ],
     data: [
       {~c"State",
        %SecurityTokenManager{
          access_key: "my-access-key",
          secret_access: "my-secret-access",
          security_token: "ZjhkWWzemgvCMZXwIit+a/00FHw=",
          expires_at: ~U[2023-11-26 15:05:49.494781Z]
        }}
     ]
   ]
 ]}
```

This could lead to unauthorized access if the leaked information falls into the wrong hands. Therefore, it’s crucial to ensure that sensitive data stored in a GenServer’s state is adequately protected.

## Implementing the `format_status/2` callback

The `format_status/2` callback provides a way to protect sensitive data in GenServers. This callback is used to provide a custom representation of the GenServer’s state when debugging or introspecting the process.

By default, the `format_status/2` callback returns all the state data. To protect sensitive data, we can implement this callback to filter out or obfuscate the sensitive parts of the state.

Here’s how we can implement the `format_status/2` callback in our GenServer:

```elixir
def format_status(_reason, [pdict, state]) do
  {:ok,
    [
      pdict,
      %{
        state
        | access_key: "<sensitive_data>",
          secret_access: "<sensitive_data>",
          security_token: "<sensitive_data>"
      }
    ]}
end
```

So, when the `:sys.get_status/1` is called we'll have a response that does not display any sensitive data.

```bash
iex(4)> :sys.get_status(pid)
{:status, #PID<0.116.0>, {:module, :gen_server},
 [
   [
     "$initial_call": {SecurityTokenManager, :init, 1},
     "$ancestors": [#PID<0.115.0>, #PID<0.107.0>]
   ],
   :running,
   #PID<0.115.0>,
   [],
   [
     header: ~c"Status for generic server Elixir.SecurityTokenManager",
     data: [
       {~c"Status", :running},
       {~c"Parent", #PID<0.115.0>},
       {~c"Logged events", []}
     ],
     ok: [
       [
         "$initial_call": {SecurityTokenManager, :init, 1},
         "$ancestors": [#PID<0.115.0>, #PID<0.107.0>]
       ],
       %SecurityTokenManager{
         access_key: "<sensitive_data>",
         secret_access: "<sensitive_data>",
         security_token: "<sensitive_data>",
         expires_at: ~U[2023-11-26 16:59:47.764327Z]
       }
     ]
   ]
 ]}
```

This is certainly an improvement, isn’t it? However, one concern that arises is that sensitive data can still be accessed via the `:sys.get_state/1` function, even with the implementation of `format_status/2`.

```bash
iex(5)> :sys.get_state(pid)
%SecurityTokenManager{
  access_key: "my-access-key",
  secret_access: "my-secret-access",
  security_token: "fZWO+Dym+bEJ9kw8E1nLNryT5m0=",
  expires_at: ~U[2023-11-26 17:16:47.936304Z]
}
```

The next section will delve into how to prevent this issue.

## Implementing or deriving the `Inspect` protocol for structs

The `Inspect` protocol controls how data structures are converted to strings for printing. By default, when a struct is printed, all of its data is exposed. So, again this can lead to sensitive data being accidentally logged or displayed. To prevent this, we can implement the `Inspect` protocol for our struct to control how it is printed.

```elixir
defimpl Inspect, for: SecurityTokenManager do
  def inspect(%SecurityTokenManager{} = state, opts) do
    Inspect.Map.inspect(
      %{
        access_key: "<redacted>",
        secret_access: "<redacted>",
        security_token: "<redacted>",
        expires_at: state.expires_at
      },
      opts
    )
  end
end
```

With the implementation of the `Inspect` protocol now established, we can achieve the same structured output for both `:sys.get_state/1` and `:sys.get_status/1` functions.

```bash
iex(6)> :sys.get_state(pid)
%{
  access_key: "<redacted>",
  secret_access: "<redacted>",
  security_token: "<redacted>",
  expires_at: ~U[2023-11-26 21:37:53.396092Z]
}
```

```bash
iex(7)> :sys.get_status(pid)
{:status, #PID<0.119.0>, {:module, :gen_server},
 [
   [
     "$initial_call": {SecurityTokenManager, :init, 1},
     "$ancestors": [#PID<0.118.0>, #PID<0.110.0>]
   ],
   :running,
   #PID<0.118.0>,
   [],
   [
     header: ~c"Status for generic server Elixir.SecurityTokenManager",
     data: [
       {~c"Status", :running},
       {~c"Parent", #PID<0.118.0>},
       {~c"Logged events", []}
     ],
     ok: [
       [
         "$initial_call": {SecurityTokenManager, :init, 1},
         "$ancestors": [#PID<0.118.0>, #PID<0.110.0>]
       ],
       %{
         access_key: "<redacted>",
         secret_access: "<redacted>",
         security_token: "<redacted>",
         expires_at: ~U[2023-11-26 21:37:53.396092Z]
       }
     ]
   ]
 ]}
```

As stated in the subtitle, an alternative method involves deriving the `Inspect` protocol. The `:only` and `:except` options can be utilized with `@derive` to determine which fields should be displayed and which should not. For simplicity, we’ll use the `:only` option in this instance.

```elixir
@derive {Inspect, only: [:expires_at]}
defstruct [:access_key, :secret_access, :security_token, :expires_at]
```

In this method, only the `:expires_at` will be visible. The rest of the fields will not just have their values hidden, but their keys will be completely omitted as well.

```bash
iex(8)> :sys.get_state(pid)
#SecurityTokenManager<expires_at: ~U[2023-11-26 22:42:56.998354Z], ...>
```

```bash
iex(9)> :sys.get_status(pid)
{:status, #PID<0.119.0>, {:module, :gen_server},
 [
   [
     "$initial_call": {SecurityTokenManager, :init, 1},
     "$ancestors": [#PID<0.118.0>, #PID<0.110.0>]
   ],
   :running,
   #PID<0.118.0>,
   [],
   [
     header: ~c"Status for generic server Elixir.SecurityTokenManager",
     data: [
       {~c"Status", :running},
       {~c"Parent", #PID<0.118.0>},
       {~c"Logged events", []}
     ],
     data: [
       {~c"State",
        #SecurityTokenManager<expires_at: ~U[2023-11-26 22:43:57.000550Z], ...>}
     ]
   ]
 ]}
```

## Conclusion

This blog post has explored some techniques to protect sensitive data in Elixir GenServers. It has shown how to implement or derive the `Inspect` protocol for structs, and how to implement the `format_status/2` callback for GenServer, `:gen_event` or `:gen_statem` processes holding sensitive data. These techniques can help prevent or limit the exposure of sensitive data in logs, error reports, or terminal outputs, which can compromise the security and privacy of the application and its users.

I hope you have found this useful and informative, and I encourage you to try these techniques in your own projects. If you have any questions or feedback, please feel free to leave a comment below.

## References

- https://erlef.github.io/security-wg/secure_coding_and_deployment_hardening/sensitive_data.html
