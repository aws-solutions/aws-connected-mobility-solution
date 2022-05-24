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
import {interfaces, ContainerModule, decorate, injectable} from 'inversify';
import {EventsService} from '../client/events.service';
import { EventsourcesService} from '../client/eventsources.service';
import { SubscriptionsService} from '../client/subscriptions.service';
import { NOTIFICATIONS_CLIENT_TYPES } from './types';
import config from 'config';
import AWS = require('aws-sdk');
import {LAMBDAINVOKE_TYPES, LambdaInvokerService} from '@cdf/lambda-invoke';
import {EventsLambdaService} from '../client/events.lambda.service';
import {EventsourcesLambdaService} from '../client/eventsources.lambda.service';
import {SubscriptionsLambdaService} from '../client/subscriptions.lambda.service';
import {EventsApigwService} from '../client/events.apigw.service';
import {EventsourcesApigwService} from '../client/eventsources.apigw.service';
import {SubscriptionsApigwService} from '../client/subscriptions.apigw.service';

export const notificationsContainerModule = new ContainerModule (
    (
        bind: interfaces.Bind,
        _unbind: interfaces.Unbind,
        isBound: interfaces.IsBound,
        _rebind: interfaces.Rebind
    ) => {

        if (config.has('notifications.mode') && config.get('notifications.mode') === 'lambda') {
            bind<EventsService>(NOTIFICATIONS_CLIENT_TYPES.EventsService).to(EventsLambdaService);
            bind<EventsourcesService>(NOTIFICATIONS_CLIENT_TYPES.EventSourcesService).to(EventsourcesLambdaService);
            bind<SubscriptionsService>(NOTIFICATIONS_CLIENT_TYPES.SubscriptionsService).to(SubscriptionsLambdaService);

            if (!isBound(LAMBDAINVOKE_TYPES.LambdaInvokerService)) {
                // always check to see if bound first incase it was bound by another client
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
            }

        } else {
            bind<EventsService>(NOTIFICATIONS_CLIENT_TYPES.EventsService).to(EventsApigwService);
            bind<EventsourcesService>(NOTIFICATIONS_CLIENT_TYPES.EventSourcesService).to(EventsourcesApigwService);
            bind<SubscriptionsService>(NOTIFICATIONS_CLIENT_TYPES.SubscriptionsService).to(SubscriptionsApigwService);
        }
    }
);
