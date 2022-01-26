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

import 'reflect-metadata';
import ow from 'ow';
import { container } from '../di/inversify.config';
import {
  GroupsService,
  Group10Resource,
  ASSTLIBRARY_CLIENT_TYPES,
} from '@cdf/assetlibrary-client';
import config from 'config';
import { logger } from '../utils/logger';

let groupService:GroupsService
let vehiclePathRoot: string;

logger.info(`\nDetected config:\n${JSON.stringify(config.util.toObject())}\n`);

exports.handler = async (event: any, _context: any) => {

  logger.debug(`dtcUpdate handler: in: event:${JSON.stringify(event)}`);

  // validation
  ow(event, ow.object.nonEmpty);
  ow(event.VIN, ow.string.nonEmpty);

  if (groupService===undefined) {
    groupService = container.get(ASSTLIBRARY_CLIENT_TYPES.GroupsService);
    vehiclePathRoot = config.get('cdf.assetLibrary.paths.vehicles') as string;
  }

  const groupPath = `${vehiclePathRoot}/${event.VIN}`;
  const group:Group10Resource = {
    attributes: {
      dtc: event.dtc
    }
  };
  await groupService.updateGroup(groupPath, group);

  logger.debug('dtcUpdate handler: exit:');
};
