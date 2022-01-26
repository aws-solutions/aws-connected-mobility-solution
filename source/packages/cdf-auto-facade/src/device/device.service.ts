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
import { injectable, inject } from 'inversify';
import { logger } from '../utils/logger';
import { DeviceRegistrationRequest, DeviceRegistrationResponse, ProvisioningTemplatePolicyDocument, DeviceStatus, DeviceActivationRequest, DeviceActivationResponse} from './device.models';
import { TYPES } from '../di/types';
// import AWS = require('aws-sdk');
import ow from 'ow';
import { WhitelistService } from '../whitelist/whitelist.service';
import { PoliciesService, ASSTLIBRARY_CLIENT_TYPES, Device10Resource, DevicesService, Group10Resource, GroupsService } from '@cdf/assetlibrary-client/dist';
import { ProvisionThingRequest, PROVISIONING_CLIENT_TYPES, ThingsService } from '@cdf/provisioning-client/dist';

@injectable()
export class DeviceService {

    private PROVISIONING_POLICY_TYPE:string = 'ProvisioningTemplate';

    private iotData: AWS.IotData;

    constructor(
        @inject(TYPES.WhitelistService) private whitelistService: WhitelistService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.DevicesService) private assetLibraryDeviceClient: DevicesService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.GroupsService) private assetLibraryGroupClient: GroupsService,
        @inject(ASSTLIBRARY_CLIENT_TYPES.PoliciesService) private assetLibraryPolicyClient: PoliciesService,
        @inject(PROVISIONING_CLIENT_TYPES.ThingsService) private provisioningThingsClient: ThingsService,
        @inject('paths.vehicles') private vehiclesGroupRoot:string,
        @inject('templates.vehicle') private vehicleTemplateId:string,
        @inject('templates.ecu') private ecuTemplateId:string,
        @inject('mqtt.topics.activate.success') private mqttActivateSuccessTopic: string,
        @inject('mqtt.topics.activate.failure') private mqttActivateFailureTopic: string,
        @inject(TYPES.IotDataFactory) iotDataFactory: () => AWS.IotData) {
        this.iotData = iotDataFactory();
    }

    public async registerTCU(supplierId:string, device:DeviceRegistrationRequest) : Promise<DeviceRegistrationResponse> {
        logger.debug(`device.service registerTCU: in: supplierId:${supplierId}, device:${JSON.stringify(device)}`);

        try {
            ow(device, ow.object.nonEmpty);
            ow(device.deviceId, ow.string.nonEmpty);
            ow(device.templateId, ow.string.nonEmpty);
            ow(device.certificateId, ow.string.nonEmpty);
        } catch(err) {
            logger.error(`device.service.registerTCU()] failed: ${err.message}`);
            throw err;
        }

        // whitelist device
        if (!device.attributes) {
            device.attributes= {};
        }
        await this.whitelistService.whitelistDevice(supplierId, device);

        logger.debug(`[device.service.registerTCU()] succesfully whitelisted device: ${JSON.stringify(device)}`);

        // retrieve provisoning template
        logger.debug(`[device.service.registerTCU()] retrieve provisoning template`);
        let provisioningTemplate:ProvisioningTemplatePolicyDocument;
        try {
            const provisioningTemplateResult = await this.assetLibraryPolicyClient.listInheritedPoliciesByDevice(device.deviceId, this.PROVISIONING_POLICY_TYPE);
            if (provisioningTemplateResult===undefined || provisioningTemplateResult.results===undefined || provisioningTemplateResult.results.length===0) {
                throw new Error('NO_PROVISIONING_TEMPLATE_CONFIGURED');
            }
            provisioningTemplate = JSON.parse(provisioningTemplateResult.results[0].document);
        } catch (err) {
            if (err.status === 404) {
                throw new Error('NO_PROVISIONING_TEMPLATE_CONFIGURED');
            }
            throw err;
        }
        logger.debug(`[device.service.registerTCU()] retrieved provisoning template: ${JSON.stringify(provisioningTemplate)}`);

        // provision
        logger.debug(`[device.service.registerTCU()] provisioning...`);
        const provisionRequest:ProvisionThingRequest = {
            provisioningTemplateId: provisioningTemplate.template,
            parameters: {
                ThingName: device.deviceId,
                CertificateId: device.certificateId,
                Status: 'ACTIVE'
            }
        };
        const provisionResponse = await this.provisioningThingsClient.provisionThing(provisionRequest);
        logger.debug(`[device.service.registerTCU()] finished provisioning thing: ${JSON.stringify(provisionResponse)}`);

        // update device with thing ARN
        logger.debug(`[device.service.registerTCU()] updating device ${device.deviceId} with assembled state`);
        const awsIotThingArn:string = provisionResponse.resourceArns.thing;
        const updateRequest:Device10Resource = {
            attributes: {
                status: DeviceStatus.assembled
            },
            awsIotThingArn
        };
        await this.assetLibraryDeviceClient.updateDevice(device.deviceId, updateRequest);
        logger.debug(`[device.service.registerTCU()] finished updating device ${device.deviceId}`);

        const response:DeviceRegistrationResponse = {
            certificatePem : provisionResponse.certificatePem,
            thingArn : awsIotThingArn,
            certificateId : provisionResponse.resourceArns.certificate
        };
        const logObject = {...response};
        logObject.certificatePem = 'REDACTED';

        logger.debug(`[device.service.registerTCU()] exiting this response: ${JSON.stringify(logObject)}`);
        return response;

    }

    public async activateTCU(deviceId:string, activation:DeviceActivationRequest) : Promise<void> {
        logger.debug(`device.service activateTCU: in: activation:${JSON.stringify(activation)}`);

        const vin = (activation!==undefined && activation.vehicle!==undefined && activation.vehicle.vin!==undefined)? activation.vehicle.vin : 'UNKNOWN';
        const response:DeviceActivationResponse = {
            deviceId,
            vin
        };

        if ( typeof activation?.vehicle?.modelYear === 'string') {
            activation.vehicle.modelYear = parseInt(activation.vehicle.modelYear, 10);
        }

        try {

            // validation
            const v = activation.vehicle;
            ow(v, ow.object.nonEmpty);
            ow(v.make, ow.string.nonEmpty);
            ow(v.model, ow.string.nonEmpty);
            ow(v.modelYear, ow.number.inRange(1920, (new Date()).getFullYear() + 2));
            ow(v.vin, ow.string.nonEmpty);
            ow(v.bodyType, ow.string.nonEmpty);
            ow(v.fuelType, ow.string.nonEmpty);
            ow(v.transmissionType, ow.string.nonEmpty);
            ow(v.colorCode, ow.string.nonEmpty);
            ow(v.iviType, ow.string.nonEmpty);
            ow(v.ecus, ow.array.minLength(1));
            const tcu = v.ecus.find(ecu=> ecu.type==='tcu');
            ow(tcu, ow.object.nonEmpty);
            ow(tcu.id, ow.string.equals(deviceId));

            // ensure device is whitelisted
            if (await this.whitelistService.isDeviceWhitelisted(deviceId)!==true) {
                throw new Error('TCU_NOT_WHITELISTED');
            }

            // update asset library with known vehicle info
            const vehicle:Group10Resource = {
                name: v.vin,
                templateId: this.vehicleTemplateId,
                parentPath: this.vehiclesGroupRoot,
                attributes: {
                    make: v.make,
                    model: v.model,
                    modelYear: v.modelYear,
                    bodyType: v.bodyType,
                    fuelType: v.fuelType,
                    transmissionType: v.transmissionType,
                    colorCode: v.colorCode,
                    iviType: v.iviType
                }
            };
            const vehicleGroupPath = `${vehicle.parentPath}/${vehicle.name}`;
            try {
                await this.assetLibraryGroupClient.createGroup(vehicle);
            } catch (e) {
                if (e.status===409) {
                    await this.assetLibraryGroupClient.updateGroup(vehicleGroupPath, vehicle);
                    logger.warn(`device.service activateTCU: vehicle ${v.vin} already exists therefore updated!`);
                } else {
                    throw e;
                }
            }

            // associate the existing tcu device with the vehicle
            await this.assetLibraryDeviceClient.attachToGroup(deviceId, 'installed_in', vehicleGroupPath);

            // update asset library with additional known device info
            const device:Device10Resource = {
                deviceId,
                attributes: {
                    status: DeviceStatus.installed,
                    softwareVersion: tcu.softwareVersion
                }
            };
            await this.assetLibraryDeviceClient.updateDevice(deviceId, device);

            // associate all the remaining ECU's with the vehicle
            const ecuDevices:Device10Resource[]= [];
            v.ecus.forEach(e=> {
                if (e.id!==deviceId) {
                    const ecuDevice:Device10Resource = {
                        deviceId: e.id,
                        templateId: this.ecuTemplateId,
                        attributes: {
                            type: e.type,
                            softwareVersion: e.softwareVersion
                        },
                        groups: {
                            installed_in: [vehicleGroupPath]
                        }
                    };
                    ecuDevices.push(ecuDevice);
                }
            });
            if (ecuDevices.length>0) {
                const r = await this.assetLibraryDeviceClient.bulkCreateDevice({devices:ecuDevices});
                if (r.failed>0) {
                    throw new Error(`ECU_CREATION_FAILED:\n${JSON.stringify(r.errors)}`);
                }
            }

            // publish sucess event
            await this.publishResponse(this.mqttActivateSuccessTopic, tcu.id, response);

        } catch (err) {
            logger.error(`device.service activateTCU: error:${err}`);

            // publish failure event
            response.message = err.message;
            await this.publishResponse(this.mqttActivateFailureTopic, deviceId, response);
            throw err;
        }

        logger.debug(`device.service activateTCU: exit: response:${JSON.stringify(response)}`);
    }

    private async publishResponse(topicTemplate:string, deviceId:string, r:DeviceActivationResponse) : Promise<void> {
        logger.debug(`device.service publishResponse: in: topicTemplate:${topicTemplate}, deviceId:${deviceId}, r:${JSON.stringify(r)}`);

        // e.g. cdf/{thingName}/activation/accepted
        const topic = topicTemplate.replace('{thingName}', deviceId);

        const params = {
            topic,
            payload: JSON.stringify(r),
            qos: 1
        };

        try {
            await this.iotData.publish(params).promise();
        } catch (err) {
            logger.error(`device.service publishResponse: err:${err}`);
            throw new Error('MQTT_PUBLISH_FAILED');
        }
        logger.debug('device.service publishResponse: exit:');

    }

}
