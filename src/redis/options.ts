// Copyright (c) 2025, Cyan Changes
// All rights reserved. BSD 3-Clause License

import { UnimplementedError } from "../errors";
import type {
  BasicRedisClusterOptions,
  BasicRedisOptions,
  BasicRedisSentinelOptions,
  BasicRedisSocketOptions,
  BasicRedisTcpOptions,
} from "./basic_options";

import IoRedis from "ioredis";

/**
 * `RedisOptions` objects encapsulate the logic of Redis client creation.
 *
 * @see createOptions
 */
export interface RedisOptions {
  /**
   * @param override Options to be written over existing options before
   *                 creating the client
   * @returns A Redis client configured according to the class type.
   */
  createClient(override?: object): IoRedis.Redis;

  /**
   * @returns A URI that lossily encodes a `RedisOptions` object.
   */
  createUri(): string;
}

/**
 * @param options The options to copy from.
 * @returns A new options object with old options copied from `options` and
 *          certain options forced to a value.
 */
const appendDefaultOptions = <T extends BasicRedisOptions>(options: T): T => {
  const appended = {
    ...(options as object),
    dropBufferSupport: true,
    keyPrefix: "celery-task-meta-",
    stringNumbers: true,
  };

  return appended as T;
};

/**
 */
const maybeOverride = <T extends BasicRedisOptions>(
  options: T,
  override?: object,
): T => {
  if (typeof override === "undefined") {
    return options;
  }

  // tslint:disable:no-object-literal-type-assertion
  return { ...(options as object), ...override } as T;
};

/**
 * `RedisTcpOptions` creates Redis clients that connect to a single database
 * over TCP.
 */
export class RedisTcpOptions implements RedisOptions {
  public readonly options: BasicRedisTcpOptions;

  public constructor(options: BasicRedisTcpOptions) {
    this.options = appendDefaultOptions(options);
  }

  public createClient(override?: object): IoRedis.Redis {
    return new IoRedis(maybeOverride(this.options, override));
  }

  public createUri(): string {
    let uri = "redis";

    if (typeof this.options.tls !== "undefined") {
      uri += "s";
    }

    uri += "://";

    if (typeof this.options.password !== "undefined") {
      uri += `:${this.options.password}@`;
    }

    if (
      typeof this.options.host !== "undefined" ||
      typeof this.options.password !== "undefined"
    ) {
      if (typeof this.options.host === "undefined") {
        uri += "localhost";
      } else {
        uri += this.options.host;
      }

      if (typeof this.options.port !== "undefined") {
        uri += `:${this.options.port}`;
      }
    }

    if (typeof this.options.db !== "undefined") {
      uri += `/${this.options.db}`;
    }

    return uri;
  }
}

/**
 * `RedisSocketOptions` creates Redis clients that connect to a single database
 * over Unix Socket.
 */
export class RedisSocketOptions implements RedisOptions {
  public readonly options: BasicRedisSocketOptions;

  public constructor(options: BasicRedisSocketOptions) {
    this.options = appendDefaultOptions(options);
  }

  public createClient(override?: object): IoRedis.Redis {
    return new IoRedis(maybeOverride(this.options, override));
  }

  public createUri(): string {
    let uri = "redis";

    if (typeof this.options.tls !== "undefined") {
      uri += "s";
    }

    uri += `+socket://${this.options.path}`;

    if (typeof this.options.password !== "undefined") {
      uri += `?password=${this.options.password}`;
    }

    return uri;
  }
}

/**
 * `RedisSentinelOptions` creates Redis clients that connect to a group of Redis
 * Sentinel nodes, automatically discovering slave nodes in the network.
 */
export class RedisSentinelOptions implements RedisOptions {
  public readonly options: BasicRedisSentinelOptions;

  public constructor(options: BasicRedisSentinelOptions) {
    this.options = appendDefaultOptions(options);
  }

  public createClient(override?: object): IoRedis.Redis {
    return new IoRedis(maybeOverride(this.options, override));
  }

  public createUri(): string {
    throw new UnimplementedError();
  }
}

/**
 * `RedisClusterOptions` creates Redis clients that connect to a Redis
 * Cluster network.
 */
export class RedisClusterOptions implements RedisOptions {
  public readonly options: BasicRedisClusterOptions;

  public constructor(options: BasicRedisClusterOptions) {
    this.options = (() => {
      if (typeof options.redisOptions === "undefined") {
        return options;
      }

      return {
        ...options,
        redisOptions: appendDefaultOptions(options.redisOptions),
      };
    })();
  }

  public createClient(): IoRedis.Redis {
    return new IoRedis.Cluster(this.options.nodes, this.options);
  }

  public createUri(): string {
    throw new UnimplementedError();
  }
}

export const DEFAULT_REDIS_OPTIONS: RedisTcpOptions = new RedisTcpOptions({
  protocol: "redis",
});

/**
 * @param options Options that might be used to construct ioredis clients.
 * @returns A transformed `NativeOptions` object.
 */
export const createOptions = (options: NativeOptions): RedisOptions => {
  if (isCluster(options)) {
    return new RedisClusterOptions(options);
  } else if ((options as BasicRedisSentinelOptions).sentinels) {
    return new RedisSentinelOptions(options as BasicRedisSentinelOptions);
  } else if ((options as BasicRedisSocketOptions).path) {
    return new RedisSocketOptions(options as BasicRedisSocketOptions);
  }

  return new RedisTcpOptions({
    ...(options as BasicRedisTcpOptions),
    protocol: (() => {
      if (options.tls) {
        return "rediss";
      }

      return "redis";
    })(),
  });
};

export type NativeOptions = IoRedis.RedisOptions | BasicRedisClusterOptions;

const isCluster = (
  options: NativeOptions,
): options is BasicRedisClusterOptions =>
  (options as BasicRedisClusterOptions).nodes !== undefined;
