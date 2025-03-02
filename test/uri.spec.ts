// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import * as Errors from "../src/errors";
import * as Uri from "../src/uri";

import { describe, it, expect } from 'bun:test'

/* tslint:disable:no-hardcoded-credentials */

describe("Celery.Uri.getScheme", () => {
  it("should parse typical schema", () => {
    expectParseToEqual("amqp://h", Uri.Scheme.Amqp);
    expectParseToEqual("amqps://h", Uri.Scheme.AmqpSecure);
    expectParseToEqual("redis://h", Uri.Scheme.Redis);
    expectParseToEqual("redis+socket://h", Uri.Scheme.RedisSocket);
    expectParseToEqual("rediss://h", Uri.Scheme.RedisSecure);
    expectParseToEqual("rediss+socket://h", Uri.Scheme.RedisSocketSecure);
    expectParseToEqual("sentinel://h", Uri.Scheme.RedisSentinel);
    expectParseToEqual("sentinels://h", Uri.Scheme.RedisSentinelSecure);

    expectParseToEqual("amqp://hostname", Uri.Scheme.Amqp);
    expectParseToEqual("amqps://username@hostname", Uri.Scheme.AmqpSecure);
    expectParseToEqual("redis://:password@hostname", Uri.Scheme.Redis);
    expectParseToEqual(
      "redis+socket:///usr/local/bin:",
      Uri.Scheme.RedisSocket,
    );
    expectParseToEqual("rediss:/hostname/3", Uri.Scheme.RedisSecure);
    expectParseToEqual(
      "rediss+socket://temp/redis.sock?password=password",
      Uri.Scheme.RedisSocketSecure,
    );
    expectParseToEqual("sentinel://host/0", Uri.Scheme.RedisSentinel);
    expectParseToEqual(
      "sentinels://hostname:65535/12",
      Uri.Scheme.RedisSentinelSecure,
    );
  });

  it("should ignore the case of the schema to parse", () => {
    expectParseToEqual("AmQp://h", Uri.Scheme.Amqp);
    expectParseToEqual("AMQPS://h", Uri.Scheme.AmqpSecure);
    expectParseToEqual("REDis://h", Uri.Scheme.Redis);
    expectParseToEqual("redIS+soCkET://h", Uri.Scheme.RedisSocket);
    expectParseToEqual("redisS://h", Uri.Scheme.RedisSecure);
    expectParseToEqual("rediss+socket://h", Uri.Scheme.RedisSocketSecure);
    expectParseToEqual("SENTINEL://h", Uri.Scheme.RedisSentinel);
    expectParseToEqual("sEnTiNeLs://h", Uri.Scheme.RedisSentinelSecure);
  });

  it("should throw if it detects an invalid scheme", () => {
    expectParseToThrow("http://h", Errors.ParseError);
    expectParseToThrow("ftp://h", Errors.ParseError);
    expectParseToThrow("imap://h", Errors.ParseError);
    expectParseToThrow("chrome-extension://h", Errors.ParseError);
    expectParseToThrow("https://h", Errors.ParseError);
  });

  const expectParseToEqual = (uri: string, expected: Uri.Scheme) => {
    expect(Uri.getScheme(uri)).toStrictEqual(expected);
  };

  const expectParseToThrow = (uri: string, ...rest: Array<any>) => {
    expect(() => Uri.getScheme(uri)).toThrow(...rest);
  };
});

