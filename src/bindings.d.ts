export {};

declare global {
  const TOKEN: string;
  const STATUS: KVNamespace;
  const SENTRY_DSN: string | undefined;
  const SENDGRID_TOKEN: string | undefined;
  const EMAIL_RECIPIENTS: string;
}
