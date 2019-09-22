process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios').default;
const Koa = require('koa');
const koaBody = require('koa-body');
const unparsed = require('koa-body/unparsed');

if (process.argv.length < 4) {
	console.log(`Usage: node reqcache port http://example.com/base/url`);
	process.exit(1);
}

const config = {
	port: process.argv[2],
	proxyBase: process.argv[3],
	debug: process.argv[4] === 'debug',
};

let cache = new Map();

const app = new Koa();

app.use(koaBody({includeUnparsed: true}));
app.use(async ctx => {
	let method = ctx.request.method;
	let fullUrl = ctx.request.url;
	let body = ctx.request.body[unparsed];
	let headers = ctx.request.headers;

	delete headers.host;

	let key = makeMapKey({method, fullUrl, body, headers});

	if (!cache.has(key)) {
		cache.set(key, await makeRequest({method, fullUrl, body, headers}));
	}

	if (config.debug) console.debug(`get from cache: ${method} ${fullUrl}`);

	let resp = cache.get(key);

	ctx.response.status = resp.status;
	for (let hdr in resp.headers) {
		ctx.set(hdr, resp.headers[hdr]);
	}
	ctx.response.body = resp.body;
});

app.listen(config.port, () => console.log(`Proxying to ${config.proxyBase} at 0.0.0.0:${config.port}`));

function makeMapKey({method, fullUrl, body, headers}) {
	return `${method}:${fullUrl}:${body}`;
}

async function makeRequest({method, fullUrl, body, headers}) {
	if (config.debug) console.debug(`new request: ${method} ${fullUrl}`);

	let resp = await axios.request({
		baseURL: config.proxyBase,
		validateStatus(status) { return true; },
		responseType: 'arraybuffer',
		method,
		url: fullUrl,
		headers,
		data: body,
	});

	delete resp.headers['content-length'];
	delete resp.headers['transfer-encoding'];

	if (config.debug) console.debug(`response: ${resp.status} - ${fullUrl}`);

	return {body: resp.data, headers: resp.headers, status: resp.status};
}