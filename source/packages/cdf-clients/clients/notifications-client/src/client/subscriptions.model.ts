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

import { EventConditions } from './events.model';

export interface SubscriptionResource {
    id?: string;

    principalValue?: string;
    ruleParameterValues?: { [key: string] : string};
    event?: {
        id: string;
        name?: string;
        conditions?: EventConditions;
    };
    user?: {
        id: string;
    };

    targets?: SubscriptionTargets;

    enabled?: boolean;
    alerted?: boolean;
}

export type SubscriptionTargets = {
    email?: EmailSubscriptionConfig;
    sms?: SMSSubscriptionConfig;
    mqtt?: MQTTSubscriptionConfig;
    dynamodb?: DynamoDBSubscriptionConfig;
};

export type AttributeMapping = { [key: string] : string};

export type DynamoDBSubscriptionConfig = {
    tableName:string;
    attributeMapping: AttributeMapping;
};

export type EmailSubscriptionConfig = {
    address:string
};

export type SMSSubscriptionConfig = {
    phoneNumber:string
};

export type MQTTSubscriptionConfig = {
    topic:string
};

export interface SubscriptionResourceList {
    results: SubscriptionResource[];
    pagination?: {
        offset: {
            eventId: string,
            subscriptionId: string
        }
    };
}
