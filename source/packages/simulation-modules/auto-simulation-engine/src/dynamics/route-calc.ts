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

import {logger} from '../utils/logger';
import moment from 'moment';
import { VehicleData, ModelInitializationParams } from './models';
import { DataCalc } from './data-calc';

export class RouteCalc extends DataCalc<number> {
    // static jitter values
    private readonly JITTER_PERIOD = 7000;
    private readonly THROTTLE_JITTER = 4;

    private _last_jitter_calc: moment.Moment;
    private _last_throttle_calc: moment.Moment;
    private _last_burndown_calc: moment.Moment;
    private _throttle_adj_duration: number;
    private _random_triggers: RouteTrigger[];
    private _current_stage: number;
    private _cur_throttle_position: number;
    private _throttle_position: number;
    private _brake_position: number;
    private _route_ended: boolean;
    private _burndown: boolean;
    private _dtc_code: string;
    private _route:Route;
    private _route_duration: moment.Duration;
    private _update_triggers: boolean;
    private _triggers :RouteTrigger[];
    private _latitude: number;
    private _longitude: number;
    private _trip_odometer: number;
    private _initial_odometer: number;

    // TODO:  these were defined before but don't appear to be used.  do we need them?
    // private _last_brake_calc: moment.Moment;
    // private _dtc_sent: boolean;

    constructor(params:ModelInitializationParams) {
        super('route_stage');
        super.data=0;
        this._initialize_data(params);
    }

    _initialize_data(params:ModelInitializationParams) {

        this._last_jitter_calc = moment();
        this._last_throttle_calc = moment();
        this._last_burndown_calc = moment();
        this._current_stage = 0;
        this._brake_position = 0.0;
        this._route_ended = false;
        this._burndown = false;
        this._dtc_code = '';
        this._route_duration = moment.duration(0);
        this._update_triggers = false;
        this._triggers = [];
        this._trip_odometer = 0;

        if (params.route!==undefined) {
            this._throttle_adj_duration = this.get_random_throttle_adj_period();
            this._random_triggers = this.get_random_triggers(params.route);
            this._cur_throttle_position = this.get_random_start_speed(params.route.profile);
            this._route = params.route;
            this._route.stages[this._current_stage].odometer_start = params.odometer;
            this._route.stages[this._current_stage].route_start = moment();
            this._latitude = this._route.stages[this._current_stage].start[1];
            this._longitude = this._route.stages[this._current_stage].start[0];
            this._initial_odometer = params.odometer;
        } else {
            this._cur_throttle_position = 0;
            this._latitude = params.latitude;
            this._longitude = params.longitude;
        }

        this._throttle_position = this._cur_throttle_position;

        // TODO:  these were defined before but don't appear to be used.  do we need them?
        // this._last_brake_calc = moment();
        // this._dtc_sent = false;
    }

    public get throttle_position() : number {
        return this._throttle_position;
    }

    public get brake_position() {
        return this._brake_position;
    }

    public get current_stage() {
        return this._current_stage;
    }

    public get route_duration() {
        return this._route_duration;
    }

    public get route_ended() {
        return this._route_ended;
    }

    public get dtc_code() {
        return this._dtc_code;
    }

    public get update_triggers() {
        return this._update_triggers;
    }

    public get latitude() {
        return this._latitude;
    }

    public get longitude() {
        return this._longitude;
    }

    public get triggers() {
        return this._triggers;
    }

    public get trip_odometer() {
        return this._trip_odometer;
    }

