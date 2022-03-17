#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
"""Validator for incoming charts api parameters"""

from marshmallow import Schema, fields

"""
   
{
   "filters":{
      "location":{"options":[]},
      "vehicle":{"vin":{"options":[]},"make":{"options":[]},"model":{"options":[]},"year":{"options":[]}},
      "ignition":{"on":true},"last_seen_offset":<int>,"pagination_count": <int>}

}
"""

class ChartsFilterAPISchema(Schema):
   filters = fields.Nested("ChartsChildFiltersSchema", required=True)


class ChartsChildFiltersSchema(Schema):
   location = fields.Dict(keys=fields.Str(), values=fields.List(fields.Int()))
   vehicle = fields.Nested("ChartsChildVehicleSchema", required=True)
   ignition = fields.Dict(keys=fields.Str(), values=fields.Boolean())
   last_seen_offset = fields.Int()
   pagination_count = fields.Int()


class ChartsChildVehicleSchema(Schema):
   vin = fields.Dict(keys=fields.Str(), values=fields.List(fields.Dict(keys=fields.Str(), values=fields.Str())))
   make = fields.Dict(keys=fields.Str(), values=fields.List(fields.Str()))
   model = fields.Dict(keys=fields.Str(), values=fields.List(fields.Str()))
   year = fields.Dict(keys=fields.Str(), values=fields.List(fields.Str()))
   