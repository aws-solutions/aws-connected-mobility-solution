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

import { DataCalc } from './data-calc';
import { AggregatorCalc } from './aggregator-calc';
import { SpeedCalc } from './speed-calc';
import { AccelerationCalc } from './acceleration-calc';
import { GearCalc } from './gear-calc';
import { GearIntCalc } from './gear-int-calc';
import { TorqueCalc } from './torque-calc';
import { EngineSpeedCalc } from './engine-speed-calc';
import { FuelConsumedCalc } from './fuel-consumed-calc';
import { OdometerCalc } from './odometer-calc';
import { FuelLevelCalc } from './fuel-level-calc';
import { OilTempCalc } from './oil-temp-calc';
import { RouteCalc, Route } from './route-calc';
import { LocationCalc } from './location-calc';
import { VehicleData, IgnitionStatus, ModelInitializationParams } from './models';
import moment from 'moment';
import * as randomstring from 'randomstring';
import {generate} from 'shortid';
import {FuelSpentCalc} from './fuel-spent-calc';

export class DynamicsModel {

    private _pollerDelay: number;
    private _calculations: DataCalc<any>[] = [];
    private _aggregator: AggregatorCalc;
    private _snapshot: VehicleData;
    private _route: Route;

    private _pollerInterval: NodeJS.Timer;

    constructor(params: ModelInitializationParams) {
        this.initialize_data(params);
        // logger.info('Dynamics Model initialized');
    }

    private initialize_data(params: ModelInitializationParams) {
        this._pollerDelay = 1000;

        this._calculations.push(
            new SpeedCalc(),
            new AccelerationCalc(),
            new GearCalc(),
            new GearIntCalc(),
            new TorqueCalc(),
            new EngineSpeedCalc(),
            new FuelConsumedCalc(),
            new OdometerCalc(params),
            new FuelLevelCalc(),
            new FuelSpentCalc(),
            new OilTempCalc(),
            new LocationCalc(params)
        );

        if (params.route!==undefined) {
            this._route = params.route;
            this._calculations.push(new RouteCalc(params));
        }

        this._aggregator = new AggregatorCalc();

        this._snapshot = new VehicleData();

        for (const calculation of this._calculations) {
            this._snapshot[calculation.name] = calculation.data;
        }

        this.snapshot.simulationId = params.simulationId;
        if (params.vin===undefined) {
            params.vin = this.createVIN();
        }
        this._snapshot.vin = params.vin;
        this._snapshot.tripId = generate();

        this._snapshot.accelerator_pedal_position = 0.0;
        this._snapshot.brake = 0.0;
        this._snapshot.steering_wheel_angle = 0.0;
        this._snapshot.parking_brake_status = false;
        this._snapshot.brake_pedal_status = false;
        this._snapshot.manual_trans = false;
        this._snapshot.triggers = [];
        this._snapshot.fuelTankCapacity = params.fuelTankCapacity || 40;

        // logger.debug(`snapshot: ${JSON.stringify(this._snapshot, null, 2)}`);
    }

    private createVIN() : string {
        return randomstring.generate({
            length: 17,
            charset: 'abcdefghijklmnopqrstuvwxyz0123456789',
            capitalization: 'uppercase'
        });
    }

    public start_physics_loop() {
        const _this = this;
        this._pollerInterval = setInterval(() => {
            _this.generate_snapshot();
        }, _this._pollerDelay);
    }

    public stop_physics_loop() {
        clearInterval(this._pollerInterval);
    }

    public generate_snapshot() {
        const new_snapshot = Object.assign(new VehicleData(), this._snapshot);
        for (const calculation of this._calculations) {

            calculation.iterate(this._snapshot);
            new_snapshot[calculation.name] = calculation.data;

            if (calculation.name === 'route_stage') {
                const routeStageCalc = <RouteCalc>calculation;

                new_snapshot.accelerator_pedal_position = routeStageCalc.throttle_position;
                new_snapshot.brake = routeStageCalc.brake_position;
                new_snapshot.update_triggers = routeStageCalc.update_triggers;
                new_snapshot.brake_pedal_status = (routeStageCalc.brake_position > 0);
                new_snapshot.current_route_stage = routeStageCalc.current_stage;
                new_snapshot.trip_odometer = routeStageCalc.trip_odometer;
                if (routeStageCalc.route_ended) {
                    new_snapshot.route_duration = routeStageCalc.route_duration;
                    new_snapshot.route_ended = true;
                }

                if (routeStageCalc.dtc_code !== '') {
                    new_snapshot.dtc_code = routeStageCalc.dtc_code;
                }
                new_snapshot.dtc_changed = (new_snapshot.dtc_code!==this._snapshot.dtc_code);

                if (routeStageCalc.update_triggers) {
                    new_snapshot.triggers = routeStageCalc.triggers;
                    // logger.info(`Updating model triggers ${JSON.stringify(new_snapshot.triggers)}`);
                }
            }

            if(calculation.name === 'location') {
                new_snapshot.location = calculation.data;
            }

        }

        new_snapshot.timestamp = moment().toISOString();

        if (new_snapshot.route_ended) {
            this.stop_physics_loop();
            new_snapshot.engine_running=false;
            new_snapshot.ignition_status=IgnitionStatus.off;
        }

        this._snapshot = new_snapshot;
        this._aggregator.iterate(this._snapshot);
    }

    public get aggregated_metrics(): VehicleData {
        return this._aggregator.data;
    }

    public get engine_speed(): number {
        return this._snapshot.engine_speed;
    }

    public get vehicle_speed(): number {
        return this._snapshot.vehicle_speed;
    }

    public get route(): Route {
        return this._route;
    }

    public get snapshot(): VehicleData {
        return this._snapshot;
    }
}
