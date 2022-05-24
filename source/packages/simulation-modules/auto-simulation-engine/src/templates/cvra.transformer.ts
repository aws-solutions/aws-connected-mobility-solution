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

import config from 'config';
import * as handlebars from 'handlebars';
import { VehicleData } from '../dynamics/models';
import * as fs from 'fs';

/**
 * Handles translating device attributes to the CVRA telemetry
 * format, then publishing to AWS IoT Core.
 *
 */

export class CVRATransformer {

    private readonly _carDataTemplate:handlebars.TemplateDelegate;
    private readonly _dtcTemplate:handlebars.TemplateDelegate;
    private readonly _eventTemplate:handlebars.TemplateDelegate;
    private readonly _tripTemplate:handlebars.TemplateDelegate;

    private readonly _carDataTopic:string;
    private readonly _dtcTopic:string;
    private readonly _tripTopic:string;
    private readonly _routeTopic:string;

    constructor() {

        let template = fs.readFileSync(config.get('cvra.templates.carData'), 'utf8');
        this._carDataTemplate = handlebars.compile(template);
        this._carDataTopic = config.get('cvra.topics.carData');

        const dtc_template = fs.readFileSync(config.get('cvra.templates.dtc'), 'utf8');
        this._dtcTemplate = handlebars.compile(dtc_template);
        this._dtcTopic = config.get('cvra.topics.dtc');

        template = fs.readFileSync(config.get('cvra.templates.event'), 'utf8');
        this._eventTemplate = handlebars.compile(config.get('cvra.templates.event'));

        const trip_template = fs.readFileSync(config.get('cvra.templates.trip'), 'utf8');
        this._tripTemplate = handlebars.compile(trip_template);
        this._tripTopic = config.get('cvra.topics.trip');

        this._routeTopic = config.get('cvra.topics.route');

    }

    public processCarData(data:VehicleData) : string {
        return this._carDataTemplate(data);
    }

    public  processDTC(data:any) : string {
        return this._dtcTemplate(data);
    }

    public processEvent(data:any) : string {
        return this._eventTemplate(data);
    }

    public processTrip(data:any) : string {
        return this._tripTemplate(data);
    }

    public carDataTopic(deviceId:string):string {
        return this._carDataTopic.replace('{deviceId}', deviceId);
    }

    public dtcTopic(deviceId:string):string {
        return this._dtcTopic.replace('{deviceId}', deviceId);
    }

    public tripTopic(deviceId:string):string {
        return this._tripTopic.replace('{deviceId}', deviceId);
    }

    public routeTopic(deviceId:string): string {
        return this._routeTopic.replace('{deviceId}', deviceId);
    }
}