    public iterate(snapshot:VehicleData) {
        // logger.debug(`route-calc: iterate: in: snapshot:${JSON.stringify(snapshot)}`);

        if (this._route===undefined) {
            logger.debug(`route-calc: iterate: no route!`);
            return;
        }

        const odometer = snapshot.odometer;
        let move_stage = false;
        const current_time = moment();
        this._update_triggers = false;

        this._trip_odometer = odometer - this._initial_odometer;

        if (!this._route_ended) {

            if (!this._burndown) {
                const milage = this._route.stages[this._current_stage].odometer_start +
                    this._route.stages[this._current_stage].km;
                if ((milage) <= odometer) {
                    // met or suprassed milage for stage, move to next stage
                    move_stage = true;
                }

                // check for throttle adjustment
                const throttle_time_delta = current_time.diff(this._last_throttle_calc);
                if (this._throttle_adj_duration <= throttle_time_delta) {

                    this._cur_throttle_position = this._cur_throttle_position + this.get_random_throttle_position(this._route.profile);

                    if (this._cur_throttle_position >= 100) {
                        this._cur_throttle_position = 99;
                    }

                    if (this._cur_throttle_position < 0) {
                        this._cur_throttle_position = 5;
                    }

                    this._brake_position = 0.0;
                    this._throttle_position = this._cur_throttle_position;
                    this._throttle_adj_duration = this.get_random_throttle_adj_period();
                    this._last_throttle_calc = moment();
                }

                for (const trigger of this._random_triggers) {
                    if (odometer >= trigger.km) {
                        if (trigger.type === RouteTriggerType.brake && !trigger.triggered) {
                            this._throttle_position = 0.0;
                            this._brake_position = 100.0;
                            trigger.triggered = true;
                        }

                        if (trigger.type === RouteTriggerType.dtc && !trigger.triggered) {
                            this._dtc_code = this.get_random_dtc();
                            // this._dtc_sent = true;
                            // logger.info(`DTC triggered: ${this._dtc_code}`);
                            this._triggers.push( {
                                type: RouteTriggerType.dtc,
                                triggered: true,
                                value: this._dtc_code
                            });
                            this._update_triggers = true;
                            trigger.triggered = true;
                        }

                        if (trigger.type === RouteTriggerType.oiltemp && !trigger.triggered) {
                            // update to inculde new triggers
                            // TODO: check the logic of this. not sure how this is supposed to be working
                            this._triggers.push( {
                                type: RouteTriggerType.oiltemp,
                                triggered: true
                            });
                            this._update_triggers = true;
                            trigger.triggered = true;
                        }
                    }
                }

                if (move_stage) {
                    // transition to next stage in route
                    this._current_stage++;
                    if (this._current_stage < this._route.stages.length) {
                        // initialize the new stage
                        this._route.stages[this._current_stage].odometer_start = odometer;
                        this._latitude = this._route.stages[this._current_stage].start[1];
                        this._longitude = this._route.stages[this._current_stage].start[0];
                        super.updateLastCalcTime();

                        if (this._route.stages[this._current_stage].triggers) {
                            // update to inculde new triggers
                            this._triggers = this._route.stages[this._current_stage].triggers;
                            this._update_triggers = true;
                        }
                    } else {
                        this._burndown = true;
                        this._last_burndown_calc = moment();
                    }
                }
            } else {
                // set end of route flag
                this._throttle_position = 0.0;
                this._brake_position = 100.0;
                const end_time_delta = current_time.diff(this._last_burndown_calc);
                if (end_time_delta >= 20000) {
                    this._route_ended = true;
                    this._burndown = false;
                    this._latitude = this._route.stages[this._current_stage - 1].end[1];
                    this._longitude = this._route.stages[this._current_stage - 1].end[0];
                }
            }

            if (this._route_ended) {
                const route_delta = moment.duration(current_time.diff(this._route.stages[0].route_start));
                this._route_duration = route_delta;
                this._cur_throttle_position = 0.0;
                this._throttle_position = 0.0;
                this._brake_position = 0.0;
            } else {
                const jitter_time_delta = current_time.diff(this._last_jitter_calc);
                if (this.JITTER_PERIOD <= jitter_time_delta) {
                    // met or surpassed duration for jitter, set random throttle position
                    if (this._throttle_position !== 0 && this._throttle_position !== 100 &&
                        this._brake_position === 0) {
                        this._throttle_position = this.get_jitter_position(
                            this._cur_throttle_position,
                            this.THROTTLE_JITTER
                        );
                    }

                    this._last_jitter_calc = moment();
                }

                super.data=this._current_stage;
            }
        }

    }

