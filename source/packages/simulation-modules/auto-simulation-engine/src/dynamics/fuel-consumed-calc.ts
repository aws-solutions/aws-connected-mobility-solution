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
import { VehicleData } from './models';
import { DataCalc } from './data-calc';

export class FuelConsumedCalc extends DataCalc<number> {

    private readonly MAX_FUEL = 0.0015; // #In liters per second at full throttle.
    private readonly IDLE_FUEL = 0.000015;

    constructor() {
        super('fuel_consumed_since_restart');
        super.data=0;
    }

    iterate(snapshot:VehicleData) {
        const accelerator_percent = snapshot.accelerator_pedal_position;
        const engine_running = snapshot.engine_running;

        const time_step =super.getTimeStep();
        this.updateLastCalcTime();

        // logger.debug(`FuelConsumedCalc: existing: ${super.data}`);
        // logger.debug(`FuelConsumedCalc: accelerator_percent: ${accelerator_percent}`);
        // logger.debug(`FuelConsumedCalc: engine_running: ${engine_running}`);

        if (engine_running) {
            const d = super.data + this.IDLE_FUEL + (this.MAX_FUEL * (accelerator_percent / 100) * time_step);
            super.data=d;
            // logger.debug(`FuelConsumedCalc: updated: ${super.data}`);
        }
    }

}
