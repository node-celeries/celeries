// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import type * as Options from "../../src/amqp/options";
import * as Uri from "../../src/amqp/uri";

import { describe, it, expect } from 'bun:test'

/* tslint:disable:no-hardcoded-credentials no-big-function */

describe("Celery.Amqp.Uri.parse", () => {
  it("should parse basic URIs", () => {
    assertParse("amqp://localhost", {
      hostname: "localhost",
      protocol: "amqp",
    });

    assertParse("amqp://user:pass@host:42/vhost", {
      hostname: "host",
      password: "pass",
      port: 42,
      protocol: "amqp",
      username: "user",
      vhost: "vhost",
    });

    assertParse("amqps://localhost", {
      hostname: "localhost",
      protocol: "amqps",
    });

    assertParse("amqps://user:pass@host:42/vhost", {
      hostname: "host",
      password: "pass",
      port: 42,
      protocol: "amqps",
      username: "user",
      vhost: "vhost",
    });
  });

  it("should parse sparse URIs", () => {
    assertParse("amqp://:@h/", {
      hostname: "h",
      protocol: "amqp",
      vhost: "",
    });

    assertParse("amqp://username:@h/", {
      hostname: "h",
      protocol: "amqp",
      username: "username",
      vhost: "",
    });

    assertParse("amqp://:password@h/", {
      hostname: "h",
      password: "password",
      protocol: "amqp",
      username: "",
      vhost: "",
    });

    assertParse("amqp://:@h/vhost", {
      hostname: "h",
      protocol: "amqp",
      vhost: "vhost",
    });
  });

  it("should parse valid hostnames", () => {
    assertParse("amqp://h.name", {
      hostname: "h.name",
      protocol: "amqp",
    });

    assertParse("amqp://host-n", {
      hostname: "host-n",
      protocol: "amqp",
    });

    assertParse("amqp://h.n", {
      hostname: "h.n",
      protocol: "amqp",
    });

    assertParse(
      "amqp://thisuriislongbutwecanstillmatchagainstitbecauseithas63orles" +
        "scha.thisuriislongbutwecanstillmatchagainstitbecauseithas63orles" +
        "scha",
      {
        hostname:
          "thisuriislongbutwecanstillmatchagainstitbecauseithas" +
          "63orlesscha.thisuriislongbutwecanstillmatchagainst" +
          "itbecauseithas63orlesscha",
        protocol: "amqp",
      },
    );

    assertParse("amqp://0", {
      hostname: "0",
      protocol: "amqp",
    });

    assertParse("amqp://00", {
      hostname: "00",
      protocol: "amqp",
    });
  });

  it("should not parse invalid hostnames", () => {
    assertParseThrows("amqp://"); // uris do not have empty hostnames

    assertParseThrows("amqp://-");
    assertParseThrows("amqp://f-");
    assertParseThrows("amqp://-f");
    assertParseThrows("amqp://-f-");

    assertParseThrows("amqp://.");
    assertParseThrows("amqp://f.");
    assertParseThrows("amqp://.f");
    assertParseThrows("amqp://.f.");

    assertParseThrows(
      "amqp://thisuriistoolongbecauseithas64charactersandi" +
        "wontcutmyselfoffagai.thisuriislongbutwecanstill" +
        "matchagainstitbecauseithas63orlesscha",
    );
    assertParseThrows(
      "amqp://thisuriislongbutwecanstillmatchagainstit" +
        "becauseithas63orlesscha.thisuriistoolongbecauseit" +
        "has64charactersandiwontcutmyselfoffagai",
    );

    assertParseThrows("amqp://ß"); // no UTF for hostnames :(

    assertParseThrows("amqp://host?foo bar=baz qux");

    const RESERVED: Array<string> = [
      "!",
      "*",
      "'",
      "(",
      ")",
      ";",
      ":",
      "@",
      "&",
      "=",
      "+",
      "$",
      ",",
      "/",
      "?",
      "#",
      "[",
      "]",
    ];

    for (const c of RESERVED) {
      assertParseThrows(`amqp://${c}`);
    }
  });

  it("should parse queries in snake_case and camelCase", () => {
    assertParse("amqp://h?channelMax=5555", {
      channelMax: 5555,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?channel_max=0x2a", {
      channelMax: 0x2a,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?frameMax=0x1000", {
      frameMax: 0x1000,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?frame_max=4096", {
      frameMax: 4096,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?heartbeat=5", {
      heartbeat: 5,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?heartbeat=0x0", {
      heartbeat: 0x0,
      hostname: "h",
      protocol: "amqp",
    });

    assertParse("amqp://h?locale=en_UK", {
      hostname: "h",
      locale: "en_UK",
      protocol: "amqp",
    });

    assertParse(
      "amqp://h?locale=en_US&heartbeat=13&frame_max=0x1000&channelMax=15",
      {
        channelMax: 15,
        frameMax: 0x1000,
        heartbeat: 13,
        hostname: "h",
        locale: "en_US",
        protocol: "amqp",
      },
    );

    assertParse("amqp://localhost?unused=&frameMax=0b111", {
      frameMax: 7,
      hostname: "localhost",
      protocol: "amqp",
    });
  });

  it("should not parse ill-formed queries", () => {
    assertParseThrows("amqp://?");
    assertParseThrows("amqp://?=");
    assertParseThrows("amqp://?&=");
    assertParseThrows("amqp://?key=value&");
    assertParseThrows("amqp://?&");
    assertParseThrows("amqp://?/");
    assertParseThrows("amqp://?key=");
    assertParseThrows("amqp://?=value");
    assertParseThrows("amqp://?key=value&key=");
    assertParseThrows("amqp://?key=value&=value");
    assertParseThrows("amqp://?key=value&=");
  });

  it("should not parse URIs with non-AMQP schemes", () => {
    assertParseThrows("redis://localhost");
    assertParseThrows("rediss://localhost");
  });

  const assertParse = (uri: string, expected: Options.AmqpOptions) =>
    expect(Uri.parseAmqpUri(uri)).toStrictEqual(expected);

  const assertParseThrows = (uri: string) =>
    expect(() => Uri.parseAmqpUri(uri)).toThrow(Error);
});
