# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Validator for incoming IoT Group (vehicle) data"""

from marshmallow import Schema, fields

"""
Service Set Group (Payload)
{
  "payload":{
    "groups":{
      "out":{
      "available":[
        "/auto/vehicles/5azie98sxdd10000"
      ],
      "included":[
        "/services/lock",
        "/services/horn",
        "/services/headlights",
        "/services/window"
      ]
    }
  },
  "attributes":{
    "provider":"Denso",
    "serviceStartedAt":"2020-12-09",
    "serviceEndedAt":"2021-12-09"
  }
}
"""


class ServiceSetGroupSchema(Schema):
    groups = fields.Nested("NestedSSGroupsSchema", required=True)
    attributes = fields.Nested("NestedSSAttributesSchema", required=True)
    templateid = fields.Str(required=True)
    name = fields.Str(required=True)
    parentpath = fields.Str()
    grouppath = fields.Str()
    category = fields.Str()


class NestedSSGroupsSchema(Schema):
    out = fields.Nested("NestedGroupsSS", required=True)


class NestedGroupsSS(Schema):
    available = fields.List(fields.Str(required=True))
    included = fields.List(fields.Str(required=True))


class NestedSSAttributesSchema(Schema):
    servicestartedat = fields.Str()
    serviceendedat = fields.Str()
    provider = fields.Str(required=True)
