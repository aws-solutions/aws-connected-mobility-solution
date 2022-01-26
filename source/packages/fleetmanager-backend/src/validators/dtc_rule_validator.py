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
