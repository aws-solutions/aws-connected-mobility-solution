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

import moment from 'moment';
import {Route, RouteTrigger} from './route-calc';

export interface ModelInitializationParams {
    deviceId: string;
    vin: string;
    route: Route;
    routeS3Bucket: string;
    routeS3Key: string;
    odometer:number;
    fuelTankCapacity: number;
    startTime: string;
    latitude:number;
    longitude:number;
    simulationId:string;
}

export class VehicleData {
    accelerator_pedal_position_mean = 0;
    accelerator_pedal_position = 0;
    brake_mean = 0;
    brake_pedal_status: boolean;
    brake = 0;
    bearing = 0;
    dtc_code: string;
    dtc_changed: boolean;
    end_time: string;
    engine_running: boolean;
    engine_speed_mean = 0;
    engine_speed = 0;
    fuel_consumed_since_restart = 0;
    fuel_level = 0;
    fuel_spent = 0;
    gear_lever_position: GearLever;
    heading:number;
    high_acceleration_event = 0;
    high_braking_event = 0;
    high_speed_duration = 0;
    idle_duration = 0;
    ignition_status: IgnitionStatus;
    location: Location;
    manual_trans: boolean;
    odometer: number;
    oil_temp_mean = 0;
    parking_brake_status: boolean;
    route_duration: moment.Duration;
    route_ended:boolean;
    route?:Route;
    start_time: string;
    steering_wheel_angle: number;
    torque_at_transmission_mean = 0;
    transmission_gear_position: Gears;
    update_triggers: boolean;
    vehicle_speed_mean = 0;
    vehicle_speed = 0;

    simulationId: string;
    vin: string;
    timestamp: string;

    triggers: RouteTrigger[]= [];
    current_route_stage: number;
    tripId: string;
    trip_odometer: number;
    fuelTankCapacity: number;
}

export enum IgnitionStatus {
    run='run',
    off='off'
}

export enum Gears {
    neutral,
    first,
    second,
    third,
    fourth,
    fifth,
    sixth
}

export enum GearLever {
    drive
}

export interface Location {
    latitude: number;
    longitude: number;
    bearing:number;
}
