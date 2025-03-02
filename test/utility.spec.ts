// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import * as Errors from "../src/errors";
import * as Utility from "../src/utility";

import * as Events from "events";

import { noop } from 'cosmokit'

import { describe, it, expect } from "bun:test";

describe("Celery.Utility.parseInteger", () => {
  it("should parse base-2, 8, 10, and 16 literals", () => {
    expect(Utility.parseInteger("1")).toStrictEqual(1);
    expect(Utility.parseInteger("15")).toStrictEqual(15);
    expect(Utility.parseInteger("8")).toStrictEqual(8);

    expect(Utility.parseInteger("0")).toStrictEqual(0);
    expect(Utility.parseInteger("0666")).toStrictEqual(438);
    expect(Utility.parseInteger("010")).toStrictEqual(8);

    expect(Utility.parseInteger("0xdeadBEEF")).toStrictEqual(3735928559);
    expect(Utility.parseInteger("0X5")).toStrictEqual(5);
    expect(Utility.parseInteger("0x01ab")).toStrictEqual(427);

    expect(Utility.parseInteger("0b1111")).toStrictEqual(15);
    expect(Utility.parseInteger("0B0101")).toStrictEqual(5);
    expect(Utility.parseInteger("0B0")).toStrictEqual(0);
  });

  it("should trim whitespace from literals", () => {
    expect(Utility.parseInteger(" 42")).toStrictEqual(42);
    expect(Utility.parseInteger("42\t")).toStrictEqual(42);
    expect(Utility.parseInteger("\t42\n")).toStrictEqual(42);
  });

  it("should not parse ill formed literals", () => {
    expect(() => Utility.parseInteger("0x")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("0xg")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("0XG")).toThrow(Errors.ParseError);

    expect(() => Utility.parseInteger("08")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("09")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("0a")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("0f")).toThrow(Errors.ParseError);

    expect(() => Utility.parseInteger("0b2")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("0b9")).toThrow(Errors.ParseError);

    expect(() => Utility.parseInteger("a")).toThrow(Errors.ParseError);
    expect(() => Utility.parseInteger("f")).toThrow(Errors.ParseError);

    expect(() => Utility.parseInteger("foo")).toThrow(Errors.ParseError);
  });
});

describe("Celery.Utility.parseBoolean", () => {
  it("should parse expected strings as booleans", () => {
    expect(Utility.parseBoolean("true")).toStrictEqual(true);
    expect(Utility.parseBoolean("on")).toStrictEqual(true);
    expect(Utility.parseBoolean("yes")).toStrictEqual(true);
    expect(Utility.parseBoolean("1")).toStrictEqual(true);

    expect(Utility.parseBoolean("false")).toStrictEqual(false);
    expect(Utility.parseBoolean("off")).toStrictEqual(false);
    expect(Utility.parseBoolean("no")).toStrictEqual(false);
    expect(Utility.parseBoolean("0")).toStrictEqual(false);
  });

  it("should not parse invalid inputs", () => {
    expect(() => Utility.parseBoolean("")).toThrow(Errors.ParseError);
    expect(() => Utility.parseBoolean("foo")).toThrow(Errors.ParseError);
    expect(() => Utility.parseBoolean("2")).toThrow(Errors.ParseError);
  });
});

describe("Celery.Utility.isNullOrUndefined", () => {
  it("should return true if the value is null", () => {
    expect(Utility.isNullOrUndefined(null)).toEqual(true);
  });

  it("should return true if the value is undefined", () => {
    expect(Utility.isNullOrUndefined(undefined)).toEqual(true);
  });

  it("should return false if the value is truthy", () => {
    expect(Utility.isNullOrUndefined(1)).toEqual(false);
    expect(Utility.isNullOrUndefined("a")).toEqual(false);
    expect(Utility.isNullOrUndefined(true)).toEqual(false);
    expect(Utility.isNullOrUndefined([])).toEqual(false);
    expect(Utility.isNullOrUndefined({})).toEqual(false);
  });

  it("should return false if the value is falsy but not null", () => {
    expect(Utility.isNullOrUndefined(0)).toEqual(false);
    expect(Utility.isNullOrUndefined("")).toEqual(false);
    expect(Utility.isNullOrUndefined(Number.NaN)).toEqual(false);
    expect(Utility.isNullOrUndefined(false)).toEqual(false);
  });
});

