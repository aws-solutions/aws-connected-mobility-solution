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

import { injectable, inject } from 'inversify';
import { logger } from '../utils/logger';
import { DevicesService, ASSTLIBRARY_CLIENT_TYPES, Device10Resource, DeviceState, GroupsService, SearchService, SearchRequestModel, GroupBaseResource } from '@cdf/assetlibrary-client';
import { DeviceModel, DeviceStatus } from '../device/device.models';
import ow from 'ow';

@injectable()
export class WhitelistService {

    constructor(
        @inject('templates.supplier') private supplierTemplate:string,
        @inject(ASSTLIBRARY_CLIENT_TYPES.DevicesService) private assetLibraryDeviceClient: DevicesService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.GroupsService) private assetLibraryGroupClient: GroupsService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.SearchService) private assetLibrarySearchClient: SearchService) {}

    public async whitelistDevice(supplierExternalId:string, device:DeviceModel) : Promise<void> {

        logger.debug(`whitelist.service whitelistDevice: in: supplierExternalId:${supplierExternalId}, device:${JSON.stringify(device)}`);

        ow(supplierExternalId, ow.string.nonEmpty);
        ow(device, ow.object.nonEmpty);
        ow(device.deviceId, ow.string.nonEmpty);
        ow(device.templateId, ow.string.nonEmpty);

        const searchRequest = new SearchRequestModel();
        searchRequest.types = [this.supplierTemplate];
        searchRequest.eq = [{
            field: 'externalId',
            value: supplierExternalId
        }];
        const searchResult = await this.assetLibrarySearchClient.search(searchRequest);

        if (searchResult===undefined || searchResult.results.length===0) {
            throw new Error('SUPPLIER_NOT_FOUND');
        }
        const supplierPath = (<GroupBaseResource>searchResult.results[0]).groupPath;

        const model:Device10Resource = {
            deviceId: device.deviceId,
            templateId: device.templateId,
            groups: {
                manufactured_by: [supplierPath]
            },
            attributes: {
                status: DeviceStatus.whitelisted,
                ...device.attributes
            },
            state: DeviceState.Active
        };

        await this.assetLibraryDeviceClient.createDevice(model);

        logger.debug('whitelist.service whitelistDevice: exit');

    }

    public async isDeviceWhitelisted(deviceId:string) : Promise<boolean> {
        logger.debug(`assetlibrary.service isDeviceWhitelisted: in: deviceId:${deviceId}`);

        ow(deviceId, ow.string.nonEmpty);

        let whitelisted = false;

        try {
            const device = await this.assetLibraryDeviceClient.getDeviceByID(deviceId);
            whitelisted = (device!==undefined);
        } catch (err) {
            logger.debug(`assetlibrary.service isDeviceWhitelisted: err:${err}`);
            if (err.message==='Not Found') {
                return false;
            } else {
                throw new Error('UNABLE_TO_CHECK_WHITELIST');
            }
        }

        // TODO: any other checks we need to do here as part of whitelist?  Such as verifying state/status?

        logger.debug(`assetlibrary.service isDeviceWhitelisted: exit:${whitelisted}`);
        return whitelisted;
    }

    public async isGroupWhitelisted(groupPath:string) : Promise<boolean> {
        logger.debug(`assetlibrary.service isGroupWhitelisted: in: groupPath:${groupPath}`);

        ow(groupPath, ow.string.nonEmpty);

        let whitelisted = false;

        try {
            const group = await this.assetLibraryGroupClient.getGroup(groupPath);
            whitelisted = (group!==undefined);
        } catch (err) {
            logger.debug(`assetlibrary.service isGroupWhitelisted: err:${err}`);
            if (err.message==='Not Found') {
                return false;
            } else {
                throw new Error('UNABLE_TO_CHECK_WHITELIST');
            }
        }

        // TODO: any other checks we need to do here as part of whitelist?

        logger.debug(`assetlibrary.service isGroupWhitelisted: exit:${whitelisted}`);
        return whitelisted;
    }
}
