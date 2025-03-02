// BSD 3-Clause License
//
// Copyright (c) 2021, node-celery-ts contributors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.
//
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
//
// * Neither the name of the copyright holder nor the names of its
//   contributors may be used to endorse or promote products derived from
//   this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import {
  Compressor,
  Encoder,
  type Packer,
  Serializer,
  createDefaultPacker,
  createPacker,
} from "../../src/packer";

import * as Zlib from "zlib";
import * as JsYaml from "js-yaml";

import { describe, it, expect } from 'bun:test'

describe("Celery.Packer.Packer", () => {
  const data = {
    arr: [0, 5, 10],
    num: 15,
    obj: {
      bar: 10,
      foo: 5,
    },
    str: "foo",
  };

  it("should be created by default with JSON/Base64", () => {
    const expected = Buffer.from(JSON.stringify(data), "utf8").toString(
      "base64",
    );

    const packer: Packer = createDefaultPacker();

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with JSON", () => {
    const expected = JSON.stringify(data);

    const packer: Packer = createPacker({
      compressor: Compressor.Identity,
      encoder: Encoder.Plaintext,
      serializer: Serializer.Json,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with YAML", () => {
    const expected = JsYaml.dump(data);

    const packer: Packer = createPacker({
      compressor: Compressor.Identity,
      encoder: Encoder.Plaintext,
      serializer: Serializer.Yaml,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with JSON/Base64", () => {
    const expected = Buffer.from(JSON.stringify(data), "utf8").toString(
      "base64",
    );

    const packer: Packer = createPacker({
      compressor: Compressor.Identity,
      encoder: Encoder.Base64,
      serializer: Serializer.Json,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with YAML/Base64", () => {
    const expected = Buffer.from(JsYaml.dump(data), "utf8").toString(
      "base64",
    );

    const packer: Packer = createPacker({
      compressor: Compressor.Identity,
      encoder: Encoder.Base64,
      serializer: Serializer.Yaml,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with JSON/zlib", () => {
    const expected = Zlib.deflateSync(
      Buffer.from(JSON.stringify(data), "utf8"),
    ).toString("base64");

    const packer: Packer = createPacker({
      compressor: Compressor.Zlib,
      encoder: Encoder.Base64,
      serializer: Serializer.Json,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with JSON/gzip", () => {
    const expected = Zlib.gzipSync(
      Buffer.from(JSON.stringify(data), "utf8"),
    ).toString("base64");

    const packer: Packer = createPacker({
      compressor: Compressor.Gzip,
      encoder: Encoder.Base64,
      serializer: Serializer.Json,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with YAML/zlib", () => {
    const expected = Zlib.deflateSync(
      Buffer.from(JsYaml.dump(data), "utf8"),
    ).toString("base64");

    const packer: Packer = createPacker({
      compressor: Compressor.Zlib,
      encoder: Encoder.Base64,
      serializer: Serializer.Yaml,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });

  it("should work as expected with YAML/gzip", () => {
    const expected = Zlib.gzipSync(
      Buffer.from(JsYaml.dump(data), "utf8"),
    ).toString("base64");

    const packer: Packer = createPacker({
      compressor: Compressor.Gzip,
      encoder: Encoder.Base64,
      serializer: Serializer.Yaml,
    });

    const packed = packer.pack(data);
    const unpacked = packer.unpack(packed);

    expect(packed).toStrictEqual(expected);
    expect(unpacked).toStrictEqual(data);
  });
});
