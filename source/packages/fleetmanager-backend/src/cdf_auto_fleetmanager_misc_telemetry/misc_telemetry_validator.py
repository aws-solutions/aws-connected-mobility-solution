# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Validator for incoming IoT telemetry data"""

from marshmallow import Schema, fields

"""
{
   "messageid": "",
   "simulationid": "",
   "creationtimestamp": "",
   "sendtimestamp": "",
   "vin": "",
   "driverid": "",
   "geolocation": {
      "latitude": 0.0,
      "longitude": 0.0,
      "altitude": 0,
      "heading": 0.0,
      "speed": 0.0,
      "location" : [0.0, 0.0],
      "validlocation": 0.0
   },
   "communications": {
      "gsm": {
         "satelites": "",
         "fix": "",
         "networktype": "",
         "mnc": "",
         "mcc": "",
         "lac": "",
         "cid": ""
      },
      "wifi": {
         "networkid": ""
      },
      "wired": {
         "networkid": ""
      }
   },
   "acceleration": {
      "maxlongitudinal": {
         "axis": 0,
         "value": 0.0
      },
      "maxlateral": {
         "axis": 0,
         "value": 0.0
      }
   },
   "throttle": {
      "max": 0.0,
      "average": 0
   },
   "speed": {
      "max": 0.0,
      "average": 0,
      "roadspeed": 0.0
   },
   "odometer": {
      "metres": 0.0,
      "ticksfl": 0,
      "ticksfr": 0,
      "ticksrl": 0,
      "ticksrr": 0
   },
   "fuel": 0.0,
   "fuelused": 0.0,
   "totalfuelused": 0.0,
   "totalidlefuelused": 0.0,
   "idlefuelused": 0.0,
   "name": "",
   "oiltemp": 0.0,
   "outsidetemperature": 0.0,
   "tires": {
        "pressure_front_left": 0.0,
        "pressure_front_right": 0.0,
        "pressure_rear_left": 0.0,
        "pressure_rear_right": 0.0
    },
   "ignition": 0,
   "gearposition": 0.0,
   "driverseatbelt": 0.0,
   "elevation": 0.0,
   "batterycrankingvoltage": 0.0,
   "devicevoltage": 0.0,
   "electricenergyin": 0.0,
   "electricenergyout": 0.0,
   "stateofcharge": 0.0
}
"""


class TelemetrySchema(Schema):
    simulationid = fields.Str()
    messageid = fields.Str()
    creationtimestamp = fields.DateTime()
    sendtimestamp = fields.DateTime(required=True)
    vin = fields.Str(required=True)
    tripid = fields.Str()
    driverid = fields.Str()
    geolocation = fields.Nested("ChildGeolocationSchema")
    communications = fields.Nested("ChildCommunicationsSchema")
    acceleration = fields.Nested("ChildAccelerationSchema")
    throttle = fields.Nested("ChildThrottleSchema")
    speed = fields.Nested("ChildSpeedSchema")
    odometer = fields.Nested("ChildOdometerSchema")
    name = fields.Str()
    oiltemp = fields.Decimal()
    fuel = fields.Decimal()
    fuelused = fields.Decimal()
    totalfuelused = fields.Decimal()
    totalidlefuelused = fields.Decimal()
    idlefuelused = fields.Decimal()
    outsidetemperature = fields.Decimal()
    tires = fields.Dict(keys=fields.Str(), values=fields.Decimal())
    ignition = fields.Decimal()
    gearposition = fields.Decimal()
    driverseatbelt = fields.Decimal()
    elevation = fields.Decimal()
    batterycrankingvoltage = fields.Decimal()
    devicevoltage = fields.Decimal()
    electricenergyin = fields.Decimal()
    electricenergyout = fields.Decimal()
    stateofcharge = fields.Decimal()


class ChildGeolocationSchema(Schema):
    latitude = fields.Decimal()
    longitude = fields.Decimal()
    altitude = fields.Decimal()
    heading = fields.Decimal()
    speed = fields.Decimal()
    validlocation = fields.Decimal()
    location = fields.List(fields.Decimal())


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
    roadspeed = fields.Decimal()


class ChildOdometerSchema(Schema):
    metres = fields.Decimal()
    ticksfl = fields.Decimal()
    ticksfr = fields.Decimal()
    ticksrl = fields.Decimal()
    ticksrr = fields.Decimal()