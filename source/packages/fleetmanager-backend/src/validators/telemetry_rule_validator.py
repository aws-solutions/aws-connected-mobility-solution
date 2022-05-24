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
"""Validator for incoming IoT telemetry data"""

from marshmallow import Schema, fields

"""
{
   "messageid":"5AZMJ59WXHD10002-2020-04-06T18:27:54.762Z",
   "simulationid":"fMtUITZgG",
   "creationtimestamp":"2020-04-06T18:27:54.762Z",
   "sendtimestamp":"2020-04-06T18:27:54.762Z",
   "vin":"5AZMJ59WXHD10002",
   "driverid":"",
   "geolocation":{
      "latitude":47.59943001055839,
      "longitude":-122.40145993517973,
      "altitude":0,
      "heading":76.41972147846934,
      "speed":52.20532731532755
   },
   "communications":{
      "gsm":{
         "satelites":"",
         "fix":"",
         "networktype":"",
         "mnc":"",
         "mcc":"",
         "lac":"",
         "cid":""
      },
      "wifi":{
         "networkid ":""
      },
      "wired":{
         "networkid ":""
      }
   },
   "acceleration":{
      "maxlongitudinal":{
         "axis":0,
         "value":14.809766537028473
      },
      "maxlateral":{
         "axis":0,
         "value":14.809766537028473
      }
   },
   "throttle":{
      "max":27.045815904809814,
      "average":0
   },
   "speed":{
      "max":52.20532731532755,
      "average":0
   },
   "odometer":{
      "metres":131497.02661035192,
      "ticksfl":0,
      "ticksfr":0,
      "ticksrl":0,
      "ticksrr":0
   },
   "fuel":1.0735107507144903,
   "name":"syehYE83l",
   "oiltemp":306.6088974352555
}
"""


class TelemetrySchema(Schema):
    simulationid = fields.Str()
    messageid = fields.Str()
    creationtimestamp = fields.DateTime()
    sendtimestamp = fields.DateTime(required=True)
    vin = fields.Str(required=True)
    tripid = fields.Str(required=True)
    driverid = fields.Str()
    geolocation = fields.Nested("ChildGeolocationSchema")
    communications = fields.Nested("ChildCommunicationsSchema")
    acceleration = fields.Nested("ChildAccelerationSchema")
    throttle = fields.Nested("ChildThrottleSchema")
    speed = fields.Nested("ChildSpeedSchema")
    odometer = fields.Nested("ChildOdometerSchema")
    fuel = fields.Decimal()
    name = fields.Str()
    oiltemp = fields.Decimal()
    fuelinfo = fields.Nested("ChildFuelInfo")


class ChildGeolocationSchema(Schema):
    latitude = fields.Decimal()
    longitude = fields.Decimal()
    altitude = fields.Decimal()
    heading = fields.Decimal()
    speed = fields.Decimal()


class ChildCommunicationsSchema(Schema):
    gsm = fields.Dict(keys=fields.Str(), values=fields.Str())
    wifi = fields.Dict(keys=fields.Str(), values=fields.Str())
    wired = fields.Dict(keys=fields.Str(), values=fields.Str())


class ChildAccelerationSchema(Schema):
    maxlongitudinal = fields.Dict(keys=fields.Str(), values=fields.Decimal())
    maxlateral = fields.Dict(keys=fields.Str(), values=fields.Decimal())


class ChildThrottleSchema(Schema):
    max = fields.Decimal()
    average = fields.Decimal()


class ChildSpeedSchema(Schema):
    max = fields.Decimal()
    average = fields.Decimal()


class ChildOdometerSchema(Schema):
    metres = fields.Decimal()
    tripodometer = fields.Decimal()
    ticksfl = fields.Decimal()
    ticksfr = fields.Decimal()
    ticksrl = fields.Decimal()
    ticksrr = fields.Decimal()

class ChildFuelInfo(Schema):
    currenttripconsumption = fields.Decimal()
    tankcapacity = fields.Decimal()
    