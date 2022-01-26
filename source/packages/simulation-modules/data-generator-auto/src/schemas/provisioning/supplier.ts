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
import {sanitizePath} from '../../utils/helper.util';
import config from 'config';
import {generate} from 'shortid';

export const supplierFields = ['name','parentPath','externalId'];

export const supplierSchema = {
    idCounter: {
        incrementalId: 0,
        virtual: true
    },
    externalId: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return generate().toUpperCase();
        }
    },
    name: {
        faker: 'company.companyName'
    },
    parentPath: {
        function() {
            return config.get('paths.suppliers.parent');
        }
    },
    // parentPathSanitized: {
    //     function() {
    //         // tslint:disable-next-line: no-invalid-this
    //         return sanitizePath(`${this.object.parentPath}`);
    //     }
    // },
    groupPath: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return `${this.object.parentPath}/${this.object.name.toLowerCase()}`;
        }
    },
    groupPathSanitized: {
        function() {
            // tslint:disable-next-line: no-invalid-this
            return sanitizePath(this.object.groupPath);
        }
    },
};
