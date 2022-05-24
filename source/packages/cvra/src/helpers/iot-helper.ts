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
import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

/**
 * Helper function to interact with AWS IoT for cfn custom resource.
 *
 * @class iotHelper
 */

export class IotHelper  {
    public createTopicRule = async (settings:any) => {
        const params = {
            ruleName: settings.name,
            topicRulePayload: {
                actions: settings.actions,
                sql: settings.sql,
                description: settings.description,
                ruleDisabled: false
            }
        };
        logger.debug(`IotHelper.createTopicRule(): ${JSON.stringify(params)}`);
        const iot = new AWS.Iot();
        try {
            const result = await iot.createTopicRule(params).promise();
            logger.debug(`iot:createTopicRule: ${JSON.stringify(params)}`);
            return result;
        } catch (err) {
            throw err;
        }
    }

    public deleteTopicRule = async (settings:any) => {

        const params = {
            ruleName: settings.name
        };

        const iot = new AWS.Iot();
        try {
           const result = await iot.deleteTopicRule(params).promise();
           return result;
        } catch (err) {
            throw err;
        }
    }
}
