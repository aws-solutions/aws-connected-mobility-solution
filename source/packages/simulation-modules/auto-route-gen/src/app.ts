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

import {RouteGenerator} from './route-gen';
import {SimulatorRouteProfiles} from './models/route.models';
import * as fs from 'fs';

// parse the command args
const argv = yargs
    .usage('Usage: $0 <command> [options]')

    .number(['latitude'])
    .describe('latitude', 'Route starting latitude')

    .number(['longitude'])
    .describe('longitude', 'Route starting longitude')

    .string(['triggers'])
    .describe('triggers', 'Route Triggers such as DTC, oil temp, no triggers will be added if not provided')

    .string(['profile'])
    .describe('profile', 'Route Profile, i.e aggressive | normal, will be defaulted to normal if not provided')

    .string(['distance'])
    .describe('distance', 'Route Distance, will be defaulted if not provided')

    .string(['saveAs'])
    .describe('saveAs', 'Location to save the route')

    .demandOption(['latitude', 'longitude', 'saveAs'])

    .argv;

const routeGenerator = new RouteGenerator({
    startLocation: {
        lat: argv.latitude,
        lon: argv.longitude
    },
    triggers: argv.triggers ? JSON.parse(argv.triggers) : [],
    profile: argv.profile ? SimulatorRouteProfiles[argv.profile] : SimulatorRouteProfiles.normal,
    distance: Number(argv.distance),
});

routeGenerator.generate()
    .then(route=>  fs.writeFileSync(argv.saveAs, JSON.stringify(route)))
    .catch(err=> logger.error(err))
    .then(()=> process.exit());
