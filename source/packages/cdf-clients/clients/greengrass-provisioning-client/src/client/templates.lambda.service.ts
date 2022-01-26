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

import {inject, injectable} from 'inversify';
import ow from 'ow';
import {RequestHeaders} from './common.model';
import { LambdaInvokerService, LAMBDAINVOKE_TYPES, LambdaApiGatewayEventBuilder } from '@cdf/lambda-invoke';
import { TemplatesServiceBase, TemplatesService } from './templates.service';
import { Template, TemplateList } from './templates.model';

@injectable()
export class TemplatesLambdaService extends TemplatesServiceBase implements TemplatesService {

    constructor(
        @inject(LAMBDAINVOKE_TYPES.LambdaInvokerService) private lambdaInvoker: LambdaInvokerService,
        @inject('greengrassProvisioning.apiFunctionName') private functionName : string
    ) {
        super();
        this.lambdaInvoker = lambdaInvoker;
    }

    async saveTemplate(template: Template, additionalHeaders?:RequestHeaders) : Promise<Template> {

        ow(template, ow.object.nonEmpty);
        ow(template.name, ow.string.nonEmpty);

        const event = new LambdaApiGatewayEventBuilder()
            .setPath(super.templateRelativeUrl(template.name))
            .setMethod('PUT')
            .setHeaders(super.buildHeaders(additionalHeaders))
            .setBody(template);

        const res = await this.lambdaInvoker.invoke(this.functionName, event);
        return res.body;

    }

    async getTemplate(name: string, additionalHeaders?:RequestHeaders) : Promise<Template> {

        ow(name, ow.string.nonEmpty);

        const event = new LambdaApiGatewayEventBuilder()
            .setPath(super.templateRelativeUrl(name))
            .setMethod('GET')
            .setHeaders(super.buildHeaders(additionalHeaders));

        const res = await this.lambdaInvoker.invoke(this.functionName, event);
        return res.body;
    }

    async listTemplates(additionalHeaders?:RequestHeaders) : Promise<TemplateList> {

        const event = new LambdaApiGatewayEventBuilder()
            .setPath(super.templatesRelativeUrl())
            .setMethod('GET')
            .setHeaders(super.buildHeaders(additionalHeaders));

        const res = await this.lambdaInvoker.invoke(this.functionName, event);
        return res.body;
    }

}
