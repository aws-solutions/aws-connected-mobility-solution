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
import { LatLonSpherical } from 'geodesy';

import { VehicleData, Location, ModelInitializationParams } from './models';
import { DataCalc } from './data-calc';
import {Route} from './route-calc';
// import {logger} from '../utils/logger';

export class LocationCalc extends DataCalc <Location> {

    private route: Route;
    private routeStageIndex: number;

    constructor(params:ModelInitializationParams) {
        super('location');

        // logger.debug(`location-calc: constructor`);

        this.routeStageIndex = 0;
        this.route = params.route;
        super.data= {
            latitude: params.latitude,
            longitude: params.longitude,
            bearing: 0
        };
    }

    iterate(snapshot:VehicleData) {
        // logger.debug(`location-calc: iterate: in: snapshot:${JSON.stringify(snapshot)}`);

        super.data = snapshot.location;

        if (this.route===undefined) {
            return;
        }
        if(snapshot.current_route_stage > this.route.stages.length - 1) {
            return;
        }

        if(this.routeStageIndex !== snapshot.current_route_stage) {
            this.initRouteStage(snapshot.current_route_stage);
        }

        const lastKnownLocation = this.data;

        const routeStage = this.route.stages[this.routeStageIndex];
        const routeStageLocation:Location = {
            latitude: routeStage.end[1],
            longitude: routeStage.end[0],
            bearing: 0
        };

        const latLon = this.calculateLatLon(lastKnownLocation, routeStageLocation, 0.001);

        super.data = latLon;
        // logger.debug(`location-calc: iterate: in: exit:`);
    }

   private calculateLatLon (lastKnownLocation: Location, routeStageLocation:Location, pointPrecision: number): Location {
        // logger.debug(`location-calc: calculateLatLon: in: lastKnownLocation:${JSON.stringify(lastKnownLocation)}, routeStageLocation:${JSON.stringify(routeStageLocation)}, pointPrecision:${pointPrecision}`);

        const startLocation = new LatLonSpherical(lastKnownLocation.latitude, lastKnownLocation.longitude);
        const routeStageEndLocation = new LatLonSpherical(routeStageLocation.latitude, routeStageLocation.longitude);

        const bearing = startLocation.bearingTo(routeStageEndLocation);
        const nextLocation = startLocation.destinationPoint(pointPrecision, bearing);

        const res = {
            latitude: nextLocation.lat,
            longitude: nextLocation.lon,
            bearing
        };

        // logger.debug(`location-calc: calculateLatLon: in: exit:${JSON.stringify(res)}`);
        return res;
   }

   private initRouteStage(routeStageIndex:number): void {
    // logger.debug(`location-calc: initRouteStage: in: routeStageIndex:${JSON.stringify(routeStageIndex)}`);
       this.routeStageIndex = routeStageIndex;
       if(routeStageIndex === undefined) {
            this.routeStageIndex = 0;
       }

       super.data = {
            latitude: this.route.stages[this.routeStageIndex].start[1],
            longitude: this.route.stages[this.routeStageIndex].start[0],
            bearing: 0
        };

   }
}
