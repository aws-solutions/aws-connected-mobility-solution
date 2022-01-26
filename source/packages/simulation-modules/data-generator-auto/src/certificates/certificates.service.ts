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
import * as pem from 'pem';
import { CertificateInfo } from './certificates.models';
// import {logger} from '../utils/logger';

export class CsrGenerator {

    public async generate(certInfo: CertificateInfo) {
        // logger.debug(`CsrGenerator: generate: in: certInfo:${JSON.stringify(certInfo)}`);

        const privateKey = await this.createPrivateKey();
        const csr = await this.createCSR(privateKey, certInfo);

        // logger.debug(`CsrGenerator: generate: exit: csr:${csr}`);
        return csr;
    }

    private createPrivateKey() : Promise<string> {
        return new Promise((resolve:any,reject:any) =>  {
            pem.createPrivateKey(2048, (err:any, data:any) => {
                if(err) {
                    return reject(err);
                }
                return resolve(data.key);
            });
        });
    }

    private createCSR(privateKey:string, certInfo: CertificateInfo) : Promise<string> {
        return new Promise((resolve:any,reject:any) =>  {
            const csrOptions= {
                country: certInfo.country,
                organization: certInfo.organization,
                organizationUnit: certInfo.organizationalUnit,
                state: certInfo.stateName,
                commonName: certInfo.commonName,
                clientKey: privateKey
            };
            pem.createCSR(csrOptions, (err:Object, data:any) => {
                if(err) {
                    return reject(err);
                }
                return resolve(data.csr);
            });
        });
    }
}
