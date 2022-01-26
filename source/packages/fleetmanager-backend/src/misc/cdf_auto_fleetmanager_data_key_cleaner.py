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
"""Util function that takes in data dict and converts all
keys to lowercase. This will make all keys consistant throughout
this deployment for all queries."""


def lowercase(data):
    """ Make dictionary lowercase """

    if isinstance(data, dict):
        return {key.lower(): lowercase(value) for key, value in data.items()}
    elif isinstance(data, (list, set, tuple)):
        data_type = type(data)
        return data_type(lowercase(obj) for obj in data)
    else:
        return data
