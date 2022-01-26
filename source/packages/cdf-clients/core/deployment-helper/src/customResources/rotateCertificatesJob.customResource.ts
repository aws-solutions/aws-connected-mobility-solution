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
import { injectable } from 'inversify';
import config from 'config';

import * as request from 'superagent';

import { logger } from '../utils/logger';

import { CustomResourceEvent } from './customResource.model';
import { CustomResource } from './customResource';

@injectable()
export class RotateCertificatesJobCustomResource implements CustomResource {

    protected headers:{[key:string]:string};
    private DEFAULT_MIME_TYPE:string = 'application/vnd.aws-cdf-v1.0+json';
    private mimeType:string;

    constructor() {
        this.mimeType=this.DEFAULT_MIME_TYPE;
    }

    public async create(customResourceEvent: CustomResourceEvent) : Promise<any> {
        const endpoint = customResourceEvent.ResourceProperties.CommandsUrl;
        const thingArn = customResourceEvent.ResourceProperties.ThingGroupArn;

        await this.createRotateCertificatesJobTemplate(endpoint);
        const commandLocation = await this.createRotateCertificatesJob(endpoint, thingArn);
        await this.publishRotateCertificatesJob(endpoint, commandLocation);
    }

    public async update(_customResourceEvent: CustomResourceEvent) : Promise<any> {
        return {};
    }

    public async delete(_customResourceEvent: CustomResourceEvent) : Promise<any> {
        return {};
    }

    protected getHeaders(): {[key:string]:string} {
        if (this.headers===undefined) {
            const h = {
                'Accept': this.mimeType,
                'Content-Type': this.mimeType
            };
            this.headers = {...h};
        }
        return this.headers;
    }

    protected async createRotateCertificatesJobTemplate(endpoint: string) {
        logger.debug(`RotateCertificatesJobCustomResource: createRotateCertificatesJobTemplate: in: `);
        const payload = {
            'templateId': 'RotateCertificates',
            'description': 'Rotate certificates',
            'operation' : 'RotateCertificates',
            'document': '{"get":{"subscribe":"${cdf:parameter:getSubscribeTopic}","publish":"${cdf:parameter:getPublishTopic}"},"ack":{"subscribe":"${cdf:parameter:ackSubscribeTopic}","publish":"${cdf:parameter:ackPublishTopic}"}}',
            'requiredDocumentParameters': [
                'getSubscribeTopic',
                'getPublishTopic',
                'ackSubscribeTopic',
                'ackPublishTopic'
            ]
        };

        const url = `${endpoint}/templates`;

        try {
            await request.post(url)
                .set(this.getHeaders())
                .send(payload);
        } catch (err) {
            logger.error(JSON.stringify(err));
            if(err.status === 409) {
                return {};
            }
            throw new Error(err);
        }
        logger.debug(`RotateCertificatesJobCustomResource: createRotateCertificatesJobTemplate: out: `);
        return {};
    }

    protected async createRotateCertificatesJob(endpoint: string, thingGroupArn: string) {
        logger.debug(`RotateCertificatesJobCustomResource: :createRotateCertificatesJob in: `);

        const MQTT_GET_TOPIC = config.get('mqtt.topics.get.root');
        const MQTT_ACK_TOPIC = config.get('mqtt.topics.ack.root');
        const oldText = '/+/';
        const newText = '/{thingName}/';
        const getSubscribeTopic = `${MQTT_GET_TOPIC}/${oldText}/${newText}/+`;
        const getPublishTopic = `${MQTT_GET_TOPIC}/${oldText}/${newText}`;
        const ackSubscribeTopic = `${MQTT_ACK_TOPIC}/${oldText}/${newText}/+`;
        const ackPublishTopic = `${MQTT_ACK_TOPIC}/${oldText}/${newText}`;

        const payload = {
            'templateId': 'RotateCertificates',
            'targets': [ thingGroupArn ],
            'type': 'CONTINUOUS',
            'rolloutMaximumPerMinute': 120,
            'documentParameters': {
                'getSubscribeTopic': getSubscribeTopic,
                'getPublishTopic': getPublishTopic,
                'ackSubscribeTopic': ackSubscribeTopic,
                'ackPublishTopic': ackPublishTopic
            }
        };

        const url = `${endpoint}/commands`;

        let result;
        try {
            result = await request.post(url)
                .set(this.getHeaders())
                .send(payload);
        } catch (err) {
            logger.error(JSON.stringify(err));
            throw new Error(err);
        }
        logger.debug(`RotateCertificatesJobCustomResource: :createRotateCertificatesJob out: ${JSON.stringify(result)}`);
        return result.header.location;
    }

    protected async publishRotateCertificatesJob(endpoint: string, commandLocation: string) {
        logger.debug(`RotateCertificatesJobCustomResource: :publishRotateCertificatesJob in: `);
        const payload = {
            'commandStatus': 'PUBLISHED'
        };

        const url = `${endpoint}${commandLocation}`;

        try {
            await request.patch(url)
                .set(this.getHeaders())
                .send(payload);
        } catch (err) {
            if (err.response.body.error === 'UNSUPPORTED_TRANSITION') {
                return {};
            }
            logger.error(JSON.stringify(err));
            throw new Error(err);
        }
        logger.debug(`RotateCertificatesJobCustomResource: :publishRotateCertificatesJob out: `);
        return {};
    }
}