describe("Celery.Utility.toCamelCase", () => {
  it("should convert snake_case to camelCase", () => {
    expect(Utility.toCamelCase("foo_bar")).toEqual("fooBar");
  });

  it("should not modify camelCase statements", () => {
    expect(Utility.toCamelCase("fooBar")).toEqual("fooBar");
  });
});

describe("Celery.Utility.promisifyEvent", () => {
  it("should only resolve when the event is emitted", () => {
    const emitter = new Events.EventEmitter();
    let emitted = false;

    const event = Utility.promisifyEvent<void>(emitter, "foo");

    setImmediate(() => {
      emitter.emit("foo");
      emitted = true;
    });

    return event.then(() => {
      expect(emitted).toBe(true);
    });
  });

  it("should transmit the argument passed", () => {
    const emitter = new Events.EventEmitter();
    let emitted = false;

    const event = Utility.promisifyEvent(emitter, "foo");

    setImmediate(() => {
      emitter.emit("foo", 42);
      emitted = true;
    });

    return event.then((value) => {
      expect(value).toBe(42);
      expect(emitted).toBe(true);
    });
  });

  it("should not resolve on other events being emitted", () => {
    const emitter = new Events.EventEmitter();
    let emitted = false;

    const event = Utility.promisifyEvent(emitter, "foo");

    setTimeout(() => emitter.emit("bar"), 5);
    setTimeout(() => {
      emitter.emit("foo");
      emitted = true;
    }, 10);

    expect(event.then(() => emitted)).resolves.toBe(true);
  });

  it("should work with Symbol values", () => {
    const emitter = new Events.EventEmitter();
    const symbol = Symbol("foo");

    const event = Utility.promisifyEvent(emitter, symbol);

    setImmediate(() => {
      emitter.emit(symbol);
    });

    return event;
  });
});

describe("Celery.Utility.filterMapEvent", () => {
  it("should only resolve when the filter is true", () => {
    const emitter = new Events.EventEmitter();
    let shouldResolve = false;

    const event = Utility.filterMapEvent({
      emitter,
      filterMap(value: number): number | undefined {
        if (shouldResolve) {
          return value * 2;
        }

        return undefined;
      },
      name: "foo",
    });

    setTimeout(() => {
      emitter.emit("foo", 3);
    }, 5);

    setTimeout(() => {
      shouldResolve = true;
      emitter.emit("foo", 15);
    }, 10);

    expect(event).resolves.toBe(30);
  });
});

describe("Celery.Utility.createTimeoutPromise", () => {
  it("should resolve if the input resolves", async () => {
    const promise = Promise.resolve(5);

    expect(Utility.createTimeoutPromise(promise, 5)).resolves.toBe(5)
  });

  it("should reject upon a timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 10));

    await Promise.allSettled([promise]).catch(noop)

    expect(Utility.createTimeoutPromise(promise, 5)).rejects.pass()
  });

  it("should resolve before the timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 5));

    expect(Utility.createTimeoutPromise(promise, 10)).resolves.pass;
  });

  it("should reject if the other promise will reject", async () =>
    expect(Utility.createTimeoutPromise(Promise.reject(5), 5)).rejects.toBe(5)
  );

  it("should follow the promise if the timeout is undefined", async () =>
    expect(Utility.createTimeoutPromise(Promise.resolve(5))).resolves.toBe(5)
  );
});

describe("Celery.Utility.createTimerPromise", () => {
  it("should reject in the given time", () => {
    let firstResolved = false;
    let secondResolved = false;

    setTimeout(() => {
      firstResolved = true;
    }, 5);
    setTimeout(() => {
      secondResolved = true;
    }, 15);

    return Utility.createTimerPromise(10)
      .then(() => {
        expect().fail();
      })
      .catch(() => {
        expect(firstResolved).toBe(true);
        expect(secondResolved).toBe(false);
      });
  });
});
