/*
Copyright 2019-2022 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

const sinon = require("sinon");
const { NestedCollections } = require("@mocks-server/nested-collections");
const { Logger } = require("@mocks-server/logger");

const MockMock = require("./mock/Mock.mock.js");
const ServerMocks = require("./server/Server.mocks.js");
const PluginsMocks = require("./plugins/Plugins.mocks.js");
const ConfigMocks = require("./common/Config.mocks.js");
const AlertsMocks = require("./alerts/AlertsLegacy.mocks.js");
const FilesLoadersMocks = require("./files/FilesLoaders.mocks.js");
const ScaffoldMocks = require("./scaffold/Scaffold.mocks.js");
const UpdateNotifierMock = require("./update-notifier/UpdateNotifier.mock.js");

const Core = require("../src/Core");
const tracer = require("../src/common/legacyTracer");
const Alerts = require("../src/alerts/Alerts");
const { version } = require("../package.json");

describe("Core", () => {
  let sandbox;
  let mockMock;
  let mockInstance;
  let serverMocks;
  let serverInstance;
  let pluginsMocks;
  let pluginsInstance;
  let configMocks;
  let alertsMocks;
  let loadersMocks;
  let filesLoadersMocks;
  let scaffoldMocks;
  let core;
  let updateNotifierMock;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    updateNotifierMock = new UpdateNotifierMock();
    mockMock = new MockMock();
    mockInstance = mockMock.stubs.instance;
    serverMocks = new ServerMocks();
    serverInstance = serverMocks.stubs.instance;
    pluginsMocks = new PluginsMocks();
    pluginsInstance = pluginsMocks.stubs.instance;
    alertsMocks = new AlertsMocks();
    loadersMocks = mockMock.stubs.loaders;
    configMocks = new ConfigMocks();
    filesLoadersMocks = new FilesLoadersMocks();
    scaffoldMocks = new ScaffoldMocks();
    sandbox.stub(NestedCollections.prototype, "onChange");
    sandbox.stub(Logger.prototype, "onChangeGlobalStore");
    sandbox.stub(Logger.prototype, "setLevel");

    core = new Core();
    core.variantHandlers._registerOption.value = [];
    await core.init();
  });

  afterEach(() => {
    sandbox.restore();
    mockMock.restore();
    serverMocks.restore();
    configMocks.restore();
    pluginsMocks.restore();
    alertsMocks.restore();
    filesLoadersMocks.restore();
    scaffoldMocks.restore();
    updateNotifierMock.restore();
  });

  describe("when created", () => {
    it("should listen to change logger level when log option changes", async () => {
      core = new Core();
      configMocks.stubs.option.onChange.getCall(0).args[0]("foo-level");
      expect(core.logger.setLevel.getCall(1).args[0]).toEqual("foo-level");
    });

    it("should listen to change trace level when log option changes", async () => {
      core = new Core();
      expect(configMocks.stubs.option.onChange.getCall(1).args[0]).toEqual(tracer.set);
    });
  });

  describe("version", () => {
    it("should return current version", async () => {
      core = new Core();
      expect(core.version).toEqual(version);
    });
  });

  describe("Plugins parameters", () => {
    describe("createCollectionsLoader", () => {
      it("should return a new loader", () => {
        pluginsMocks.stubs.Constructor.mock.calls[0][0].createCollectionsLoader()(
          "foo-collection"
        );
        expect(loadersMocks.loadCollections.callCount).toEqual(1);
        expect(loadersMocks.loadCollections.getCall(0).args[0]).toEqual("foo-collection");
      });
    });

    describe("createRoutesLoader", () => {
      it("should return a new loader", () => {
        pluginsMocks.stubs.Constructor.mock.calls[0][0].createRoutesLoader()("foo-routes");
        expect(loadersMocks.loadRoutes.callCount).toEqual(1);
        expect(loadersMocks.loadRoutes.getCall(0).args[0]).toEqual("foo-routes");
      });
    });
  });

  describe("loadMocks method", () => {
    it("should call to mock loader loadCollections", () => {
      core.loadMocks("foo");
      expect(loadersMocks.loadCollections.getCall(0).args[0]).toEqual("foo");
    });
  });

  describe("loadRoutes method", () => {
    it("should call to mock loader loadRoutes", () => {
      core.loadRoutes("foo");
      expect(loadersMocks.loadRoutes.getCall(0).args[0]).toEqual("foo");
    });
  });

  describe("Mocks callbacks", () => {
    describe("onChange", () => {
      it("should emit a change:mock event", () => {
        const spy = sandbox.spy();
        core.onChangeMocks(spy);
        mockMock.stubs.Constructor.mock.calls[0][0].onChange();
        expect(spy.callCount).toEqual(1);
      });
    });
  });

  describe("init method", () => {
    it("should init only once", async () => {
      await core.init();
      await core.init();
      expect(pluginsInstance.register.callCount).toEqual(1);
    });

    it("should init Config with received config", async () => {
      const fooConfig = { foo: "foo" };
      core = new Core(fooConfig);
      await core.init();
      expect(configMocks.stubs.instance.init.getCall(1).args[0]).toEqual(fooConfig);
    });

    it("should extend config from constructor with config from init", async () => {
      core = new Core({ foo: "foo" });
      await core.init({ foo2: "foo2" });
      expect(configMocks.stubs.instance.init.getCall(1).args[0]).toEqual({
        foo: "foo",
        foo2: "foo2",
      });
    });

    it("should not extend arrays in config", async () => {
      core = new Core({ foo: ["foo", "foo2"] });
      await core.init({ foo: ["foo3", "foo4"] });
      expect(configMocks.stubs.instance.init.getCall(1).args[0]).toEqual({
        foo: ["foo3", "foo4"],
      });
    });

    it("should register plugins", () => {
      expect(pluginsInstance.register.callCount).toEqual(1);
    });

    it("should add an Alert if legacy routesHandlers option is set", async () => {
      core = new Core();
      sandbox.spy(core._deprecationAlerts, "set");
      core._variantHandlersOption.hasBeenSet = true;
      await core.init();
      expect(core._deprecationAlerts.set.callCount).toEqual(1);
    });

    it("should init server", () => {
      expect(serverInstance.init.callCount).toEqual(1);
    });

    it("should init update notifier", () => {
      expect(updateNotifierMock.stubs.instance.init.callCount).toEqual(1);
    });

    it("should pass pkg advanced option to update notifier if received in constructor", () => {
      core = new Core({ foo: "foo" }, { pkg: { name: "foo-name", version: "foo-version" } });
      expect(updateNotifierMock.stubs.Constructor.mock.calls[1][0].pkg).toEqual({
        name: "foo-name",
        version: "foo-version",
      });
    });

    it("should init scaffold", () => {
      expect(scaffoldMocks.stubs.instance.init.callCount).toEqual(1);
    });

    it("should init plugins", () => {
      expect(pluginsInstance.init.callCount).toEqual(1);
    });
  });

  describe("start method", () => {
    it("should init if it has not been done before", async () => {
      pluginsMocks.reset();
      pluginsMocks = new PluginsMocks();
      pluginsInstance = pluginsMocks.stubs.instance;
      core = new Core();
      await core.start();
      expect(pluginsInstance.register.callCount).toEqual(1);
    });

    it("should not init if it has been done before", async () => {
      await core.start();
      expect(pluginsInstance.register.callCount).toEqual(1);
    });

    it("should start server", async () => {
      await core.start();
      expect(serverInstance.start.callCount).toEqual(1);
    });

    it("should start plugins", async () => {
      await core.start();
      expect(pluginsInstance.start.callCount).toEqual(1);
    });

    it("should start plugins only once when called in parallel", async () => {
      core.start();
      core.start();
      core.start();
      await core.start();
      expect(pluginsInstance.start.callCount).toEqual(1);
    });

    it("should start plugins again", async () => {
      core.start();
      await core.start();
      await core.start();
      expect(pluginsInstance.start.callCount).toEqual(2);
    });
  });

  describe("addRouter method", () => {
    it("should add router to server", () => {
      core.addRouter();
      expect(serverInstance.addRouter.callCount).toEqual(1);
    });
  });

  describe("removeRouter method", () => {
    it("should remove router from server", () => {
      core.removeRouter();
      expect(serverInstance.removeRouter.callCount).toEqual(1);
    });
  });

  describe("addRoutesHandler method", () => {
    it("should add Route Handler", () => {
      core.addRoutesHandler("foo");
      // TODO, do not use private properties in testing
      expect(core._variantHandlers._registeredVariantHandlers.length).toEqual(8);
      expect(core._variantHandlers._registeredVariantHandlers[7]).toEqual("foo");
    });
  });

  describe("onChangeMocks method", () => {
    it("should add listener to eventEmitter", () => {
      const spy = sandbox.spy();
      core.onChangeMocks(spy);
      core._eventEmitter.emit("change:mock");
      expect(spy.callCount).toEqual(1);
    });

    it("should return a function to remove listener", () => {
      expect.assertions(2);
      const spy = sandbox.spy();
      const removeCallback = core.onChangeMocks(spy);
      core._eventEmitter.emit("change:mock");
      expect(spy.callCount).toEqual(1);
      removeCallback();
      core._eventEmitter.emit("change:mock");
      expect(spy.callCount).toEqual(1);
    });
  });

  describe("onChangeAlerts method", () => {
    it("should execute callback when alerts execute onChange callback", () => {
      const spy = sandbox.spy();
      core.onChangeAlerts(spy);
      NestedCollections.prototype.onChange.getCall(0).args[0]();
      expect(spy.callCount).toEqual(1);
    });

    it("should return a function to remove listener", () => {
      expect.assertions(2);
      const spy = sandbox.spy();
      const removeCallback = core.onChangeAlerts(spy);
      core._eventEmitter.emit("change:alerts");
      expect(spy.callCount).toEqual(1);
      removeCallback();
      core._eventEmitter.emit("change:alerts");
      expect(spy.callCount).toEqual(1);
    });
  });

  describe("onChangeLogs method", () => {
    it("should execute callback when logs execute onChangeGlobalStore callback", () => {
      const spy = sandbox.spy();
      core.onChangeLogs(spy);
      Logger.prototype.onChangeGlobalStore.getCall(0).args[0]();
      expect(spy.callCount).toEqual(1);
    });

    it("should return a function to remove listener", () => {
      expect.assertions(2);
      const spy = sandbox.spy();
      const removeCallback = core.onChangeLogs(spy);
      core._eventEmitter.emit("change:logs");
      expect(spy.callCount).toEqual(1);
      removeCallback();
      core._eventEmitter.emit("change:logs");
      expect(spy.callCount).toEqual(1);
    });
  });

  describe("stop method", () => {
    it("should stop server", async () => {
      await core.stop();
      expect(serverInstance.stop.callCount).toEqual(1);
    });

    it("should stop plugins", async () => {
      await core.stop();
      expect(pluginsInstance.stop.callCount).toEqual(1);
    });

    it("should stop plugins only once when called in parallel", async () => {
      core.stop();
      core.stop();
      core.stop();
      await core.stop();
      expect(pluginsInstance.stop.callCount).toEqual(1);
    });

    it("should stop plugins again", async () => {
      core.stop();
      core.stop();
      core.stop();
      await core.stop();
      await core.stop();
      expect(pluginsInstance.stop.callCount).toEqual(2);
    });
  });

  describe("restartServer method", () => {
    it("should restart server", async () => {
      await core.restartServer();
      expect(serverInstance.restart.callCount).toEqual(1);
    });
  });

  describe("tracer getter", () => {
    it("should return tracer instance", () => {
      expect(core.tracer).toEqual(tracer);
    });
  });

  describe("logs getter", () => {
    it("should return Logger global store from logs", () => {
      expect(core.logs).toEqual(core.logger.globalStore);
    });
  });

  describe("mocks getter", () => {
    it("should return mocks instance", () => {
      expect(core.mocks).toEqual(mockInstance);
    });
  });

  describe("mock getter", () => {
    it("should return routes instance", () => {
      expect(core.mock).toEqual(mockInstance);
    });
  });

  describe("config getter", () => {
    it("should return config instance", () => {
      expect(core.config).toEqual(configMocks.stubs.instance);
    });
  });

  describe("alerts getter", () => {
    it("should return alerts", () => {
      expect(core.alerts).toEqual(core._alerts.customFlat);
    });
  });

  describe("alertsApi getter", () => {
    it("should return alerts API", () => {
      expect(core.alertsApi instanceof Alerts).toBe(true);
      expect(core.alertsApi.id).toEqual("alerts");
    });
  });

  describe("server getter", () => {
    it("should return server", () => {
      expect(core.server).toEqual(serverMocks.stubs.instance);
    });
  });

  describe("variantHandlers getter", () => {
    it("should return variantHandlers", () => {
      expect(core.variantHandlers).toEqual(core._variantHandlers);
    });
  });
});
