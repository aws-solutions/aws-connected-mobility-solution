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
import { VehicleData } from './models';

// A base class is defined using the new reserved 'class' keyword
export abstract class DataCalc<T> {

    private _data:T;
    private _last_calc:moment.Moment;
    protected readonly _name:string;

    constructor(name:string) {
        this._name = name;
        this.updateLastCalcTime();
    }

    public get name() : string {
        return this._name;
    }

    public get data() : T {
        return this._data;
    }

    public set data(new_value:T) {
        this._data = new_value;
    }

    protected updateLastCalcTime(): void {
        this._last_calc = moment();
    }

    protected get lastCalcTime(): moment.Moment {
        return this._last_calc;
    }

    public abstract iterate(snapshot:VehicleData):void;

    protected getTimeDelta() : moment.Duration {
        const current_time = moment();
        const time_delta = moment.duration(current_time.diff(this._last_calc));
        return time_delta;
    }

    protected getTimeStep() : number {
        const time_delta = this.getTimeDelta();
        const time_step = time_delta.get('seconds') + (time_delta.get('milliseconds') / 1000);
        return time_step;
    }

}
