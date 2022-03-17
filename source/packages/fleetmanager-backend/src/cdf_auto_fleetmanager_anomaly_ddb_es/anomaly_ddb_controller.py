# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""DDB table enntry trigger:
- anomaly data from DDB table --> this lambda --> elasticsearch"""

import logging
from anomaly_ddb_service import AnomalyDDBService
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class MessageProcessor:
    """handle incoming event message per type of group"""

    @staticmethod
    def process_data_list(data_list):
        """Take in latest DDB message from stream to be sent to
        elasticsearch.
        {
            "anomaly_id" : "S019VT46E",
            "anomaly_score" : "45.827756308918936",
            "anomaly_type" : "OilTemp",
            "created_at" : "2020-04-21T18:12:53Z",
            "identified_at" : "2020-04-21T18:12:50Z",
            "pk" : "5AZYG67LX9B10001",
            "sk" : "A:OilTemp",
            "updated_at" : "2020-04-21T18:12:53Z",
            "value" : "295.82775630891894",
            "vin" : "5AZYG67LX9B10001",
            "deletion_flag" : "1587492774"
            }
        """

        for data in data_list['Records']:
            logger.info("Incoming DDB record: {}".format(data))

            if data['eventName'] == 'INSERT':

                vin = data['dynamodb']['NewImage']['vin']['S']

                new_anomaly_obj = {
                    "anomaly_id": data['dynamodb']['NewImage']['anomaly_id']['S'],
                    "anomaly_score": data['dynamodb']['NewImage']['anomaly_score']['N'],
                    "anomaly_type": data['dynamodb']['NewImage']['anomaly_type']['S'],
                    "created_at": data['dynamodb']['NewImage']['created_at']['S'],
                    "identified_at": data['dynamodb']['NewImage']['identified_at']['S'],
                    "pk": data['dynamodb']['NewImage']['pk']['S'],
                    "sk": data['dynamodb']['NewImage']['sk']['S'],
                    "updated_at": data['dynamodb']['NewImage']['updated_at']['S'],
                    "value": data['dynamodb']['NewImage']['value']['N'],
                }

                AnomalyDDBService.add_shared_cardata_index(vin, new_anomaly_obj)
                AnomalyDDBService.add_anomaly_index(new_anomaly_obj)


def lambda_handler(event, context):
    """Handler for DDB trigger -> anomaly data

        Write anomaly to elasticsearch indexes
        1. shared_cardata index: UI data
        2. anomaly index: historical
    """

    # send incoming data message to be parsed
    ddb_response = MessageProcessor.process_data_list(event)
