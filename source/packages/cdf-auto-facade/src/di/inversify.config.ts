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
import { Container, decorate, injectable, interfaces } from 'inversify';
import {TYPES} from './types';
import { WhitelistService } from '../whitelist/whitelist.service';
import { DeviceService } from '../device/device.service';
import { VehicleService } from '../vehicles/vehicle.service';
import { UserService } from '../users/user.service';
import { HttpHeaderUtils } from '../utils/httpHeaders';
import {assetLibraryContainerModule} from '@cdf/assetlibrary-client';
import {provisioningContainerModule} from '@cdf/provisioning-client';
import { CDFConfigInjector } from '@cdf/config-inject';
import AWS = require('aws-sdk');
import config from 'config';

// Load everything needed to the Container
export const container = new Container();

// allow config to be injected
const configInjector = new CDFConfigInjector();
container.load(configInjector.getConfigModule());

// bind containers from the cdf client modules
container.load(assetLibraryContainerModule);
container.load(provisioningContainerModule);

container.bind<HttpHeaderUtils>(TYPES.HttpHeaderUtils).to(HttpHeaderUtils).inSingletonScope();

container.bind<WhitelistService>(TYPES.WhitelistService).to(WhitelistService).inSingletonScope();

container.bind<DeviceService>(TYPES.DeviceService).to(DeviceService).inSingletonScope();
import '../device/device.controller';

container.bind<VehicleService>(TYPES.VehicleService).to(VehicleService).inSingletonScope();
import '../vehicles/vehicle.controller';

container.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
import '../users/user.controller';

// for 3rd party objects, we need to use factory injectors
// DynamoDB
decorate(injectable(), AWS.DynamoDB);
container.bind<interfaces.Factory<AWS.DynamoDB>>(TYPES.DynamoDBFactory)
    .toFactory<AWS.DynamoDB>(() => {
    return () => {

        if (!container.isBound(TYPES.DynamoDB)) {
            const dynamodb = new AWS.DynamoDB({region: config.get('aws.region')});
            container.bind<AWS.DynamoDB>(TYPES.DynamoDB).toConstantValue(dynamodb);
        }
        return container.get<AWS.DynamoDB>(TYPES.DynamoDB);
    };
});

// SNS
decorate(injectable(), AWS.SNS);
container.bind<interfaces.Factory<AWS.SNS>>(TYPES.SNSFactory)
    .toFactory<AWS.SNS>(() => {
    return () => {

        if (!container.isBound(TYPES.SNS)) {
            const sns = new AWS.SNS({region: config.get('aws.region')});
            container.bind<AWS.SNS>(TYPES.SNS).toConstantValue(sns);
        }
        return container.get<AWS.SNS>(TYPES.SNS);
    };
});

// S3
decorate(injectable(), AWS.S3);
container.bind<interfaces.Factory<AWS.S3>>(TYPES.S3Factory)
    .toFactory<AWS.S3>(() => {
    return () => {

        if (!container.isBound(TYPES.S3)) {
            const s3 = new AWS.S3({region: config.get('aws.region')});
            container.bind<AWS.S3>(TYPES.S3).toConstantValue(s3);
        }
        return container.get<AWS.S3>(TYPES.S3);
    };
});

// IoT
decorate(injectable(), AWS.Iot);
container.bind<interfaces.Factory<AWS.Iot>>(TYPES.IotFactory)
    .toFactory<AWS.Iot>(() => {
    return () => {

        if (!container.isBound(TYPES.Iot)) {
            const iot = new AWS.Iot({region: config.get('aws.region')});
            container.bind<AWS.Iot>(TYPES.Iot).toConstantValue(iot);
        }
        return container.get<AWS.Iot>(TYPES.Iot);
    };
});

decorate(injectable(), AWS.IotData);
container.bind<interfaces.Factory<AWS.IotData>>(TYPES.IotDataFactory)
    .toFactory<AWS.IotData>(() => {
    return () => {

        if (!container.isBound(TYPES.IotData)) {
            const iotData = new AWS.IotData({
                region: config.get('aws.region'),
                endpoint: config.get('aws.iot.endpoint'),
            });
            container.bind<AWS.IotData>(TYPES.IotData).toConstantValue(iotData);
        }
        return container.get<AWS.IotData>(TYPES.IotData);
    };
});
