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

// breakdown of a VIN take from https://www.faxvin.com/vin-decoder
export const vinSchema = {
    country: {
        // 1st digit
        // https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/World_Manufacturer_Identifier_(WMI)
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone([1,4,5]);
        },
        virtual: true
    },
    region: {
        // 2nd digit
        static: 'A',     // dummy value for Amazon
        virtual: true
    },
    manufacturer: {
        // 3rd digit
        static: 'Z',     // dummy value for Amazon
        virtual: true
    },
    vds: {
        // 4th-8th digit
        randexp: '[A-Z]{2}[0-9]{2}[A-Z]',     // dummy value for Amazon
        virtual: true
    },
    vds_check: {
        // 9th digit
        static: 'X',     // dummy value for Amazon
        virtual: true
    },
    year: {
        chance: 'integer({"min":2009, "max":2019})',
        virtual: true
    },
    'object.year==1980,yearCode': {
        static: 'A'
    },
    'object.year==1981,yearCode': {
        static: 'B'
    },
    'object.year==1982,yearCode': {
        static: 'C'
    },
    'object.year==1983,yearCode': {
        static: 'D'
    },
    'object.year==1984,yearCode': {
        static: 'E'
    },
    'object.year==1985,yearCode': {
        static: 'F'
    },
    'object.year==1986,yearCode': {
        static: 'G'
    },
    'object.year==1987,yearCode': {
        static: 'H'
    },
    'object.year==1988,yearCode': {
        static: 'J'
    },
    'object.year==1989,yearCode': {
        static: 'K'
    },
    'object.year==1990,yearCode': {
        static: 'L'
    },
    'object.year==1991,yearCode': {
        static: 'M'
    },
    'object.year==1992,yearCode': {
        static: 'N'
    },
    'object.year==1993,yearCode': {
        static: 'P'
    },
    'object.year==1994,yearCode': {
        static: 'R'
    },
    'object.year==1995,yearCode': {
        static: 'S'
    },
    'object.year==1996,yearCode': {
        static: 'T'
    },
    'object.year==1997,yearCode': {
        static: 'V'
    },
    'object.year==1998,yearCode': {
        static: 'W'
    },
    'object.year==1999,yearCode': {
        static: 'X'
    },
    'object.year==2000,yearCode': {
        static: 'Y'
    },
    'object.year==2001,yearCode': {
        static: '1'
    },
    'object.year==2002,yearCode': {
        static: '2'
    },
    'object.year==2003,yearCode': {
        static: '3'
    },
    'object.year==2004,yearCode': {
        static: '4'
    },
    'object.year==2005,yearCode': {
        static: '5'
    },
    'object.year==2006,yearCode': {
        static: '6'
    },
    'object.year==2007,yearCode': {
        static: '7'
    },
    'object.year==2008,yearCode': {
        static: '8'
    },
    'object.year==2009,yearCode': {
        static: '9'
    },
    'object.year==2010,yearCode': {
        static: 'A'
    },
    'object.year==2011,yearCode': {
        static: 'B'
    },
    'object.year==2012,yearCode': {
        static: 'C'
    },
    'object.year==2013,yearCode': {
        static: 'D'
    },
    'object.year==2014,yearCode': {
        static: 'E'
    },
    'object.year==2015,yearCode': {
        static: 'F'
    },
    'object.year==2016,yearCode': {
        static: 'G'
    },
    'object.year==2017,yearCode': {
        static: 'H'
    },
    'object.year==2018,yearCode': {
        static: 'J'
    },
    'object.year==2019,yearCode': {
        static: 'K'
    },
    'object.year==2020,yearCode': {
        static: 'L'
    },
    'object.year==2021,yearCode': {
        static: 'M'
    },
    'object.year==2022,yearCode': {
        static: 'N'
    },
    'object.year==2023,yearCode': {
        static: 'P'
    },
    assemblyPlant: {
        // 11th digit
        function() {
            // tslint:disable-next-line: no-invalid-this
            return this.chance.pickone(['A','B','C','D','E']);
        },
        virtual: true
    },
    sequentialCounter: {
        // 12th-17th digit
        incrementalId: 10000,
        virtual: true
    },
    vin: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return `${this.object.country}${this.object.region}${this.object.manufacturer}${this.object.vds}${this.object.vds_check}${this.object.yearCode}${this.object.assemblyPlant}${this.object.sequentialCounter}`;
        }
    }
};
