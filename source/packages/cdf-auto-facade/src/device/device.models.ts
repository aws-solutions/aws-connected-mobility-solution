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

export type AttributeMap = { [key: string] : string | number | boolean };

export interface DeviceModel {
	deviceId:string;
	templateId: string;
	attributes?: AttributeMap;
}

export interface DeviceRegistrationRequest extends DeviceModel {
	// csr?:string;
	certificateId:string;
}

export interface DeviceRegistrationResponse {
	certificatePem:string;
	certificateId:string;
	thingArn:string;
}

export interface DeviceActivationRequest {
	vehicle: VehicleModel;
}

export interface VehicleModel {
	make: string;
	model: string;
	modelYear:number;
	vin:string;
	marketCode?: string;
	countryCode?: string;
	bodyType: string;
	fuelType: string;
	transmissionType: string;
	transmissionAutoType?: string;
	transmissionManualType?: string;
	colorCode: string;
	iviType: string;
	ecus: ECUModel[];
	// TODO: model features
}

export interface ECUModel {
	type:string;
	id: string;
	softwareVersion: string;
}

export interface DeviceActivationResponse {
	deviceId:string;
	vin:string;
	message?: string;
}

export interface ProvisioningTemplatePolicyDocument {
	template:string;
}

export enum DeviceStatus {
	whitelisted = 'whitelisted',
    assembled = 'assembled',
    installed = 'installed',
    owned = 'owned'
}
