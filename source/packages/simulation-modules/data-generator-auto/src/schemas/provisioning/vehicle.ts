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
export const vehicleSchema = {
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

    make : {
        static: 'AMZ'
    },
    model: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(['1','2','3','4','5']);
        }
    },
    modelYear : {
        chance: 'integer({"min":2009, "max":2019})'
    },
    vin : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.db.vins[this.object.idCounter].vin;
        }
    },
    bodyType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            switch (this.object.model) {
                case '2':
                    return 'Estate';
                case '3':
                    return 'SUV';
                case '4':
                    return 'Coupe';
                default:
                    return 'Saloon';
            }
        }
    },
    fuelType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.weighted(['Gas','Diesel','EV','Hybrid_MHEV','Hybrid_PHEV'], [70,10,10,5,5]);
        }
    },
    transmissionType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            if (this.object.fuelType==='EV') {
                return 'EV';
            } else {
                // tslint:disable-next-line: no-invalid-this
                return this.chance.weighted(['Manual','Auto'], [5,95]);
            }
        }
    },
    transmissionAutoType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            if (this.object.transmissionType==='Auto') {
                // tslint:disable-next-line: no-invalid-this
                return this.chance.pickone(['7-speed','8-speed','9-speed']);
            }
        }
    },
    transmissionManualType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            if (this.object.transmissionType==='Manual') {
                // tslint:disable-next-line: no-invalid-this
                return this.chance.pickone(['5-speed','6-speed']);
            }
        }
    },
    colorCode : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(['252','253','254','255']);
        }
    },
    iviType : {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(['LoLine','HiLine','Premium']);
        }
    },
    odometer: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            const age = 2019 - this.object.modelYear;
            const min = age * 5000;
            const max = (age+1) * 15000;
            // tslint:disable-next-line: no-invalid-this
            return this.chance.integer({min,max});
        }
    },
};
