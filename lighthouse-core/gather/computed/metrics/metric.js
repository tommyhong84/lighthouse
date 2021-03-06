/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ComputedArtifact = require('../computed-artifact');

/**
 * @fileOverview Encapsulates logic for choosing the correct metric computation method based on the
 * specified throttling settings, supporting simulated and observed metric types.
 *
 * To implement a fully supported metric:
 *     - Override the name getter with MyMetricName
 *     - Override the computeObservedMetric method with the observed-mode implementation.
 *     - Override the computeSimulatedMetric method with the simulated-mode implementation OR
 *       create another computed artifact with the name LanternMyMetricName.
 */
class ComputedMetric extends ComputedArtifact {
  /** @type {string} */
  get name() {
    throw new Error('Unimplemented');
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {Object} artifacts
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  computeSimulatedMetric(data, artifacts) {
    return artifacts[`requestLantern${this.name}`](data);
  }

  /**
   * @param {LH.Artifacts.MetricComputationData} data
   * @param {Object} artifacts
   * @return {Promise<LH.Artifacts.Metric>}
   */
  computeObservedMetric(data, artifacts) { // eslint-disable-line no-unused-vars
    throw new Error('Unimplemented');
  }

  /**
   * @param {LH.Artifacts.MetricComputationDataInput} data
   * @param {Object} artifacts
   * @return {Promise<LH.Artifacts.LanternMetric|LH.Artifacts.Metric>}
   */
  async compute_(data, artifacts) {
    const {trace, devtoolsLog, settings} = data;
    if (!trace || !devtoolsLog || !settings) {
      throw new Error('Did not provide necessary metric computation data');
    }

    const augmentedData = Object.assign({
      networkRecords: await artifacts.requestNetworkRecords(devtoolsLog),
      traceOfTab: await artifacts.requestTraceOfTab(trace),
    }, data);

    switch (settings.throttlingMethod) {
      case 'simulate':
        return this.computeSimulatedMetric(augmentedData, artifacts);
      case 'provided':
      case 'devtools':
        return this.computeObservedMetric(augmentedData, artifacts);
      default:
        throw new TypeError(`Unrecognized throttling method: ${settings.throttlingMethod}`);
    }
  }
}

module.exports = ComputedMetric;
