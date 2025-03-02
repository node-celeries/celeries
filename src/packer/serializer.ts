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

import * as JsYaml from "js-yaml";

/**
 * encapsulates serialization of arbitrary data into binary formats
 */
export interface Serializer {
  serialize(data: any): Buffer;

  deserialize(data: Buffer): any;
}

/**
 * implemented using JSON.{stringify,parse}
 *
 * @returns a Serializer that serializes data to and from JSON
 */
export const createJsonSerializer = (): Serializer => ({
  serialize: (data: any): Buffer => Buffer.from(JSON.stringify(data), "utf8"),

  deserialize: (data: Buffer): any => JSON.parse(data.toString("utf8")),
});

/**
 * implemented using js-yaml's safeDump and safeLoad
 * cannot serialize undefined inputs
 *
 * @returns a Serializer that serializes data to and from YAML
 */
export const createYamlSerializer = (): Serializer => ({
  serialize: (data: any): Buffer => Buffer.from(JsYaml.dump(data), "utf8"),

  deserialize: (data: Buffer): any => JsYaml.load(data.toString("utf8")),
});
