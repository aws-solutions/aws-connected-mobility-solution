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
process.env['NODE_CONFIG_DIR'] = __dirname + '/config';

console.log(`NODE_CONFIG_DIR: ${process.env['NODE_CONFIG_DIR'] }`);

import { CDFConfigInjector } from '../index';
import { CDFLogger } from '@cdf/logger';

import { Container, injectable, inject } from 'inversify';

@injectable()
export class TestService {
  constructor(@inject('aws.region') public awsRegion: string,
              @inject('aws.db.connection_url') public dbConnectionString: string) { }
}

const container = new Container();
const logger = new CDFLogger('debug');
let theService: TestService;

describe('ConfigInjector', () => {
  beforeAll((done) => {
    const configInjector = new CDFConfigInjector();
    container.load(configInjector.getConfigModule());
    container.bind<TestService>('TheService').to(TestService);
    theService = container.get<TestService>('TheService');
    logger.debug('container initialized');
    logger.debug(`region : ${container.get('aws.region')}`);
    done();
  });
  // this.timeout(15000);
  describe('injected values', () => {
    it('should get valid access config data', async () => {
      expect(theService).toBeDefined();
      expect(theService.awsRegion).toEqual('us-west-2');
      expect(theService.dbConnectionString).toEqual('https://testdb');
    });

  });
});
