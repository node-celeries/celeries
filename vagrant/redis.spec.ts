// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import * as Celery from "../src";

import IoRedis from "ioredis";
import * as Uuid from "uuid";


import { describe, it, expect } from 'bun:test'

describe("Celery.RedisBackend", () => {
  const REDIS_URI: string = "redis://localhost";

  const createRedisClient = () => new IoRedis(REDIS_URI);

  const getKey = (id: string) => `celery-task-meta-${id}`;

  const createRedisBackend = () => new Celery.RedisBackend();

  it("should receive messages via SET/GET", async () => {
    const id = Uuid.v4();
    const message = {
      children: [],
      result: "foo",
      status: Celery.Status.Success,
      task_id: id,
      traceback: null,
    };

    const redis = createRedisClient();
    await redis.set(getKey(id), JSON.stringify(message));

    const backend = createRedisBackend();
    const result = await backend.get<string>({ taskId: id, timeout: 20 });

    expect(result).toEqual(message);

    await backend.end();
    await redis.flushall();
    await redis.quit();
    redis.disconnect();
  });

  it("should receive messages via PUBLISH/SUBSCRIBE", async () => {
    const id = Uuid.v4();
    const message = {
      children: [],
      result: "foo",
      status: Celery.Status.Success,
      task_id: id,
      traceback: null,
    };

    const backend = createRedisBackend();
    const result = backend.get<string>({ taskId: id, timeout: 20 });

    await new Promise((resolve) => setTimeout(resolve, 5));

    const redis = createRedisClient();
    await redis.publish(getKey(id), JSON.stringify(message));

    expect(await result).toEqual(message);

    await backend.end();
    await redis.flushall();
    await redis.quit();
    redis.disconnect();
  });

  it("should set with expected timeout", async () => {
    const id = Uuid.v4();
    const message = {
      children: [],
      result: "foo",
      status: Celery.Status.Success,
      task_id: id,
      traceback: null,
    };

    const redis = createRedisClient();

    const backend = createRedisBackend();
    await backend.put<string>(message);

    const expry = await redis.ttl(getKey(id));
    const placed = JSON.parse(await redis.get(getKey(id)));

    expect(placed).toEqual(message);
    expect(expry).toBeGreaterThan(8638); // give 2 seconds leeway

    await backend.end();
    await redis.flushall();
    await redis.quit();
    redis.disconnect();
  });

  it("should DELETE from Redis when #delete is invoked", async () => {
    const id = Uuid.v4();
    const message = {
      children: [],
      result: "foo",
      status: Celery.Status.Success,
      task_id: id,
      traceback: null,
    };

    const redis = createRedisClient();
    await redis.set(getKey(id), JSON.stringify(message));

    const backend = createRedisBackend();

    expect(await backend.delete(id)).toEqual("1");
    expect(await redis.exists(getKey(id))).toBe(0);

    await backend.end();
    await redis.flushall();
    await redis.quit();
    redis.disconnect();
  });

  it("should receive messages published before #get", async () => {
    const id = Uuid.v4();
    const message = {
      children: [],
      result: "foo",
      status: Celery.Status.Success,
      task_id: id,
      traceback: null,
    };

    const backend = createRedisBackend();

    await new Promise((resolve) => setTimeout(resolve, 5));

    const redis = createRedisClient();
    await redis.publish(getKey(id), JSON.stringify(message));

    expect(await backend.get<string>({ taskId: id })).toEqual(
      message,
    );

    await backend.end();
    await redis.flushall();
    await redis.quit();
    redis.disconnect();
  });
});
