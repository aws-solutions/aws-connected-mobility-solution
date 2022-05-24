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

import { logger } from './utils/logger';
import { ProvisionDataGenerator } from './provision.generator';
import ow from 'ow';

exports.handler = async (event: any, _context: any) => {
  logger.debug(`handler: event: ${JSON.stringify(event)}`);

  ow(event, ow.object.nonEmpty);
  ow(event.Records, ow.array.nonEmpty);
  ow(event.Records[0].EventSource, ow.string.equals('aws:sns'));
  ow(event.outputDir, ow.string.nonEmpty);

  const request = JSON.parse(event.Records[0].Sns.Message);

  const dataGenerator = new ProvisionDataGenerator();

  await dataGenerator.generateData({
    simulationId: request.simulationId,
    instanceId: request.instanceId,
    deviceTotal: request.deviceTotal,
    certificateId: request.certificateId,
    regions: request.regions,
    outputDir: request.outputDir
  });

};
