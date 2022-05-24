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
import { Response } from 'express';
import { interfaces, controller, response, requestBody, httpPost, requestParam } from 'inversify-express-utils';
import {logger} from '../utils/logger';

import { inject } from 'inversify';
import { TYPES } from '../di/types';
import { DeviceRegistrationRequest, DeviceRegistrationResponse, DeviceActivationRequest } from './device.models';
import { DeviceService } from './device.service';
import {handleError} from '../utils/errors';

@controller('/suppliers/:supplierExternalId/devices/:deviceId')
export class DeviceController implements interfaces.Controller {

    constructor( @inject(TYPES.DeviceService) private deviceService: DeviceService) {}

    @httpPost('/register')
    public async tcuRegistration(@requestParam('supplierExternalId') supplierExternalId: string, @requestParam('deviceId') deviceId: string,
        @requestBody() request: DeviceRegistrationRequest, @response() res: Response): Promise<DeviceRegistrationResponse> {

        logger.info(`[DeviceController.tcuRegistration()] in: supplierExternalId:${supplierExternalId}, deviceId:${deviceId}, request:${JSON.stringify(request)}`);
        try {
            request.deviceId = deviceId;
            const registrationResponse:DeviceRegistrationResponse = await this.deviceService.registerTCU(supplierExternalId, request);
            res.status(201);
            logger.debug(`[DeviceController.tcuRegistration()] registrationResponse: ${JSON.stringify(registrationResponse)}`);
            return registrationResponse;
        } catch (e) {
            handleError(e, res);
            return undefined;
        }
    }

    @httpPost('/activate')
    public async tcuActivation(@requestParam('deviceId') deviceId: string,
        @requestBody() request: DeviceActivationRequest, @response() res: Response): Promise<void> {

        logger.info(`device.controller tcuActivation: in: deviceId:${deviceId}, request:${JSON.stringify(request)}`);

        try {
            await this.deviceService.activateTCU(deviceId, request);
        } catch (e) {
            handleError(e, res);
        }

    }
}
