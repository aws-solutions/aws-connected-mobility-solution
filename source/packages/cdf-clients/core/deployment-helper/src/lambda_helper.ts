import 'reflect-metadata';
import { send } from 'cfn-response-promise';

import {logger} from './utils/logger';

exports.handler = async (event: any, context: any) => {
    logger.debug(`Event:${JSON.stringify(event)} Context: ${JSON.stringify(context)}`);

    // TODO: Try Loading the config from S3
    // TODO: If not in S3 then just return empty

    if (event.RequestType === 'Create') {
        return await send(event, context, 'SUCCESS', {
            bulkCertsApplicationConfigOverride: JSON.stringify({}),
            deviceMonitoringApplicationConfigOverride: JSON.stringify({}),
            eventsProcessorApplicationConfigOverride: JSON.stringify({}),
            eventAlertsApplicationConfigOverride: JSON.stringify({}),
            requestQueueApplicationConfigOverride: JSON.stringify({}),
            provisioningApplicationConfigOverride: JSON.stringify({}),
            assetLibraryApplicationConfigOverride: JSON.stringify({}),
            assetLibraryHistoryApplicationConfigOverride: JSON.stringify({}),
            commandsApplicationConfigOverride: JSON.stringify({}),
            certificateActivatorApplicationConfigOverride: JSON.stringify({}),
            certificateVendorApplicationConfigOverride: JSON.stringify({})
        });
    } else if (event.RequestType === 'Update') {
        return await send(event, context, 'SUCCESS', {
            bulkCertsApplicationConfigOverride: JSON.stringify({}),
            deviceMonitoringApplicationConfigOverride: JSON.stringify({}),
            eventsProcessorApplicationConfigOverride: JSON.stringify({}),
            eventAlertsApplicationConfigOverride: JSON.stringify({}),
            requestQueueApplicationConfigOverride: JSON.stringify({}),
            provisioningApplicationConfigOverride: JSON.stringify({}),
            assetLibraryApplicationConfigOverride: JSON.stringify({}),
            assetLibraryHistoryApplicationConfigOverride: JSON.stringify({}),
            commandsApplicationConfigOverride: JSON.stringify({}),
            certificateActivatorApplicationConfigOverride: JSON.stringify({}),
            certificateVendorApplicationConfigOverride: JSON.stringify({})

        });
    } else if (event.RequestType === 'Delete') {
        return await send(event, context, 'SUCCESS', {
            bulkCertsApplicationConfigOverride: JSON.stringify({}),
            deviceMonitoringApplicationConfigOverride: JSON.stringify({}),
            eventsProcessorApplicationConfigOverride: JSON.stringify({}),
            eventAlertsApplicationConfigOverride: JSON.stringify({}),
            requestQueueApplicationConfigOverride: JSON.stringify({}),
            provisioningApplicationConfigOverride: JSON.stringify({}),
            assetLibraryApplicationConfigOverride: JSON.stringify({}),
            assetLibraryHistoryApplicationConfigOverride: JSON.stringify({}),
            commandsApplicationConfigOverride: JSON.stringify({}),
            certificateActivatorApplicationConfigOverride: JSON.stringify({}),
            certificateVendorApplicationConfigOverride: JSON.stringify({})
        });
    }
};
