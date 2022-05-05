const { isEqual, isUndefined } = require("lodash");
const EventEmitter = require("events");

const Option = require("./Option");
const { types } = require("./types");
const { addEventListener, CHANGE } = require("./events");
const { checkNamespaceName, checkOptionName } = require("./namespaces");

class Namespace {
  constructor(name, { parents = [], brothers }) {
    this._brothers = brothers;
    this._parents = parents;
    this._eventEmitter = new EventEmitter();
    this._name = name;
    this._namespaces = new Set();
    this._options = new Set();
    this._started = false;
  }

  addOption(optionProperties) {
    checkOptionName(optionProperties.name, {
      options: this._options,
      namespaces: this._name ? this._namespaces : this._brothers,
    });
    const option = new Option(optionProperties);
    this._options.add(option);
    return option;
  }

  addOptions(options) {
    return options.map((option) => this.addOption(option));
  }

  _set(configuration) {
    const changedOptions = [];
    if (configuration) {
      this._options.forEach((option) => {
        if (!isUndefined(configuration[option.name])) {
          const previousValue = option.value;
          if (option.type === types.OBJECT) {
            option.merge(configuration[option.name]);
          } else {
            option.value = configuration[option.name];
          }
          if (!isEqual(previousValue, option.value)) {
            changedOptions.push(option);
          }
        }
      });
    }
    return changedOptions;
  }

  init(configuration) {
    const namespaceConfig = this._name ? configuration[this._name] : configuration;
    this._set(namespaceConfig);
    this._namespaces.forEach((namespace) => {
      namespace.init(namespaceConfig || {});
    });
  }

  start() {
    this._options.forEach((option) => option.start());
    this._namespaces.forEach((namespace) => namespace.start());
    this._started = true;
  }

  set(configuration) {
    const changedOptions = this._set(configuration);
    // TODO, remove?
    if (changedOptions.length && this._started) {
      this._eventEmitter.emit(CHANGE, changedOptions);
    }
  }

  // TODO, remove?
  onChange(listener) {
    return addEventListener(listener, CHANGE, this._eventEmitter);
  }

  addNamespace(name) {
    const namespace =
      checkNamespaceName(name, { namespaces: this._namespaces, options: this._options }) ||
      new Namespace(name, { parents: [...this._parents, this] });
    this._namespaces.add(namespace);
    return namespace;
  }

  get name() {
    return this._name;
  }

  get parents() {
    return this._parents;
  }

  get namespaces() {
    return this._namespaces;
  }

  get options() {
    return this._options;
  }
}

module.exports = Namespace;
