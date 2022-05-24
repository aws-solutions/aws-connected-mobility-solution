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

export class AccelerationCalc extends DataCalc<number> {

    private readonly ACCEL_PERIOD = 1000; // one second

    private start_speed: number;

    constructor() {
        super('acceleration');
        super.data=0;
        this.start_speed = 0.0;
    }

    iterate(snapshot:VehicleData) {

        const _cur_speed = snapshot.vehicle_speed;

        const _time_delta = super.getTimeDelta();

        if (_time_delta.asMilliseconds() >= this.ACCEL_PERIOD) {
            // logger.debug(`AccelerationCalc: existing: ${super.data}`);
            // logger.debug(`AccelerationCalc: _cur_speed: ${_cur_speed}`);
            // logger.debug(`AccelerationCalc: start_speed: ${this.start_speed}`);

            const _accel = (_cur_speed - this.start_speed) / 1; // speed difference / 1 sec = km/h/s
            // let _accel = ((_cur_speed - this.start_speed) / _time_delta) * 1000;

            // logger.debug(`AccelerationCalc: updated: ${_accel}`);

            this.start_speed = _cur_speed;
            super.data=_accel;
            super.updateLastCalcTime();
        }

    }
}
