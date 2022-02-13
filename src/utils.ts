const relativeTimeFormat = new Intl.RelativeTimeFormat('en-US', {
  numeric: "auto",
  style: "long",
});

const pluralRules = new Intl.PluralRules('en-US', {type: "cardinal"});

export function formatRelativeTime(secDiff: number): string {
  if (isInRange(-60, secDiff, 60)) {
    return relativeTimeFormat.format(Math.round(secDiff), "seconds");
  }

  const minDiff = secDiff / 60;

  if (isInRange(-60, minDiff, 60)) {
    return relativeTimeFormat.format(Math.round(minDiff), "minutes");
  }

  const hourDiff = minDiff / 60;

  if (isInRange(-24, hourDiff, 24)) {
    return relativeTimeFormat.format(Math.round(hourDiff), "hours");
  }

  return relativeTimeFormat.format(Math.round(hourDiff / 24), "days");
}

export function formatDuration(delta: number): string {
  const years = Math.floor(delta / 31536000);
  const days = Math.floor((delta % 31536000) / 86400);
  const hours = Math.floor(((delta % 31536000) % 86400) / 3600);
  const minutes = Math.floor((((delta % 31536000) % 86400) % 3600) / 60);
  const seconds = (((delta % 31536000) % 86400) % 3600) % 60;

  let result = [];

  if (years != 0) {
    result.push(`${years} years`);
  }

  if (days != 0) {
    result.push(`${days} days`);
  }

  if (hours != 0) {
    result.push(`${hours} hours`);
  }

  if (minutes != 0) {
    result.push(`${minutes} minutes`);
  }

  if (seconds != 0) {
    result.push(`${seconds} seconds`);
  }

  return humanList(result);
}

export function formatCount(count: number): string {
  return pluralRules.select(count);
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function isInRange(start: number, value: number, end: number) {
  return start < value && value < end;
}

export function humanList(list: string[]): string {
  return list.length == 1 ? list[0] : [list.slice(0, list.length - 1).join(", "), list[list.length - 1]].join(" and ");
}

export function humanOrList(list: string[]): string {
  return list.length == 1 ? list[0] : [list.slice(0, list.length - 1).join(", "), list[list.length - 1]].join(" or ");
}

// https://stackoverflow.com/a/34890276
export function groupBy<T>(array: T[], key: string): { [key: string]: T[] } {
  return array.reduce(function (rv, x) {
    // @ts-ignore
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}
