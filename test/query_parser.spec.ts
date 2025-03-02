// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import {
  QueryParser,
  asArray,
  asScalar,
  createBooleanQueryDescriptor,
  createIntegerQueryDescriptor,
} from "../src/query_parser";
import type { Queries } from "../src/uri";
import { parseBoolean, parseInteger } from "../src/utility";

import { describe, it, expect } from 'bun:test'

describe("Celery.QueryParser.QueryParser", () => {
  interface A {
    foo?: number;
    bar?: boolean;
  }

  const queries: Queries = {
    baz: "10",
    qux: "false",
  };

  it("should work", () => {
    const parser = new QueryParser<A>([
      {
        parser: (x) => parseInteger(asScalar(x)),
        source: "baz",
        target: "foo",
      },
      {
        parser: (x) => parseBoolean(asScalar(x)),
        source: "qux",
        target: "bar",
      },
    ]);

    expect(parser.parse(queries, {})).toStrictEqual({
      bar: false,
      foo: 10,
    });
  });

  it("should work with create*QueryDescriptor and co.", () => {
    const parser = new QueryParser<A>([
      createIntegerQueryDescriptor("baz", "foo"),
      createBooleanQueryDescriptor("qux", "bar"),
    ]);

    expect(parser.parse(queries, {})).toStrictEqual({
      bar: false,
      foo: 10,
    });
  });

  it("should default the map target", () => {
    interface B {
      baz?: number;
      qux?: boolean;
    }

    const parser = new QueryParser<B>([
      { parser: (x) => parseInteger(asScalar(x)), source: "baz" },
      { parser: (x) => parseBoolean(asScalar(x)), source: "qux" },
    ]);

    expect(parser.parse(queries, {})).toStrictEqual({
      baz: 10,
      qux: false,
    });
  });

  it("should default to identity mapping", () => {
    interface C {
      foo?: string;
      bar?: string;
    }

    const parser = new QueryParser<C>([
      { source: "baz", target: "foo" },
      { source: "qux", target: "bar" },
    ]);

    expect(parser.parse(queries, {})).toStrictEqual({
      bar: "false",
      foo: "10",
    });
  });

  it("should default target as source and identity mapping", () => {
    interface D {
      baz?: string;
      qux?: string;
    }

    const parser = new QueryParser<D>([{ source: "baz" }, { source: "qux" }]);

    expect(parser.parse(queries, {})).toStrictEqual({
      baz: "10",
      qux: "false",
    });
  });

  it("should have no trouble with undefined values", () => {
    const parser = new QueryParser<A>([
      createIntegerQueryDescriptor("baz", "foo"),
      createBooleanQueryDescriptor("qux", "bar"),
    ]);

    expect(parser.parse({ baz: "10" }, {})).toStrictEqual({ foo: 10 });
  });
});

describe("Celery.QueryParser.asScalar", () => {
  it("should forward scalars", () => {
    const num = 15;
    const str = "foo";
    const obj = { foo: 10 };

    expect(asScalar(num)).toEqual(15);
    expect(asScalar(str)).toEqual("foo");
    expect(asScalar(obj)).toEqual(obj);
  });

  it("should pop off arrays", () => {
    const num = [15];
    const str = ["foo", "bar"];
    const obj = [{ foo: 10 }, { foo: 15 }, { foo: 20 }];

    expect(asScalar(num)).toEqual(num[0]);
    expect(asScalar(str)).toEqual(str[1]);
    expect(asScalar(obj)).toEqual(obj[2]);
  });
});

describe("Celery.QueryParser.asArray", () => {
  it("should convert scalars", () => {
    const num = 15;
    const str = "foo";
    const obj = { foo: 10 };

    expect(asArray(num)).toStrictEqual([15]);
    expect(asArray(str)).toStrictEqual(["foo"]);
    expect(asArray(obj)).toStrictEqual([obj]);
  });

  it("should forward arrays", () => {
    const num = [15];
    const str = ["foo", "bar"];
    const obj = [{ foo: 10 }, { foo: 15 }, { foo: 20 }];

    expect(asArray(num)).toStrictEqual(num);
    expect(asArray(str)).toStrictEqual(str);
    expect(asArray(obj)).toStrictEqual(obj);
  });
});
