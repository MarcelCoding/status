import {Request} from "itty-router";
import {json, status} from "itty-router-extras";

export async function getPings(request: Request): Promise<Response> {
  return json([]);
}

export async function postPings(request: Request): Promise<Response> {
  return status(204);
}

