// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { PromiseQueue } from "../../src/containers";

import { noop } from 'cosmokit'

import { describe, it, expect } from 'bun:test'

describe("Celery.Containers.PromiseQueue", () => {
  it("should #resolveOne in FIFO order", async () => {
    const queue = new PromiseQueue<number>();

    const first = queue.push();
    const second = queue.push();

    expect(queue.resolveOne(0)).toEqual(true);
    expect(queue.resolveOne(1)).toEqual(true);
    expect(queue.resolveOne(2)).toEqual(false);

    expect(await first).toEqual(0);
    expect(await second).toEqual(1);
  });

  it("should #rejectOne in FIFO order", async () => {
    const queue = new PromiseQueue<number>();

    const e1 = new Error("foo");
    const e2 = new Error("bar");

    const first = queue.push();
    const second = queue.push();

    expect(queue.rejectOne(e1)).toEqual(true);
    expect(queue.rejectOne(e2)).toEqual(true);
    expect(queue.rejectOne()).toEqual(false);

    await Promise.allSettled([first, second]).catch(noop)

    expect(first).rejects.toBe(e1)
    expect(second).rejects.toBe(e2)
  });

  it("should follow Promises in #resolveOne", async () => {
    const queue = new PromiseQueue<number>();

    const e = new Error("foo");

    const first = queue.push();
    const second = queue.push();

    expect(queue.resolveOne(Promise.resolve(0))).toEqual(true);
    expect(queue.resolveOne(Promise.reject(e))).toEqual(true);

    expect(await first).toEqual(0);

    expect(second).rejects.toEqual(e);
  });

  it("should #resolveAll", async () => {
    const queue = new PromiseQueue<number>();

    const first = queue.push();
    const second = queue.push();
    const third = queue.push();

    expect(queue.resolveAll(0)).toEqual(3);
    expect(await first).toEqual(0);
    expect(await second).toEqual(0);
    expect(await third).toEqual(0);
  });

  it("should #resolveAll with an empty queue", () => {
    const queue = new PromiseQueue<number>();

    expect(queue.resolveAll(0)).toEqual(0);
  });

  it("should #rejectAll", async () => {
    const queue = new PromiseQueue<number>();

    const first = queue.push();
    const second = queue.push();
    const third = queue.push();

    const e = new Error("foo");
    expect(queue.rejectAll(e)).toEqual(3);

    await Promise.allSettled([first, second, third]).catch(noop);

    expect(first).rejects.toEqual(e);
    expect(second).rejects.toEqual(e);
    expect(third).rejects.toEqual(e);
  });

  it("should #rejectAll with an empty queue", () => {
    const queue = new PromiseQueue<number>();

    expect(queue.rejectAll(new Error("foo"))).toEqual(0);
  });
});
