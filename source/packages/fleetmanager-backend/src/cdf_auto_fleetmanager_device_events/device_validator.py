#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
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


class TCUSchema(Schema):
    attributes = fields.Nested("NestedTCUAttributes")
    groups = fields.Dict(keys=fields.Str(), values=fields.Str())
    devices = fields.Dict(keys=fields.Str(), values=fields.Str())
    deviceid = fields.Str()
    category = fields.Str()
    templateid = fields.Str()


class NestedTCUAttributes(Schema):
    status = fields.Str(required=True)
    softwareversion = fields.Str()


class SensorDeviceSchema(Schema):
    attributes = fields.Nested("NestedSensorAttributes", required=True)
    groups = fields.Nested("NestedSensorGroups", required=True)
    devices = fields.Dict(keys=fields.Str(), values=fields.Str())
    deviceid = fields.Str()
    category = fields.Str()
    templateid = fields.Str()
    state = fields.Str()


class NestedSensorAttributes(Schema):
    type = fields.Str(required=True)
    position = fields.Str()
    model = fields.Str()


class NestedSensorGroups(Schema):
    out = fields.Dict(keys=fields.Str(), values=fields.List(fields.Str(required=True)))
