#---------------------------------------------------------------------------------------------------------------------
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
#---------------------------------------------------------------------------------------------------------------------
"""Validator for incoming IoT OTA data"""

from marshmallow import Schema, fields

"""
{
  "eventType": "JOB_EXECUTION",
  "eventId": "6a9191a9-4d15-4846-9a6f-e0429d98161a",
  "timestamp": 1587497526,
  "operation": "succeeded",
  "jobId": "cdf-c37f9510-8406-11ea-ad1e-f59392e78371",
  "thingArn": "arn:aws:iot:us-west-2:xxxxxxxxxxxx:thing/ECU-AWS-2017-Q4MWJUSLAH",
  "status": "SUCCEEDED"
}
"""


class OtaSchema(Schema):
    eventtype = fields.Str()
    eventid = fields.Str()
    timestamp = fields.Str()
    operation = fields.Str()
    jobid = fields.Str(required=True)
    thingarn = fields.Str(required=True)
    status = fields.Str(required=True)
