# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Util class for all iot incoming data"""

import os
import json
import boto3
import requests
from chalice import BadRequestError
from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection, helpers
from elasticsearch.helpers import bulk
import uuid
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()

if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

REGION = os.getenv('REGION')
CREDENTIALS = boto3.Session().get_credentials()
AWSAUTH = AWS4Auth(CREDENTIALS.access_key, CREDENTIALS.secret_key, REGION, 'es', session_token=CREDENTIALS.token)
HEADERS = {"Content-Type": "application/json"}
HOST = os.getenv('ES_ENDPOINT')
S3_CLIENT = boto3.client('s3')


class CDFAutoUtils:
    """Helpers for vehicle methods"""

    @staticmethod
    def create_es_client():
      """create client for elasticsearch (non-requests)"""

      logger.info("Entering create_es_client")

      try:
          es_client = Elasticsearch(
              hosts=[{'host': HOST.split('//')[1], 'port': 443}],
              http_auth=AWSAUTH,
              use_ssl=True,
              verify_certs=True,
              connection_class=RequestsHttpConnection
          )

          return es_client

      except Exception as err:
          logger.error("ES client error: {}".format(err))

    @staticmethod
    def url_builder(_index, action):
        """create elasticsearch url for request"""

        logger.info("Entering url_builder: {}, {}".format(_index, action))

        url = HOST + '/' + _index + '/' + action
        logger.info("URL: {}".format(url))
        return url

    @staticmethod
    def es_bulk(payload, index):
      """bulk request to es index"""

      logger.info("Entering es_bulk: {}".format(index))
      client = CDFAutoUtils.create_es_client()

      try:
          bulk_response = bulk(client, CDFAutoUtils.es_bulk_generator(payload, index))
          logger.info('bulk_response: {}'.format(bulk_response))

      except Exception as err:
          logger.error("Error response {}:".format(err))

    @staticmethod
    def es_request(url, query):
        """GET elasticsearch request builder"""

        logger.info("Entering es_request")
        logger.info("Query: {}".format(query))

        try:
            es_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query))
            return es_response
        except Exception as err:
            logger.info("Error making elasticsearch request: {}".format(err))
            raise BadRequestError(err)

    @staticmethod
    def es_add_update(url, payload):
        """add new or updated payload to index"""

        logger.info("Entering es_add_update")

        try:
            es_response = requests.post(url, auth=AWSAUTH, headers=HEADERS, json=payload)
            logger.info("Add/Update response {}:".format(es_response.text))
        except Exception as err:
            logger.error("Error response {}:".format(err))

    @staticmethod
    def es_delete(url):
        """delete doc in index"""

        logger.info("Entering es_delete")

        try:
            es_response = requests.delete(url, auth=AWSAUTH, headers=HEADERS)
            logger.info("Delete response {}:".format(es_response.text))
        except Exception as err:
            logger.error("Error response {}:".format(err))

    @staticmethod
    def es_bulk_generator(data, index):
      """build objects specifically for
      ES bulk insert"""
      logger.info("Entering es_bulk_generator")

      for obj in data:
        payload = dict()

        if index == 'latest_telemetry':
          payload['_id'] = obj['vin']
        else:
          payload['_id'] = uuid.uuid4()

        payload['_index'] = index
        payload['_source'] = obj

        yield payload

    @staticmethod
    def build_trip_data(trip_data):
        """return all trip data per incoming trip_data"""

        logger.info("Entering build_trip_data")

        """
        [
            {
                tripId: "trip1",
                startTime: "date-time",
                duration: 22, // minutes
                startLocation: [-117, 30], // long, lat
                endLocation: [-118, 31], // long, lat
                route: "https://s3/trip1.geojson", // trip geojson file associated with the tripId
                distance: {
                    miles: 3.1
                },
                fuelEconomy: {
                    mpg: 44
                }
            }
        ]
        """

        temp_trip_list = list()

        for trip in trip_data['hits']['hits']:

            # convert km to miles section
            km = trip['_source']['tripsummary']['distance']
            # conversion factor
            conv_fac = 0.621371
            # calculate miles
            miles = km * conv_fac

            # convert milliseconds to mins
            mins = trip['_source']['tripsummary']['duration'] / 60000

            # convert ml to gallons
            gallons = trip['_source']['tripsummary']['fuel'] * 0.000264;

            # mpg = miles/gallons
            mpg = miles / gallons if gallons else 0

            # Update this section to refer to the trips json template
            trip_obj = {
                'tripId': trip['_source']['tripid'],
                'startTime': trip['_source']['tripsummary']['starttime'],
                'duration': mins,
                'fuel': gallons,
                'startLocation': [trip['_source']['tripsummary']['startlocation']['longitude'], trip['_source']['tripsummary']['startlocation']['latitude']],
                'endLocation': [trip['_source']['tripsummary']['endlocation']['longitude'], trip['_source']['tripsummary']['endlocation']['latitude']],
                'distance': {
                    'miles': miles
                },
                'fuelEconomy': {
                    'mpg': mpg
                }
            }

            temp_trip_list.append(trip_obj)

        return temp_trip_list

    @staticmethod
    def build_event_data(event_data):
        """return mapped event data"""

        logger.info("Entering build_event_data")

        temp_event_list = list()

        # build final trip data history objects section
        for event in event_data['hits']['hits']:

            event_obj = {
                'messageId': event['_source']['messageid'],
                'creationtimestamp': event['_source']['creationtimestamp'],
                'alert': event['_source']['alert']
            }

            temp_event_list.append(event_obj)

        return temp_event_list

    @staticmethod
    def build_vin_list(data):
        """create a list of vins for util use"""

        logger.info("Entering build_vin_list: {}".format(data))

        temp_list = list()

        for incoming_obj in data['hits']['hits']:
            temp_list.append(incoming_obj['_source']['vin'])

        return temp_list

    @staticmethod
    def load_data_template(template_name):
        """return json template"""
        return CDFAutoUtils._load_json_file('json_templates/'+template_name)

    @staticmethod
    def download_file(bucket, key):
        """download file and return"""

        logger.info("Entering download_file")

        try:
            s3_response = S3_CLIENT.get_object(Bucket=bucket, Key=key)

        except Exception as err:
            logger.info("Error downloading s3 file: {}".format(err))
            raise BadRequestError("Download file from S3 error")
        else:
            return json.loads(s3_response['Body'].read().decode('utf-8'))

    @staticmethod
    def _load_json_file(relative_filename):
        """get path / open json file and return"""

        try:
            json_template = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                relative_filename)
            with open(json_template) as f:
                return json.loads(f.read())
        except Exception as err:
            logger.info("Error: {}".format(err))

    @staticmethod
    def lowercase(data):
        """ Make dictionary keys lowercase """

        if isinstance(data, dict):
            return {key.lower(): CDFAutoUtils.lowercase(value) for key, value in data.items()}
        elif isinstance(data, (list, set, tuple)):
            data_type = type(data)
            return data_type(CDFAutoUtils.lowercase(obj) for obj in data)
        else:
            return data

    @staticmethod
    def clean_data(data):
        """convert stringified data to json"""
        return json.loads(data)

    @staticmethod
    def kinesis_stream_data_converter(data):
        """convert incoming kinesis stream data to json"""
        logger.info("Entering kinesis_stream_data_converter")

        updated_data = list()

        for obj in data:
            convert_binary = "".join(chr(x) for x in obj)
            temp_obj = json.loads(convert_binary)

            if 'payload' in temp_obj.keys():
                convert_payload = json.loads(temp_obj['payload'])
                temp_obj['payload'] = convert_payload

            updated_data.append(temp_obj)

        return updated_data

    @staticmethod
    def tcu_device_mapper(data):
        """maps cdf device data"""
        logger.info("Entering tcu_device_mapper: {}".format(data))

        temp_obj = dict()
        temp_obj['deviceid'] = data['deviceId']

        # add all attributes key/vales to mapped object
        for att_key, att_value in data['attributes'].items():
            temp_obj[att_key.lower()] = att_value

        logger.info("Final mapped obj: {}".format(temp_obj))
        return temp_obj

    @staticmethod
    def nontcu_device_mapper(data):
        """build mapped payload for supplimentary device
        published from mqtt device event topic"""
        logger.info("Entering nontcu_device_mapper")

        final_data = dict()

        for data_key, data_value in data.items():

            if data_key == 'payload':
                final_data['devicetype'] = data_value['templateid']
                final_data['deviceid'] = data_value['deviceid']

                for attribute_key, attribute_value in data_value['attributes'].items():
                    final_data[attribute_key.lower()] = attribute_value

        logger.info("Mapped data: {}".format(final_data))
        return final_data

    @staticmethod
    def uniform_keys(data):
        """Iterate to convert all json keys to lowercase
        for uniformity (needed for queries later.
        (List, usually from Kinesis stream)"""
        logger.info("Entering uniform_keys")

        updated_data = list()

        for payload in data:
            # convert all data keys to lowercase for consistency
            updated_payload = CDFAutoUtils.lowercase(payload)
            updated_data.append(updated_payload)

        logger.info("Updated data: {}".format(updated_data))
        return updated_data
