#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
"""Validator for incoming IoT dtc data"""

from marshmallow import Schema, fields

"""
{
  "MessageId": "5AZJH09WXCB10004-2020-04-18T06:59:40.534Z",
  "CreationTimeStamp": "2020-04-18T06:59:40.534Z",
  "SendTimeStamp": "2020-04-18T06:59:40.534Z",
  "VIN": "5AZJH09WXCB10004",
  "DTC": {
    "Code": "P1734",
    "Changed": "true"
  }
}
"""


class DtcSchema(Schema):
    messageid = fields.Str()
    creationtimestamp = fields.DateTime()
    sendtimestamp = fields.DateTime(required=True)
    vin = fields.Str(required=True)
    dtc = fields.Nested("ChildDtcSchema")


class ChildDtcSchema(Schema):
    code = fields.Str(required=True)
    changed = fields.Str()
