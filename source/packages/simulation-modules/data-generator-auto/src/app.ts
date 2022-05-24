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
import yargs from 'yargs';
import {logger} from './utils/logger';
import { ProvisionDataGenerator, Region } from './provision.generator';

// parse the command args
const argv = yargs
    .usage('Usage: $0 <command> [options]')

    .string('simulationId')
    .number('instanceId')
    .number('deviceTotal')

    .string('region')

    .string('certificateId')

    .string('outputDir')

    .demand(['simulationId', 'instanceId', 'deviceTotal', 'region', 'certificateId', 'outputDir'])

    .argv;

logger.debug(`Running with args: ${JSON.stringify(argv)}`);

let rawRegions:string[];
if (Array.isArray(argv.region)) {
    rawRegions=argv.region as string[];
} else {
    rawRegions=[argv.region];
}

const regions:Region[]= [];
for(const r of rawRegions) {
    if (r===null || r===undefined || r==='' || r==='1') {
        continue;
    }
    const splitRegion = r.split(',');
    const region:Region= {
        latitudeMin:9999,
        latitudeMax:9999,
        longitudeMin:9999,
        longitudeMax:9999,
        weight:0
    };
    splitRegion.forEach(sr=> {
        const keyValuePair=sr.split(':');
        region[keyValuePair[0]]=Number(keyValuePair[1]);
    });
    regions.push(region);
}

logger.debug(`Regions: ${JSON.stringify(regions)}`);

const instance = new ProvisionDataGenerator();
instance.generateData({
    simulationId: argv.simulationId,
    instanceId: argv.instanceId,
    deviceTotal: argv.deviceTotal,
    certificateId: argv.certificateId,
    regions,
    outputDir: argv.outputDir
});
