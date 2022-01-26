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
import { ProvisionDataGenerator } from './provision.generator';
import * as pLimit from 'p-limit';

describe('Generator', () => {
    const instance = new ProvisionDataGenerator();

    it('generateData should run create csv files', async () => {

        jest.setTimeout(600000);

        const simulationIds=['DEAN1234'];
        const instances=1;
        const batchQty=10;
        // 0937:
        const certificateId= 'c2c0fa5e489f9f4a8f3881d07049691f444bc349f5b5a8ecb7cd0d58fb211f04';
        // 1577:
        // const certificateId: 'ee9116006a52b26247432e265dea40d9240ba70dce758db9cbec1582f66e49b0',

        const limit = pLimit.default(6);

        for (const id of simulationIds) {
            const promises:Promise<void>[]= [];
            for (let instanceId=1; instanceId<=instances; instanceId++) {
                promises.push(limit(()=> instance.generateData({
                    simulationId:id,
                    instanceId,
                    deviceTotal:batchQty,
                    certificateId,
                    regions: [{
                        // seattle
                        latitudeMin: 47.501957,
                        longitudeMin: -122.432518,
                        latitudeMax: 47.728965,
                        longitudeMax: -122.247523,
                        weight: 20
                    },{
                        // vegas
                        latitudeMin: 36.309945,
                        longitudeMin: -115.337742,
                        latitudeMax: 35.980028,
                        longitudeMax: -114.925754,
                        weight: 70
                    }],
                    outputDir: `/tmp/${id}/${instanceId}`
                })));
            }
            await Promise.all(promises);
        }

    });

});
