# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
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
