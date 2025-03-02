// BSD 3-Clause License
//
// Copyright (c) 2021, node-celery-ts contributors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.
//
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
//
// * Neither the name of the copyright holder nor the names of its
//   contributors may be used to endorse or promote products derived from
//   this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import { ParseError } from "./errors";
import { isNullOrUndefined, toCamelCase } from "./utility";

/**
 * Object representation of a URI.
 */
export interface Uri {
  readonly authority?: Authority;
  readonly path: string;
  readonly query?: Queries;
  readonly raw: string;
  readonly scheme: string;
}

/**
 * Supported URI schemes for Celery message brokers and result backends.
 */
export enum Scheme {
  Amqp = "amqp",
  AmqpSecure = "amqps",
  Redis = "redis",
  RedisSecure = "rediss",
  RedisSentinel = "sentinel",
  RedisSentinelSecure = "sentinels",
  RedisSocket = "redis+socket",
  RedisSocketSecure = "rediss+socket",
  Rpc = "rpc",
  RpcSecure = "rpcs",
}

/**
 * For convenience.
 */
const SCHEMES = new Set<string>(Object.values(Scheme));

/**
 * URI authority.
 */
export interface Authority {
  readonly userInfo?: UserInfo;
  readonly host: string;
  readonly port?: number;
}

/**
 * Parsed URI query - can be not present or present one or more times.
 */
export interface Queries {
  readonly [key: string]: string | Array<string> | undefined;
}

/**
 * URI username and password.
 */
export interface UserInfo {
  readonly user: string;
  readonly pass?: string;
}

/**
 * @param toParse A valid URI.
 * @returns A normalized object representation of a URI.
 *
 * @throws ParseError If `toParse` is not a valid URI.
 */
export const parseUri = (toParse: string): Uri => {
  const parsed = (() => {
    try {
      return URL.parse(toParse);
    } catch (error) {
      throw new ParseError(
        `Celery.Uri.parse: unable to parse ${toParse}: ${error}`,
      );
    }
  })();

  if (!parsed) throw new ParseError(`Celery.Uri.parse: string '${toParse}' is not parsable`);

  const scheme = parsed.protocol.substring(0, parsed.protocol.length - 1).toLowerCase();

  const withRequired: Uri = {
    path: parsed.href === parsed.protocol ? parsed.pathname : parsed.pathname || '/',
    raw: toParse,
    scheme
  };
  const withAuthority = addHostUserPassAndPort(parsed, withRequired);
  const withQuery = addQuery(parsed, withAuthority);

  return withQuery;
};

function isFalsy(value: string | null | undefined): boolean {
  return !value
}

/**
 * Only looks at the beginning of the string to match a scheme.
 *
 * @param rawUri A valid URI.
 * @returns An enum corresponding to the scheme of `rawUri`.
 * @throws ParseError If `rawUri` has an unrecognized scheme.
 */
export function getScheme(rawUri: string): Scheme {
  const SCHEME_REGEX: RegExp = /^([A-Za-z][A-Za-z\d+.-]*):/;
  const SCHEME_INDEX: number = 1;

  const maybeMatches = rawUri.match(SCHEME_REGEX);

  if (isNullOrUndefined(maybeMatches)) {
    throw new ParseError(`invalid uri "${rawUri}"`);
  }

  const matches = maybeMatches;
  const scheme = matches[SCHEME_INDEX].toLowerCase();

  if (!SCHEMES.has(scheme)) {
    throw new ParseError(`unrecognized scheme "${scheme}"`);
  }

  return scheme as Scheme;
};

/**
 * @param uri The output of `require("urijs").parse`.
 * @param parsing The object to add a hostname to.
 * @returns A copy of `parsing` with `authority.host` added if `uri.hostname` is
 *          defined.
 */
function addHost(uri: URL, parsing: Uri): Uri {
  if (isFalsy(uri.hostname)) {
    return parsing;
  }

  return {
    ...parsing,
    authority: {
      host: validateHost(uri.hostname).toLowerCase(),
    },
  };
};

/**
 * @param uri The output of `require("urijs").parse`.
 * @param parsing The object to add a hostname and username to.
 * @returns A copy of `parsing` with the fields added.
 */
function addHostAndUser(uri: URL, parsing: Uri): Uri {
  const withHost = addHost(uri, parsing);

  if (
    isNullOrUndefined(withHost.authority) ||
    isFalsy(uri.username)
  ) {
    return withHost;
  }

  return {
    ...withHost,
    authority: {
      ...withHost.authority,
      userInfo: {
        user: decodeURIComponent(uri.username),
      },
    },
  };
};

