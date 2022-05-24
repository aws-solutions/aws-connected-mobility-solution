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
import {handleError} from '../utils/errors';
import { NewVehicleOwnerRequest } from './vehicle.models';
import { VehicleService } from './vehicle.service';

@controller('/vehicles')
export class VehicleController implements interfaces.Controller {

    constructor( @inject(TYPES.VehicleService) private vehicleService: VehicleService) {}

    @httpPost('/:vin/owners/:userId')
    public async registerVehicleOwner(@requestParam('vin') vin: string, @requestParam('userId') userId: string,
        @requestBody() request: NewVehicleOwnerRequest, @response() res: Response): Promise<void> {

        logger.info(`vehicle.controller ownVehicle: in: vin:${vin}, userId:${userId}, request:${JSON.stringify(request)}`);

        try {
            request.vin = vin;
            request.ownerId = userId;
            await this.vehicleService.registerOwner(request);
            res.status(201);
        } catch (e) {
            handleError(e, res);
        }

        logger.debug(`vehicle.controller ownVehicle: exit:`);
    }
}
