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

import { DTCModel } from '../models/model';

const creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const ddbTable = process.env.VEHICLE_DTC_TBL;
const dtcTable = process.env.DTC_TBL;

export class DTC {

    private docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

    public async getVehicleDtc(vin:string, page:string): Promise<any> {
        // tslint:disable-next-line:radix
        let _page = parseInt(page);
        if (isNaN(_page)) {
            _page = 0;
        }

        let result;
        try {
            result = await this._getDtcPage(vin,0, _page);
        } catch (err) {
            throw err;
        }

        return {
            Items: result
        };
    }

    public async createDtc(record:any) : Promise<any> {
        let dtc;
        try {
            dtc = await this._lookupDtc(record.value);

            const _dtc = {
                dtc_id: shortid.generate(),
                vin: record.vin,
                dtc: record.value,
                description: 'No description available.',
                steps: [] as string[],
                generated_at: moment.utc(record.timestamp, 'YYYY-MM-DD HH:mm:ss.SSSSSSSSS').format(),
                created_at: moment().utc().format(),
                updated_at: moment().utc().format(),
                acknowledged: false
            };

            if (!_.isEmpty(dtc)) {
                _dtc.description = dtc.Item.description;
            }

            const params = {
                TableName: ddbTable,
                Item: dtc
            };
            dtc = await this.docClient.put(params).promise();
        } catch (err) {
            throw err;
        }

        return dtc;
    }

    public async getDtc(dtc_id:string, vin:string): Promise<any> {
        const params = {
            TableName: ddbTable,
            Key: {
                dtc_id,
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

    public async deleteDtc(dtc_id:string, vin:string): Promise<any> {
        const params = {
            TableName: ddbTable,
            Key: {
                dtc_id,
                vin
            }
        };
        let result;
        try {
            result = await this.docClient.get(params).promise();
            if (!_.isEmpty(result)) {
                result = await this.docClient.delete(params).promise();
            } else {
                return {
                    error: {
                        message: 'The dtc record requested to update does not exist.'
                    }
                };
            }
        } catch (err) {
            throw err;
        }

        return result;
    }

    public async updateVehicle(dtc: DTCModel): Promise<any> {
        const params = {
            TableName: ddbTable,
            Key: {
                dtc_id: dtc.dtc_id,
                vin: dtc.vin
            }
        };

        let result;
        try {
            result = await this.docClient.get(params).promise();
            if (!_.isEmpty(dtc)) {
                result.Item.updated_at = moment().utc().format();
                const updateparams = {
                    TableName: ddbTable,
                    Item: result.Item
                };
                result = await this.docClient.put(updateparams).promise();
            } else {
                throw {
                    error: {
                        message: 'The dtc record requested to update does not exist.'
                    }
                };
            }
        } catch (err) {
            throw err;
        }

        return result;
    }

    private async _lookupDtc(code:string): Promise<any> {
        const params = {
            TableName: dtcTable,
            Key: {
                dtc: code
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

    private async _getDtcPage(vin:string, curpage:number, targetpage:number): Promise<any> {
        const params = {
            TableName: ddbTable,
            KeyConditionExpression: 'vin = :vin',
            ExpressionAttributeValues: {
                ':vin': vin
            },
            Limit: 20,
        };

        let result;
        try {
            result = await this.docClient.query(params).promise();

            if (curpage === targetpage) {
                return result.Items;
            } else if (result.LastEvaluatedKey) {
                curpage++;
                // getVehiclePage(ticket, result.LastEvaluatedKey, curpage, targetpage, cb);
            } else {
                return [];
            }
        } catch (err) {
            throw err;
        }
    }
}
