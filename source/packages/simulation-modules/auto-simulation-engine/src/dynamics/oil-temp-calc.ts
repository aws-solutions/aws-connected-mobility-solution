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

import { VehicleData } from './models';
import { DataCalc } from './data-calc';
import { RouteTriggerType } from './route-calc';

export class OilTempCalc extends DataCalc<number> {

    private readonly TEMP_COEFFICIENT = 2.0417;

    private _total_time:number;
    private _operating_zone:number;
    private _trigger_tripped: boolean;

    constructor() {
        super('oil_temp');
        super.data=0;
        this._total_time = 0;
        this._operating_zone = 0.0;
        this._trigger_tripped = false;
    }

    iterate(snapshot:VehicleData) {

        const snapshot_triggers = snapshot.triggers;

        const time_step = super.getTimeStep();
        super.updateLastCalcTime();
        this._total_time += time_step;

        const highOilTempTrigger = snapshot_triggers.filter(t=> t.type===RouteTriggerType.oiltemp);

        if (this._total_time <= 115 && highOilTempTrigger.length===0) {
            const _oiltemp = time_step * this.TEMP_COEFFICIENT; // Time * degree/sec.
            super.data = super.data + _oiltemp;
            this._operating_zone = super.data;
        } else {
            // normal oil temp jitter
            const _upper = this._operating_zone + 5;
            const _lower = this._operating_zone - 5;
            super.data = (Math.random() * (_upper - _lower) + _lower);
        }

        if (snapshot_triggers) {
            if (highOilTempTrigger.length>0 && !this._trigger_tripped) {
                this._operating_zone = this.get_high_temp();
                this._trigger_tripped = true;
            }
        }
    }

    private get_high_temp() : number {
        const _rand = Math.floor(Math.random() * (320 - 275)) + 275;
        return _rand;
    }

}
