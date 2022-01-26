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
import { decorate, injectable, Container, interfaces } from 'inversify';
import { TYPES } from './types';
import config from 'config';
import { CDFConfigInjector } from '@cdf/config-inject';
import {LAMBDAINVOKE_TYPES, LambdaInvokerService} from '@cdf/lambda-invoke';
import AWS = require('aws-sdk');
import {CustomResourceManager} from '../customResources/customResource.manager';
import {IotEndpointCustomResource} from '../customResources/iotEndpoint.customResource';
import {IotFleetIndexCustomResource} from '../customResources/iotFleetIndex.customResource';
import {AssetLibraryInitCustomResource} from '../customResources/assetLibraryInit.customResource';
import {NeptuneEngineVersionCustomResource} from '../customResources/neptuneEngineVersion.customResource';
import {S3VpcEndpointCustomResource} from '../customResources/s3VpcEndpoint.customResource';
import {AppConfigOverrideCustomResource} from '../customResources/appConfigOverride.customResource';
import { IotPoliciesCustomResource } from '../customResources/iotPolicies.customResource';
import { IotTemplatesCustomResource } from '../customResources/iotTemplates.customResource';
import { IotEventsCustomResource } from '../customResources/iotEvents.customResource';
import { IotThingTypeCustomResource } from '../customResources/iotThingType.customResource';
import { S3PutObjectCustomResource } from '../customResources/s3PutObject.customResource';
import { IotThingGroupCustomResource } from '../customResources/iotThingGroup.customResource';
import { AssetLibraryTemplateCustomResource } from '../customResources/assetLibraryTemplate.customResource';
import { AssetLibraryPolicyCustomResource } from '../customResources/assetLibraryPolicy.customResource';
import { AssetLibraryBulkGroupsCustomResource } from '../customResources/assetLibraryBulkGroups.customResource';
import { CommandsTemplateCustomResource } from '../customResources/commandsTemplate.customResource';
import { CommandsCommandCustomResource } from '../customResources/commandsCommand.customResource';
import { IotDeviceDefenderCustomResource } from "../customResources/iotDeviceDefender.customResource";
import { S3CopyFromBucketCustomResource } from '../customResources/s3CopyFromBucket.customResource';
import { IotCertificateCustomResource } from '../customResources/iotCertificate.customResource';

// Load everything needed to the Container
export const container = new Container();

// allow config to be injected
const configInjector = new CDFConfigInjector();
container.load(configInjector.getConfigModule());

container.bind<CustomResourceManager>(TYPES.CustomResourceManager).to(CustomResourceManager).inSingletonScope();
container.bind<AppConfigOverrideCustomResource>(TYPES.AppConfigOverrideCustomResource).to(AppConfigOverrideCustomResource).inSingletonScope();

container.bind<AssetLibraryInitCustomResource>(TYPES.AssetLibraryInitCustomResource).to(AssetLibraryInitCustomResource).inSingletonScope();
container.bind<AssetLibraryBulkGroupsCustomResource>(TYPES.AssetLibraryBulkGroupsCustomResource).to(AssetLibraryBulkGroupsCustomResource).inSingletonScope();
container.bind<AssetLibraryPolicyCustomResource>(TYPES.AssetLibraryPolicyCustomResource).to(AssetLibraryPolicyCustomResource).inSingletonScope();
container.bind<AssetLibraryTemplateCustomResource>(TYPES.AssetLibraryTemplateCustomResource).to(AssetLibraryTemplateCustomResource).inSingletonScope();

container.bind<CommandsTemplateCustomResource>(TYPES.CommandsTemplateCustomResource).to(CommandsTemplateCustomResource).inSingletonScope();
container.bind<CommandsCommandCustomResource>(TYPES.CommandsCommandCustomResource).to(CommandsCommandCustomResource).inSingletonScope();

container.bind<IotCertificateCustomResource>(TYPES.IotCertificateCustomResource).to(IotCertificateCustomResource).inSingletonScope();
container.bind<IotEndpointCustomResource>(TYPES.IotEndpointCustomResource).to(IotEndpointCustomResource).inSingletonScope();
container.bind<IotEventsCustomResource>(TYPES.IotEventsCustomResource).to(IotEventsCustomResource).inSingletonScope();
container.bind<IotFleetIndexCustomResource>(TYPES.IotFleetIndexCustomResource).to(IotFleetIndexCustomResource).inSingletonScope();
container.bind<IotPoliciesCustomResource>(TYPES.IotPoliciesCustomResource).to(IotPoliciesCustomResource).inSingletonScope();
container.bind<IotTemplatesCustomResource>(TYPES.IotTemplatesCustomResource).to(IotTemplatesCustomResource).inSingletonScope();
container.bind<IotThingGroupCustomResource>(TYPES.IotThingGroupCustomResource).to(IotThingGroupCustomResource).inSingletonScope();
container.bind<IotThingTypeCustomResource>(TYPES.IotThingTypeCustomResource).to(IotThingTypeCustomResource).inSingletonScope();
container.bind<IotDeviceDefenderCustomResource>(TYPES.IotDeviceDefenderCustomResource).to(IotDeviceDefenderCustomResource).inSingletonScope();

container.bind<NeptuneEngineVersionCustomResource>(TYPES.NeptuneEngineCustomResource).to(NeptuneEngineVersionCustomResource).inSingletonScope();

container.bind<S3VpcEndpointCustomResource>(TYPES.S3VpcEndpointCustomResource).to(S3VpcEndpointCustomResource).inSingletonScope();
container.bind<S3PutObjectCustomResource>(TYPES.S3PutObjectCustomResource).to(S3PutObjectCustomResource).inSingletonScope();
container.bind<S3CopyFromBucketCustomResource>(TYPES.S3CopyFromBucketCustomResource).to(S3CopyFromBucketCustomResource).inSingletonScope();


// lambda invoker
container.bind<LambdaInvokerService>(LAMBDAINVOKE_TYPES.LambdaInvokerService).to(LambdaInvokerService);
decorate(injectable(), AWS.Lambda);
container.bind<interfaces.Factory<AWS.Lambda>>(LAMBDAINVOKE_TYPES.LambdaFactory)
    .toFactory<AWS.Lambda>((ctx: interfaces.Context) => {
        return () => {

            if (!container.isBound(LAMBDAINVOKE_TYPES.Lambda)) {
                const lambda = new AWS.Lambda();
                container.bind<AWS.Lambda>(LAMBDAINVOKE_TYPES.Lambda).toConstantValue(lambda);
            }
            return ctx.container.get<AWS.Lambda>(LAMBDAINVOKE_TYPES.Lambda);
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

decorate(injectable(), AWS.EC2);
container.bind<interfaces.Factory<AWS.EC2>>(TYPES.EC2Factory)
    .toFactory<AWS.EC2>(() => {
        return () => {

            if (!container.isBound(TYPES.EC2)) {
                const ec2 = new AWS.EC2({region: config.get('aws.region')});
                container.bind<AWS.EC2>(TYPES.EC2).toConstantValue(ec2);
            }
            return container.get<AWS.EC2>(TYPES.EC2);
        };
    });
