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
import {LAMBDAINVOKE_TYPES, LambdaInvokerService} from '@cdf/lambda-invoke';
import config from 'config';
import AWS = require('aws-sdk');
import { ContainerModule, decorate, injectable, interfaces } from 'inversify';
import { DeploymentsLambdaService } from '../client/deployments.lambda.service';
import { DeploymentsService } from '../client/deployments.service';
import { DevicesLambdaService } from '../client/devices.lambda.service';
import { DevicesService } from '../client/devices.service';
import { GroupsService } from '../client/groups.service';
import { GroupsLambdaService } from '../client/groups.lambda.service';
import { SubscriptionsService } from '../client/subscriptions.service';
import { SubscriptionsLambdaService } from '../client/subscriptions.lambda.service';
import { TemplatesService } from '../client/templates.service';
import { TemplatesLambdaService } from '../client/templates.lambda.service';
import { GREENGRASS_PROVISIONING_CLIENT_TYPES } from './types';
import { DeploymentsApigwService } from '../client/deployments.apigw.service';
import { DevicesApigwService } from '../client/devices.apigw.service';
import { GroupsApigwService } from '../client/groups.apigw.service';
import { SubscriptionsApigwService } from '../client/subscriptions.apigw.service';
import { TemplatesApigwService } from '../client/templates.apigw.service';

export const greengrassProvisioningContainerModule = new ContainerModule (
    (
        bind: interfaces.Bind,
        _unbind: interfaces.Unbind,
        isBound: interfaces.IsBound,
        _rebind: interfaces.Rebind
    ) => {

        if (config.has('greengrassProvisioning.mode') && config.get('greengrassProvisioning.mode') === 'lambda') {
            bind<DeploymentsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.DeploymentsService).to(DeploymentsLambdaService);
            bind<DevicesService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.DevicesService).to(DevicesLambdaService);
            bind<GroupsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.GroupsService).to(GroupsLambdaService);
            bind<SubscriptionsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.SubscriptionsService).to(SubscriptionsLambdaService);
            bind<TemplatesService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.TemplatesService).to(TemplatesLambdaService);

            bind<LambdaInvokerService>(LAMBDAINVOKE_TYPES.LambdaInvokerService).to(LambdaInvokerService);
            decorate(injectable(), AWS.Lambda);
            bind<interfaces.Factory<AWS.Lambda>>(LAMBDAINVOKE_TYPES.LambdaFactory)
                .toFactory<AWS.Lambda>((ctx: interfaces.Context) => {
                    return () => {

                        if (!isBound(LAMBDAINVOKE_TYPES.Lambda)) {
                            const lambda = new AWS.Lambda({region:config.get('aws.region')});
                            bind<AWS.Lambda>(LAMBDAINVOKE_TYPES.Lambda).toConstantValue(lambda);
                        }
                        return ctx.container.get<AWS.Lambda>(LAMBDAINVOKE_TYPES.Lambda);
                    };
                });

        } else {
            bind<DeploymentsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.DeploymentsService).to(DeploymentsApigwService);
            bind<DevicesService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.DevicesService).to(DevicesApigwService);
            bind<GroupsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.GroupsService).to(GroupsApigwService);
            bind<SubscriptionsService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.SubscriptionsService).to(SubscriptionsApigwService);
            bind<TemplatesService>(GREENGRASS_PROVISIONING_CLIENT_TYPES.TemplatesService).to(TemplatesApigwService);
        }
    }
);
