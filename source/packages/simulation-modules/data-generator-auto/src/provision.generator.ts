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

import {parseAsync} from 'json2csv';
import { logger } from './utils/logger';
import ow from 'ow';

import mocker from 'mocker-data-generator';
import { deviceSchema } from './schemas/provisioning/device';
import { supplierSchema, supplierFields } from './schemas/provisioning/supplier';
import { vehicleSchema } from './schemas/provisioning/vehicle';
import { vinSchema } from './schemas/provisioning/vin';
import { userSchema, usersFields } from './schemas/provisioning/user';
import { combinedVehicleSchema, combinedVehicleFields } from './schemas/provisioning/combinedVehicleData';
import { generateProvisionDataSchema } from './schemas/provisioning/config';
import * as fs from 'fs';
import { promisify } from 'util';
import * as mkdirp from 'mkdirp';

export interface GenerateDataOptions {
    simulationId: string;
    instanceId: number;
    deviceTotal: number;
    certificateId: string;
    regions:Region[];
    outputDir:string;
}

export interface Region {
    latitudeMin: number;
    latitudeMax: number;
    longitudeMin: number;
    longitudeMax: number;
    weight: number;
}

export class ProvisionDataGenerator {

    private readonly _writeFileAsync = promisify(fs.writeFile);
    // private readonly _mkdirpAsync = promisify(mkdirp.default);

    public async generateData(options:GenerateDataOptions) : Promise<void> {
        logger.debug(`provision.generator: generateData: in options: ${JSON.stringify(options)}}`);

        ow(options.simulationId, ow.string.nonEmpty);
        ow(options.instanceId, ow.number.greaterThan(0));
        ow(options.deviceTotal, ow.number.greaterThan(0));
        ow(options.certificateId, ow.string.nonEmpty);
        ow(options.regions, ow.object.nonEmpty);
        ow(options.regions, ow.array.nonEmpty.minLength(1));
        for (const r of (<Region[]>options.regions)) {
            ow(r.latitudeMin, ow.number.inRange(-90,90));
            ow(r.latitudeMax, ow.number.inRange(-90,90));
            ow(r.longitudeMin, ow.number.inRange(-180,180));
            ow(r.longitudeMax, ow.number.inRange(-180,180));
            ow(r.weight, ow.number.greaterThan(0));
        }
        ow(options.outputDir, ow.string.nonEmpty);

        const data = await this.faker(options);

        // convert the data to csv and save local
        try {
            await mkdirp.native(options.outputDir, undefined);
        } catch(err) {
            console.log(err)
        }

        let localFile = `${options.outputDir}/vehicles.csv`;
        logger.debug(`provision.generator: generateData: saving: ${localFile}`);
        let  dataAsCsv = await parseAsync(data.combinedVehicleData, {fields: combinedVehicleFields});
        await this._writeFileAsync(localFile, dataAsCsv);

        localFile = `${options.outputDir}/users.csv`;
        logger.debug(`provision.generator: generateData: saving: ${localFile}`);
        dataAsCsv = await parseAsync(data.usersData, {fields: usersFields});
        await this._writeFileAsync(localFile, dataAsCsv);

        localFile = `${options.outputDir}/suppliers.csv`;
        logger.debug(`provision.generator: generateData: saving: ${localFile}`);
        dataAsCsv = await parseAsync(data.suppliersData, {fields: supplierFields});
        await this._writeFileAsync(localFile, dataAsCsv);

        logger.debug(`provision.generator: generateData: exit`);

    }

    private async faker(opts:GenerateDataOptions): Promise<FakedData> {

        const configSchema = generateProvisionDataSchema(opts);

        const data = await mocker()
            // the order of these is important!
            .schema('config', configSchema, 1)
            .schema('users', userSchema, opts.deviceTotal)
            .schema('suppliers', supplierSchema, 1)
            .schema('vins', vinSchema, opts.deviceTotal)
            .schema('vehicles', vehicleSchema, opts.deviceTotal)
            .schema('devices', deviceSchema, opts.deviceTotal)
            .schema('combinedVehicleData', combinedVehicleSchema, opts.deviceTotal)
            .build();

        // This works.  but temp replaced with a single certificateId instead of individual csr;s
        // create csrs first async, as the mocker-data-generator is sync only,
        // with sync to async workarounds increasing processing time exponentially
        // const csrs= [];
        // const batchSize=10;
        // for (let i=0; i<opts.vehicles; i+=batchSize) {
        //     const csrCalls = [];
        //     for(let j=0; j<batchSize; j++) {
        //         csrCalls.push(this._csrGen.generate({}));
        //     }
        //     csrs.push(...await Promise.all(csrCalls));
        // }
        // // as we created csr's separately to the rest of the data, combine them
        // for (let i=0; i<data.combinedVehicleData.length; i++) {
        //     data.combinedVehicleData[i].csr=jsStringEscape(csrs[i]);
        // }

        const response:FakedData = {
            suppliersData: data.suppliers,
            usersData: data.users,
            combinedVehicleData: data.combinedVehicleData
        };

        // logger.debug(`generator: fake: data: ${JSON.stringify(data,null,2)}}`);
        return response;

    }
}

interface FakedData {
    combinedVehicleData: any;
    usersData: any;
    suppliersData: any;
}
