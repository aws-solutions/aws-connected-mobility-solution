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
export interface IGeneratorParams {
    startLocation: IGeoPoint;
    distance?: number;
    triggers?: ISimulatorRouteTrigger[];
    profile?: SimulatorRouteProfiles;
}

export enum SimulatorRouteProfiles {
    aggressive= 'aggressive',
    normal='normal'
}

export interface ISimulatorRouteTrigger {
    type:TriggerTypes;
    occurances: number;
}

export enum TriggerTypes {
    dtc='dtc',
    oiltemp='oiltemp'
}

export interface ILocation {
    [index: number]: number;
}

export interface IGeoPoint {
    lat: number;
    lon: number;
}

export interface IRouteBounds {
    start: IGeoPoint;
    end:IGeoPoint;
}

export interface ISimulatorRoute {
    start: ILocation;
    end: ILocation;
    description: string;
    name: string;
    route_id: string;
    stages : ISimulatorRouteStage[];
    triggers?: ISimulatorRouteTrigger[];
    profile?: SimulatorRouteProfiles;
    km : number;
}

export interface ISimulatorRouteStage {
    stage: number;
    start: ILocation;
    end: ILocation;
    km: number;
}

export interface IMapboxDrivingDirections {
    routes: IMapboxRoute[];
    waypoints: IMapboxWaypoint[];
    name: string;
    uuid: string;
}

export interface IMapboxRoute {
    legs: IMapboxRouteLeg[];
    geometry: string;
    duration: number;
    distance: number;
    weight: number;
}

export interface IMapboxWaypoint {
    distance: string;
    name: string;
    location: ILocation;
}

export interface IMapboxRouteLeg {
    summary: string;
    steps: IMapboxRouteLegStep[];
    duration: number;
    distance: number;
    weight: number;
}

export interface IMapboxRouteLegStep {
    intersections: IMapboxRouteLegStepIntersection[];
    name: string;
    distance: number;
    maneuver: IMapboxRouteLegStepManeuver[];
    weight: number;
    geometry: string;
    duration: number;
    mode: string;
    driving_side: string;
}

export interface IMapboxRouteLegStepIntersection {
    out: number;
    bearings: number[];
    entry: boolean[];
    location: number[];
}

export interface IMapboxRouteLegStepManeuver {
    bearing_after: number;
    type: string;
    bearing_before: number;
    location: number[];
    instruction: string;
}
