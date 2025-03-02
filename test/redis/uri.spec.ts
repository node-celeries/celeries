// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import type * as BasicOptions from "../../src/redis/basic_options";
import * as Uri from "../../src/redis/uri";

import * as Errors from "../../src/errors";

import { describe, expect, it } from 'bun:test'

/* tslint:disable:no-hardcoded-credentials */

describe("Celery.Redis.Uri.Tcp.parse", () => {
  it("should parse the usual URIs", () => {
    expectParseToEqual("redis://localhost", {
      host: "localhost",
      protocol: "redis",
    });

    expectParseToEqual("rediss://:pass@host:6379/0?key=value&key=value", {
      db: 0,
      host: "host",
      password: "pass",
      port: 6379,
      protocol: "rediss",
    });

    expectParseToEqual("REDIS://host", {
      host: "host",
      protocol: "redis",
    });

    expectParseToEqual("ReDiSs://host", {
      host: "host",
      protocol: "rediss",
    });

    expectParseToEqual("redis://:password@localhost", {
      host: "localhost",
      password: "password",
      protocol: "redis",
    });
  });

  it("should parse queries", () => {
    expectParseToEqual("redis://localhost?noDelay=true", {
      host: "localhost",
      noDelay: true,
      protocol: "redis",
    });
    expectParseToEqual("redis://localhost?noDelay=off", {
      host: "localhost",
      noDelay: false,
      protocol: "redis",
    });

    expectParseToEqual("redis://localhost?no_delay=FALSE&irrelevant=", {
      host: "localhost",
      noDelay: false,
      protocol: "redis",
    });

    expectParseToEqual("redis://localhost?password=foo", {
      host: "localhost",
      password: "foo",
      protocol: "redis",
    });

    expectParseToEqual("redis://:foo@localhost?password=bar", {
      host: "localhost",
      password: "bar",
      protocol: "redis",
    });

    expectParseToEqual("redis://localhost?password=%2ffoo", {
      host: "localhost",
      password: "/foo",
      protocol: "redis",
    });
  });

  it("should not parse invalid URIs", () => {
    expectParseToThrow("amqp://localhost", Errors.ParseError);
    expectParseToThrow("redis://invalid_host", Errors.ParseError);
    expectParseToThrow("redis://host:badport", Errors.ParseError);
    expectParseToThrow("redis://host/baddb", Errors.ParseError);
    expectParseToThrow("redis://", Errors.ParseError);
  });

  const expectParseToEqual = (
    uri: string,
    expected: BasicOptions.BasicRedisTcpOptions,
  ) => expect(Uri.parseTcp(uri)).toStrictEqual(expected);

  const expectParseToThrow = (uri: string, ...rest: Array<any>) =>
    expect(() => Uri.parseTcp(uri)).toThrow(...rest);
});

describe("Celery.Redis.Uri.Socket.parse", () => {
  const PATH: string = "/var/redis.sock";
  const PROTOCOL: string = "redis+socket";
  const SECURE_PROTOCOL: string = "rediss+socket";

  it("should parse the usual URIs", () => {
    expectParseToEqual("redis+socket:///var/redis.sock", {
      path: PATH,
      protocol: PROTOCOL,
    });

    expectParseToEqual("rediss+socket:///VAR/REDIS.sock", {
      path: "/VAR/REDIS.sock",
      protocol: SECURE_PROTOCOL,
    });

    expectParseToEqual("redis+socket:////redis.sock", {
      path: "//redis.sock",
      protocol: PROTOCOL,
    });
  });

  it("should parse queries", () => {
    expectParseToEqual("redis+socket:///var/redis.sock?noDelay=true", {
      noDelay: true,
      path: PATH,
      protocol: PROTOCOL,
    });

    expectParseToEqual("redis+socket:///var/redis.sock?unused=&no_delay=OFF", {
      noDelay: false,
      path: PATH,
      protocol: PROTOCOL,
    });

    expectParseToEqual("redis+socket:///var/redis.sock?password=foo", {
      password: "foo",
      path: PATH,
      protocol: PROTOCOL,
    });

    expectParseToEqual(
      "redis+socket:///var/redis.sock?password=%2ffoo&noDelay=true",
      {
        noDelay: true,
        password: "/foo",
        path: PATH,
        protocol: PROTOCOL,
      },
    );
  });

  it("should not parse invalid URIs", () => {
    expectParseToThrow("redis://localhost", Errors.ParseError);
    expectParseToThrow("rediss://localhost", Errors.ParseError);
    expectParseToThrow("amqp://localhost", Errors.ParseError);
    expectParseToThrow("amqps://localhost", Errors.ParseError);
  });

  const expectParseToEqual = (
    uri: string,
    expected: BasicOptions.BasicRedisSocketOptions,
  ) => expect(Uri.parseSocket(uri)).toStrictEqual(expected);

  const expectParseToThrow = (uri: string, ...rest: Array<any>) =>
    expect(() => Uri.parseSocket(uri)).toThrow(...rest);
});
