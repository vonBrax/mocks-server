const Ajv = require("ajv");
const betterAjvErrors = require("better-ajv-errors").default;
const { isString, isNumber, isObject, isBoolean } = require("lodash");

const ajv = new Ajv({ allErrors: true });

const { types } = require("./types");

function enforceDefaultTypeSchema(type) {
  return {
    properties: {
      name: { type: types.STRING },
      description: { type: types.STRING },
      type: { enum: [type] },
      default: { type },
    },
    additionalProperties: false,
  };
}

const optionSchema = {
  type: types.OBJECT,
  oneOf: [
    enforceDefaultTypeSchema(types.NUMBER),
    enforceDefaultTypeSchema(types.STRING),
    enforceDefaultTypeSchema(types.BOOLEAN),
    enforceDefaultTypeSchema(types.OBJECT),
  ],
  required: ["name", "type"],
};

const optionValidator = ajv.compile(optionSchema);

function emptySchema({ allowAdditionalProperties = false } = {}) {
  return {
    type: types.OBJECT,
    properties: {},
    additionalProperties: allowAdditionalProperties,
  };
}

function throwValueTypeError(value, type) {
  throw new Error(`${value} is not of type ${type}`);
}

function validateString(value) {
  if (!isString(value)) {
    throwValueTypeError(value, types.STRING);
  }
}

function validateBoolean(value) {
  if (!isBoolean(value)) {
    throwValueTypeError(value, types.BOOLEAN);
  }
}

function validateNumber(value) {
  if (!isNumber(value)) {
    throwValueTypeError(value, types.NUMBER);
  }
}

function validateObject(value) {
  if (!isObject(value)) {
    throwValueTypeError(value, types.OBJECT);
  }
}

const typeValidators = {
  [types.STRING]: validateString,
  [types.BOOLEAN]: validateBoolean,
  [types.NUMBER]: validateNumber,
  [types.OBJECT]: validateObject,
};

function namespaceSchema(namespace) {
  return Array.from(namespace.options).reduce((schema, option) => {
    schema.properties[option.name] = {
      type: option.type,
    };
    return schema;
  }, emptySchema());
}

function addGroupToSchema(group, fullSchema, { allowAdditionalNamespaces }) {
  if (allowAdditionalNamespaces) {
    fullSchema.additionalProperties = true;
  }
  return Array.from(group.namespaces).reduce((schema, namespace) => {
    schema.properties[namespace.name] = namespaceSchema(namespace);
    return schema;
  }, fullSchema);
}

function groupSchema(group, { allowAdditionalNamespaces }) {
  return Array.from(group.namespaces).reduce((schema, namespace) => {
    schema.properties[namespace.name] = namespaceSchema(namespace);
    return schema;
  }, emptySchema({ allowAdditionalProperties: allowAdditionalNamespaces }));
}

function validate(config, schema, validator) {
  const validateProperties = validator || ajv.compile(schema);
  const valid = validateProperties(config);
  if (!valid) {
    throw new Error(betterAjvErrors(schema, config, validateProperties.errors));
  }
}

function validateConfig(config, { groups, allowAdditionalNamespaces }) {
  const schema = Array.from(groups).reduce((fullSchema, group) => {
    if (group.name) {
      fullSchema.properties[group.name] = groupSchema(group, { allowAdditionalNamespaces });
    } else {
      addGroupToSchema(group, fullSchema, { allowAdditionalNamespaces });
    }
    return fullSchema;
  }, emptySchema());
  validate(config, schema);
}

function validateOption(properties) {
  validate(properties, optionSchema, optionValidator);
}

function validateValueType(value, type) {
  typeValidators[type](value);
}

module.exports = {
  validateConfig,
  validateOption,
  validateValueType,
};
