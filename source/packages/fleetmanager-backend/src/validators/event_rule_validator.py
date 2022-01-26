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
