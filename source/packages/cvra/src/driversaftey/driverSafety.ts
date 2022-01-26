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
import moment from 'moment';
import AWS from 'aws-sdk';

import { logger } from '../utils/logger';

const creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const ddbTable = process.env.VEHICLE_TRIP_TBL;

export class DriverSafety {
    private docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

    public async updateVehicleTrip(payload:any): Promise<any> {
        logger.debug(`DriverSafety.updateVehicleTrip(): ${JSON.stringify(payload)}`)
        const params = {
            TableName: ddbTable,
            Item: payload
        };
        let result;
        try {
            result = await this.docClient.put(params).promise();
        } catch (err) {
            throw err;
        }
        return result;
    }

    public async getDriverScorePrediction(payload:any): Promise<any> {
        logger.debug(`DriverSafety.getDriverScorePrediction: ${JSON.stringify(payload)}`);
        const summary = payload.TripSummary;
        const _triptime = moment(summary.EndTime).diff(moment(summary.StartTime));
        const _timedelta = (_triptime - summary.IdleDuration) / _triptime;
        const _odometer = Math.ceil(summary.Distance);

        let _raw_score = (_timedelta +
            Math.abs(((_odometer - summary.HighBrakingEvent) / _odometer)) +
            Math.abs(((_odometer - summary.HighAccelerationEvent) / _odometer)) +
            ((summary.HighSpeedDuration / _triptime) * _odometer)) / 4;

        if (_raw_score > 1) {
            _raw_score = _raw_score / 100;
        }

        summary.DriverSafetyScore = _raw_score * 100;
        let result;

        try {
            result = await this.updateVehicleTrip(payload);
        } catch (err) {
            throw err;
        }

        return result;

    }
}
