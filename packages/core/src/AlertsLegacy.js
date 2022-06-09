/*
Copyright 2020-2022 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

// LEGACY, remove when legacy alerts are removed
class AlertsLegacy {
  constructor({ alerts, logger }) {
    this._logger = logger;
    this._deprecatedAlerts = alerts.collection("deprecated");
    this._alerts = alerts;
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.rename = this.rename.bind(this);
  }

  add(context, message, error) {
    this._deprecatedAlerts.set(
      "addAlert",
      `Detected usage of deprecated method 'addAlert'. Use alerts instead: https://www.mocks-server.org/docs/api-mocks-server-api#alerts`
    );
    const collectionIds = context.split(":");
    const alertId = collectionIds.pop();
    const alertCollection = collectionIds.reduce((currentCollection, collectionId) => {
      return currentCollection.collection(collectionId);
    }, this._alerts);
    alertCollection.set(alertId, message, error);
  }

  remove(context) {
    this._deprecatedAlerts.set(
      "removeAlert",
      `Detected usage of deprecated method 'removeAlerts'. Use alerts instead: https://www.mocks-server.org/docs/api-mocks-server-api#alerts`
    );
    this._logger.silly(`Removing alerts with context "${context}"`);
    // Clean collection with whole context
    const collectionIds = context.split(":");
    const contextCollection = collectionIds.reduce((currentCollection, collectionId) => {
      return currentCollection.collection(collectionId);
    }, this._alerts);
    contextCollection.clean();

    // Last context may be an item id instead of a collection. Remove it
    const alertId = collectionIds.pop();
    const alertCollection = collectionIds.reduce((currentCollection, collectionId) => {
      return currentCollection.collection(collectionId);
    }, this._alerts);
    alertCollection.remove(alertId);
  }

  rename(oldContext, newContext) {
    this._logger.silly(`Renaming alerts with context "${oldContext}" to context "${newContext}"`);
    const collectionIds = oldContext.split(":");
    const newCollectionsIds = newContext.split(":");
    collectionIds.reduce((currentCollection, collectionId, currentIndex) => {
      currentCollection.renameCollection(collectionId, newCollectionsIds[currentIndex]);
      return currentCollection.collection(newCollectionsIds[currentIndex]);
    }, this._alerts);

    // Rename item
    const lastCollectionId = collectionIds.pop();
    const newLastCollectionId = newCollectionsIds.pop();
    const lastCollection = newCollectionsIds.reduce((currentCollection, collectionId) => {
      return currentCollection.collection(collectionId);
    }, this._alerts);

    const value = lastCollection.get(lastCollectionId);
    if (value) {
      lastCollection.remove(lastCollectionId);
      lastCollection.set(newLastCollectionId, value.message, value.error);
    }
  }

  get values() {
    return this._alerts.customFlat;
  }
}

module.exports = AlertsLegacy;
