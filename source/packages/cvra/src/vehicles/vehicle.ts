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
import _ from 'underscore';
import AWS from 'aws-sdk';

import { Ticket, VehicleModel } from '../models/model';

const creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const ddbTable = process.env.VEHICLE_OWNER_TBL;

export class Vehicle {
    private docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

    public listVehicles = async (ticket: Ticket) => {
        const params = {
            TableName: ddbTable,
            KeyConditionExpression: 'owner_id = :uid',
            ExpressionAttributeValues: {
                ':uid': ticket['cognito:username']
            }
        };

        let result;
        try {
            result = await this.docClient.query(params).promise();
        } catch (err) {
            throw err;
        }
        return result;
    }

    public createVehicle = async (ticket:Ticket, vehicle:VehicleModel) => {
        vehicle.owner_id = ticket['cognito:username'];
        const params = {
            TableName: ddbTable,
            Item: vehicle
        };

        let result;
        try {
            result = await this.docClient.put(params).promise();
        } catch (err) {
            throw err;
        }
        return result;
    }

    public getVehicle = async (ticket:Ticket, vin:string) => {
        const params = {
            TableName: ddbTable,
            Key: {
                owner_id: ticket['cognito:username'],
                vin
            }
        };

        let result;
        try {
            result = await this.docClient.get(params).promise();
        } catch (err) {
            throw err;
        }
        if (!_.isEmpty(result)) {
            return result;
        } else {
            throw {
                error: {
                    message: 'The vehicle requested does not exist.'
                }
            };
        }
    }
}
