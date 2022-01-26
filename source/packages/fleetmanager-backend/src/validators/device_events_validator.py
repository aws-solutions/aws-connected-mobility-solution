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
"""Validator for incoming IoT Device data"""

from marshmallow import Schema, fields

"""
*Focus only on the payload value
{
    "objectid":"ecu-aws-2014-ybjgqxueqp",
    "type":"devices",
    "event":"modify",
    "payload":{
        "attributes":{
            "status":"installed",
            "softwareVersion":"2.3"
        },
        "groups":{},
        "devices":{},
        "deviceid":"ecu-aws-2014-ybjgqxueqp",
        "category":"device",
        "templateid":"auto_ecu"
    },
    "time":"2020-04-06T18:19:39.890Z"
}
OR
*Focus only on the attributes value
{
    "objectid": "12345",
    "type": "devices",
    "event": "modify",
    "attributes": {
        "deviceid": "ecu-aws-2014-umyi8trclr",
        "attachedtogroup": "/auto/vehicles/1hgbh41jxmn109186",
        "relationship": "installed_in"
    },
    "time": "2019-11-24T02:40:12.543Z"
}
"""


class SoftwareVersionSchema(Schema):
    attributes = fields.Nested("ChildSVAttributesSchema")
    groups = fields.Dict(keys=fields.Str(), values=fields.Str())
    devices = fields.Dict(keys=fields.Str(), values=fields.Str())
    deviceid = fields.Str()
    category = fields.Str()
    templateid = fields.Str()


class ChildSVAttributesSchema(Schema):
    status = fields.Str(required=True)
    softwareversion = fields.Str()


class VinSchema(Schema):
    deviceid = fields.Str(required=True)
    attachedtogroup = fields.Str(required=True)
    relationship = fields.Str(required=True)
