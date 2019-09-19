# reqcache

Simple utility to proxy and cache all requests to upstream server.
Useful when you need to benchmark microservice by self and exclude other services affects

# Prepare to use

Just clone the repository and install dependecies:

```
npm install
```

# Usage

```
node reqcache port baseUrl [debug]
```

Parameters:

- `port` - port to listen on
- `baseUrl` - base url to proxy requests
- `debug` - optional flag for printing debug info

# Example

For example, run cached proxy for `http://example.com`, that uses resource `/styles.css`:

```
node reqcache 3030 http://example.com debug
```
Open in browser `http://localhost:3030` and you will see in console something like:
```
Proxying to https://example.com at 0.0.0.0:3030
new request: GET /
response: /: 200
get from cache: GET /
new request: GET /styles.css
response: /styles.css 200
get from cache: GET /styles.css
```

Then reload page in browser:
```
get from cache: GET /
get from cache: GET /styles.css
```
Reqcache memorized first response and just return it again with no requests to upstream server.