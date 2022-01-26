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
import { TYPES } from '../di/types';
import ow from 'ow';
import { WhitelistService } from '../whitelist/whitelist.service';
import { ASSTLIBRARY_CLIENT_TYPES, GroupsService, DeviceState } from '@cdf/assetlibrary-client/dist';
import { NewVehicleOwnerRequest } from './vehicle.models';

@injectable()
export class VehicleService {

    constructor(
        @inject(TYPES.WhitelistService) private whitelistService: WhitelistService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.GroupsService) private assetLibraryGroupClient: GroupsService,
        @inject('paths.vehicles') private vehiclesGroupRoot:string,
        @inject('paths.users') private usersGroupRoot:string,
        @inject('templates.ecu') private ecuTemplateId:string) {
    }

    public async registerOwner(request:NewVehicleOwnerRequest) : Promise<void> {
        logger.debug(`vehicle.service registerOwner: in: request${JSON.stringify(request)}`);

        ow(request, ow.object.nonEmpty);
        ow(request.ownerId, ow.string.nonEmpty);
        ow(request.vin, ow.string.nonEmpty);
        ow(request.pairingCode, ow.string.nonEmpty);

        // ensure vehicle is registered
        const vehicleGroupPath = `${this.vehiclesGroupRoot}/${request.vin}`;
        const vehicleGroup = await this.assetLibraryGroupClient.getGroup(vehicleGroupPath);
        if (vehicleGroup===undefined) {
            throw new Error('VEHICLE_NOT_REGISTERED');
        }

        // ensure user is registered
        const ownerGroupPath = `${this.usersGroupRoot}/${request.ownerId}`;
        if (await this.whitelistService.isGroupWhitelisted(ownerGroupPath)!==true) {
            throw new Error('USER_NOT_REGISTERED');
        }

        // find the tcu installed in the vehicle
        const ecuDevices = await this.assetLibraryGroupClient.listGroupMembersDevices(vehicleGroupPath, this.ecuTemplateId, DeviceState.Active);
        if (ecuDevices===undefined || ecuDevices.results.length===0) {
            throw new Error('TCU_NOT_WHITELISTED');
        }
        const tcuDevices = ecuDevices.results.filter(d=> d.attributes!==undefined && d.attributes.type==='tcu');
        if (tcuDevices.length===0) {
            throw new Error('TCU_NOT_WHITELISTED');
        }

        // TODO: any additional verification required, such as calling out to an OEM service?

        // If the vehicle already has an owner(s), transfer the ownership
        if (vehicleGroup.groups && vehicleGroup.groups['owns']) {
            for(const previousOwner of vehicleGroup.groups['owns']) {
                await this.assetLibraryGroupClient.attachToGroup(previousOwner, 'owned', vehicleGroup.groupPath);
                await this.assetLibraryGroupClient.detachFromGroup(previousOwner, 'owns', vehicleGroup.groupPath);
            }
        }

        // Associate owner with vehicle (the change event will trigger remote activation)
        await this.assetLibraryGroupClient.attachToGroup(ownerGroupPath, 'owns', vehicleGroup.groupPath);

        logger.debug(`device.service registerDevice: exit:`);

    }
}
