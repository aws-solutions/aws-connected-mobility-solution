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
import shortid from 'shortid';
import axios from 'axios';
import config from 'config';
import { LatLonSpherical } from 'geodesy';
import { decode } from '@mapbox/polyline';

import {
    IGeneratorParams,
    IGeoPoint,
    ILocation, IMapboxDrivingDirections,
    IMapboxRoute,
    IRouteBounds,
    ISimulatorRoute,
    ISimulatorRouteStage,
    ISimulatorRouteTrigger,
    SimulatorRouteProfiles
} from './models/route.models';

export class RouteGenerator {

    private readonly startLocation: IGeoPoint;
    private readonly distance: number;
    private readonly profile: SimulatorRouteProfiles;
    private readonly triggers: ISimulatorRouteTrigger[];

    constructor (params: IGeneratorParams) {
        this.startLocation = params.startLocation;
        // generate a distance between 0 - 100 km
        this.distance = params.distance || this.getRandomDistance();

        this.profile = params.profile || SimulatorRouteProfiles.normal;
        this.triggers = params.triggers || [];
    }

    private async queryRouteFromMapbox (coordinates: string): Promise<IMapboxDrivingDirections> {
        // logger.debug(`route-gen: queryRouteFromMapbox: in: ${coordinates}`);
        try {
            const result = await axios.request({
                url: `/directions/v5/mapbox/driving/${coordinates}`,
                baseURL: 'https://api.mapbox.com/',
                method: 'GET',
                params:{
                    access_token: config.get('mapbox.access_token'),
                    steps:true,
                    overview:'full'
                }
            });
            const route = result.data;
            // logger.debug(`route-gen: queryRouteFromMapbox: exit: ${JSON.stringify(route,null,2)}`);
            return route;
        } catch (err) {
            throw err;
        }

    }

    public async generate(): Promise<ISimulatorRoute> {
        // logger.debug(`route-gen: generate: in:`);
        try {
            const simulatorRoute = await this.buildSimulatorRoute(this.startLocation, this.distance);
            // logger.debug(`route-gen: generate: exit:${JSON.stringify(simulatorRoute)}`);
            return simulatorRoute;
        } catch (err) {
            throw err;
        }
    }

    public async buildSimulatorRoute(startLocation: IGeoPoint, distance: number): Promise<ISimulatorRoute> {
        const routeBounds = await this.generateRandomRouteBounds(startLocation, distance);
        const routeBoundString = await this.generateRouteString(routeBounds);
        const mapboxDirections = await this.queryRouteFromMapbox(routeBoundString);
        const simulatorRoute = await this.parseRoute(mapboxDirections);

        if(simulatorRoute.stages.length === 0) {
            return this.buildSimulatorRoute(this.startLocation, this.getRandomDistance());
        }
        // logger.debug(`route-gen: generate: exit:${JSON.stringify(simulatorRoute)}`);
        return simulatorRoute;
    }

    private parseRoute (mapboxDirections: IMapboxDrivingDirections): ISimulatorRoute {
        // logger.debug(`route-gen: parseRoute: in: mapboxRoute:${JSON.stringify(mapboxRoute)}`);
        const mapboxRoute:IMapboxRoute = mapboxDirections.routes[0];
        let collection:any = decode(mapboxRoute.geometry);

        // Reverse the location points
        collection = collection.map((item: ILocation) => {
            return [item[1], item[0]];
        });

        // make the collection of points to an even number so grouping can be easier
        if (collection.length % 2 !== 0) {
            collection.pop();
        }

        let routeDistance = 0;
        const routeStart = collection[0];
        const routeEnd = collection[collection.length - 1];
        const routeStages: ISimulatorRouteStage[] = [];
        const routeSummary = mapboxRoute.legs[0].summary;
        const routeId = shortid.generate();

        // Repack the collection points as stages
        for (let i = 0 ; i <= collection.length; i++) {
            // Dont let the index go out of bounds of the array
            if(i + 1 < collection.length - 1) {
                const _start = collection[i];
                const _end = collection[i+1];
                const _distance = this.calculateDistance(_start, _end);
                const _stage: ISimulatorRouteStage = {
                    stage: i,
                    start: _start,
                    end: _end,
                    km: _distance
                };
                routeStages.push(_stage);
                routeDistance+=_distance;
            }
        }

        const route = {
            start: routeStart,
            end: routeEnd,
            description: routeSummary,
            name: routeId,
            profile: this.profile,
            route_id: routeId,
            triggers: this.triggers,
            stages: routeStages,
            km: routeDistance
        };
        // logger.debug(`route-gen: parseRoute: exit:${JSON.stringify(route)}`);
        return route;

    }

    private calculateDistance(startPoint:ILocation, endPoint:ILocation) : number {
        // logger.debug(`route-gen: calculateDistance: startPoint:${JSON.stringify(startPoint)}, endPoint:${JSON.stringify(endPoint)}`);
        const p1 = new LatLonSpherical(startPoint[1], startPoint[0]);
        const p2 = new LatLonSpherical(endPoint[1], endPoint[0]);
        const distance = p1.distanceTo(p2)/1000;
        // logger.debug(`route-gen: calculateDistance: exit:${distance}`);
        return distance;
    }

    private generateRandomRouteBounds(startLocation: IGeoPoint, routeDistance: number): IRouteBounds {
        // logger.debug(`route-gen: generateRandomRouteBounds: in: startLocation:${JSON.stringify(startLocation)}, routeDistance:${routeDistance}`);

        const distance = routeDistance; // meters distance
        const randomAngle = Math.floor(Math.random() * 360) + 1; // random angle between 0 and 360

        const routeStartSpherical = new LatLonSpherical(startLocation.lat, startLocation.lon);
        const routeEndSpherical = routeStartSpherical.destinationPoint(distance, randomAngle);

        const bounds = {
            start: { lat: routeStartSpherical.lat, lon: routeStartSpherical.lon},
            end: { lat: routeEndSpherical.lat, lon: routeEndSpherical.lon},
        };
        // logger.debug(`route-gen: generateRandomRouteBounds: exit: bounds:${JSON.stringify(bounds)}`);
        return bounds;
    }

    private generateRouteString(routeBounds: IRouteBounds) : string {
        return `${routeBounds.start.lon},${routeBounds.start.lat};${routeBounds.end.lon},${routeBounds.end.lat}`;
    }

    private getRandomDistance(): number {
        return (Math.random() * (2000 - 500)) + 500;
    }

}
