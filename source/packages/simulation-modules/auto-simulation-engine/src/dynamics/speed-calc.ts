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

export class SpeedCalc extends DataCalc<number> {

    private AIR_DRAG_COEFFICIENT = .000008;
    private ENGINE_DRAG_COEFFICIENT = 0.0004;
    private BRAKE_CONSTANT = 0.1;
    private ENGINE_V0_FORCE = 30; // units are cars * km / h / s

    // TODO: doesn't appear to be used:
    // private CAR_MASS = 1; // Specifically, one car.

    constructor() {
        super('vehicle_speed');
        super.data=0.0;
    }

    iterate(snapshot:VehicleData) {
        // logger.debug(`SpeedCalc: existing: ${super.data}`);

        const accelerator_percent = snapshot.accelerator_pedal_position;
        const brake = snapshot.brake;
        const parking_brake_status = snapshot.parking_brake_status;
        const engine_running = snapshot.engine_running;
        const engine_speed = snapshot.engine_speed;
        const gear = snapshot.transmission_gear_position;

        const speed = super.data; // Just to avoid confution

        const air_drag = speed * speed * speed * this.AIR_DRAG_COEFFICIENT;

        const engine_drag = engine_speed * this.ENGINE_DRAG_COEFFICIENT;

        let engine_force = 0.0;
        if (engine_running && gear>Gears.neutral) {
            // accelerator_percent is 0.0 to 100.0, not 0
            engine_force = (this.ENGINE_V0_FORCE * accelerator_percent / (50 * gear));
        }

        let acceleration = engine_force - air_drag - engine_drag - .1 - (brake * this.BRAKE_CONSTANT);

        if (parking_brake_status) {
            acceleration = acceleration - (this.BRAKE_CONSTANT * 100);
        }
        const time_step = super.getTimeStep();
        super.updateLastCalcTime();

        let impulse = acceleration * time_step;
        if ((impulse + speed) < 0.0) {
            impulse = -speed;
        }

        // logger.debug(`SpeedCalc: accelerator_percent:${accelerator_percent}, brake:${brake}, parking_brake_status:${parking_brake_status}, engine_running:${engine_running}, engine_speed:${engine_speed}, gear:${gear}, speed:${speed}, air_drag:${air_drag}, engine_drag:${engine_drag}, engine_force:${engine_force}, acceleration:${acceleration}, time_step:${time_step}, impulse:${impulse}`);

        super.data=speed + impulse;

        // logger.debug(`SpeedCalc: updated: ${super.data}`);

    }

}
