const { fixtureRunner, optionsFromLogs } = require("./support/utils");

describe("Config from args", () => {
  let runner, options;

  const run = async function (folder, file, runnerOptions) {
    runner = fixtureRunner(folder, file, runnerOptions);
    await runner.hasExited();
    options = optionsFromLogs(runner.logs.join);
  };

  describe("when argument is provided", () => {
    it("option should get the value from it", async () => {
      await run("no-config", "only-init", {
        args: ["--no-config.readFile"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(expect.arrayContaining(["config.readFile:boolean:false"]));
    });
  });

  describe("when option is String", () => {
    it("option should get the value from it", async () => {
      await run("no-config", "option-types", {
        args: ["--component.stringWithDefault=foo-from-args"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(["component.stringWithDefault:string:foo-from-args"])
      );
    });
  });

  describe("when option is Object", () => {
    it("option should merge the value from it", async () => {
      await run("no-config", "option-types", {
        args: ['--component.objectWithDefault={"foo2":"var2"}'],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(['component.objectWithDefault:object:{"foo":"var","foo2":"var2"}'])
      );
    });

    it("should merge value from env vars and files when option is of type Object", async () => {
      await run("json-config-option-types", "option-types", {
        args: ['--component.objectWithDefault={"foo2":"from-arg"}'],
        env: {
          MOCKS_COMPONENT_OBJECT_WITH_DEFAULT: '{"foo2":"from-env","foo3":true,"foo4":5}',
        },
      });

      expect(options).toEqual(
        expect.arrayContaining([
          'component.objectWithDefault:object:{"foo":"var","foo2":"from-arg","foo3":true,"foo4":5}',
        ])
      );
    });
  });

  describe("when option is Boolean and default value is true", () => {
    it("option should be false if --no argument is provided", async () => {
      await run("no-config", "option-types", {
        args: ["--no-component.booleanDefaultTrue"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(["component.booleanDefaultTrue:boolean:false"])
      );
    });
  });

  describe("when option is Boolean and default value is true and env var is provided", () => {
    it("option should be false if --no argument is provided", async () => {
      await run("no-config", "option-types", {
        args: ["--no-component.booleanDefaultTrue"],
        env: {
          MOCKS_COMPONENT_BOOLEAN_DEFAULT_TRUE: true,
        },
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(["component.booleanDefaultTrue:boolean:false"])
      );
    });
  });

  describe("when option is Boolean and default value is false", () => {
    it("option should be true if argument is provided", async () => {
      await run("no-config", "option-types", {
        args: ["--component.booleanDefaultFalse"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(["component.booleanDefaultFalse:boolean:true"])
      );
    });
  });

  describe("when option is Number", () => {
    it("option should be of type number", async () => {
      await run("no-config", "option-types", {
        args: ["--component.numberDefaultZero=5"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(expect.arrayContaining(["component.numberDefaultZero:number:5"]));
    });

    it("option value should include decimals", async () => {
      await run("no-config", "option-types", {
        args: ["--component.numberDefaultZero=5.34"],
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(expect.arrayContaining(["component.numberDefaultZero:number:5.34"]));
    });
  });

  describe("when option is Boolean and default value is false and env var is provided", () => {
    it("option should be true if argument is provided", async () => {
      await run("no-config", "option-types", {
        args: ["--component.booleanDefaultFalse"],
        env: {
          MOCKS_COMPONENT_BOOLEAN_DEFAULT_TRUE: false,
        },
      });
      expect(runner.exitCode).toEqual(0);
      expect(options).toEqual(
        expect.arrayContaining(["component.booleanDefaultFalse:boolean:true"])
      );
    });
  });

  describe("when programmatic config is provided", () => {
    it("argument should overwrite the value from it", async () => {
      await run("js-async-function-config", "two-namespaces", {
        args: ["--component.alias=alias-from-arg", "--fooNamespace.fooOption=option-from-arg"],
      });

      expect(options).toEqual(expect.arrayContaining(["component.alias:string:alias-from-arg"]));
      expect(options).toEqual(
        expect.arrayContaining(["fooNamespace.fooOption:string:option-from-arg"])
      );
    });
  });

  describe("when env var is provided", () => {
    it("argument should overwrite the value from it", async () => {
      await run("no-config", "two-namespaces", {
        args: ["--component.alias=alias-from-arg", "--fooNamespace.fooOption=option-from-arg"],
        env: {
          MOCKS_FOO_NAMESPACE_FOO_OPTION: "option-from-env-var",
          MOCKS_COMPONENT_ALIAS: "alias-from-env-var",
        },
      });

      expect(options).toEqual(expect.arrayContaining(["component.alias:string:alias-from-arg"]));
      expect(options).toEqual(
        expect.arrayContaining(["fooNamespace.fooOption:string:option-from-arg"])
      );
    });
  });

  describe("when file is provided", () => {
    it("env var should overwrite the value from it", async () => {
      await run("js-async-function-config", "two-namespaces", {
        args: ["--component.alias=alias-from-arg"],
        env: {
          MOCKS_COMPONENT_ALIAS: "alias-from-env-var",
        },
      });

      expect(options).toEqual(expect.arrayContaining(["component.alias:string:alias-from-arg"]));
    });
  });

  describe("when programmatic, file and env vars are provided", () => {
    it("argument should overwrite the value from all of them", async () => {
      await run("js-async-function-config", "two-namespaces", {
        args: ["--component.alias=alias-from-arg", "--fooNamespace.fooOption=option-from-arg"],
        env: {
          MOCKS_FOO_NAMESPACE_FOO_OPTION: "option-from-env-var",
          MOCKS_COMPONENT_ALIAS: "alias-from-env-var",
        },
      });

      expect(options).toEqual(expect.arrayContaining(["component.alias:string:alias-from-arg"]));
      expect(options).toEqual(
        expect.arrayContaining(["fooNamespace.fooOption:string:option-from-arg"])
      );
    });
  });
});
