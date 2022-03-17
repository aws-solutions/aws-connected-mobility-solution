#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
"""Validator for incoming IoT Event data"""

from marshmallow import Schema, fields

"""
{
    "messageid" : "1AZPG71SXDC10042-2019-12-19-13-37-58-2ae34de2-227c-11ea-93e3-0242ac110003",
    "creationtimestamp" : "2019-12-19T16:25:17.133Z",
    "sendtimestamp" : "2019-12-19T16:25:27.870Z",
    "vin" : "1AZPG71SXDC10042",
    "alert" : {
        "videoevent" : {
            "event_name" : "WarningPedestriansCrossing",
            "event_source" : "mapbox",
            "event_id" : 169,
            "event_data" : { },
            "event_location" : {
                "latitude" : 47.5859241,
                "longitude" : -122.3983032
            }
        }
    }
}
"""


class EventSchema(Schema):
    messageid = fields.Str()
    creationtimestamp = fields.DateTime()
    sendtimestamp = fields.DateTime(required=True)
    vin = fields.Str(required=True)
    alert = fields.Nested("ChildAlertSchema")


class ChildAlertSchema(Schema):
    videoevent = fields.Nested("ChildVideoEventSchema", required=True)


class ChildVideoEventSchema(Schema):
    event_name = fields.Str()
    event_source = fields.Str()
    event_id = fields.Int()
    event_data = fields.Dict(keys=fields.Str(), values=fields.Str())
    event_location = fields.Dict(keys=fields.Str(), values=fields.Decimal())
