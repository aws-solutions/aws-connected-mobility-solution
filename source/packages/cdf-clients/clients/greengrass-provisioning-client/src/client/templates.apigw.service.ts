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
/* tslint:disable:no-unused-variable member-ordering */

import {injectable} from 'inversify';
import config from 'config';
import ow from 'ow';
import * as request from 'superagent';
import {RequestHeaders} from './common.model';
import { TemplatesServiceBase, TemplatesService } from './templates.service';
import { Template, TemplateList } from './templates.model';

@injectable()
export class TemplatesApigwService extends TemplatesServiceBase implements TemplatesService {

    private readonly baseUrl:string;

    public constructor() {
        super();
        this.baseUrl = config.get('greengrassProvisioning.baseUrl') as string;
    }

    async saveTemplate(template: Template, additionalHeaders?:RequestHeaders) : Promise<Template> {
        ow(template, ow.object.nonEmpty);
        ow(template.name, ow.string.nonEmpty);
        const url = `${this.baseUrl}${super.templateRelativeUrl(template.name)}`;

        const res = await request.put(url)
            .send(template)
            .set(this.buildHeaders(additionalHeaders));
        return res.body;

    }

    async getTemplate(name: string, additionalHeaders?:RequestHeaders) : Promise<Template> {

        ow(name, ow.string.nonEmpty);

        const url = `${this.baseUrl}${super.templateRelativeUrl(name)}`;

        const res = await request.get(url)
            .set(this.buildHeaders(additionalHeaders));
        return res.body;

    }

    async listTemplates(additionalHeaders?:RequestHeaders) : Promise<TemplateList> {

        const url = `${this.baseUrl}${super.templatesRelativeUrl()}`;

        const res = await request.get(url)
            .set(this.buildHeaders(additionalHeaders));
        return res.body;

    }
}
