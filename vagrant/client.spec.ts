// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import * as Celery from "../src";

import { describe, it, expect } from 'bun:test'

describe("Celery.Client", () => {
  it("should work", async () => {
    const client = Celery.createClient({
      brokerUrl: "amqp://localhost",
      resultBackend: "redis://localhost",
    });

    const task = client.createTask("tasks.add");
    const applied = task.applyAsync({ args: [10, 15], kwargs: {} });
    const result = await applied.get();

    await client.end();

    expect(result).toBe(25);
  });
});
