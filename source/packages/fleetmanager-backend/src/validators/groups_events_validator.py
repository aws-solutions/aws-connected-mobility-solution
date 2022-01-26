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
"""Validator for incoming IoT Group (vehicle) data"""

from marshmallow import Schema, fields

"""
{
    "objectid": "/auto/vehicles/1hgbh41jxmn109186",
    "type": "groups",
    "event": "modify",
    "payload": "{}",
    "time": "2019-11-23T22:30:41.123Z"
}

Just Payload Section
{
   "groups":{},
   "attributes":{
      "make":"AMZ",
      "model":"2",
      "modelyear":2009,
      "bodytype":"Estate",
      "fueltype":"Gas",
      "transmissiontype":"Manual",
      "colorcode":"254",
      "ivitype":"HiLine"
   },
   "templateid":"auto_vehicle",
   "parentpath":"/auto/vehicles",
   "grouppath":"/auto/vehicles/4azvf37vxbe10003",
   "category":"group",
   "name":"4AZVF37VXBE10003"
}
"""


class GroupSchema(Schema):
    groups = fields.Dict()
    attributes = fields.Nested("ChildAttributesSchema", required=True)
    templateid = fields.Str()
    parentpath = fields.Str()
    grouppath = fields.Str()
    category = fields.Str()
    name = fields.Str(required=True)


class ChildAttributesSchema(Schema):
    make = fields.Str()
    model = fields.Str()
    modelyear = fields.Int()
    bodytype = fields.Str()
    fueltype = fields.Str()
    transmissiontype = fields.Str()
    colorcode = fields.Str()
    ivitype = fields.Str()
