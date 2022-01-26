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

import moment from 'moment';
import { IgnitionStatus, VehicleData } from './models';
import { DataCalc } from './data-calc';

export class AggregatorCalc extends DataCalc<VehicleData> {

    private measures:Measure[];
    private last_accel_calc: moment.Moment;
    private accel_start_speed: number;

    constructor() {
        super('aggregation');
        this._initialize_data();
    }

    _initialize_data() {
        super.updateLastCalcTime();
        this.last_accel_calc = moment();
        this.accel_start_speed = 0.0;

        const data = new VehicleData();
        data.start_time = moment().toISOString();
        super.data=data;

        this.measures = [{
            name: 'vehicle_speed',
            mean: true,
            cnt: 0
        }, {
            name: 'engine_speed',
            mean: true,
            cnt: 0
        }, {
            name: 'torque_at_transmission',
            mean: true,
            cnt: 0
        }, {
            name: 'oil_temp',
            mean: true,
            cnt: 0
        }, {
            name: 'accelerator_pedal_position',
            mean: true,
            cnt: 0
        }, {
            name: 'brake',
            mean: true,
            cnt: 0
        }, {
            name: 'ignition_status'
        }, {
            name: 'brake_pedal_status'
        }, {
            name: 'transmission_gear_position'
        }, {
            name: 'odometer'
        }, {
            name: 'fuel_level'
        }, {
            name: 'fuel_consumed_since_restart'
        }, {
            name: 'latitude'
        }, {
            name: 'longitude'
        }];
    }

    reset() {
        this._initialize_data();
    }

    iterate(snapshot:VehicleData) {
        const _current_time = moment();
        const _time_delta = _current_time.diff(super.lastCalcTime);
        const _accel_time_delta = _current_time.diff(this.last_accel_calc);

        const data = super.data;

        for (const measure of this.measures) {
            if (measure.mean) {
                const _name = [measure.name, 'mean'].join('_');
                data[_name] = this.getMean(data[_name], snapshot[measure.name], measure.cnt);
                measure.cnt++;
            } else {
                data[measure.name] = snapshot[measure.name];
            }

            if (measure.name === 'vehicle_speed') {
                if (snapshot.vehicle_speed > 112.6) {
                    data.high_speed_duration += _time_delta;
                    // console.log(['high speed trigger', snapshot.vehicle_speed, this.data.high_speed_duration]);
                }

                if (snapshot.ignition_status === IgnitionStatus.run && snapshot.vehicle_speed <= 1.0) {
                    data.idle_duration += _time_delta;
                    // console.log(['idle trigger', snapshot.vehicle_speed, this.data.idle_duration]);
                }

                if (_accel_time_delta >= 1000) {
                    const _period = moment.duration(_accel_time_delta).asSeconds();
                    const _accel = this.getAcceleration(this.accel_start_speed, snapshot.vehicle_speed, _period);
                    if (_accel >= 12) {
                        data.high_acceleration_event++;
                        // console.log('high_acceleration_event', this.data.high_acceleration_event);
                    }

                    if (snapshot.brake > 0.0 && _accel < -16.0) {
                        data.high_braking_event++;
                    }

                    this.accel_start_speed = snapshot.vehicle_speed;
                    this.last_accel_calc = moment();
                }

            }

        }

        if (snapshot.ignition_status === IgnitionStatus.off) {
            super.data.end_time = moment().toISOString();
        }

        super.updateLastCalcTime();
    }

    // Returns the new average after including x
    private getMean(prev_avg:number, new_val:number, cnt:number) : number {
        return ((prev_avg * cnt) + new_val) / (cnt + 1);
    }

    // Returns the acceleration in km/hr/sec
    private getAcceleration(start_speed:number, end_speed:number, period:number) :number {
        return (end_speed - start_speed) / period;
    }

}

interface Measure {
    name: string;
    mean?: boolean;
    cnt?: number;
}
