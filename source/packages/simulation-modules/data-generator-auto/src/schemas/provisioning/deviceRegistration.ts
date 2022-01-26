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

export const deviceRegistrationFields = ['supplierPath','deviceId','certificateId'];

export const deviceRegistrationSchema = {
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
    supplierPath: {
        self: 'device.supplierPath'
    },
    deviceId: {
        self: 'device.id'
    },
    certificateId: {
        self: 'device.certificateId'
    }
};