    private get_random_triggers(route:Route) : RouteTrigger[] {
        // logger.debug(`route-calc: get_random_triggers: in: snapshot:${JSON.stringify(route)}`);

        const triggers:RouteTrigger[] = [];

        const upper = route.km;
        const lower = 0.2;

        if (route.triggers) {
            for (const trigger of route.triggers) {
                for (let j = 0; j < trigger.occurances; j++) {
                    const _rand = (Math.random() * (upper - lower) + lower);
                    triggers.push({
                        type: trigger.type,
                        km: Math.round(_rand * 100) / 100,
                        triggered: false
                    });
                }
            }
        }

        // logger.debug(`route-calc: get_random_triggers: exit: _triggers:${JSON.stringify(triggers)}`);
        return triggers;
    }

    private get_random_start_speed(profile:string) : number {
        // logger.debug(`route-calc: get_random_start_speed: in: profile:${profile}`);

        let upper = 40.0;
        let lower = 10.0;

        if (profile === 'aggressive') {
            lower = 20;
            upper = 50.0;
        }

        const rand = Math.random() * (upper - lower) + lower;
        // logger.debug(`route-calc: n: exit: _rand:${_rand}`);
        return rand;
    }

    private get_random_throttle_position(profile:string) : number {
        // logger.debug(`route-calc: get_random_throttle_position: in: profile:${profile}`);

        const normal = [2, 2, 2, 2, 2, 2, 2, 2, 2, 25, 5, 5, 5, 5, 5, 5, 5, 5, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 15,
            15, 15, 15, 20, 20
        ];
        const aggressive = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 15, 15,
            15,
            15, 15, 15, 15, 15, 15, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25, 25
        ];
        let upper = normal.length;
        const lower = 0;

        if (profile === 'aggressive') {
            upper = aggressive.length;
        }

        const rand_multiplier = Math.floor(Math.random() * (2 - 0)) + 1;
        const multipler = rand_multiplier === 2 ? -1 : 1;
        const rand = Math.floor(Math.random() * (upper - lower)) + lower;
        const res =  multipler * (profile === 'aggressive' ? aggressive[rand] : normal[rand]);

        // logger.debug(`route-calc: get_random_throttle_position: exit: res:${JSON.stringify(res)}`);
        return res;
    }

    private get_random_throttle_adj_period() : number {
        // logger.debug(`route-calc: get_random_throttle_adj_period: in:`);

        const upper = 60000;
        const lower = 30000;

        const rand = Math.floor(Math.random() * (upper - lower)) + lower;
        // logger.debug(`route-calc: get_random_throttle_adj_period: exit: ${rand}`);
        return rand;
    }

    private get_random_dtc() : string {
        // logger.debug(`route-calc: get_random_dtc: in:`);
        const codes = require('./diagnostic-trouble-codes.js');
        const rand = Math.floor(Math.random() * (codes.diagnostic_trouble_codes.length - 0)) + 0;
        const res = codes.diagnostic_trouble_codes[rand];
        // logger.debug(`route-calc: get_random_dtc: exit: ${res}`);
        return res;
    }

    private get_jitter_position(stage_position:number, jitter:number): number {
        // logger.debug(`route-calc: get_jitter_position: in: stage_position:${stage_position}, jitter:${jitter}`);

        let upper = stage_position + jitter;
        if (upper > 100.0) {
            upper = 100.0;
        }

        let lower = 0.0;
        if (stage_position === 0.0) {
            lower = 0.0;
        } else {
            lower = stage_position - jitter;
            if (lower < 0.0) {
                lower = 0.0;
            }
        }

        const rand = Math.floor(Math.random() * (upper - lower)) + lower;
        // logger.debug(`route-calc: get_jitter_position: exit: ${rand}`);
        return rand;
    }

}

export interface Route {
    route_id:string;
    start:number[];
    end:number[];
    description:string;
    profile:string;
    km:number;
    stages:RouteStage[];
    triggers?:RouteTrigger[];
}

export interface RouteStage {
    stage:number;
    start:number[];
    end:number[];
    km:number;

    odometer_start?: number;
    route_start?: moment.Moment;
    triggers?:RouteTrigger[];
}

export interface RouteTrigger {
    type:RouteTriggerType;
    km?:number;
    occurances?:number;
    triggered:boolean;
    value?: string;
}

export enum RouteTriggerType {
    brake='brake',
    dtc='dtc',
    oiltemp='oiltemp'
}
