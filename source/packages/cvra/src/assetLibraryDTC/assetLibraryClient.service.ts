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
import config from 'config';
import {Group10Resource, Group20Resource} from './groups.model';
import ow from 'ow';
import {PathHelper} from '../utils/path.helper';
import {QSHelper} from '../utils/qs.helper';
import * as request from 'superagent';

export class AssetLibraryClientService  {

    private DEFAULT_MIME_TYPE:string = 'application/vnd.aws-cdf-v1.0+json';

    private readonly baseUrl:string;

    private headers:{[key:string]:string};
    private readonly additionalHeaders:{[key:string]:string};
    private mimeType:string;
    private authToken:string;

    constructor() {

        this.baseUrl = config.get('cdf.assetLibrary.baseUrl') as string;
        if (config.has('cdf.assetLibrary.headers')) {
            this.additionalHeaders = config.get('cdf.assetLibrary.headers') as {[key:string]:string};
        }
        this.mimeType=this.DEFAULT_MIME_TYPE;
    }

    public init(options:AssetLibraryClientOptions) {
        if (options.mimeType) {
            this.mimeType=options.mimeType;
        }
        this.setAuthToken(options.authToken);
    }

    public setAuthToken(authToken?:string) {
        this.authToken=authToken;
        this.headers = undefined;
        this.getHeaders();
    }

    private getHeaders(): {[key:string]:string} {
        if (this.headers===undefined) {
            const h = {
                'Accept': this.mimeType,
                'Content-Type': this.mimeType
            };
            if (this.authToken!==undefined) {
                h['Authorization'] = `Bearer ${this.authToken}`;
            }
            this.headers = {...h, ...this.additionalHeaders};
        }
        return this.headers;
    }

    public async updateGroup(groupPath: string, body: Group10Resource|Group20Resource, applyProfileId?:string): Promise<void> {
        ow(groupPath, ow.string.nonEmpty);
        ow(body, ow.object.nonEmpty);

        let url = this.baseUrl + PathHelper.encodeUrl('groups', groupPath);
        const queryString = QSHelper.getQueryString({applyProfile:applyProfileId});
        if (queryString) {
            url += `?${queryString}`;
        }

        await request.patch(url)
            .send(body)
            .set(this.getHeaders());
    }
}

export class AssetLibraryClientOptions {
    mimeType?:string;
    authToken?:string;
}
