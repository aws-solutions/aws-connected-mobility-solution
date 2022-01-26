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
import { container } from './di/inversify.config';
import { logger } from './utils/logger';
import { TYPES } from './di/types';
import { DeviceService } from './device/device.service';
import { DeviceActivationRequest } from './device/device.models';
import ow from 'ow';

let deviceService:DeviceService;

exports.handler = async (event: any, _context: any) => {

  logger.debug(`iot_core_proxy handler: in: event:${JSON.stringify(event)}`);

  // validation
  ow(event, ow.object.nonEmpty);
  ow(event.deviceId, ow.string.nonEmpty);
  const request = event as DeviceActivationRequest;
  ow(event.vehicle, ow.object.nonEmpty);

  if (deviceService===undefined) {
    deviceService = container.get(TYPES.DeviceService);
  }

  await deviceService.activateTCU(event.deviceId, request);

  logger.debug('events.service create: exit:');
};
