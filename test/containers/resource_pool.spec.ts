// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { ResourcePool } from "../../src/containers";

import * as Chai from "chai";

import { describe, it, expect } from 'bun:test'

describe("Celery.Containers.ResourcePool", () => {
  interface A {
    destroyed: boolean;
    value: number;
  }

  const createPool = () => {
    let value = 0;

    return new ResourcePool<A>(
      () => ({ destroyed: false, value: value++ }),
      (resource) => {
        resource.destroyed = true;
        ++destroyedCount;

        return "destroyed";
      },
      4,
    );
  };

  let destroyedCount = 0;

  it("should return resources in FIFO order", async () => {
    const count = destroyedCount;
    const pool = createPool();

    return Promise.all([pool.get(), pool.get(), pool.get()])
      .then(([first, second, third]) => {
        expect(destroyedCount).toStrictEqual(count);

        pool.return(second);
        pool.return(first);
        pool.return(third);
      })
      .then(() => Promise.all([pool.get(), pool.get(), pool.get()]))
      .then(async ([first, second, third]) => {
        expect(first.value).toStrictEqual(1);
        expect(second.value).toStrictEqual(0);
        expect(third.value).toStrictEqual(2);

        pool.return(first);
        pool.return(second);
        pool.return(third);

        return pool.destroyAll().then((returns) => {
          expect(returns).toStrictEqual([
            "destroyed",
            "destroyed",
            "destroyed",
          ]);
          expect(destroyedCount).toStrictEqual(count + 3);

          expect(first.destroyed).toStrictEqual(true);
          expect(second.destroyed).toStrictEqual(true);
          expect(third.destroyed).toStrictEqual(true);
        });
      })
      .catch(() => expect(false).toStrictEqual(true));
  });

  it("should wait to destroy in-use resources", async () => {
    const pool = createPool();

    return Promise.all([pool.get(), pool.get(), pool.get()]).then(
      async ([first, second, third]) => {
        const responses = pool.destroyAll();
        let returned = false;

        pool.return(first);

        setImmediate(() => {
          pool.return(second);
          pool.return(third);

          expect(first.destroyed).toStrictEqual(false);
          expect(second.destroyed).toStrictEqual(false);
          expect(third.destroyed).toStrictEqual(false);

          returned = true;
        });

        expect(returned).toStrictEqual(false);

        expect(first.destroyed).toStrictEqual(false);
        expect(second.destroyed).toStrictEqual(false);
        expect(third.destroyed).toStrictEqual(false);

        expect(responses
          .then((returns) => {
            expect(returns).toStrictEqual([
              "destroyed",
              "destroyed",
              "destroyed",
            ]);
            expect(returned).toStrictEqual(true);

            expect(first.destroyed).toStrictEqual(true);
            expect(second.destroyed).toStrictEqual(true);
            expect(third.destroyed).toStrictEqual(true);
          })).resolves.toBeUndefined();
      },
    );
  });

  it("should throw if an unowned resource is returned", async () => {
    const pool = createPool();

    const a: A = {
      destroyed: false,
      value: 0,
    };

    expect(() => pool.return(a)).toThrow(Error);

    return pool.get().then((first) => {
      expect(() => pool.return(a)).toThrow(Error);
      pool.return(first);

      return pool.destroyAll();
    });
  });

  it("should #returnAfter with a Promise that fulfills", async () => {
    const pool = createPool();

    const promise = Promise.resolve(5);

    await pool
      .get()
      .then((a) => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(1);
        expect(pool.numUnused()).toStrictEqual(0);
        expect(a.value).toStrictEqual(0);

        return pool.returnAfter(promise, a);
      })
      .then(() => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(0);
        expect(pool.numUnused()).toStrictEqual(1);

        return pool.get();
      })
      .then((a) => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(1);
        expect(pool.numUnused()).toStrictEqual(0);
        expect(a.value).toStrictEqual(0);

        return pool.returnAfter(Promise.resolve(), a);
      });
  });

  it("should #returnAfter with a Promise that rejects", async () => {
    const pool = createPool();

    const error = new Error();
    const promise = Promise.reject(error);

    await pool
      .get()
      .then((a) => pool.returnAfter(promise, a))
      .catch((e) => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(0);
        expect(pool.numUnused()).toStrictEqual(1);
        expect(e).toStrictEqual(error);

        return pool.get();
      })
      .then((a) => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(1);
        expect(pool.numUnused()).toStrictEqual(0);
        expect(a.value).toStrictEqual(0);

        pool.return(a);
      });
  });

  it("should automatically return resources after #use", async () => {
    const pool = createPool();

    expect(pool.numOwned()).toStrictEqual(0);
    expect(pool.numInUse()).toStrictEqual(0);
    expect(pool.numUnused()).toStrictEqual(0);

    await pool
      .use(() => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(1);
        expect(pool.numUnused()).toStrictEqual(0);

        return;
      })
      .then(() => {
        expect(pool.numOwned()).toStrictEqual(1);
        expect(pool.numInUse()).toStrictEqual(0);
        expect(pool.numUnused()).toStrictEqual(1);
      });
  });

  it("should allow #use to work with throwing functions", async () => {
    const pool = createPool();

    expect(pool.numOwned()).toStrictEqual(0);
    expect(pool.numInUse()).toStrictEqual(0);
    expect(pool.numUnused()).toStrictEqual(0);

    const toThrow = new Error("foo");

    expect(pool.use(() => {
      expect(pool.numOwned()).toStrictEqual(1);
      expect(pool.numInUse()).toStrictEqual(1);
      expect(pool.numUnused()).toStrictEqual(0);

      throw toThrow;
    })).rejects.toBe(toThrow)

    expect(pool.numOwned()).toStrictEqual(1);
    expect(pool.numInUse()).toStrictEqual(0);
    expect(pool.numUnused()).toStrictEqual(1);
  });

  it("should not allocate more resources than are available", async () => {
    const pool = createPool();

    const first = pool.get();
    const second = pool.get();
    const third = pool.get();
    const fourth = pool.get();

    await Promise.all([first, second, third, fourth])
      .then((resources: Array<A>) => {
        expect(pool.numOwned()).toStrictEqual(4);
        expect(pool.numInUse()).toStrictEqual(4);
        expect(pool.numUnused()).toStrictEqual(0);

        const fifth = pool.get();
        const sixth = pool.get();

        const doReturn = () => resources.map((r) => pool.return(r));
        setTimeout(doReturn, 5);

        return Promise.all([fifth, sixth]);
      })
      .then((resources: Array<A>) => {
        expect(pool.numOwned()).toStrictEqual(4);
        expect(pool.numInUse()).toStrictEqual(2);
        expect(pool.numUnused()).toStrictEqual(2);

        expect(resources[0].value).toStrictEqual(0);
        expect(resources[1].value).toStrictEqual(1);
      });
  });
});
