/*
Copyright 2021-2022 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

const sinon = require("sinon");

const LibsMocks = require("../common/Libs.mocks");
const { Logger } = require("@mocks-server/logger");

const Collection = require("../../src/mock/Collection");

describe("Collection", () => {
  let sandbox;
  let libsMocks;
  let collection;
  let getDelay;
  let routeVariants;
  let middlewareMethodsStubs;
  let logger;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    routeVariants = [
      {
        method: "GET",
        url: "url-1",
        delay: null,
        middleware: sandbox.stub(),
      },
      {
        method: "POST",
        url: "url-2",
        delay: 1000,
        middleware: sandbox.stub(),
      },
      {
        method: ["PUT", "PATCH"],
        url: "url-3",
        delay: 1000,
        middleware: sandbox.stub(),
      },
    ];
    middlewareMethodsStubs = {
      req: {
        id: "foo-request-id",
      },
      res: {
        status: sandbox.stub(),
        send: sandbox.stub(),
      },
      next: sandbox.stub(),
    };
    getDelay = sandbox.stub();
    libsMocks = new LibsMocks();
    logger = new Logger();
    collection = new Collection({ id: "mock-id", routeVariants, getDelay, logger });
  });

  afterEach(() => {
    sandbox.restore();
    libsMocks.restore();
  });

  describe("id getter", () => {
    it("should return mock id", () => {
      expect(collection.id).toEqual("mock-id");
    });
  });

  describe("routeVariants getter", () => {
    it("should return routesVariants", () => {
      expect(collection.routeVariants).toEqual(routeVariants);
    });
  });

  describe("router getter", () => {
    it("should return express router", () => {
      expect(collection.router).toEqual(libsMocks.stubs.expressRouter);
    });
  });

  describe("router", () => {
    it("should add two routers for each routeVariant using correspondant method", () => {
      expect(libsMocks.stubs.expressRouter.get.getCall(0).args[0]).toEqual("url-1");
      expect(libsMocks.stubs.expressRouter.get.getCall(1).args[0]).toEqual("url-1");
      expect(libsMocks.stubs.expressRouter.post.getCall(0).args[0]).toEqual("url-2");
      expect(libsMocks.stubs.expressRouter.post.getCall(1).args[0]).toEqual("url-2");
    });

    it("should add two routers for each routeVariant using correspondant method when it is an array", () => {
      expect(libsMocks.stubs.expressRouter.put.getCall(0).args[0]).toEqual("url-3");
      expect(libsMocks.stubs.expressRouter.put.getCall(1).args[0]).toEqual("url-3");
      expect(libsMocks.stubs.expressRouter.patch.getCall(0).args[0]).toEqual("url-3");
      expect(libsMocks.stubs.expressRouter.patch.getCall(1).args[0]).toEqual("url-3");
    });

    it("should not apply delay in first router middleware if routeVariant has not delay and getDelay returns null", () => {
      const delayMiddleware = libsMocks.stubs.expressRouter.get.getCall(0).args[1];
      delayMiddleware(
        middlewareMethodsStubs.req,
        middlewareMethodsStubs.res,
        middlewareMethodsStubs.next
      );
      expect(middlewareMethodsStubs.next.callCount).toEqual(1);
    });

    it("should apply getDelay in first router middleware if routeVariant has not delay", () => {
      const clock = sandbox.useFakeTimers();
      const delayMiddleware = libsMocks.stubs.expressRouter.get.getCall(0).args[1];
      getDelay.returns(500);
      delayMiddleware(
        middlewareMethodsStubs.req,
        middlewareMethodsStubs.res,
        middlewareMethodsStubs.next
      );
      expect(middlewareMethodsStubs.next.callCount).toEqual(0);
      clock.tick(500);
      expect(middlewareMethodsStubs.next.callCount).toEqual(1);
    });

    it("should apply routeVariant delay in first router if it is defined", () => {
      const clock = sandbox.useFakeTimers();
      const delayMiddleware = libsMocks.stubs.expressRouter.post.getCall(0).args[1];
      delayMiddleware(
        middlewareMethodsStubs.req,
        middlewareMethodsStubs.res,
        middlewareMethodsStubs.next
      );
      expect(middlewareMethodsStubs.next.callCount).toEqual(0);
      clock.tick(1000);
      expect(middlewareMethodsStubs.next.callCount).toEqual(1);
    });
  });
});
