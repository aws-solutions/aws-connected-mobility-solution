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

export class HeadingCalc extends DataCalc<number> {

    constructor() {
        super('heading');
        super.data=0.0;
    }

    iterate(snapshot:VehicleData) {
        const vehicle_speed = snapshot.vehicle_speed;
        const steering_wheel_angle = snapshot.steering_wheel_angle;

        // 600 degree steering == 45 degree wheels.
        const wheel_angle = steering_wheel_angle / 13.33;
        const wheel_angle_rad = wheel_angle * Math.PI / 180;
        let calc_angle = -wheel_angle_rad;
        if (wheel_angle < 0) {
            calc_angle = calc_angle - (Math.PI / 2);
        } else {
            calc_angle = calc_angle + (Math.PI / 2);
        }

        // should return number between 28 m and infinity
        const turning_circumference_km = 0.028 * Math.tan(calc_angle);

        const time_step = super.getTimeStep();
        super.updateLastCalcTime();

        const distance = time_step * (vehicle_speed / 3600); // Time * km / s.

        const delta_heading = (distance / turning_circumference_km) * 2 * Math.PI;
        let temp_heading = super.data + delta_heading;
        while (temp_heading >= (2 * Math.PI)) {
            temp_heading = temp_heading - (2 * Math.PI);
        }

        while (temp_heading < 0) {
            temp_heading = temp_heading + (2 * Math.PI);
        }

        super.data=temp_heading;
    }

}
