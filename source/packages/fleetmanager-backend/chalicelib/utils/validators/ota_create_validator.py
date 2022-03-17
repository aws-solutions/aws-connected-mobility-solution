#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
"""Validator for incoming filter api parameters"""

from marshmallow import Schema, fields

"""
{
    "desiredVersion": "9.2",
    "filters": {
        "troubleCodes": [],
        "vehicle": {
            "vin": [],
            "make": [],
            "model": [],
            "year": []
        },
        "software": {
            "swVersion": ""
        }
    }
}
"""


class OTACreateSchema(Schema):
    desiredVersion = fields.Str()
    filters = fields.Nested("ChildOTAFiltersSchema")


class ChildOTAFiltersSchema(Schema):
    troubleCodes = fields.List(fields.Str())
    vehicle = fields.Nested("ChildOTAFiltersVehicleSchema")
    software = fields.Dict(keys=fields.Str(), values=fields.Str())


class ChildOTAFiltersVehicleSchema(Schema):
    vin = fields.List(fields.Str())
    make = fields.List(fields.Str())
    model = fields.List(fields.Str())
    year = fields.List(fields.Int())
