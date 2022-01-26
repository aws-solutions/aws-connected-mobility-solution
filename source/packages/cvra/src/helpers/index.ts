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
/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { send } from 'cfn-response-promise';

import { IotHelper } from './iot-helper';
import { KinesisHelper } from './kinesis-helper';
import {logger} from '../utils/logger';

/**
 * Request handler.
 */
export const handler = async (event: any, context: any) => {
    logger.debug(`Event:${JSON.stringify(event)} Context: ${JSON.stringify(context)}`);

    if (event.RequestType === 'Delete') {
        if (event.ResourceProperties.customAction === 'dynamoDBv2IotRule') {

            const _iotHelper = new IotHelper();
            const _params = {
                name: event.ResourceProperties.name,
            };

            let result;
            try {
                result = await _iotHelper.deleteTopicRule(_params);
                return await send(event, context, 'SUCCESS', { result });
            } catch (err) {
                logger.error(err);
                const _err = ['Deleting IoT Topic Rule', event.ResourceProperties.name, 'failed'].join(' ');
                return await send(event, context, 'FAILED', { _err });
            }

        } else if (event.ResourceProperties.customAction === 'kinesisApplication') {
            const _kinesisHelper = new KinesisHelper();
            const _params = {
                appName: event.ResourceProperties.name,
            };

            try {
                const result = await _kinesisHelper.deleteKinesisAnalyticsApp(_params);
                await send(event, context, 'SUCCESS', {result});
            } catch (err) {
                logger.error(err);
                const _err = ['Deleting Kinesis Application', event.ResourceProperties.name, 'failed'].join(' ');
                return await send(event, context, 'FAILED', { _err });
            }

        } else {
             return await send(event, context, 'SUCCESS', {});
        }
    }

    if (event.RequestType === 'Create') {
        if (event.ResourceProperties.customAction === 'dynamoDBv2IotRule') {
            const _iotHelper = new IotHelper();
            const _params = {
                name: event.ResourceProperties.name,
                actions: [{
                    dynamoDBv2: {
                        putItem: {
                            tableName: event.ResourceProperties.tableName
                        },
                        roleArn: event.ResourceProperties.roleArn
                    }
                }],
                sql: event.ResourceProperties.sql,
                description: event.ResourceProperties.description
            };

            try {
                const result = await _iotHelper.createTopicRule(_params);
                return await send(event, context, 'SUCCESS', { result });
            } catch (err) {
                logger.error(err);
                const _err =['Creating IoT Topic Rule', event.ResourceProperties.name, 'failed'].join(' ');
                return await send(event, context, 'FAILED', { _err });
            }

        } else if (event.ResourceProperties.customAction === 'kinesisApplication') {
            const _kinesisHelper = new KinesisHelper();
            const _params = {
                appName: event.ResourceProperties.name,
                deliveryStream: event.ResourceProperties.deliveryStream,
                anomalyStream: event.ResourceProperties.anomalyStream,
                roleArn: event.ResourceProperties.roleArn
            };

            try {
                const result = await _kinesisHelper.createKinesisAnalyticsApp(_params);
                return await send(event, context, 'SUCCESS', { result });
            } catch (err) {
                logger.error(err);
                const _err = ['Creating Kinesis Application', event.ResourceProperties.name, 'failed'].join(' ');
                return await send(event, context, 'FAILED', { _err });
            }

        } else {
            return await send(event, context, 'SUCCESS', {});
        }
    } if (event.RequestType === 'Update') {
        return await send(event, context, 'SUCCESS', {});
    }
};
