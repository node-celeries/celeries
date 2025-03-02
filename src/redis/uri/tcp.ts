// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { parseRedisQuery } from "./common";

import type { BasicRedisTcpOptions as Options } from "../basic_options";

import { ParseError } from "../../errors";
import { Scheme, type Uri, getScheme, parseUri } from "../../uri";
import { isNullOrUndefined, parseInteger } from "../../utility";

/**
 * `uri` should be of the format:
 * redis[s]://[user[:pass]@]host[:port][/db][?query=value[&query=value]...]
 * snake_case query keys will be converted to camelCase. Supported queries are
 * `"noDelay"` and `"password"`,
 *
 * @param rawUri The URI to parse.
 * @returns The `Options` parsed from `uri`.
 *
 * @throws ParseError If `uri` is not a valid Redis Socket URI.
 */
export const parse = (rawUri: string): Options => {
  const protocol = getScheme(rawUri);

  if (protocol !== Scheme.Redis && protocol !== Scheme.RedisSecure) {
    throw new ParseError(`unrecognized scheme "${protocol}"`);
  }

  const parsed = parseUri(rawUri);

  if (isNullOrUndefined(parsed.authority)) {
    throw new ParseError(`"${rawUri}" is missing authority`);
  }

  const rawOptions = addOptions(parsed, { protocol });

  return {
    ...rawOptions,
    ...parseRedisQuery(parsed),
  };
};

/**
 * Accepted options for TCP URIs.
 */
enum Option {
  Database = "db",
  Hostname = "host",
  Password = "password",
  Port = "port",
}

/**
 * TODO: restructure this to be less verbose and less duplicated.
 *
 * @param uri The URI to extract authority and path information from.
 * @param options The `Options` to fill non-query components to.
 * @returns `options` with database, hostname, password, and port filled in.
 *
 * @throws ParseError If the URI's path is not parsable as a non-negative base
 *                    10 number.
 */
const addOptions = (uri: Uri, options: Options): Options => {
  return Object.values(Option).reduce(
    (iterating: Options, key: Option): Options => {
      switch (key) {
        case Option.Database:
          return addDatabase(uri, iterating);
        case Option.Hostname:
          return addHostname(uri, iterating);
        case Option.Password:
          return addPassword(uri, iterating);
        case Option.Port:
          return addPort(uri, iterating);
      }
    },
    options,
  );
};

/**
 * @param uri The URI to parse from.
 * @param iterating The `Options` object to draw defaults from.
 * @returns An `Options` object with database appended and all other members
 *          copied from `iterating`.
 *
 * @throws ParseError If `uri`'s path cannot be parsed as a database number.'
 */
const addDatabase = (uri: Uri, iterating: Options): Options => {
  if (uri.path === "/") {
    return iterating;
  }

  return {
    ...iterating,
    db: parseDb(uri.path),
  };
};

/**
 * @param uri The URI to parse from.
 * @param iterating The `Options` object to draw defaults from.
 * @returns An `Options` object with hostname appended and all other members
 *          copied from `iterating`.
 */
const addHostname = (uri: Uri, iterating: Options): Options => {
  const authority = uri.authority!;

  return {
    ...iterating,
    host: authority.host,
  };
};

/**
 * @param uri The URI to parse from.
 * @param iterating The `Options` object to draw defaults from.
 * @returns An `Options` object with password appended and all other members
 *          copied from `iterating`.
 */
const addPassword = (uri: Uri, iterating: Options): Options => {
  const authority = uri.authority!;

  if (
    isNullOrUndefined(authority.userInfo) ||
    isNullOrUndefined(authority.userInfo.pass)
  ) {
    return iterating;
  }

  return {
    ...iterating,
    password: authority.userInfo.pass,
  };
};

/**
 * @param uri The URI to parse from.
 * @param iterating The `Options` object to draw defaults from.
 * @returns An `Options` object with port appended and all other members
 *          copied from `iterating`.
 */
const addPort = (uri: Uri, iterating: Options): Options => {
  const authority = uri.authority!;

  if (isNullOrUndefined(authority.port)) {
    return iterating;
  }

  return {
    ...iterating,
    port: authority.port,
  };
};

/**
 * Uses `Utility.parseInteger` internally.
 *
 * @param maybeDb A datab
 * @returns A database index.
 */
const parseDb = (maybeDb: string): number => {
  const DB_INDEX: number = 1;

  const maybeMatches = /^\/0*(\d+)/.exec(maybeDb);

  if (isNullOrUndefined(maybeMatches)) {
    throw new ParseError(`unable to parse "${maybeDb}" as db path`);
  }

  const matches: RegExpExecArray = maybeMatches;

  return parseInteger(matches[DB_INDEX]);
};
