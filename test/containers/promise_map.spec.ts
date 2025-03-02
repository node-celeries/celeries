// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { PromiseMap } from "../../src/containers";

import { describe, it, expect } from "bun:test";

describe("Celery.Containers.PromiseMap", () => {
  it("should register promises when getting them", () => {
    const map = new PromiseMap<string, { data: number }>();

    const value = { data: 15 };
    const num = map.get("foo");
    expect(map.has("foo")).toEqual(true);
    expect(map.isPending("foo")).toEqual(true);
    expect(map.resolve("foo", value)).toEqual(false);

    return num.then((v) => {
      expect(map.isFulfilled("foo")).toEqual(true);
      expect(v).toEqual(value);
    });
  });

  it("should register promises when settling them", () => {
    const map = new PromiseMap<string, { data: number }>();

    const value = { data: 10 };
    expect(map.resolve("foo", value)).toEqual(true);
    expect(map.has("foo")).toEqual(true);
    expect(map.isPending("foo")).toEqual(true);
    const num = map.get("foo");

    return num.then((v) => {
      expect(map.isFulfilled("foo")).toEqual(true);
      expect(v).toEqual(value);
    });
  });

  it("should properly reject unregistered promises", () => {
    const map = new PromiseMap<string, void>();

    const error = new Error("error");

    expect(map.reject("foo", error)).toEqual(true);
    expect(map.has("foo")).toEqual(true);
    expect(map.isRejected("foo")).toEqual(true);
    const num = map.get("foo");

    return num.catch((reason) => {
      expect(map.isRejected("foo")).toEqual(true);
      expect(reason).toEqual(error);
    });
  });

  it("should reject registered promises", () => {
    const map = new PromiseMap<string, void>();

    const error = new Error("error");

    const num = map.get("foo");
    expect(map.reject("foo", error)).toEqual(false);
    expect(map.has("foo")).toEqual(true);
    expect(map.isRejected("foo")).toEqual(true);

    return num.catch((reason) => {
      expect(map.isRejected("foo")).toEqual(true);
      expect(reason).toEqual(error);
    });
  });

  it("should overwrite settled Promises with #resolve", async () => {
    const map = new PromiseMap<string, number>();
    map.resolve("foo", 5);

    expect(await map.get("foo")).toEqual(5);

    map.resolve("foo", 10);

    expect(await map.get("foo")).toEqual(10);
  });

  it("should overwrite settled Promises with #reject", async () => {
    const map = new PromiseMap<string, number>();
    map.resolve("foo", 5);

    const error = new Error("foo");
    map.reject("foo", error);

    expect(map.get("foo")).rejects.toEqual(error);
  });

  it("should delete promises as expected", () => {
    const map = new PromiseMap<string, number>();
    const value = map.get("foo");

    expect(map.delete("foo")).toEqual(true);
    expect(map.delete("foo")).toEqual(false);

    expect(map.has("foo")).toEqual(false);

    return value.catch(() => expect(true).toEqual(true));
  });

  it("should not reject settled promises in rejectAll", () => {
    const map = new PromiseMap<string, number>();
    map.resolve("foo", 15);

    const error = new Error("rejected");

    const value = map.get("bar");
    map.rejectAll(error);

    return value
      .catch((e) => {
        expect(e).toEqual(error);
        expect(map.has("bar")).toEqual(true);

        return map.get("foo");
      })
      .then((foo) => {
        expect(foo).toEqual(15);
        expect(map.has("foo")).toEqual(true);
      });
  });

  it("should delete registered promises with clear", () => {
    const map = new PromiseMap<string, number>();
    map.resolve("foo", 10);
    map.resolve("bar", 5);

    map.clear();

    map.resolve("baz", 25);

    expect(map.delete("foo")).toEqual(false);
    expect(map.delete("bar")).toEqual(false);
    expect(map.delete("baz")).toEqual(true);
  });

  it("should reject pending promises with #clear", async () => {
    const map = new PromiseMap<string, number>();
    map.resolve("foo", 0);
    const bar = map.get("bar");

    map.clear();

    expect(map.has("foo")).toEqual(false);
    expect(map.has("bar")).toEqual(false);

    expect(bar).rejects.toHaveProperty("message", "cleared")
  });

  it("should handle timeouts as expected", () => {
    const map = new PromiseMap<string, number>(10);

    const request = map.get("foo");

    return new Promise((resolve) => {
      setTimeout(resolve, 5);
    })
      .then(() => {
        map.resolve("foo", 5);

        return request;
      })
      .then((value) => {
        expect(value).toEqual(5);

        return new Promise((resolve) => {
          setTimeout(resolve, 15);
        });
      })
      .then(() => {
        expect(map.has("foo")).toEqual(false);
      });
  });

  it("should reject rejecting promises", () => {
    const map = new PromiseMap<string, number>();

    const error = new Error("bar");

    map.resolve("foo", Promise.reject(error));
    expect(map.has("foo")).toEqual(true);
    expect(map.isPending("foo")).toEqual(true);

    return map.get("foo").catch((reason) => {
      expect(map.isRejected("foo")).toEqual(true);
      expect(reason).toEqual(error);
    });
  });

  it("should reject rejecting promises that have been created", () => {
    const map = new PromiseMap<string, number>();

    const value = map.get("foo");

    expect(map.has("foo")).toEqual(true);
    expect(map.isPending("foo")).toEqual(true);

    const error = new Error("bar");
    map.resolve("foo", Promise.reject(error));

    expect(map.has("foo")).toEqual(true);
    expect(map.isPending("foo")).toEqual(true);

    return value
      .then(() => {
        expect(false);
      })
      .catch((reason) => {
        expect(map.isRejected("foo")).toEqual(true);
        expect(reason).toEqual(error);
      });
  });
});
