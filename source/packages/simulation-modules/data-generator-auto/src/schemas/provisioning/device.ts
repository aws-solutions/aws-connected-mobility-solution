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
import {generate} from 'shortid';

export const deviceSchema = {
    idCounter: {
        incrementalId: 0,
        virtual: true
    },
    supplier: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(this.db.suppliers);
        },
        virtual: true
    },
    vehicle: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(this.db.vehicles);
        },
        virtual: true
    },

    supplierPathSanitized: {
        self: 'supplier.groupPathSanitized'
    },
    supplierExternalId: {
        self: 'supplier.externalId'
    },
    // csr: {
    //     'static': 'THIS WILL BE REPLACED'
    // },
    certificateId: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.db.config[0].certificateId;
        }
    },
    type : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            switch (this.object.vehicle.model) {
                case '1':
                case '2':
                case '3':
                    return 'TCU-1';
                default:
                    return 'TCU-2';
            }
        }
    },
    id : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            if (this.object.type==='TCU-1') {
                // tslint:disable-next-line: no-invalid-this
                return `ECU-AWS-2014-${generate().toUpperCase()}`;
            } else {
                // tslint:disable-next-line: no-invalid-this
                return `ECU-AWS-2017-${generate().toUpperCase()}`;
            }
        }
    },
    softwareVersion : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            if (this.object.type==='TCU-1') {
                // tslint:disable-next-line: no-invalid-this
                return this.chance.pickone([2.1,2.2,2.3,2.4]);
            } else {
                // tslint:disable-next-line: no-invalid-this
                return this.chance.pickone([1.5,1.6,1.7]);
            }
        }
    },

};
