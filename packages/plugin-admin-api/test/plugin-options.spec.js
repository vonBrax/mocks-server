/*
Copyright 2019 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
const { startServer, fetch, waitForServer } = require("./support/helpers");

describe("plugin options", () => {
  let server;

  describe("adminApiPath option", () => {
    beforeAll(async () => {
      server = await startServer("web-tutorial", {
        plugins: {
          adminApi: {
            path: "/foo",
          },
        },
      });
      await waitForServer();
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should change the administration api path", async () => {
      const adminResponse = await fetch("/foo/settings");
      expect(adminResponse.body.plugins.adminApi.path).toEqual("/foo");
    });
  });
});
