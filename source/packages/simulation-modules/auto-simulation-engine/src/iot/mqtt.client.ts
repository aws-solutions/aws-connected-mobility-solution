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
import config from 'config';
import {promisify} from 'util';
import {IClientPublishOptions, IClientSubscribeOptions} from 'mqtt';
import {logger} from '../utils/logger';

import moment from 'moment';
import awsIot = require('aws-iot-device-sdk');

export class AwsIotMqttClient {

  private readonly awsDevice: awsIot.jobs;
  private readonly deviceId: string;
  private readonly vin: string;

  constructor(deviceId: string, vin: string) {
    try {
      this.awsDevice = new awsIot.jobs({
        keyPath: <string>config.get('aws.iot.keyPath'),
        certPath: <string>config.get('aws.iot.certPath'),
        caPath: <string>config.get('aws.iot.caPath'),
        clientId: deviceId,
        host: <string>config.get('aws.iot.host'),
        region: <string>config.get('aws.region'),
        autoResubscribe: true,
        offlineQueueing: true,
        // debug:true
      });

      this.awsDevice.on('connect', ()=> {
        logger.debug(`mqtt.client: connect`);
      });
      this.awsDevice.on('close', ()=> {
        logger.debug(`mqtt.client: disconnect`);
      });
      this.awsDevice.on('offline', ()=> {
        logger.debug(`mqtt.client: offline`);
      });
      this.awsDevice.on('reconnect', ()=> {
        logger.debug(`mqtt.client: reconnect`);
      });

      this.deviceId = deviceId;
      this.vin = vin;
    } catch (ex) {
      throw ex;
    }
  }

  public async startJobProcess(): Promise<void> {
    await this.startJobNotifications();

    // @ts-ignore optional filter parameter thats bing required, this is valid.
    this.awsDevice.subscribeToJobs(this.deviceId, (err: any, job: any) => {
      if (err) {
        console.error(err);
      } else {
        this.processJob(job);
      }
    });
  }

  public async startJobNotifications() : Promise<void> {
    const startJobNotifications = promisify(this.awsDevice.startJobNotifications);
    await startJobNotifications(this.deviceId);
  }

  public async publish(topic: string, message: string): Promise<void> {
    logger.debug(`mqtt.client: publish: topic:${topic}, message:${message}`);
    const opts: IClientPublishOptions = {
      qos: 1
    };
    const publish = promisify(this.awsDevice.publish);
    logger.debug(`mqtt.client: publish: A`);
    await publish(topic, message, opts);
    logger.debug(`mqtt.client: publish: exit`);
  }

  public async subscribe(topic: string): Promise<void> {
    logger.debug(`mqttClient.subscribe(): topic:${topic}`);
    const opts: IClientSubscribeOptions = {
      qos: 1
    };
    const subscribe = promisify(this.awsDevice.subscribe);
    await subscribe(topic, opts);
  }

  public async unsubscribe(topic: string): Promise <void> {
    logger.debug(`mqttClient.unsubscribe(): topic:${topic}`);
    const opts: IClientSubscribeOptions = {
      qos: 1
    };
    const subscribe = promisify(this.awsDevice.unsubscribe);
    await subscribe(topic, opts);
  }

  public async on(event:string, listener: (topic: string, payload: any) => void): Promise<void> {
    logger.debug(`mqttClient.on(): ${event}`);

    if (event === 'message') {
      await this.awsDevice.once('message',(topic: string, payload:any) => {
        listener(topic, JSON.parse(payload.toString()));
      });
    }

  }

  public async off(event:string, listener: (topic: string, payload: any) => void): Promise<void> {
    logger.debug(`mqttClient.off(): ${event}`);

    if (event === 'message') {
      await this.awsDevice.removeListener('message',(topic: string, payload:any) => {
        listener(topic, JSON.parse(payload.toString()));
      });
    }
  }

  public async updateJob(job: any, status: JobStatus): Promise<any> {
   if ( status === JobStatus.succeeded) {
     const jobSucceded = promisify(job.succeeded);
     await jobSucceded();
   }

   if (status === JobStatus.inProgress) {
     const jobInprogress = promisify(job.inProgress);
     await jobInprogress();
   }

   if (status === JobStatus.failed) {
     const jobFailed = promisify(job.failed);
     await jobFailed();
   }

  }

  public async updateJobCustom(job:Job, status:string): Promise<void> {
    logger.debug(`mqttClient.updateJob(): JobId: ${job.id}`);

    const updateTopic = `dt/cvra/${this.deviceId}/job/${job.id}/update`;

    await this.publish(updateTopic, JSON.stringify({
      operation: job.document.operation,
      reportedVersion: job.document.desiredVersion,
      jobId: job.id,
      status,
      vin: this.vin,
      deviceId: this.deviceId,
      timestamp: moment().toISOString()
    }));

  }

  public async processJob(job: any): Promise<void> {
      if(job.document && job.document.operation) {
        const operation = job.document.operation;

        switch (operation) {
          case 'OtaUpdate':
            await this._processOTA(job);
            break;
          case 'updateFirmware':
            await this._processOTA(job);
            break;
          default:
        }
      }
  }

  private async  _processOTA(job: Job): Promise<void> {
    await this.updateJob(job, JobStatus.inProgress);
    await this.updateJobCustom(job, 'queued');

    const inProgressWait = setTimeout(async () => {
      await this.updateJobCustom(job, 'inProgress');
      clearTimeout(inProgressWait);
    }, 5000);

    const successWait = setTimeout(async () => {
      await this.updateJob(job, JobStatus.succeeded);
      await this.updateJobCustom(job, 'success');
      clearTimeout(successWait);
    }, 5000);

  }

}

export enum JobStatus {
  inProgress = 'IN_PROGRESS',
  failed = 'FAILED',
  succeeded = 'SUCCEEDED',
  rejected = 'rejected',
}

export class Job {
  id: string;
  document: any;
  operation: string;
  status: {
    status: JobStatus,
    statusDetails: string
  };
}
