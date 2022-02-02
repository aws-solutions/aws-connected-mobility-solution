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
"""Validator for incoming IoT trip data"""

from marshmallow import Schema, fields

"""
{
    "tripsummary" : {
        "duration" : 1397098,
        "distance" : 23.312640441316034,
        "endlocation" : {
            "altitude" : 0,
            "latitude" : 36.38873030604302,
            "longitude" : -114.88766981109507
        },
        "fuel" : 559.441033099354,
        "starttime" : "2020-04-06T18:27:49.475Z",
        "startlocation" : {
            "altitude" : 0,
            "latitude" : 36.2523,
            "longitude" : -115.0112
        }
    },
    "creationtimestamp" : "2020-04-06T18:51:06.573Z",
    "vin" : "5AZHG76KXGA10001",
    "tripid" : "H8TRucIRX",
    "sendtimestamp" : "2020-04-06T18:51:06.573Z"
}
"""


class TripSchema(Schema):
    messageid = fields.Str()
    creationtimestamp = fields.DateTime()
    sendtimestamp = fields.DateTime(required=True)
    vin = fields.Str(required=True)
    tripid = fields.Str(required=True)
    tripsummary = fields.Nested("ChildTripSummarySchema")


class ChildTripSummarySchema(Schema):
    starttime = fields.DateTime()
    distance = fields.Decimal()
    duration = fields.Decimal()
    fuel = fields.Decimal()
    startlocation = fields.Nested("ChildEndLocationSchema")
    endlocation = fields.Nested("ChildStartLocationSchema")
    speedprofile = fields.Decimal()


class ChildStartLocationSchema(Schema):
    altitude = fields.Decimal()
    latitude = fields.Decimal()
    longitude = fields.Decimal()


class ChildEndLocationSchema(Schema):
    altitude = fields.Decimal()
    latitude = fields.Decimal()
    longitude = fields.Decimal()