/**
 * @param uri The output of `require("urijs").parse`.
 * @param parsing The object to add a hostname, username, and password to.
 * @returns A copy of `parsing` with the fields added.
 */
function addHostUserAndPass(uri: URL, parsing: Uri): Uri {
  const withUser = addHostAndUser(uri, parsing);

  if (isNullOrUndefined(withUser.authority)) {
    return withUser;
  }

  if (
    isNullOrUndefined(withUser.authority.userInfo) &&
    !isFalsy(uri.password)
  ) {
    return {
      ...withUser,
      authority: {
        ...withUser.authority,
        userInfo: {
          pass: decodeURIComponent(uri.password),
          user: "",
        },
      },
    };
  }

  if (
    isNullOrUndefined(withUser.authority.userInfo) ||
    isFalsy(uri.password)
  ) {
    return withUser;
  }

  return {
    ...withUser,
    authority: {
      ...withUser.authority,
      userInfo: {
        ...withUser.authority.userInfo,
        pass: uri.password,
      },
    },
  };
};

/**
 * @param uri The output of `require("urijs").parse`.
 * @param parsing The object to add a hostname, username, password, and port to.
 * @returns A copy of `parsing` with the fields added.
 */
function addHostUserPassAndPort(uri: URL, parsing: Uri): Uri {
  const withPass = addHostUserAndPass(uri, parsing);

  if (isNullOrUndefined(withPass.authority) || isFalsy(uri.port)) {
    return withPass;
  }

  return {
    ...withPass,
    authority: {
      ...withPass.authority,
      port: parsePort(uri.port),
    },
  };
};

function parseQueries(entries: Iterable<[string, string]>) {
  const result = <any>{};
  for (const [key, value] of entries) {
    if (Object.hasOwnProperty.call(result, key)) {
      if (Array.isArray(result[key]))
        result[key].push(value);
      else
        result[key] = [result[key], value];
    } else result[key] = value;
  }
  return result;
}

/**
 * @param uri `URL`.
 * @param parsing The object to append queries to.
 * @returns A copy of `parsing` with the parsed query appended.
 */
export function addQuery(uri: URL, parsing: Uri): Uri {
  const REGEX: RegExp = // tslint:disable:max-line-length
    /^[A-Za-z\d*-._+%]+=[A-Za-z\d*-._+%]*(?:&[A-Za-z\d*-._+%]+=[A-Za-z\d*-._+%+]*)*$/;

  if (isFalsy(uri.search)) {
    return parsing;
  }

  if (!REGEX.test(uri.search.substring(1))) {
    throw new ParseError(`query "${uri.search}" is not a valid HTML query`);
  }

  const unconverted = parseQueries(uri.searchParams.entries()) as Queries;

  const camelCaseQuery = (queries: Queries, key: string) => {
    const cased = toCamelCase(key);

    if (cased === key) {
      return queries;
    }

    const { [key]: _key, ...renamed } = {
      ...queries,
      [cased]: queries[key],
    };

    return renamed;
  };

  const query = Object.keys(unconverted).reduce(camelCaseQuery, unconverted);

  return {
    ...parsing,
    query,
  };
};

/**
 * Uses `Number.parseInt` with a base of 10.
 *
 * @param maybePort A valid base-10 representation of a number.
 * @returns The parsed port number.
 *
 * @throws ParseError If `maybePort` is not a number.
 */
export function parsePort(maybePort: string): number {
  const parsed = +maybePort;

  if (Number.isNaN(parsed)) {
    throw new ParseError(`could not parse "${maybePort}" as port`);
  }

  return Number.parseInt(maybePort);
};

/**
 * @param maybeHost A string to validate as URI authority hostname.
 * @returns `maybeHost` if it is a valid hostname.
 *
 * @throws ParseError If `maybeHost` is not a valid URI authority hostname.
 */
export function validateHost(maybeHost: string): string {
  if (HOST_REGEX.test(maybeHost) === false) {
    throw new ParseError(`invalid host "${maybeHost}"`);
  }

  return maybeHost;
};

// tslint:disable:max-line-length
const HOST_REGEX: RegExp =
  /^(?:[A-Za-z\d]|[A-Za-z\d][A-Za-z\d-]{0,61}?[A-Za-z\d])(?:\.(?:[A-Za-z\d]|[A-Za-z\d][A-Za-z\d-]{0,61}?[A-Za-z\d]))*$/;
