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
import { CustomResourceEvent } from './customResource.model';
import { CustomResource } from './customResource';

@injectable()
export class IotEventsCustomResource implements CustomResource {

    private _iot: AWS.Iot;

    constructor(
        @inject(TYPES.IotFactory) iotFactory: () => AWS.Iot,
    ) {
        this._iot = iotFactory();
    }

    public async create(_customResourceEvent: CustomResourceEvent) : Promise<any> {
        const params:AWS.Iot.Types.UpdateEventConfigurationsRequest = {
            eventConfigurations: {
                JOB: {
                    Enabled: true
                }
            }
        };
        return await this._iot.updateEventConfigurations(params).promise();
    }

    public async update(_customResourceEvent: CustomResourceEvent) : Promise<any> {
        return await this.create(_customResourceEvent);
    }

    public async delete(_customResourceEvent: CustomResourceEvent) : Promise<any> {
        return {};
    }
}