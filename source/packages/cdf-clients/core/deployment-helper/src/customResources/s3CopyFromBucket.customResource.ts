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

import { injectable, inject } from 'inversify';

import { TYPES } from '../di/types';
import { logger } from '../utils/logger';
import { CustomResource } from './customResource';
import { CustomResourceEvent } from './customResource.model';

@injectable()
export class S3CopyFromBucketCustomResource implements CustomResource {

    private s3: AWS.S3;

    constructor(
        @inject(TYPES.S3Factory) s3Factory: () => AWS.S3,
    ) {
        this.s3 = s3Factory();
    }

    public async create(customResourceEvent: CustomResourceEvent) {
        const sourceBucketName = customResourceEvent.ResourceProperties.SourceBucketName;
        const sourceBucketKey = customResourceEvent.ResourceProperties.SourceBucketKey;
        const destBucketName = customResourceEvent.ResourceProperties.DestBucketName;
        const destBucketKey = customResourceEvent.ResourceProperties.DestBucketKey;

        return await this.copy(sourceBucketName, sourceBucketKey, destBucketName, destBucketKey);
    }

    public async update(customResourceEvent: CustomResourceEvent) {
        const sourceBucketName = customResourceEvent.ResourceProperties.SourceBucketName;
        const sourceBucketKey = customResourceEvent.ResourceProperties.SourceBucketKey;
        const destBucketName = customResourceEvent.ResourceProperties.DestBucketName;
        const destBucketKey = customResourceEvent.ResourceProperties.DestBucketKey;

        return await this.copy(sourceBucketName, sourceBucketKey, destBucketName, destBucketKey);
    }

    public async delete() {
        return {};
    }

    public async copy(sourceBucketName: string, sourceBucketKey: string, destBucketName: string, destBucketKey: string) {

        const params = {
            Bucket: destBucketName,
            Key: destBucketKey,
            CopySource: `${sourceBucketName}/${sourceBucketKey}`,
            MetadataDirective: 'REPLACE',
        }

        try {
            await this.s3.copyObject(params).promise();
        } catch (err) {
            logger.error(JSON.stringify(err));
            if (err.code === 'NoSuchKey') {}
            throw err;
        }
    }

}
