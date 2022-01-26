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
import { inject, injectable } from 'inversify';

import { TYPES } from '../di/types';
import { logger } from '../utils/logger';
import { CustomResourceEvent } from './customResource.model';
import { AppConfigOverrideCustomResource } from './appConfigOverride.customResource';
import { IotFleetIndexCustomResource } from './iotFleetIndex.customResource';
import { AssetLibraryInitCustomResource} from './assetLibraryInit.customResource';
import { IotEndpointCustomResource } from './iotEndpoint.customResource';
import { S3VpcEndpointCustomResource } from './s3VpcEndpoint.customResource';
import { NeptuneEngineVersionCustomResource } from './neptuneEngineVersion.customResource';
import { IotTemplatesCustomResource } from './iotTemplates.customResource';
import { IotPoliciesCustomResource } from './iotPolicies.customResource';
import { IotEventsCustomResource } from './iotEvents.customResource';
import { CustomResource } from './customResource';
import { IotThingGroupCustomResource } from './iotThingGroup.customResource';
import { S3PutObjectCustomResource } from './s3PutObject.customResource';
import { AssetLibraryBulkGroupsCustomResource } from './assetLibraryBulkGroups.customResource';
import { AssetLibraryPolicyCustomResource } from './assetLibraryPolicy.customResource';
import { AssetLibraryTemplateCustomResource } from './assetLibraryTemplate.customResource';
import { CommandsTemplateCustomResource } from './commandsTemplate.customResource';
import { CommandsCommandCustomResource } from './commandsCommand.customResource';
import { IotThingTypeCustomResource } from './iotThingType.customResource';
import { IotDeviceDefenderCustomResource } from "./iotDeviceDefender.customResource";
import { IotCertificateCustomResource } from './iotCertificate.customResource';
import { S3CopyFromBucketCustomResource } from './s3CopyFromBucket.customResource';

@injectable()
export class CustomResourceManager {

    private customResources: {[key:string] : CustomResource};

    constructor(
        @inject(TYPES.AppConfigOverrideCustomResource) protected appConfigOverrideCustomResource: AppConfigOverrideCustomResource,

        @inject(TYPES.AssetLibraryInitCustomResource) protected assetLibraryInitCustomResource: AssetLibraryInitCustomResource,
        @inject(TYPES.AssetLibraryBulkGroupsCustomResource) protected assetLibraryBulkGroupsCustomResource: AssetLibraryBulkGroupsCustomResource,
        @inject(TYPES.AssetLibraryPolicyCustomResource) protected assetLibraryPolicyCustomResource: AssetLibraryPolicyCustomResource,
        @inject(TYPES.AssetLibraryTemplateCustomResource) protected assetLibraryTemplateCustomResource: AssetLibraryTemplateCustomResource,

        @inject(TYPES.CommandsTemplateCustomResource) protected commandsTemplateCustomResource: CommandsTemplateCustomResource,
        @inject(TYPES.CommandsCommandCustomResource) protected commandsCommandCustomResource: CommandsCommandCustomResource,

        @inject(TYPES.IotCertificateCustomResource) protected iotCertificatesCustomResource: IotCertificateCustomResource,
        @inject(TYPES.IotEndpointCustomResource) protected iotEndpointCustomResource: IotEndpointCustomResource,
        @inject(TYPES.IotEventsCustomResource) protected iotEventsCustomResource: IotEventsCustomResource,
        @inject(TYPES.IotFleetIndexCustomResource) protected iotFleetIndexCustomResource: IotFleetIndexCustomResource,
        @inject(TYPES.IotPoliciesCustomResource) protected iotPoliciesCustomResource: IotPoliciesCustomResource,
        @inject(TYPES.IotTemplatesCustomResource) protected iotTemplatesCustomResource: IotTemplatesCustomResource,
        @inject(TYPES.IotThingGroupCustomResource) protected iotThingGroupCustomResource: IotThingGroupCustomResource,
        @inject(TYPES.IotThingTypeCustomResource) protected iotThingTypeCustomResource: IotThingTypeCustomResource,
        @inject(TYPES.IotDeviceDefenderCustomResource) protected iotDeviceDefenderCustomResource: IotDeviceDefenderCustomResource,

        @inject(TYPES.NeptuneEngineCustomResource) protected neptuneEngineCustomResource: NeptuneEngineVersionCustomResource,

        @inject(TYPES.S3VpcEndpointCustomResource) protected s3VpcEndpointCustomResource: S3VpcEndpointCustomResource,
        @inject(TYPES.S3PutObjectCustomResource) protected s3PutObjectCustomResource: S3PutObjectCustomResource,
        @inject(TYPES.S3CopyFromBucketCustomResource) protected s3CopyFromBucketCustomResource: S3CopyFromBucketCustomResource
    ) {
        this.customResources = {};

        this.customResources['Custom::ApplicationConfigOverride'] = appConfigOverrideCustomResource;

        this.customResources['Custom::AssetLibraryInit'] = assetLibraryInitCustomResource;
        this.customResources['Custom::AssetLibraryTemplate'] = assetLibraryTemplateCustomResource;
        this.customResources['Custom::AssetLibraryBulkGroups'] = assetLibraryBulkGroupsCustomResource;
        this.customResources['Custom::AssetLibraryPolicy'] = assetLibraryPolicyCustomResource;

        this.customResources['Custom::CommandsTemplate'] = commandsTemplateCustomResource;
        this.customResources['Custom::CommandsCommand'] = commandsCommandCustomResource;

        this.customResources['Custom::IotCertificate'] = iotCertificatesCustomResource;
        this.customResources['Custom::IotEndpoint'] = iotEndpointCustomResource;
        this.customResources['Custom::IotEvents'] = iotEventsCustomResource;
        this.customResources['Custom::IotFleetIndex'] = iotFleetIndexCustomResource;
        this.customResources['Custom::IotPolicy'] = iotPoliciesCustomResource;
        this.customResources['Custom::IotTemplate'] = iotTemplatesCustomResource;
        this.customResources['Custom::IotThingGroup'] = iotThingGroupCustomResource;
        this.customResources['Custom::IotThingType'] = iotThingTypeCustomResource;
        this.customResources['Custom::IotDeviceDefender'] = iotDeviceDefenderCustomResource;

        this.customResources['Custom::NeptuneEngineVersionCheck'] = neptuneEngineCustomResource;

        this.customResources['Custom::S3VpcEndpoint'] = s3VpcEndpointCustomResource;
        this.customResources['Custom::S3PutObject'] = s3PutObjectCustomResource;
        this.customResources['Custom::S3CopyFromBucket'] = s3CopyFromBucketCustomResource;
    }

    public async create(event: CustomResourceEvent) {
        logger.info(`CustomResourceManager: create: event:${JSON.stringify(event)}`);
        return await this.customResources[event.ResourceType].create(event);
    }
    public async delete(event: CustomResourceEvent) {
        logger.info(`CustomResourceManager: delete: event:${JSON.stringify(event)}`);
        return await this.customResources[event.ResourceType].delete(event);
    }
    public async update(event: CustomResourceEvent) {
        logger.info(`CustomResourceManager: update: event:${JSON.stringify(event)}`);
        return await this.customResources[event.ResourceType].update(event);
    }

}
