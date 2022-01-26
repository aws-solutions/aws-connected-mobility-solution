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

/**
 * @author Solution Builders
 */

// import {logger} from '../utils/logger';
import { VehicleData, Gears } from './models';
import { DataCalc } from './data-calc';

export class EngineSpeedCalc extends DataCalc<number> {

    private readonly IDLE_SPEED = 2000;

    constructor() {
        super('engine_speed');
        super.data=0;
    }

    iterate(snapshot:VehicleData) {
        // logger.debug(`EngineSpeedCalc: existing: ${super.data}`);

        const vehicle_speed = snapshot.vehicle_speed;
        const gear = snapshot.transmission_gear_position;

        let data;
        if (gear===Gears.neutral) {
            // TODO add jitter to this:
            data=this.IDLE_SPEED;
        } else {
            data = 16382 * vehicle_speed / (100.0 * gear);
        }

        // logger.debug(`EngineSpeedCalc: vehicle_speed: ${vehicle_speed}`);
        // logger.debug(`EngineSpeedCalc: gear: ${gear}`);
        // logger.debug(`EngineSpeedCalc: updated: ${data}`);

        super.data=data;
    }
}
