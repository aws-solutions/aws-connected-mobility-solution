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

export class GearIntCalc extends DataCalc<Gears> {

    private readonly SPEEDS = [
        [0, 0],
        [0, 25],
        [20, 50],
        [45, 75],
        [70, 100],
        [95, 125],
        [120, 500]
    ];

    constructor() {
        super('transmission_gear_position');
        super.data=Gears.first;
    }

    // TODO: not used anywhere?
    public shift_up() : void {
        let gear:number =super.data;
        gear++;
        if (gear > 6) {
            gear = 6;
        }
        super.data=gear;
    }

    // TODO: not used anywhere?
    public shift_down() : void {
        let gear:number =super.data;
        gear--;
        if (gear < 1) {
            gear = 1;
        }
        super.data=gear;
    }

    iterate(snapshot:VehicleData) {
        const manual = snapshot.manual_trans;
        const vehicle_speed = snapshot.vehicle_speed;
        const engine_running = snapshot.engine_running;

        // logger.debug(`GearIntCalc: before:${super.data}`);
        // logger.debug(`GearIntCalc: manual:${manual}, vehicle_speed:${vehicle_speed}, engine_running:${engine_running}`);

        if (!engine_running) {
            return;
        }

        if (!manual) {
            if (vehicle_speed < this.SPEEDS[super.data][0]) {
                super.data=super.data-1;
            } else if (vehicle_speed > this.SPEEDS[super.data][1]) {
                super.data=super.data+1;
            }
        }

        // logger.debug(`GearIntCalc: after:${super.data}`);
    }
}
