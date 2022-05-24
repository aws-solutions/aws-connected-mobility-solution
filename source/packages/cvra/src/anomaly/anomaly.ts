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
import shortid from 'shortid';
import moment from 'moment';
import _ from 'underscore';
import AWS from 'aws-sdk';
import {logger} from '../utils/logger';

const creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const ddbTable = process.env.VEHICLE_ANOMALY_TBL;

export class Anomaly {

    private docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

    public async getVehicleAnomaly(vin:string, page:string): Promise<any> {
        // tslint:disable-next-line:radix
        let _page = parseInt(page);
        if (isNaN(_page)) {
            _page = 0;
        }
        let result;
        try {
            result = await this.getAnomalyPage(vin, null, 0, _page);
        } catch (err) {
            throw err;
        }

        return {
            Items:result
        };
    }

    // Todo: change the input "record" param to "anomaly" and create a type for it
    public async createAnomaly(record:any): Promise<any> {
        logger.debug(`anomalyService.createAnomaly(): ${JSON.stringify(record)}`);
        logger.debug(`is low_lim lower then the temp ?: ${record.low_limit < record.oil_temp}`);
        if (record.low_limit < record.oil_temp) {
            try {
                const anomaly_id = shortid.generate();
                const _anomaly = {
                    pk: record.vin,
                    sk: `A:${record.anomaly_type}`,
                    anomaly_id: `${anomaly_id}`,
                    value: record.val,
                    anomaly_type: record.anomaly_type,
                    vin: record.vin,
                    anomaly_score: record.ANOMALY_SCORE,
                    identified_at: moment(record.ts).utc().format(),
                    created_at: moment().utc().format(),
                    updated_at: moment().utc().format()
                };

                await this.docClient.put({
                    TableName: ddbTable,
                    Item: _anomaly
                }).promise();

                return _anomaly;
            } catch (err) {
                throw err;
            }
        } else {
            return {};
        }
    }

    public async getAnomaly(id:string, vin:string): Promise<any> {
        const params = {
            TableName: ddbTable,
            Key: {
                dtc_id: id,
                vin
            }
        };
        let result;
        try {
            result = await this.docClient.get(params).promise();
        } catch (err) {
            throw err;
        }
        return result;
    }

    public async deleteAnomaly(id:string, vin:string): Promise<any> {
        const params = {
            TableName: ddbTable,
            Key: {
                dtc_id: id,
                vin
            }
        };

        let anomaly;
        try {
            anomaly = this.docClient.get(params).promise();
        } catch (err) {
            throw err;
        }

        let result;
        if (!_.isEmpty(anomaly)) {
            result = await this.docClient.delete(params);
        } else {
            throw {
                error: {
                    message: 'The anomaly record requested to update does not exist.'
                }
            };
        }

        return result;
    }

    private async getAnomalyPage(vin:string, _lastevalkey:number, curpage:number, targetpage:number): Promise<any> {
        const params = {
            TableName: ddbTable,
            KeyConditionExpression: 'vin = :vin',
            ExpressionAttributeValues: {
                ':vin': vin
            },
            Limit: 20
        };

        let result;
        try {
            result =  await this.docClient.query(params).promise();
            if (curpage === targetpage) {
                return result.Items;
            } else {
                return[];
            }
        } catch (err) {
            throw err;
        }
    }

}
