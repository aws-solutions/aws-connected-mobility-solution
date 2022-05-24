/*--------------------------------------------------------------------------------------------------------------------
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
#                                                                                                                    *
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
#  with the License. A copy of the License is located at                                                             *
#                                                                                                                    *
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
#                                                                                                                    *
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
#  and limitations under the License.                                                                                *
#-------------------------------------------------------------------------------------------------------------------*/
import { logger } from './utils/logger';

import { DriverSafety } from './driversaftey/driverSafety';
import { Anomaly } from './anomaly/anomaly';

export const driverSafetyScoreService = async (event:any) => {
    logger.debug(`driverSafetyScoreService(): ${JSON.stringify(event)}`);
    const driverSafety = new DriverSafety();
    return await driverSafety.getDriverScorePrediction(event);
};

export const anomalyService = async (event: any) => {
    logger.debug(`anomalyService(): ${JSON.stringify(event)}`);

    const _anomaly = new Anomaly();

    const payload = new Buffer(event.Records[0].kinesis.data, 'base64').toString('ascii');
    const _record = JSON.parse(payload);
    try {
        return await _anomaly.createAnomaly(_record);
    } catch (err) {
        logger.error(err);
    }
};
