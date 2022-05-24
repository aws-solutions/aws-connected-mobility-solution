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

import { VehicleData, Gears } from './models';
import { DataCalc } from './data-calc';

export class TorqueCalc extends DataCalc<number> {

    private readonly ENGINE_TO_TORQUE = 500.0 / 16382.0;

    constructor() {
        super('torque_at_transmission');
        super.data=0.0;
    }

    iterate(snapshot:VehicleData) {
        const accelerator = snapshot.accelerator_pedal_position;
        const engine_speed = snapshot.engine_speed;
        const engine_running = snapshot.engine_running;

        let gear_number = snapshot.transmission_gear_position;

        // First gear is the basline.
        gear_number--;
        if (gear_number<Gears.first) {
            gear_number=Gears.first;
        }

        // Giving sixth gear half the torque of first.
        const gear_ratio = 1 - (gear_number * .1);

        const drag = engine_speed * this.ENGINE_TO_TORQUE;
        const power = accelerator * 15 * gear_ratio;

        if (engine_running) {
            super.data= (power - drag);
        } else {
            super.data= (-drag);
        }
    }

}
