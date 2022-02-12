import {Router} from 'itty-router';
import {error, json, missing} from 'itty-router-extras';
// @ts-expect-error
import config from './config.yaml';
import {Config} from "./domain";
import {getIncidents, postIncidents} from "./incident";
import {getPings, postPings} from "./ping";

const {namespaces, services}: Config = config;

const router = Router({base: '/api'})
    .get('/namespaces', () => json(namespaces))
    .get("/services", () => json(services))
    .get('/incidents', getIncidents)
    .post('/incidents', postIncidents)
    .get('/pings', getPings)
    .post('/pings', postPings)
    .all('*', () => missing("Endpoint not found."));

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(router.handle(event.request).catch(() => error(500, "Internal Server Error")));
})
