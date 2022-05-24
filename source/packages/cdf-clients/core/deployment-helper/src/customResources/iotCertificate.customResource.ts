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

import { injectable, inject } from 'inversify';

import { TYPES } from '../di/types';
import { logger } from '../utils/logger';
import { CustomResource } from './customResource'
import { CustomResourceEvent } from './customResource.model';

@injectable()
export class IotCertificateCustomResource implements CustomResource {

    private _iot: AWS.Iot;

    constructor(
        @inject(TYPES.IotFactory) iotFactory: () => AWS.Iot,
    ) {
        this._iot = iotFactory();
    }

    public async create(customResourceEvent: CustomResourceEvent) {
        logger.debug(`IotPoliciesCustomResource: create: in: customResourceEvent: ${JSON.stringify(customResourceEvent)}`);

        const policyName = customResourceEvent?.ResourceProperties?.PolicyName;
        const certificatePair = await this._iot.createKeysAndCertificate({setAsActive: true}).promise();
        await this._iot.attachPrincipalPolicy({
            policyName: policyName,
            principal: certificatePair.certificateArn
        }).promise();

        return {
            certificatePem: certificatePair.certificatePem,
            certificateKey: certificatePair.keyPair.PrivateKey,
            certificateId: certificatePair.certificateId
        }
    }

    public async update() {
        return {}
    }

    public async delete() {
        return {};
    }
}


