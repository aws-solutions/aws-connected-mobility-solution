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
import { GenerateDataOptions } from '../../provision.generator';

export function generateProvisionDataSchema(opts:GenerateDataOptions) : any {

    // calculate region weighting
    const regionWeights:number[]= [];
    Object.keys(opts.regions).forEach(k=> {
        regionWeights.push(opts.regions[k].weight);
    });

    const schema = {
        certificateId: {
            static: opts.certificateId
        },
        regions: {
            function() {
                return opts.regions;
            }
        },
        regionWeights: {
            function() {
                return regionWeights;
            }
        },

    };

    return schema;

}
