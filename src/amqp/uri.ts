// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import type { AmqpOptions } from "./options";

import { ParseError } from "../errors";
import { QueryParser, createIntegerQueryDescriptor } from "../query_parser";
import { type Queries, Scheme, type Uri, getScheme, parseUri } from "../uri";
import { isNullOrUndefined } from "../utility";

/**
 * Parses a URI formatted according to the rules set forth by RabbitMQ.
 * https://www.rabbitmq.com/uri-spec.html
 * https://www.rabbitmq.com/uri-query-parameters.html
 * Potential queries are authMechanism, channelMax, connectionTimeout,
 * frameMax, heartbeat, and locale. snake_case and camelCase are accepted.
 * Should be formatted roughly as follows:
 * amqp[s]://[user[:pass]@]host[:port][/vhost][?key0=value0[&key1=value1]...]
 * Or as:
 * rpc[s]://[user[:pass]@]host[:port][/vhost][?key0=value0[&key1=value1]...]
 *
 * @param rawUri A RabbitMQ URI.
 * @returns An object representation of `uri`.
 *
 * @throws ParseError If `rawUri` is not a RabbitMQ URI.
 */
export const parseAmqpUri = (rawUri: string): AmqpOptions => {
  const scheme = getScheme(rawUri);

  if (![
    Scheme.Amqp,
    Scheme.AmqpSecure,
    Scheme.Rpc,
    Scheme.RpcSecure
  ].includes(scheme)) {
    throw new ParseError(`unrecognized scheme "${scheme}"`);
  }

  const uri = parseUri(rawUri);

  if (isNullOrUndefined(uri.authority)) {
    throw new ParseError(`"${rawUri}" missing authority`);
  }

  const protocol = (() => {
    switch (scheme) {
      case Scheme.Rpc:
        return Scheme.Amqp;
      case Scheme.RpcSecure:
        return Scheme.AmqpSecure;
    }

    return scheme;
  })();

  const withOptions = appendOptions(uri, {
    hostname: uri.authority.host,
    protocol,
  });

  const withVhost = appendVhost(rawUri, withOptions);
  const withQueries = appendQueries(uri, withVhost);

  return withQueries;
};

/**
 * @param uri The URI to extract a password, port, and username from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with options added.
 */
const appendOptions = (uri: Uri, appending: AmqpOptions): AmqpOptions => {
  type FunctionList = Array<(options: AmqpOptions) => AmqpOptions>;

  const functions: FunctionList = [
    appendPass(uri),
    appendPort(uri),
    appendUser(uri),
  ];

  return functions.reduce((x, f) => f(x), appending);
};

/**
 * @param uri The URI to extract queries from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with query options added.
 *
 * @throws ParseError If invalid query key-value pairs with matching keys are
 *                    found.
 */
const appendQueries = (uri: Uri, appending: AmqpOptions): AmqpOptions => {
  if (isNullOrUndefined(uri.query)) {
    return appending;
  }

  const query: Queries = uri.query;

  const parser = new QueryParser<AmqpOptions>([
    createIntegerQueryDescriptor("channelMax"),
    createIntegerQueryDescriptor("frameMax"),
    createIntegerQueryDescriptor("heartbeat"),
    { source: "locale" },
  ]);

  return parser.parse(query, appending);
};

/**
 * vhost is parsed from the URI's path. amqp://localhost uses the default
 * vhost, while amqp://localhost/ uses the vhost "". Strange.
 *
 * @param uri The URI to extract a vhost from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with options added.
 */
const appendVhost = (rawUri: string, appending: AmqpOptions): AmqpOptions => {
  const maybeMatches = /^.+:\/\/[^/]*\/([\w\d-.~%]*)$/.exec(rawUri);

  if (isNullOrUndefined(maybeMatches)) {
    return appending;
  }

  const vhost = decodeURIComponent(maybeMatches[1]);

  return {
    ...appending,
    vhost,
  };
};

/**
 * @param uri The URI to extract a password from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with password added.
 */
const appendPass =
  (uri: Uri) =>
  (options: AmqpOptions): AmqpOptions => {
    if (
      isNullOrUndefined(uri.authority) ||
      isNullOrUndefined(uri.authority.userInfo) ||
      isNullOrUndefined(uri.authority.userInfo.pass)
    ) {
      return options;
    }

    return {
      ...options,
      password: uri.authority.userInfo.pass,
    };
  };

/**
 * @param uri The URI to extract a port number from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with port number added.
 */
const appendPort =
  (uri: Uri) =>
  (options: AmqpOptions): AmqpOptions => {
    if (
      isNullOrUndefined(uri.authority) ||
      isNullOrUndefined(uri.authority.port)
    ) {
      return options;
    }

    return {
      ...options,
      port: uri.authority.port,
    };
  };

/**
 * @param uri The URI to extract a username from.
 * @param appending The object to use as default.
 * @returns A shallow copy of `appending` with username added.
 */
const appendUser =
  (uri: Uri) =>
  (options: AmqpOptions): AmqpOptions => {
    if (
      isNullOrUndefined(uri.authority) ||
      isNullOrUndefined(uri.authority.userInfo)
    ) {
      return options;
    }

    return {
      ...options,
      username: uri.authority.userInfo.user,
    };
  };
