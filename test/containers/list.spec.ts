// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { List } from "../../src/containers";

import { describe, it, expect } from 'bun:test'

const expectIterableEqual = <T>(lhs: Iterable<T>, rhs: Iterable<T>) => {
  const first = lhs[Symbol.iterator]();
  const second = rhs[Symbol.iterator]();

  while (true) {
    const firstNext = first.next();
    const secondNext = second.next();

    expect(firstNext.done).toEqual(<boolean>secondNext.done);

    if (firstNext.done) {
      return;
    }

    expect(firstNext.value).toEqual(secondNext.value);
  }
};

describe("Celery.Containers.List", () => {
  it("should be empty by default", () => {
    const list = new List<number>();

    expect(list.length).toBe(0);
    expectIterableEqual([], list);
  });

  it("should be initialized by #from", () => {
    const init = [5, 4, 3, 2];
    const list = List.from(init);

    expect(list.length).toEqual(init.length);
    expectIterableEqual(init, list);
  });

  it("should be initialized by #of", () => {
    const init = [5, 4, 3, 2];
    const list = List.of(...init);

    expect(list.length).toEqual(init.length);
    expectIterableEqual(init, list);
  });

  it("should #push to the right", () => {
    const toPush = 3;
    const array: Array<number> = [];
    const list: List<number> = List.from(array);

    expect(list.push(toPush)).toEqual(array.push(toPush));

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #push multiple to the right", () => {
    const toPush = [3, 4, 5];
    const array: Array<number> = [];
    const list: List<number> = List.from(array);

    expect(list.push(...toPush)).toEqual(array.push(...toPush));

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #pop from the right", () => {
    const array: Array<number> = [0, 1, 2, 3];
    const list: List<number> = List.from(array);

    expect(list.pop()).toEqual(<number>array.pop());

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #pop multiple from the right", () => {
    const array = [0, 1, 2, 3];
    const list: List<number> = List.from(array);

    expect(list.pop()).toEqual(<number>array.pop());
    expect(list.pop()).toEqual(<number>array.pop());
    expect(list.pop()).toEqual(<number>array.pop());

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #unshift to the left", () => {
    const toUnshift = 3;
    const array: Array<number> = [];
    const list: List<number> = List.from(array);

    expect(list.unshift(toUnshift)).toEqual(
      array.unshift(toUnshift),
    );

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #unshift multiple to the left", () => {
    const toUnshift = [3, 4, 5];
    const array: Array<number> = [];
    const list: List<number> = List.from(array);

    expect(list.unshift(...toUnshift)).toEqual(
      array.unshift(...toUnshift),
    );

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #shift from the left", () => {
    const array = [0, 1, 2, 3];
    const list: List<number> = List.from(array);

    expect(list.shift()).toEqual(<number>array.shift());

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should #shift multiple from the left", () => {
    const array = [0, 1, 2, 3];
    const list: List<number> = List.from(array);

    expect(list.shift()).toEqual(<number>array.shift());
    expect(list.shift()).toEqual(<number>array.shift());
    expect(list.shift()).toEqual(<number>array.shift());

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should function as a FIFO queue", () => {
    const array = [0, 1, 2, 3];
    const list: List<number> = List.from(array);

    expect(list.shift()).toEqual(<number>array.shift());
    expect(list.push(6)).toEqual(array.push(6));

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);

    expect(list.shift()).toEqual(<number>array.shift());
    expect(list.push(5)).toEqual(array.push(5));

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);

    expect(list.shift()).toEqual(<number>array.shift());
    expect(list.push(4)).toEqual(array.push(4));

    expect(list.length).toEqual(array.length);
    expectIterableEqual(list, array);
  });

  it("should return undefined from an empty #pop call", () => {
    const list = new List<number>();

    expect(list.pop()).toBeUndefined();

    expect(list.length).toEqual(0);
    expectIterableEqual(list, []);
  });

  it("should return undefined from an empty #shift call", () => {
    const list = new List<number>();

    expect(list.shift()).toBeUndefined();

    expect(list.length).toEqual(0);
    expectIterableEqual(list, []);
  });

  it("should not fail to #pop a `List` with length 1", () => {
    const list: List<number> = List.of(0);

    expect(list.pop()).toEqual(0);

    expect(list.length).toEqual(0);
    expectIterableEqual(list, []);
  });

  it("should not fail to #shift a `List` with length 1", () => {
    const list: List<number> = List.of(0);

    expect(list.shift()).toEqual(0);

    expect(list.length).toEqual(0);
    expectIterableEqual(list, []);
  });
});
