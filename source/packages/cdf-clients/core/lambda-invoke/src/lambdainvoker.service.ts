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

import * as AWS from 'aws-sdk';

import { inject, injectable } from 'inversify';
import createHttpError from 'http-errors';

import { LAMBDAINVOKE_TYPES } from './di/types';
import { logger } from './utils/logger';

import {LambdaApiGatewayEventBuilder, LambdaApiGatewayEventResponse} from './lambdainvoker.model';

@injectable()
export class LambdaInvokerService {

    private lambda: AWS.Lambda;

    public constructor(
        @inject(LAMBDAINVOKE_TYPES.LambdaFactory) lambdaFactory: () => AWS.Lambda,
    ) {
        this.lambda = lambdaFactory();
    }

    public async invoke(functionName: string, apiEvent: LambdaApiGatewayEventBuilder) {
        logger.debug(`LambdaUtil.invoke: apiEvent: ${JSON.stringify(apiEvent)}`);

        const invokeRequest: AWS.Lambda.InvocationRequest = {
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(apiEvent)
        };

        const invokeResponse: AWS.Lambda.InvocationResponse = await this.lambda.invoke(invokeRequest).promise();
        logger.debug(`invokeResponse: ${JSON.stringify(invokeResponse)}`);

        if (invokeResponse.StatusCode >= 200 && invokeResponse.StatusCode < 300 ) {
            const response = new LambdaApiGatewayEventResponse(invokeResponse.Payload);
            logger.debug(`payload: ${JSON.stringify(response)}`);

            if (response.status > 300) {
                const error = createHttpError(response.status);
                error.status = response.status;
                error.response = response;
                throw error;
            }

            return response;
        } else {
            const error = createHttpError(invokeResponse.StatusCode);
            error.status = invokeResponse.StatusCode;
            throw error;
        }

    }
}
