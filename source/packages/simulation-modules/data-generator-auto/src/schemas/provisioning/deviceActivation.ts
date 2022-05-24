/*--------------------------------------------------------------------------------------------------------------------
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
#-------------------------------------------------------------------------------------------------------------------*/

export const deviceActivationFields = ['make','model','modelYear','vin','bodyType','fuelType','transmissionType','colorCode','iviType','ecuType','ecuId','ecuSoftwareVersion'];

export const deviceActivationSchema = {
    idCounter: {
        incrementalId: 0,
        virtual: true
    },
    device: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.db.devices[this.object.idCounter];
        },
        virtual: true
    },
    vehicle: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.db.vehicles[this.object.idCounter];
        },
        virtual: true
    },
    make: {
        self: 'vehicle.make'
    },
    model: {
        self: 'vehicle.model'
    },
    modelYear: {
        self: 'vehicle.modelYear'
    },
    vin: {
        self: 'vehicle.vin'
    },
    bodyType: {
        self: 'vehicle.bodyType'
    },
    fuelType: {
        self: 'vehicle.fuelType'
    },
    transmissionType: {
        self: 'vehicle.transmissionType'
    },
    colorCode: {
        self: 'vehicle.colorCode'
    },
    iviType: {
        self: 'vehicle.iviType'
    },
    ecuType: {
        self: 'device.type'
    },
    ecuId: {
        self: 'device.id'
    },
    ecuSoftwareVersion: {
        self: 'device.softwareVersion'
    },
};
