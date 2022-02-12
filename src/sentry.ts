import Toucan from "toucan-js";
import type {Options} from "toucan-js/dist/types";

// https://github.com/MattIPv4/workers-sentry
export class Sentry extends Toucan {

  constructor(event: FetchEvent, dsn: string, opts ?: Options) {
    super({
      dsn,
      context: event,
      allowedHeaders: [
        'user-agent',
        'cf-challenge',
        'accept-encoding',
        'accept-language',
        'cf-ray',
        'content-length',
        'content-type',
        'host',
      ],
      allowedSearchParams: /(.*)/,
      rewriteFrames: {root: '/',},
      // release: typeof SENTRY_RELEASE === 'undefined' ? undefined : SENTRY_RELEASE.id,
      ...opts,
    });

    // Set the type (fetch event or scheduled event)
    this.setTag('type', event.type);

    const request = event.request;
    if (request) {
      // @ts-expect-error
      const colo = request.cf && request.cf.colo ? request.cf.colo : 'UNKNOWN';
      this.setTag('colo', colo);
    }
  }
}
