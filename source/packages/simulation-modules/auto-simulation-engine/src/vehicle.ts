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
import {DynamicsModel} from './dynamics/dynamics-model';
import { VehicleData, IgnitionStatus, Gears, ModelInitializationParams, GearLever } from './dynamics/models';
import config from 'config';
import {logger} from './utils/logger';

import { CVRATransformer } from './templates/cvra.transformer';
import { AwsIotMqttClient } from './iot/mqtt.client';

export class Vehicle {

    private readonly _engine: DynamicsModel;
    private readonly _transformer: CVRATransformer;
    private readonly _mqttClient: AwsIotMqttClient;
    private readonly _deviceId: string;
    private readonly _vin: string;
    private readonly _routeS3Bucket: string;
    private readonly _routeS3Key: string;

    private _telemetrySampler: NodeJS.Timer;
    private _dtcSampler: NodeJS.Timer;
    // private _tripSampler: NodeJS.Timer;

    constructor (opts:ModelInitializationParams) {
        // logger.debug(`vehicle: constructor: in: opts:${JSON.stringify(opts)}`);

        this._deviceId = opts.deviceId;
        this._vin = opts.vin;
        this._routeS3Bucket = opts.routeS3Bucket;
        this._routeS3Key = opts.routeS3Key;

        this._engine = new DynamicsModel(opts);

        this._transformer = new CVRATransformer();
        this._mqttClient = new AwsIotMqttClient(this._deviceId, this._vin);
    }

    public async start () {
        logger.debug('vehicle: start: in:');

        // if we have a route provided, we're simulating a journey, otherwise just initializing state
        if (this._engine.route) {
            await this.startJourney();
        } else {
            await this.publishInitialState();
        }

        logger.debug('vehicle: start: exit:');

    }

    private async startJourney():Promise<void> {
        logger.debug('vehicle: startJourney: in:');

        // Gracefully close the process if no stages to process
        if(this._engine.route!==undefined && this._engine.route.stages!==undefined
            && this._engine.route.stages.length === 0) {
            logger.error(`route: has no stages`);
            this.stop();
        }

        this._engine.snapshot.engine_running=true;
        this._engine.snapshot.ignition_status=IgnitionStatus.run;
        this._engine.snapshot.gear_lever_position = GearLever.drive;
        this._engine.snapshot.transmission_gear_position = Gears.first;

        await this._mqttClient.startJobProcess();

        await this.publishRouteLocation(this._engine.snapshot.tripId);

        this._engine.start_physics_loop();

        // this sampler is processing the main telemetry, every 12 seconds
        const telemetrySamplerInterval:number = config.get('cvra.samplerIntervals.carData');
        this._telemetrySampler = setInterval( async () => {
            const snapshot = this._engine.snapshot;
            snapshot.route = this._engine.route;
            await this.sampleTelemetry(snapshot);
            if (snapshot.route_ended) {
                snapshot.start_time = this._engine.aggregated_metrics.start_time;
                snapshot.end_time = this._engine.aggregated_metrics.end_time;
                await this.sampleTrip(snapshot);
                await this.stop();
            }
        }, telemetrySamplerInterval);

        // this sampler is processing DTC's as they occur, so sampling every 1s
        const dtcSamplerInterval:number = config.get('cvra.samplerIntervals.dtc');
        this._dtcSampler = setInterval( async () => {
            const snapshot = this._engine.snapshot;
            await this.sampleDTC(snapshot);
        }, dtcSamplerInterval);

        logger.debug('vehicle: startJourney: exit:');
    }

    private async publishInitialState(): Promise<void> {
        logger.debug('vehicle: publishInitialState: in:');

        this._engine.snapshot.engine_running=false;
        this._engine.snapshot.ignition_status=IgnitionStatus.off;
        this._engine.snapshot.transmission_gear_position = Gears.neutral;

        this._engine.generate_snapshot();
        const snapshot = this._engine.snapshot;
        await this.sampleTelemetry(snapshot);

        logger.debug('vehicle: publishInitialState: exit:');
        this.stop();
    }

    public stop () {
        logger.debug('vehicle: stop: in:');
        clearInterval(this._telemetrySampler);
        clearInterval(this._dtcSampler);
        this._engine.stop_physics_loop();
        logger.debug('vehicle: stop: exit');
        process.exit();
    }

    private async sampleTelemetry(sample:VehicleData) : Promise<void> {
        logger.debug('vehicle: sampleTelemetry: in:');
        const message = this._transformer.processCarData(sample);
        // logger.info(`vehicle: sampleTelemetry: message: ${message}`);

        await this._mqttClient.publish(this._transformer.carDataTopic(this._deviceId), message);
        logger.debug('vehicle: sampleTelemetry: exit:');
    }

    private async sampleDTC(sample:VehicleData) : Promise<void> {
        if(sample.update_triggers || sample.dtc_changed) {
            const message = this._transformer.processDTC(sample);
            // logger.info(`vehicle: sampleTelemetry: message: ${message}`);

            await this._mqttClient.publish(this._transformer.dtcTopic(this._deviceId), message);
        }
    }

    private async sampleTrip(sample:VehicleData) : Promise<void> {
        const message = this._transformer.processTrip(sample);
        // logger.info(`vehicle: sampleTelemetry: message: ${message}`);

        await this._mqttClient.publish(this._transformer.tripTopic(this._deviceId), message);
    }

    private async publishRouteLocation(tripId: string): Promise<void> {
        const routeInfo = {
            deviceId: this._deviceId,
            vin: this._vin,
            routeS3Bucket: this._routeS3Bucket,
            routeS3Key: this._routeS3Key,
            tripId
        };
        await this._mqttClient.publish(this._transformer.routeTopic(this._deviceId), JSON.stringify(routeInfo));
    }

}
