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
"""Validator for incoming filter api parameters"""

from marshmallow import Schema, fields

"""
{
    "filters":{
        "software":{
            "swVersion":""
        },
        "anomalies": ["OilTemp"],
        "troubleCodes": ["U1234"],
        "vehicle":{
            "vin":[],
            "make":[],
            "model":[],
            "year":[]
        },
        "boundaries":[
            [-115.384126, 35.912202, -114.947419, 36.265106]
        ]
    },
    "pagination": {
        "offset": 0,
        "maxResults": 20
    },
    "clusters": {
        "zoom": 6
    }
}
"""


class VehicleAggregateAPISchema(Schema):
    filters = fields.Nested("ChildAggregateSchema", required=True)
    pagination = fields.Nested("ChildAggregatePaginationSchema", required=True)
    clusters = fields.Nested("ChildAggregateClustersSchema", required=True)


class ChildAggregateSchema(Schema):
    software = fields.Dict(keys=fields.Str(), values=fields.Str(), required=True)
    anomalies = fields.List(fields.Str(), required=True)
    troubleCodes = fields.List(fields.Str(), required=True)
    vehicle = fields.Nested("ChildAggregateVehicleSchema", required=True)
    boundaries = fields.List(fields.List(fields.Float()), required=True)


class ChildAggregateVehicleSchema(Schema):
    vin = fields.List(fields.Str())
    make = fields.List(fields.Str())
    model = fields.List(fields.Str())
    year = fields.List(fields.Int())


class ChildAggregatePaginationSchema(Schema):
    offset = fields.Int()
    maxResults = fields.Int()


class ChildAggregateClustersSchema(Schema):
    zoom = fields.Int()
