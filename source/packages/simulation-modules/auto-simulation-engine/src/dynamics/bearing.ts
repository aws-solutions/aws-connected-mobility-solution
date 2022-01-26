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
import { VehicleData, Location } from './models';
import { DataCalc } from './data-calc';
import {Route} from './route-calc';

export class BearingCalc extends DataCalc <number> {

    private route:Route;

    constructor(route:Route) {
        super('bearing');
        super.data=0;
        this.route = route;
    }

    iterate(snapshot:VehicleData) {
        const route_stage = snapshot.current_route_stage;
        if (route_stage === undefined || route_stage > this.route.stages.length - 1) {
            return;
        }

        const start:Location = {
            latitude: this.route.stages[route_stage].start[1],
            longitude: this.route.stages[route_stage].start[0],
            bearing:0
        };

        const end:Location = {
            latitude: this.route.stages[route_stage].end[1],
            longitude: this.route.stages[route_stage].end[0],
            bearing:0
        };

        const bearing = this.calculateBearing(start, end);

        super.data = bearing;
    }

    private calculateBearing(start:Location, end:Location) {

        const teta1 = this.radians(start.latitude);
        const teta2 = this.radians(end.latitude);
        // Safe, not used on purpose.
        // const _delta1 = this.radians(end_latitude - start_latitude);
        const delta2 = this.radians(end.longitude - start.longitude);

        const y = Math.sin(delta2) * Math.cos(teta2);
        const x = Math.cos(teta1) * Math.sin(teta2) - Math.sin(teta1) * Math.cos(teta2) * Math.cos(delta2);
        let bearing = Math.atan2(y, x);
        bearing = this.degrees(bearing);
        bearing = (bearing + 360) % 360;

        return bearing;
    }

    private radians(degrees:number) {
        return degrees * Math.PI / 180;
    }

    private degrees(radians:number) {
        return radians * 180 / Math.PI;
    }
}
