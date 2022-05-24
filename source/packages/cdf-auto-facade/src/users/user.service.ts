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
import ow from 'ow';
import { ASSTLIBRARY_CLIENT_TYPES, GroupsService, Group10Resource } from '@cdf/assetlibrary-client/dist';
import { UserModel } from './user.models';

@injectable()
export class UserService {

    constructor(
        @inject(ASSTLIBRARY_CLIENT_TYPES.GroupsService) private assetLibraryGroupClient: GroupsService,
        @inject('paths.users') private usersGroupRoot:string,
        @inject('templates.user') private userTemplateId:string) {
    }

    public async registerUser(model:UserModel) : Promise<void> {
        logger.debug(`user.service registerUser: in: model${JSON.stringify(model)}`);

        ow(model, ow.object.nonEmpty);
        ow(model.username, ow.string.nonEmpty);
        ow(model.firstName, ow.string.nonEmpty);
        ow(model.lastName, ow.string.nonEmpty);

        // ensure user with same userid does not already exist
        const userGroupPath = `${this.usersGroupRoot}/${model.username}`;
        let userExists=false;
        try {
            const existingUser = await this.assetLibraryGroupClient.getGroup(userGroupPath);
            userExists = (existingUser!==undefined);
        } catch (err) {
            logger.warn(`user.service registerUser: err.status:${err.status}`);
            if (err.status===404) {
                userExists=false;
            } else {
                logger.warn(`user.service registerUser: err:${err}`);
                throw new Error('UNABLE_TO_CHECK_USER');
            }
        }
        logger.warn(`user.service registerUser: userExists:${userExists}`);

        if (userExists) {
            throw new Error('USER_ALREADY_REGISTERED');
        }

        // save the user
        const user:Group10Resource = {
            name: model.username,
            parentPath: this.usersGroupRoot,
            templateId: this.userTemplateId,
            attributes: {
                firstName: model.firstName,
                lastName: model.lastName,
                email:model.email,
                addressLine1:model.addressLine1,
                addressLine2:model.addressLine2,
                city:model.city,
                state:model.state,
                country:model.country,
                phone:model.phone
            }
        };
        await this.assetLibraryGroupClient.createGroup(user);

        logger.debug(`user.service registerUser: exit:`);

    }
}
