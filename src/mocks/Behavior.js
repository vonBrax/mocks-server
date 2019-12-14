/*
Copyright 2019 Javier Brea
Copyright 2019 XbyOrange

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

"use strict";

const FixturesGroup = require("./FixturesGroup");

class Behavior {
  constructor(fixtures = []) {
    this._initialFixtures = [...fixtures];
    this._fixtures = new FixturesGroup(this._initialFixtures);
  }

  extend(fixtures) {
    return new Behavior(this._initialFixtures.concat(fixtures));
  }

  async init(fixturesHandler) {
    await this._fixtures.init(fixturesHandler);
    return Promise.resolve(this);
  }

  getRequestMatchingFixture(req) {
    return this._fixtures.collection.find(fixture => fixture.requestMatch(req));
  }

  get isMocksServerBehavior() {
    return true;
  }

  get fixtures() {
    return this._fixtures.collection;
  }

  get name() {
    return this._name; // Prepared for defining behavior names based on property, file name, etc.
  }

  set name(name) {
    this._name = name;
  }
}

module.exports = Behavior;
