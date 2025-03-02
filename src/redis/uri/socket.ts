// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { parseRedisQuery } from "./common";

import type { BasicRedisSocketOptions as Options } from "../basic_options";

import { ParseError } from "../../errors";
import { Scheme, getScheme, parseUri } from "../../uri";

/**
 * `uri` should be of the format:
 * redis[s]+socket://path[?query=value[&query=value]...]
 * Valid queries are `"noDelay"` and `"password"`. snake_case will be converted
 * to camelCase. If multiple duplicate queries are provided, the last one
 * provided will be used.
 *
 * @param uri The URI to parse.
 * @returns The `Options` parsed from `uri`.
 *
 * @throws ParseError If `uri` is not a valid Redis Socket URI.
 */
export const parse = (uri: string): Options => {
  const protocol = getScheme(uri);

  if (
    protocol !== Scheme.RedisSocket &&
    protocol !== Scheme.RedisSocketSecure
  ) {
    throw new ParseError(`unrecognized scheme "${protocol}"`);
  }

  const parsed = parseUri(uri);
  const path = parsed.path;

  return {
    path: validatePath(path),
    protocol,
    ...parseRedisQuery(parsed),
  };
};

/**
 * @param path The URI path to validate.
 * @returns `path`, if it is a valid Unix path.
 *
 * @throws ParseError If `path` contains a null-terminator (`'\0'`).
 */
const validatePath = (path: string): string => {
  if (/^[^\0]+$/.test(path) !== true) {
    throw new ParseError(`invalid path "${path}"`);
  }

  return path;
};
