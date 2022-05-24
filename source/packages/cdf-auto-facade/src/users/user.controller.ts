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
import { Response } from 'express';
import { interfaces, controller, response, requestBody, httpPost } from 'inversify-express-utils';
import {logger} from '../utils/logger';

import { inject } from 'inversify';
import { TYPES } from '../di/types';
import {handleError} from '../utils/errors';
import { UserModel } from './user.models';
import { UserService } from './user.service';

@controller('/users')
export class UserController implements interfaces.Controller {

    constructor( @inject(TYPES.UserService) private userService: UserService) {}

    @httpPost('')
    public async registerUser(@requestBody() user: UserModel, @response() res: Response): Promise<void> {

        logger.info(`user.controller registerUser: in: user:${JSON.stringify(user)}`);

        try {
            await this.userService.registerUser(user);
            res.status(201);
        } catch (e) {
            handleError(e, res);
        }

        logger.debug(`user.controller registerUser: exit:`);
    }
}
