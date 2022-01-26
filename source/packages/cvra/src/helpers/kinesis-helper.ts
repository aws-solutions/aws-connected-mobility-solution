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
import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

/**
 * Helper function to interact with AWS IoT for cfn custom resource.
 *
 * @class iotHelper
 */

export class KinesisHelper {
    public createKinesisAnalyticsApp = async (settings:any) => {
        logger.debug(`kinesisHelper.createKinesisAnalyticsApp(): ${JSON.stringify(settings)}`)

        const _params = {
            ApplicationName: settings.appName,
            ApplicationDescription: 'This Amazon Kinesis Analaytics application detects anomalous oil temperatures for the connected vehicle platform',
            Inputs: [{
                InputSchema: {
                    RecordColumns: [{
                        Name: 'ts',
                        SqlType: 'TIMESTAMP',
                        Mapping: '$.CreationTimeStamp'
                    }, {
                        Name: 'vin',
                        SqlType: 'VARCHAR(32)',
                        Mapping: '$.VIN'
                    }, {
                        Name: 'oil_temp',
                        SqlType: 'DOUBLE',
                        Mapping: '$.OilTemp'
                    }, {
                        Name: 'latitude',
                        SqlType: 'DOUBLE',
                        Mapping: '$.GeoLocation.Latitude'
                    }, {
                        Name: 'longitude',
                        SqlType: 'DOUBLE',
                        Mapping: '$.GeoLocation.Longitude'
                    }],
                    RecordFormat: {
                        RecordFormatType: 'JSON',
                        MappingParameters: {
                            JSONMappingParameters: {
                                RecordRowPath: '$'
                            }
                        }
                    },
                    RecordEncoding: 'UTF-8'
                },
                NamePrefix: 'SOURCE_SQL_STREAM',
                KinesisFirehoseInput: {
                    ResourceARN: settings.deliveryStream,
                    RoleARN: settings.roleArn
                }
            }],
            Outputs: [{
                DestinationSchema: {
                    RecordFormatType: 'JSON'
                },
                Name: 'ANOMALY_OUTPUT_STREAM',
                KinesisStreamsOutput: {
                    ResourceARN: settings.anomalyStream,
                    RoleARN: settings.roleArn
                }
            }],
            ApplicationCode: 'CREATE OR REPLACE STREAM "TEMP_STREAM" ("ts" TIMESTAMP,"oil_temp" DOUBLE, "vin" VARCHAR(32),"ANOMALY_SCORE" DOUBLE);\r\n\
              CREATE OR REPLACE STREAM "ANOMALY_STREAM" ("ts" TIMESTAMP,"oil_temp" DOUBLE, "vin" VARCHAR(32),"ANOMALY_SCORE" DOUBLE);\r\n\
              CREATE OR REPLACE STREAM "ANOMALY_OUTPUT_STREAM" ("ts" TIMESTAMP, "oil_temp" DOUBLE, "vin" VARCHAR(32),"ANOMALY_SCORE" DOUBLE, "low_limit" INT,  "anomaly_type" VARCHAR(32), "val" DOUBLE);\r\n\
              -- Option 1 - Compute an anomaly score for each oil temperature record in the input stream using unsupervised machine learning algorithm, Random Cut Forest\r\n\
              --CREATE OR REPLACE PUMP "STREAM_PUMP" AS INSERT INTO "TEMP_STREAM" SELECT STREAM "ts","val", "trip_id", "vin", ANOMALY_SCORE FROM TABLE(RANDOM_CUT_FOREST(CURSOR(SELECT STREAM * FROM "SOURCE_SQL_STREAM_001" WHERE  "oil_temp" > 240),10,10,10,1));\r\n\
              -- Option 2 - Compute an anomaly score for each oil temperature record in the input stream, where the anomaly is a simple diff between the observed oil temperature and a predefined average\r\n\
              CREATE OR REPLACE PUMP "STREAM_PUMP" AS INSERT INTO "TEMP_STREAM" SELECT STREAM "ts","oil_temp", "vin", ("oil_temp"-250) as ANOMALY_SCORE FROM "SOURCE_SQL_STREAM_001";\r\n\
              CREATE OR REPLACE PUMP "ANOMALY_STREAM_PUMP" AS INSERT INTO "ANOMALY_STREAM" SELECT STREAM * FROM "TEMP_STREAM";\r\n\
              CREATE OR REPLACE PUMP "OUTPUT_PUMP" AS INSERT INTO "ANOMALY_OUTPUT_STREAM" SELECT STREAM *, 250 as low_limit, \'OilTemp\' as anomaly_type, "oil_temp" as val FROM "TEMP_STREAM" WHERE ANOMALY_SCORE > 30;\r\n'
        };

        const kinesisAnalytics = new AWS.KinesisAnalytics();
        try {
            await kinesisAnalytics.createApplication(_params).promise();
            const application = await kinesisAnalytics.describeApplication({
                ApplicationName: settings.appName
            }).promise();

            logger.debug(`Kinesis Application: ${JSON.stringify(application)}`);
            const appInputId = application.ApplicationDetail.InputDescriptions[0].InputId;
            return await this.startKinesisAnalyticsApp({
                appName: settings.appName,
                appInputId
            });
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    public deleteKinesisAnalyticsApp = async (settings:any) => {
        logger.debug(`kinesisHelper.deleteKinesisAnalyticsApp(): ${JSON.stringify(settings)}`)
        const _params = {
            ApplicationName: settings.appName
        };

        const kinesisAnalytics = new AWS.KinesisAnalytics();
        try {
            const kinesisApplication = await kinesisAnalytics.describeApplication(_params).promise();
            const _delete_params = {
                ApplicationName: settings.appName,
                CreateTimestamp:kinesisApplication.ApplicationDetail.CreateTimestamp
            };
            return await kinesisAnalytics.deleteApplication(_delete_params).promise();
        } catch (err) {
            logger.error(err);

            throw err;
        }
    }

    private startKinesisAnalyticsApp = async (params:any) => {
        logger.debug(`kinesisHelper.startKinesisAnalyticsApp(): ${JSON.stringify(params)}`)
        const kinesisAnalytics = new AWS.KinesisAnalytics();
        try {
            return await kinesisAnalytics.startApplication({
                ApplicationName: params.appName,
                InputConfigurations: [{
                    Id: params.appInputId,
                    InputStartingPositionConfiguration: {
                        InputStartingPosition: 'NOW'
                    }
                }]
            }).promise();
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}