describe("Celery.Uri.parseUri", () => {
  it("should parse typical URIs", () => {
    expectParseToEqual("https://google.com", {
      authority: { host: "google.com" },
      path: "/",
      raw: "https://google.com",
      scheme: "https",
    });

    expectParseToEqual("http://mary.sue:securepassword@127.0.0.1:22", {
      authority: {
        host: "127.0.0.1",
        port: 22,
        userInfo: {
          pass: "securepassword",
          user: "mary.sue",
        },
      },
      path: "/",
      raw: "http://mary.sue:securepassword@127.0.0.1:22",
      scheme: "http",
    });

    expectParseToEqual("redis://:super%20secure@localhost/0", {
      authority: {
        host: "localhost",
        userInfo: {
          pass: "super secure",
          user: "",
        },
      },
      path: "/0",
      raw: "redis://:super%20secure@localhost/0",
      scheme: "redis",
    });
  });

  it("should parse the host and scheme case-insensitively", () => {
    expectParseToEqual("S:", { path: "", raw: "S:", scheme: "s" });
    expectParseToEqual("SChEmE:", {
      path: "",
      raw: "SChEmE:",
      scheme: "scheme",
    });
    expectParseToEqual("s://HOST", {
      authority: {
        host: "host",
      },
      path: "/",
      raw: "s://HOST",
      scheme: "s",
    });
    expectParseToEqual("s://HOST.name", {
      authority: {
        host: "host.name",
      },
      path: "/",
      raw: "s://HOST.name",
      scheme: "s",
    });
  });

  it("should not parse invalid schemes", () => {
    expectParseToThrow("_://localhost", Errors.ParseError);
    expectParseToThrow("~://localhost", Errors.ParseError);
    expectParseToThrow("+://localhost", Errors.ParseError);
    expectParseToThrow("-://localhost", Errors.ParseError);
    expectParseToThrow("a_://localhost", Errors.ParseError);
    expectParseToThrow("a~://localhost", Errors.ParseError);
    expectParseToThrow("+ab://localhost", Errors.ParseError);
  });

  it("should not parse invalid hostnames", () => {
    expectParseToThrow("s://.", Errors.ParseError);
    expectParseToThrow("s://h.", Errors.ParseError);
    expectParseToThrow("s://.h", Errors.ParseError);
    expectParseToThrow("s://h-", Errors.ParseError);
    expectParseToThrow("s://-h", Errors.ParseError);
    expectParseToThrow("s://h.n-", Errors.ParseError);
    expectParseToThrow("s://h-n.", Errors.ParseError);
  });

  it("should parse valid queries", () => {
    expectParseToEqual("s://h?key=value", {
      authority: { host: "h" },
      path: "/",
      query: { key: "value" },
      raw: "s://h?key=value",
      scheme: "s",
    });

    expectParseToEqual("s://h?key=value&key=value2", {
      authority: { host: "h" },
      path: "/",
      query: { key: ["value", "value2"] },
      raw: "s://h?key=value&key=value2",
      scheme: "s",
    });

    expectParseToEqual("s://h?key=", {
      authority: { host: "h" },
      path: "/",
      query: { key: "" },
      raw: "s://h?key=",
      scheme: "s",
    });
  });

  it("should not parse invalid queries", () => {
    expectParseToThrow("s://h?query =value", Errors.ParseError);
    expectParseToThrow("s://h?q=&", Errors.ParseError);
    expectParseToThrow("s://h?=value", Errors.ParseError);
  });

  it("should not parse invalid ports", () => {
    expectParseToThrow("s://h:0x100", Errors.ParseError);
    expectParseToThrow("s://h:0b100", Errors.ParseError);
    expectParseToThrow("s://h:0B100", Errors.ParseError);

    expectParseToThrow("s://h:-100", Errors.ParseError);
    expectParseToThrow("s://h:-1", Errors.ParseError);
    expectParseToThrow("s://h:65536", Errors.ParseError);
    expectParseToThrow("s://h:0x10000", Errors.ParseError);
    expectParseToThrow("s://h:0200000", Errors.ParseError);
    expectParseToThrow("s://h:2147483647", Errors.ParseError);

    expectParseToThrow("s://h:1.0", Errors.ParseError);
    expectParseToThrow("s://h:65536.0", Errors.ParseError);
    expectParseToThrow("s://h:65535.1", Errors.ParseError);
  });

  const expectParseToEqual = (uri: string, expected: Uri.Uri) => {
    expect(Uri.parseUri(uri)).toStrictEqual(expected);
  };

  const expectParseToThrow = (uri: string, ...rest: Array<any>) => {
    expect(() => Uri.parseUri(uri)).toThrow(...rest);
  };
});
