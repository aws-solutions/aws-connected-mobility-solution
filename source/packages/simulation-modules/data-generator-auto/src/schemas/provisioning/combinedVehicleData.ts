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

export const combinedVehicleFields = ['supplierExternalId','ecuId','certificateId','make','model','modelYear','vin','bodyType','fuelType','transmissionType','colorCode','iviType','ecuType','ecuSoftwareVersion','owner','latitude','longitude','odometer'];

export const combinedVehicleSchema = {
    idCounter: {
        incrementalId: 0,
        virtual: true
    },
    config: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.db.config[0];
        },
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
    supplierExternalId: {
        self: 'device.supplierExternalId'
    },
    ecuId: {
        self: 'device.id'
    },
    certificateId: {
        self: 'device.certificateId'
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
    ecuSoftwareVersion: {
        self: 'device.softwareVersion'
    },
    owner: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(this.db.users).username;
        }
    },

    odometer: {
        self: 'vehicle.odometer'
    },

    region: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.weighted(this.object.config.regions, this.object.config.regionWeights);
        },
        virtual: true
    },
    latitude: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return (this.object.region.latitudeMin + (Math.random() * (this.object.region.latitudeMax-this.object.region.latitudeMin))).toFixed(6);
        }
    },
    longitude: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return (this.object.region.longitudeMin + (Math.random() * (this.object.region.longitudeMax-this.object.region.longitudeMin))).toFixed(6);
        }
    },
};
