import {Router} from 'itty-router';
import {error, json, missing} from 'itty-router-extras';
// @ts-expect-error
import config from './config.yaml';
import {Config} from "./domain";
import {getIncidents, postIncidents} from "./incident";
import {getPings, getRecentPings, postPings} from "./ping";
import {Store} from "./store";
import {Sentry} from "./sentry";

const {namespaces, services}: Config = config;

function auth(request: Request): Response | undefined {
  if (!TOKEN) {
    throw new Error("TOKEN variable not configured");
  }

  const header = request.headers.get('Authorization');
  const match = header?.match(/Bearer (.+)/);

  if (match?.[1] !== TOKEN) {
    return error(401, "Bad Token");
  }
}

const router = Router({base: '/api'})
    .get('/namespaces', () => json(namespaces))
    .get("/services", () => json(services))
    .get('/incidents', getIncidents)
    .post('/incidents', auth, request => postIncidents(config, request))
    .get('/pings', getPings)
    .get('/pings/recent', getRecentPings)
    .post('/pings', auth, request => postPings(config, request))
    .get('/store', async () => json(await Store.load(true, true, true)))
    .all('*', () => missing("Endpoint not found."));

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(router.handle(event.request)
      .then((response: Response) => {
        if (event.request.method === "GET") {
          response.headers.set("Access-Control-Allow-Origin", "*");
          response.headers.set("Access-Control-Max-Age", "86400");
        }

        return response;
      })
      .catch((err: unknown) => {
        if (SENTRY_DSN) {
          const sentry = new Sentry(event, SENTRY_DSN);
          sentry.captureException(err);
        }
        return error(500, "Internal Server Error");
      }));
})
