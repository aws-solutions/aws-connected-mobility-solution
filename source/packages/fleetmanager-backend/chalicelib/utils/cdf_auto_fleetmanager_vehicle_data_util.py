#--------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#---------------------------------------------------------------------------------
"""Util class for all cvra data in elasticsearch"""

import os
import json
import math
import boto3
import requests
from collections import Counter,OrderedDict
import datetime
import mercantile
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
from requests_aws4auth import AWS4Auth
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
    def url_builder(_index, action):
        """create elasticsearch url for request"""

        logger.info("Entering url_builder: %s", _index)

        url = HOST + '/' + _index + '/' + action
        logger.info("URL: %s", url)
        return url

    @staticmethod
    def es_request(url, query):
        """GET elasticsearch request builder"""

        logger.info("Entering es_request")
        logger.info("Query: %s", query)

        try:
            es_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query))
            return es_response
        except Exception as err:
            logger.info("Error making elasticsearch request: %s", err)
            raise ChaliceViewError(err)

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
    def es_query_builder(query_type, payload, aggregated=None):
        """Elasticsearch query builder"""

        logger.info("Entering es_query_builder with query type: %s", query_type)
        logger.info("Payload: %s", payload)

        # pull from query template
        es_query = CDFAutoUtils.load_data_template('es_query_template.json')

        if query_type == 'single':
            es_query['single']['query']['term']['vin.keyword'] = payload
            return_query = es_query['single']

        elif query_type == 'filtered':
            template_flag = 'filtered'

            if aggregated:
                template_flag = 'aggregated'

                es_query[template_flag]['size'] = payload['pagination']['maxResults']
                es_query[template_flag]['from'] = payload['pagination']['offset']

                # only for cluster related
                if 'zoom' in payload['clusters']:

                    precision_cal = CDFAutoUtils._calculate_precision(payload['clusters']['zoom'])

                    coordinate_group_count = 0

                    # account for possible multiple coorinate boundaries
                    for coord in payload['filters']['boundaries']:
                        cluster_parent = {
                            str(coordinate_group_count): {
                                "filter": {
                                    "geo_bounding_box": {
                                        "geolocation.location": {}
                                    }
                                },
                                "aggregations": {
                                    "zoom": {
                                        "geotile_grid": {
                                            "field": "geolocation.location",
                                            "precision": 0
                                        },
                                        "aggregations": {
                                            "vin": {
                                                "terms": {"field": "vin.keyword"}
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        cluster_parent[str(coordinate_group_count)]['aggregations']['zoom']['geotile_grid']['precision'] = precision_cal

                        # incoming - [left,bottom,right,top]
                        top_left = str(coord[3]) + ', ' + str(coord[0])
                        bottom_right = str(coord[1]) + ', ' + str(coord[2])
                        bbox_obj = {"top_left": top_left, "bottom_right": bottom_right}

                        cluster_parent[str(coordinate_group_count)]['filter']['geo_bounding_box']['geolocation.location'].update(bbox_obj)

                        es_query[template_flag]['aggregations'].update(cluster_parent)

                        coordinate_group_count += 1

            # loop through multi-set of coordinates for multi-location filter
            if len(payload['filters']['boundaries']):
                parent_query = {
                    'bool': {
                        'should': []
                    }
                }
                for coord in payload['filters']['boundaries']:

                    # [left,bottom,right,top]
                    top_left = str(coord[3]) + ', ' + str(coord[0])
                    bottom_right = str(coord[1]) + ', ' + str(coord[2])

                    geoObj = {
                        "geo_bounding_box": {
                            "geolocation.location": {
                                "top_left": top_left,
                                "bottom_right": bottom_right
                            }
                        }
                    }
                    parent_query['bool']['should'].append(geoObj)

                es_query[template_flag]['query']['bool']['filter'].append(parent_query)

            # check for vins
            if len(payload['filters']['vehicle']['vin']):
                terms_obj = {
                    "terms": {
                        "vin.keyword": payload['filters']['vehicle']['vin']
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for make
            if len(payload['filters']['vehicle']['make']):
                terms_obj = {
                    "terms": {
                        "attributes.make.keyword": payload['filters']['vehicle']['make']
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for model
            if len(payload['filters']['vehicle']['model']):
                terms_obj = {
                    "terms": {
                        "attributes.model.keyword": payload['filters']['vehicle']['model']
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for model year
            if len(payload['filters']['vehicle']['year']):
                terms_obj = {
                    "terms": {
                        "attributes.modelyear": payload['filters']['vehicle']['year']
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for software version
            if payload['filters']['software']['swVersion']:
                terms_obj = {
                    "nested": {
                        "path": "devices",
                        "query": {
                            "terms": {
                                "devices.softwareversion": [payload['filters']['software']['swVersion']]
                            }
                        }
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for dtc
            if payload['filters']['troubleCodes']:
                temp_payload = list()

                for dtc in payload['filters']['troubleCodes']:
                    temp_payload.append(dtc)

                terms_obj = {
                    "nested": {
                        "path": "trouble_codes",
                        "query": {
                            "terms": {
                                "trouble_codes.code": temp_payload
                            }
                        }
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            # check for anomaly
            if payload['filters']['anomalies']:
                temp_payload = list()

                for anomaly in payload['filters']['anomalies']:
                    temp_payload.append(anomaly)

                terms_obj = {
                    "nested": {
                        "path": "anomalies",
                        "query": {
                            "terms": {
                                "anomalies.anomaly_type": temp_payload
                            }
                        }
                    }
                }
                es_query[template_flag]['query']['bool']['filter'].append(terms_obj)

            return_query = es_query[template_flag]

        elif query_type == "event":

            vin_query = {'term': {'vin.keyword': payload['vin']}}
            es_query['event']['query']['bool']['filter'].append(vin_query)

            es_query['event']['size'] = payload['pagination']['maxResults']
            es_query['event']['from'] = payload['pagination']['offset']

            if payload['filters']['dates']['start'] and payload['filters']['dates']['end']:
                temp_dates = payload['filters']['dates']
                date_range = {
                    'range': {
                        'sendtimestamp': {
                            'gte': temp_dates['start'],
                            'lte': temp_dates['end']
                        }
                    }
                }
                es_query['event']['query']['bool']['filter'].append(date_range)

            return_query = es_query['event']

        elif query_type == "trip":

            if 'vin' in payload:

                # Trip API
                vin_query = {'term': {'vin.keyword': payload['vin']}}
                es_query['trip']['query']['bool']['filter'].append(vin_query)

                es_query['trip']['size'] = payload['pagination']['maxResults']
                es_query['trip']['from'] = payload['pagination']['offset']

                if payload['filters']['dates']['start'] and payload['filters']['dates']['end']:
                    temp_dates = payload['filters']['dates']
                    date_range = {
                        'range': {
                            'sendtimestamp': {
                                'gte': temp_dates['start'],
                                'lte': temp_dates['end']
                            }
                        }
                    }
                    es_query['trip']['query']['bool']['filter'].append(date_range)

            else:
                # Route API needs trip data response
                trip_id_query = {
                    'query': {
                        'bool': {
                            'filter': {
                                'term': {
                                    'tripid.keyword': payload['trip_id']
                                }
                            }
                        }
                    }
                }
                es_query['trip'].update(trip_id_query)

            return_query = es_query['trip']

        elif query_type == "route":
            es_query['route']['query']['bool']['filter'][0]['term']['vin.keyword'] = payload['vin']
            es_query['route']['query']['bool']['filter'][1]['term']['tripid.keyword'] = payload['trip_id']
            es_query['route']['query']['bool']['filter'][2]['range']['creationtimestamp']['gte'] = payload['start']
            es_query['route']['query']['bool']['filter'][2]['range']['creationtimestamp']['lte'] = payload['end']
            return_query = es_query['route']
        # current tire pressure query using location and vin 
        
        elif query_type == "get_notcharging":
            query_list = []
            if payload['filters']['pagination_count']>0:
                pagination_count = payload['filters']['pagination_count']
            else:
                pagination_count = 15

            if payload['filters']['last_seen_offset']>0:
                last_seen = payload['filters']['last_seen_offset']
            else:
                last_seen = 0
            
            vin_timestamp = OrderedDict()

            if len(payload['filters']['vehicle']['vin']['options']) == 0:
                url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                es_query_page = CDFAutoUtils.load_data_template('es_query_template.json')
                es_query_page['not_charging_current']['size'] = pagination_count
                es_query_page['not_charging_current']['from'] = last_seen*pagination_count
                if len(payload['filters']['location']['options']) != 0:
                    d_area = {
                            "bool": {"should": []
                            }}
                    for each_location in payload['filters']['location']['options']:
                        top_long,left_lat,bot_long,right_lat = each_location['bbox']
                        geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                        d_location = {
                                        "bool": {
                                        "must": [{
                                        "geo_polygon" : {
                                            "geolocation.location" : {
                                                "points" : geolist
                                            }
                                        }
                                        }
                                            
                                        ]
                                        }
                                    }
                        d_area["bool"]["should"].append(d_location)

                    es_query_page['not_charging_current']['query']['bool']['must'].append(d_area)
                es_response = CDFAutoUtils.es_request(url,  es_query_page['not_charging_current'])
                json_response = json.loads(es_response.text)
                if len(json_response['hits']['hits']):
                    for objects in json_response['hits']['hits']:
                        vin_timestamp[objects["_source"]["vin"]] = objects["_source"]["sendtimestamp"]
            else:
                for each_vin in payload['filters']['vehicle']['vin']['options']:
                    es_query = CDFAutoUtils.load_data_template('es_query_template.json')
                    url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                    vin_query = {'terms': {'vin.keyword': [each_vin['label']]}}
                    es_query['not_charging_current']['query']['bool']['filter'].append(vin_query)
                    if len(payload['filters']['location']['options']) != 0:
                        d_area = {
                                "bool": {"should": []
                                }}
                        for each_location in payload['filters']['location']['options']:
                            top_long,left_lat,bot_long,right_lat = each_location['bbox']
                            geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                            d_location = {
                                            "bool": {
                                            "must": [{
                                            "geo_polygon" : {
                                                "geolocation.location" : {
                                                    "points" : geolist
                                                }
                                            }
                                            }
                                                
                                            ]
                                            }
                                        }
                            d_area["bool"]["should"].append(d_location)

                        es_query['not_charging_current']['query']['bool']['must'].append(d_area)



                    es_response = CDFAutoUtils.es_request(url, es_query['not_charging_current'])
                    json_response = json.loads(es_response.text)

                    if 'hits' in json_response.keys():
                        if len(json_response['hits']['hits']):
                            vin_timestamp[each_vin['label']] = json_response['hits']['hits'][0]["_source"]["sendtimestamp"]
            
            for each_vin_timestamp in vin_timestamp:     
                es_query = CDFAutoUtils.load_data_template('es_query_template.json')   
                vin_query = {'terms': {'vin.keyword': [each_vin_timestamp]}}
                es_query['not_charging_individual']['query']['bool']['filter'].append(vin_query)
                try:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S.%f')
                except ValueError:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S')
                date_time_24hoursago = date_time_obj - datetime.timedelta(hours = 24)

                date_range = {
                    'range': {
                        'sendtimestamp': {
                            'gte': datetime.datetime.strftime(date_time_24hoursago, '%Y-%m-%dT%H:%M:%S'),
                            'lte': vin_timestamp[each_vin_timestamp]
                        }
                    }
                }
                es_query['not_charging_individual']['query']['bool']['filter'].append(date_range)
                query_list.append(es_query['not_charging_individual'])

            return_query = query_list


        elif query_type == "get_efficency":
            query_list = []
            # change efficency calculation get energy out - in for each of 24 hours and the do similar calculation to pressure api 
            if payload['filters']['pagination_count']>0:
                pagination_count = payload['filters']['pagination_count']
            else:
                pagination_count = 15

            if payload['filters']['last_seen_offset']>0:
                last_seen = payload['filters']['last_seen_offset']
            else:
                last_seen = 0
            
            vin_timestamp = OrderedDict()
            
            if len(payload['filters']['vehicle']['vin']['options']) == 0:
                url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                es_query_page = CDFAutoUtils.load_data_template('es_query_template.json')
                es_query_page['efficency_current']['size'] = pagination_count
                es_query_page['efficency_current']['from'] = last_seen*pagination_count
                if len(payload['filters']['location']['options']) != 0:
                    d_area = {
                            "bool": {"should": []
                            }}
                    for each_location in payload['filters']['location']['options']:
                        top_long,left_lat,bot_long,right_lat = each_location['bbox']
                        geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                        d_location = {
                                        "bool": {
                                        "must": [{
                                        "geo_polygon" : {
                                            "geolocation.location" : {
                                                "points" : geolist
                                            }
                                        }
                                        }
                                            
                                        ]
                                        }
                                    }
                        d_area["bool"]["should"].append(d_location)

                    es_query_page['efficency_current']['query']['bool']['must'].append(d_area)
                es_response = CDFAutoUtils.es_request(url,  es_query_page['efficency_current'])
                json_response = json.loads(es_response.text)
                if len(json_response['hits']['hits']):
                    for objects in json_response['hits']['hits']:
                        vin_timestamp[objects["_source"]["vin"]] = objects["_source"]["sendtimestamp"]
            else:
                for each_vin in payload['filters']['vehicle']['vin']['options']:
                    es_query = CDFAutoUtils.load_data_template('es_query_template.json')
                    url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                    vin_query = {'terms': {'vin.keyword': [each_vin['label']]}}
                    es_query['efficency_current']['query']['bool']['filter'].append(vin_query)
                    if len(payload['filters']['location']['options']) != 0:
                        d_area = {
                                "bool": {"should": []
                                }}
                        for each_location in payload['filters']['location']['options']:
                            top_long,left_lat,bot_long,right_lat = each_location['bbox']
                            geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                            d_location = {
                                            "bool": {
                                            "must": [{
                                            "geo_polygon" : {
                                                "geolocation.location" : {
                                                    "points" : geolist
                                                }
                                            }
                                            }
                                                
                                            ]
                                            }
                                        }
                            d_area["bool"]["should"].append(d_location)

                        es_query['efficency_current']['query']['bool']['must'].append(d_area)
                    es_response = CDFAutoUtils.es_request(url, es_query['efficency_current'])
                    json_response = json.loads(es_response.text)

                    if 'hits' in json_response.keys():
                        if len(json_response['hits']['hits']):
                            vin_timestamp[each_vin['label']] = json_response['hits']['hits'][0]["_source"]["sendtimestamp"]
            
            for each_vin_timestamp in vin_timestamp:     
                es_query = CDFAutoUtils.load_data_template('es_query_template.json')   
                vin_query = {'terms': {'vin.keyword': [each_vin_timestamp]}}
                es_query['efficency']['query']['bool']['filter'].append(vin_query)
                try:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S.%f')
                except ValueError:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S')
                date_time_24hoursago = date_time_obj - datetime.timedelta(hours = 24)

                date_range = {
                    'range': {
                        'sendtimestamp': {
                            'gte': datetime.datetime.strftime(date_time_24hoursago, '%Y-%m-%dT%H:%M:%S'),
                            'lte': vin_timestamp[each_vin_timestamp]
                        }
                    }
                }
                es_query['efficency']['query']['bool']['filter'].append(date_range)
                query_list.append(es_query['efficency'])

            return_query = query_list

        elif query_type == "notcharging_current":
            if len(payload['filters']['vehicle']['vin']['options']):
                list_vin = []
                for vins in payload['filters']['vehicle']['vin']['options']:
                    list_vin.append(vins['label'])
                vin_query = {'terms': {'vin.keyword': list_vin}}
                es_query['not_charging_current']['query']['bool']['filter'].append(vin_query)
            
            
            # if len(payload['filters']['location']['options']):
            #     # add label#
            #     geo_location = {'geo_polygon':{'geolocation.location':{'points':payload['filters']['location']['options']}}}
            #     es_query['not_charging_current']['query']['bool']['filter'].append(geo_location)
            if len(payload['filters']['location']['options']) != 0:
                d_area = {
                        "bool": {"should": []
                        }}
                for each_location in payload['filters']['location']['options']:
                    top_long,left_lat,bot_long,right_lat = each_location['bbox']
                    geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                    d_location = {
                                    "bool": {
                                    "must": [{
                                    "geo_polygon" : {
                                        "geolocation.location" : {
                                            "points" : geolist
                                        }
                                    }
                                    }
                                        
                                    ]
                                    }
                                }
                    d_area["bool"]["should"].append(d_location)

                es_query['not_charging_current']['query']['bool']['must'].append(d_area)
        
            return_query = es_query['not_charging_current']


        elif query_type == "efficency_current":
            
            if len(payload['filters']['vehicle']['vin']['options']):
                list_vin = []
                for vins in payload['filters']['vehicle']['vin']['options']:
                    list_vin.append(vins['label'])
                vin_query = {'terms': {'vin.keyword': list_vin}}
                es_query['efficency_current']['query']['bool']['filter'].append(vin_query)
            
            
            # if len(payload['filters']['location']['options']):
            #     # add label#
            #     geo_location = {'geo_polygon':{'geolocation.location':{'points':payload['filters']['location']['options']}}}
            #     es_query['efficency_current']['query']['bool']['filter'].append(geo_location)
            if len(payload['filters']['location']['options']) != 0:
                d_area = {
                        "bool": {"should": []
                        }}
                for each_location in payload['filters']['location']['options']:
                    top_long,left_lat,bot_long,right_lat = each_location['bbox']
                    geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                    d_location = {
                                    "bool": {
                                    "must": [{
                                    "geo_polygon" : {
                                        "geolocation.location" : {
                                            "points" : geolist
                                        }
                                    }
                                    }
                                        
                                    ]
                                    }
                                }
                    d_area["bool"]["should"].append(d_location)

                es_query['efficency_current']['query']['bool']['must'].append(d_area)
        
            return_query = es_query['efficency_current']

        elif query_type == "tire_pressure_current":
            
            
            if len(payload['filters']['vehicle']['vin']['options']):
                list_vin = []
                for vins in payload['filters']['vehicle']['vin']['options']:
                    list_vin.append(vins['label'])
                vin_query = {'terms': {'vin.keyword': list_vin}}
                es_query['tire_pressure_current']['query']['bool']['filter'].append(vin_query)
            
            
            # if len(payload['filters']['location']['options']):
            #     # add label#
            #     geo_location = {'geo_polygon':{'geolocation.location':{'points':payload['filters']['location']['options']}}}
            #     es_query['tire_pressure_current']['query']['bool']['filter'].append(geo_location)
            if len(payload['filters']['location']['options']) != 0:
                d_area = {
                        "bool": {"should": []
                        }}
                for each_location in payload['filters']['location']['options']:
                    top_long,left_lat,bot_long,right_lat = each_location['bbox']
                    geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                    d_location = {
                                    "bool": {
                                    "must": [{
                                    "geo_polygon" : {
                                        "geolocation.location" : {
                                            "points" : geolist
                                        }
                                    }
                                    }
                                        
                                    ]
                                    }
                                }
                    d_area["bool"]["should"].append(d_location)

                es_query['tire_pressure_current']['query']['bool']['must'].append(d_area)
            return_query = es_query['tire_pressure_current']
        
        elif query_type == "tire_pressure_roc":
            
            query_list = []
            
            if payload['filters']['pagination_count']>0:
                pagination_count = payload['filters']['pagination_count']
            else:
                pagination_count = 15

            if payload['filters']['last_seen_offset']>0:
                last_seen = payload['filters']['last_seen_offset']
            else:
                last_seen = 0
            
            vin_timestamp = OrderedDict()
            
            
            if len(payload['filters']['vehicle']['vin']['options']) == 0:
                url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                es_query_page = CDFAutoUtils.load_data_template('es_query_template.json')
                es_query_page['tire_pressure_current']['size'] = pagination_count
                es_query_page['tire_pressure_current']['from'] = last_seen*pagination_count
                if len(payload['filters']['location']['options']) != 0:
                    d_area = {
                            "bool": {"should": []
                            }}
                    for each_location in payload['filters']['location']['options']:
                        top_long,left_lat,bot_long,right_lat = each_location['bbox']
                        geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                        d_location = {
                                        "bool": {
                                        "must": [{
                                        "geo_polygon" : {
                                            "geolocation.location" : {
                                                "points" : geolist
                                            }
                                        }
                                        }
                                            
                                        ]
                                        }
                                    }
                        d_area["bool"]["should"].append(d_location)

                    es_query_page['tire_pressure_current']['query']['bool']['must'].append(d_area)
                es_response = CDFAutoUtils.es_request(url,  es_query_page['tire_pressure_current'])
                json_response = json.loads(es_response.text)
                if len(json_response['hits']['hits']):
                    for objects in json_response['hits']['hits']:
                        vin_timestamp[objects["_source"]["vin"]] = objects["_source"]["sendtimestamp"]
            else:
                for each_vin in payload['filters']['vehicle']['vin']['options']:
                    es_query = CDFAutoUtils.load_data_template('es_query_template.json')
                    url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                    vin_query = {'terms': {'vin.keyword': [each_vin['label']]}}
                    es_query['tire_pressure_current']['query']['bool']['filter'].append(vin_query)
                    if len(payload['filters']['location']['options']) != 0:
                        d_area = {
                                "bool": {"should": []
                                }}
                        for each_location in payload['filters']['location']['options']:
                            top_long,left_lat,bot_long,right_lat = each_location['bbox']
                            geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                            d_location = {
                                            "bool": {
                                            "must": [{
                                            "geo_polygon" : {
                                                "geolocation.location" : {
                                                    "points" : geolist
                                                }
                                            }
                                            }
                                                
                                            ]
                                            }
                                        }
                            d_area["bool"]["should"].append(d_location)

                        es_query['tire_pressure_current']['query']['bool']['must'].append(d_area)
                    es_response = CDFAutoUtils.es_request(url, es_query['tire_pressure_current'])
                    json_response = json.loads(es_response.text)

                    if 'hits' in json_response.keys():
                        if len(json_response['hits']['hits']):
                            vin_timestamp[each_vin['label']] = json_response['hits']['hits'][0]["_source"]["sendtimestamp"]
            
            for each_vin_timestamp in vin_timestamp:     
                es_query = CDFAutoUtils.load_data_template('es_query_template.json')   
                vin_query = {'terms': {'vin.keyword': [each_vin_timestamp]}}
                es_query['tire_pressure_roc']['query']['bool']['filter'].append(vin_query)
                try:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S.%f')
                except ValueError:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S')
                date_time_24hoursago = date_time_obj - datetime.timedelta(hours = 24)

                date_range = {
                    'range': {
                        'sendtimestamp': {
                            'gte': datetime.datetime.strftime(date_time_24hoursago, '%Y-%m-%dT%H:%M:%S'),
                            'lte': vin_timestamp[each_vin_timestamp]
                        }
                    }
                }
                es_query['tire_pressure_roc']['query']['bool']['filter'].append(date_range)
                query_list.append(es_query['tire_pressure_roc'])

            return_query = query_list
            # return_query = es_query['tire_pressure_roc']
        
        elif query_type == "get_current_battery":
            if len(payload['filters']['vehicle']['vin']['options']):
                list_vin = []
                for vins in payload['filters']['vehicle']['vin']['options']:
                    list_vin.append(vins['label'])
                vin_query = {'terms': {'vin.keyword': list_vin}}
                es_query['battery_level_current']['query']['bool']['filter'].append(vin_query)
            
            
            if len(payload['filters']['location']['options']) != 0:
                d_area = {
                        "bool": {"should": []
                        }}
                for each_location in payload['filters']['location']['options']:
                    top_long,left_lat,bot_long,right_lat = each_location['bbox']
                    geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                    d_location = {
                                    "bool": {
                                    "must": [{
                                    "geo_polygon" : {
                                        "geolocation.location" : {
                                            "points" : geolist
                                        }
                                    }
                                    }
                                        
                                    ]
                                    }
                                }
                    d_area["bool"]["should"].append(d_location)

                es_query['battery_level_current']['query']['bool']['must'].append(d_area)

                
            return_query = es_query['battery_level_current']

        elif query_type == "get_battery_levels":
            query_list = []
            if payload['filters']['pagination_count']>0:
                pagination_count = payload['filters']['pagination_count']
            else:
                pagination_count = 15

            if payload['filters']['last_seen_offset']>0:
                last_seen = payload['filters']['last_seen_offset']
            else:
                last_seen = 0
            
            vin_timestamp = OrderedDict()
            
            # find latest time recorded for each vin
            if len(payload['filters']['vehicle']['vin']['options']) == 0:
                url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                
                es_query_page = CDFAutoUtils.load_data_template('es_query_template.json')
                es_query_page['battery_level_current']['size'] = pagination_count
                es_query_page['battery_level_current']['from'] = last_seen*pagination_count
                if len(payload['filters']['location']['options']) != 0:
                    d_area = {
                            "bool": {"should": []
                            }}
                    for each_location in payload['filters']['location']['options']:
                        top_long,left_lat,bot_long,right_lat = each_location['bbox']
                        geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                        d_location = {
                                        "bool": {
                                        "must": [{
                                        "geo_polygon" : {
                                            "geolocation.location" : {
                                                "points" : geolist
                                            }
                                        }
                                        }
                                            
                                        ]
                                        }
                                    }
                        d_area["bool"]["should"].append(d_location)

                    es_query_page['battery_level_current']['query']['bool']['must'].append(d_area)
                es_response = CDFAutoUtils.es_request(url, es_query_page['battery_level_current'])
                json_response = json.loads(es_response.text)
                if len(json_response['hits']['hits']):
                    for objects in json_response['hits']['hits']:
                        vin_timestamp[objects["_source"]["vin"]] = objects["_source"]["sendtimestamp"]
            else:
                for each_vin in payload['filters']['vehicle']['vin']['options']:
                    es_query = CDFAutoUtils.load_data_template('es_query_template.json')
                    url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
                    vin_query = {'terms': {'vin.keyword': [each_vin['label']]}}
                    es_query['battery_level_current']['query']['bool']['filter'].append(vin_query)
                    if len(payload['filters']['location']['options']) != 0:
                        d_area = {
                                "bool": {"should": []
                                }}
                        for each_location in payload['filters']['location']['options']:
                            top_long,left_lat,bot_long,right_lat = each_location['bbox']
                            geolist = [[top_long,left_lat],[top_long,right_lat],[bot_long,right_lat],[bot_long,left_lat],[top_long,left_lat]]
                            d_location = {
                                            "bool": {
                                            "must": [{
                                            "geo_polygon" : {
                                                "geolocation.location" : {
                                                    "points" : geolist
                                                }
                                            }
                                            }
                                                
                                            ]
                                            }
                                        }
                            d_area["bool"]["should"].append(d_location)

                        es_query['battery_level_current']['query']['bool']['must'].append(d_area)
                    es_response = CDFAutoUtils.es_request(url, es_query['battery_level_current'])
                    json_response = json.loads(es_response.text)

                    if 'hits' in json_response.keys():
                        if len(json_response['hits']['hits']):
                            vin_timestamp[each_vin['label']] = json_response['hits']['hits'][0]["_source"]["sendtimestamp"]
            
            # create query for each vin 
            for each_vin_timestamp in vin_timestamp:     
                es_query = CDFAutoUtils.load_data_template('es_query_template.json')   
                vin_query = {'terms': {'vin.keyword': [each_vin_timestamp]}}
                es_query['get_battery_info']['query']['bool']['filter'].append(vin_query)
                try:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S.%f')
                except ValueError:
                    date_time_obj = datetime.datetime.strptime(vin_timestamp[each_vin_timestamp], '%Y-%m-%dT%H:%M:%S')
                date_time_24hoursago = date_time_obj - datetime.timedelta(hours = 24)

                date_range = {
                    'range': {
                        'sendtimestamp': {
                            'gte': datetime.datetime.strftime(date_time_24hoursago, '%Y-%m-%dT%H:%M:%S'),
                            'lte': vin_timestamp[each_vin_timestamp]
                        }
                    }
                }
                es_query['get_battery_info']['query']['bool']['filter'].append(date_range)
                query_list.append(es_query['get_battery_info'])
            return_query = query_list
        elif query_type == "charts_analytics":
            query_list = []
            for weeks in range(40,44):
                es_query = CDFAutoUtils.load_data_template('es_query_template.json')
                d = "2020-W"+str(weeks)
                date_time_org  = datetime.datetime.strptime(d + '-1', "%Y-W%W-%w")
                date_time_add = date_time_org + datetime.timedelta(days = 7)
                
                start = datetime.datetime.strftime(date_time_org, '%Y-%m-%dT%H:%M:%S')
                end = datetime.datetime.strftime(date_time_add, '%Y-%m-%dT%H:%M:%S')
                
                
                date_r = {
                            "range": {
                                "sendtimestamp" : {
                                    "gte": start,
                                    "lte": end
                                }
                                }
                        }
                print(date_r)
                es_query['analytics_charts']['query']['bool']['must'].append(date_r)
                query_list.append(es_query['analytics_charts'])
            return_query = query_list

        logger.info("Final query list : %s", json.dumps(return_query))
        return return_query
    
    @staticmethod
    def get_chart_analytics(data):
        "return the min/max presuure of tires of a set of vins"
        final_stat_list = []
        logger.info("Starting chart aggregation")
        week = 40
        kwh_thresh = 35
        if len(data):
            for inc_payload in data:
                logger.info("inc_payload: {}".format(inc_payload))
                weeks_agg = {}
                weeks_agg['week'] = week
                week+=1
                if len(inc_payload["aggregations"]):
                    weeks_agg['q1'] = inc_payload["aggregations"]["efficiency_stats"]["values"]["25.0"]
                    weeks_agg['median'] = inc_payload["aggregations"]["efficiency_stats"]["values"]["50.0"]
                    weeks_agg['q3'] = inc_payload["aggregations"]["efficiency_stats"]["values"]["75.0"]
                    weeks_agg['average'] = inc_payload["aggregations"]["efficiency_mean"]["value"]
                    weeks_agg['tp90'] = inc_payload["aggregations"]["distance_tp90"]["values"]["90.0"]
                    weeks_agg['distance_average'] = inc_payload["aggregations"]["distance_avg"]["value"]
                    count = 0 
                    for docs in inc_payload["aggregations"]["vin_id"]["buckets"]:
                        if docs["efficiency"]["value"]> kwh_thresh:
                            count+=1
                    weeks_agg['occurences'] = count
                final_stat_list.append(weeks_agg)
        return final_stat_list
        
    @staticmethod
    def build_battery_level_list(data):
        "return the min/max presuure of tires of a set of vins"
        battery_min_max_list = []
        logger.info("Startingbattery level calculation for multiple individual payloads ")
        if len(data):
            for inc_payload in data: 
                logger.info("inc_payload: {}".format(inc_payload))
                single_vin_roc_battery = {}
                if len(inc_payload["aggregations"]["max_charge"]["hits"]["hits"]):
                    single_vin_roc_battery["vin"] = inc_payload["aggregations"]["max_charge"]["hits"]["hits"][0]["_source"]["vin"]
                    single_vin_roc_battery["min_soc"] = inc_payload["aggregations"]["min_charge"]["hits"]["hits"][0]["_source"]["stateofcharge"]
                    single_vin_roc_battery["max_soc"] = inc_payload["aggregations"]["max_charge"]["hits"]["hits"][0]["_source"]["stateofcharge"]
                    # single_vin_roc_battery["current_soc"] = inc_payload["hits"]["hits"][0]["_source"]["stateofcharge"]
                battery_min_max_list.append(single_vin_roc_battery)
        logger.info("Returning battery list")
        return battery_min_max_list
    
    @staticmethod
    def build_efficiency_current_list(data):
        "return the min/max presure of tires of a set of vins"
        efficiency_current_list = []
        
        for incoming_obj in data['hits']['hits']:
            single_vin_efficiency = {}
            single_vin_efficiency['vin'] = incoming_obj['_source']['vin']
            single_vin_efficiency['current_battery'] = incoming_obj['_source']['stateofcharge']
            
            efficiency_current_list.append(single_vin_efficiency)
        
        return efficiency_current_list
    
    @staticmethod
    def build_battery_current_list(data):
        "return the min/max presure of tires of a set of vins"
        battery_current_list = []
        
        for incoming_obj in data['hits']['hits']:
            single_vin_roc_battery = {}
            single_vin_roc_battery['vin'] = incoming_obj['_source']['vin']
            single_vin_roc_battery['current_battery'] = incoming_obj['_source']['stateofcharge']
            single_vin_roc_battery['electricenergyin'] = incoming_obj['_source']['electricenergyin']
            single_vin_roc_battery['electricenergyout'] = incoming_obj['_source']['electricenergyout']
            
            battery_current_list.append(single_vin_roc_battery)
        
        return battery_current_list
    @staticmethod
    def build_notcharging_current_list(data):
        "return current timestamp for set of vins"
        notcharging_current_list = []
        
        for incoming_obj in data['hits']['hits']:
            single_vin_notcharging = {}
            single_vin_notcharging['vin'] = incoming_obj['_source']['vin']
            single_vin_notcharging['current_battery'] = incoming_obj['_source']['sendtimestamp']
            single_vin_notcharging['electricenergyin'] = incoming_obj['_source']['electricenergyin']
            single_vin_notcharging['electricenergyout'] = incoming_obj['_source']['electricenergyout']
            single_vin_notcharging['current_soc'] = incoming_obj['_source']['stateofcharge']
            
            notcharging_current_list.append(single_vin_notcharging)
        
        return notcharging_current_list
   
    @staticmethod
    def notcharging_calc(data):
        "return the timestamp of max charge in the last 24 hours"
        notcharging_max_timestamp = []
        logger.info("Starting notcharging timestamp calculation for multiple individual payloads")
        if len(data):
            for inc_payload in data: 
                logger.info("inc_payload: {}".format(inc_payload))
                single_vin_lastmaxtime = {}
                if len(inc_payload["aggregations"]["max_charge"]["hits"]["hits"]):
                    single_vin_lastmaxtime["vin"] = inc_payload["aggregations"]["max_charge"]["hits"]["hits"][0]["_source"]["vin"]
                    single_vin_lastmaxtime["ttm"] = inc_payload["aggregations"]["max_charge"]["hits"]["hits"][0]["_source"]["sendtimestamp"]
                notcharging_max_timestamp.append(single_vin_lastmaxtime)
        logger.info("Returning notcharging list")
        return notcharging_max_timestamp

    @staticmethod
    def efficency_cal(data):
        "return the efficency"
        obj_efficency_list = []
        logger.info("Starting calculation for cummalative charge out difference")
        if len(data):
            for inc_payload in data:
                logger.info("inc_payload: {}".format(inc_payload))
                single_vin_efficency = {}
                if len(inc_payload['aggregations']['byHour']['buckets']):
                    for incoming_obj_inside in inc_payload['aggregations']['byHour']['buckets']:
                        logger.info("incoming_obj_inside: {}".format(incoming_obj_inside))
                        if len(incoming_obj_inside['doc']['hits']['hits']):
                            incoming_obj = incoming_obj_inside['doc']['hits']['hits']
                            if incoming_obj[0]['_source']['vin'] not in single_vin_efficency:
                                single_vin_efficency[incoming_obj[0]['_source']['vin']] = {}
                                if ('electricenergyin' in incoming_obj[0]['_source'].keys()) and ('electricenergyout' in incoming_obj[0]['_source'].keys()):
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['efficency_list_in'] = [int(float(incoming_obj[0]['_source']['electricenergyin']))]
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['efficency_list'] = [int(float(incoming_obj[0]['_source']['electricenergyout']))]
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['distance'] = [int(float(incoming_obj[0]['_source']['odometer']['metres']))/1000]
                            else:
                                if ('electricenergyin' in incoming_obj[0]['_source'].keys()) and ('electricenergyout' in incoming_obj[0]['_source'].keys()):
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['efficency_list_in'] = [int(float(incoming_obj[0]['_source']['electricenergyin']))]
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['efficency_list'].append(int(float(incoming_obj[0]['_source']['electricenergyout'])))
                                    single_vin_efficency[incoming_obj[0]['_source']['vin']]['distance'].append(int(float(incoming_obj[0]['_source']['odometer']['metres']))/1000)
                    obj_efficency_list.append(single_vin_efficency)
        logger.info("Building efficency list")
        efficency_list=[]
        if len(obj_efficency_list):
            for vins_dict in obj_efficency_list:
                agg_roc = {}
                agg_roc['vin']= list(vins_dict.keys())[0]
                if len(vins_dict[agg_roc['vin']]['efficency_list']):
                    energy_consumed = max(vins_dict[agg_roc['vin']]['efficency_list']) - min(vins_dict[agg_roc['vin']]['efficency_list'])
                    distance_travelled = max(vins_dict[agg_roc['vin']]['distance'])-min(vins_dict[agg_roc['vin']]['distance'])
                    if distance_travelled>0:
                        agg_roc['efficiency'] = (energy_consumed*100)/distance_travelled
                    else:
                        agg_roc['efficiency'] = 0
                    agg_roc['electricenergyout'] =  max(vins_dict[agg_roc['vin']]['efficency_list'])
                    agg_roc['electricenergyin'] = max(vins_dict[agg_roc['vin']]['efficency_list_in'])
                efficency_list.append(agg_roc)

        logger.info("Returning roc pressure list")
        return efficency_list

    @staticmethod
    def build_pressure_list(data):
        "return the current presuure of tires of a set of vins"
        logger.info("Starting latest telemetry pressure retrieval")
        obj_pressure_list = []
        for incoming_obj in data['hits']['hits']:
            single_vin_pressure = {}
            single_vin_pressure['vin'] = incoming_obj['_source']['vin']
            if 'tires' in incoming_obj['_source'].keys() :
                # convert to kilo pascals
                single_vin_pressure['pressure_front_left'] = int(float(incoming_obj['_source']['tires']['pressure_front_left']))*0.145038
                single_vin_pressure['pressure_front_right'] = int(float(incoming_obj['_source']['tires']['pressure_front_right']))*0.145038
                single_vin_pressure['pressure_rear_left'] = int(float(incoming_obj['_source']['tires']['pressure_rear_left']))*0.145038
                single_vin_pressure['pressure_rear_right'] = int(float(incoming_obj['_source']['tires']['pressure_rear_right']))*0.145038
            obj_pressure_list.append(single_vin_pressure)
        return obj_pressure_list

    @staticmethod
    def build_roc_pressure_list(data):
        "return the historical pressure of tires are calculate 24 hours interval roc of a set of vins"
        obj_pressure_roc_list = []
        logger.info("Starting roc calculation for multiple individual payloads ")
        if len(data):
            for inc_payload in data:
                logger.info("inc_payload: {}".format(inc_payload))
                single_vin_roc_pressure = {}
                if len(inc_payload['aggregations']['byHour']['buckets']):
                    for incoming_obj_inside in inc_payload['aggregations']['byHour']['buckets']:
                        logger.info("incoming_obj_inside: {}".format(incoming_obj_inside))

                        ############################################################################################
                        # make sure this is the behavior you want
                        ############################################################################################
                        if len(incoming_obj_inside['doc']['hits']['hits']):
                            incoming_obj = incoming_obj_inside['doc']['hits']['hits']
                            
                            if incoming_obj[0]['_source']['vin'] not in single_vin_roc_pressure:
                                single_vin_roc_pressure[incoming_obj[0]['_source']['vin']] = {}
                                if 'tires' in incoming_obj[0]['_source'].keys():
                                    single_vin_roc_pressure[incoming_obj[0]['_source']['vin']]['pressure_list'] = [{'pressure_front_left':int(float(incoming_obj[0]['_source']['tires']['pressure_front_left']))*0.145038,
                                                                                        'pressure_front_right':int(float(incoming_obj[0]['_source']['tires']['pressure_front_right'] ))*0.145038,
                                                                                        'pressure_rear_left':int(float(incoming_obj[0]['_source']['tires']['pressure_rear_left']))*0.145038,
                                                                                        'pressure_rear_right':int(float(incoming_obj[0]['_source']['tires']['pressure_rear_right']))*0.145038}
                                                                                        ]
                            else:
                                if 'tires' in incoming_obj[0]['_source'].keys():
                                    single_vin_roc_pressure[incoming_obj[0]['_source']['vin']]['pressure_list'].append({'pressure_front_left':int(float(incoming_obj[0]['_source']['tires']['pressure_front_left']))*0.145038,
                                                                                        'pressure_front_right':int(float(incoming_obj[0]['_source']['tires']['pressure_front_right'] ))*0.145038,
                                                                                        'pressure_rear_left':int(float(incoming_obj[0]['_source']['tires']['pressure_rear_left']))*0.145038,
                                                                                        'pressure_rear_right':int(float(incoming_obj[0]['_source']['tires']['pressure_rear_right']))*0.145038})
                    obj_pressure_roc_list.append(single_vin_roc_pressure)
        logger.info("Building roc pressure list")

        ############################################################################################
        # what behavior do we want if there is only 1 object in return?
        ############################################################################################
        roc_list=[]
        if len(obj_pressure_roc_list):
            for vins_dict in obj_pressure_roc_list:
                logger.info("vins_dict: {}".format(vins_dict))
                #logger.info("obj_pressure_roc_list[vins_dict]:{}".format(obj_pressure_roc_list[vins_dict]))

                agg_roc = {}
                agg_roc['vin']= list(vins_dict.keys())[0]
                front_right_tire_roc_list = []
                front_left_tire_roc_list = []
                rear_right_tire_roc_list = []
                rear_left_tire_roc_list = []

                ############################################################################################
                #logger.info("len(vins_dict['pressure_list']): {}".format(len(vins_dict['pressure_list'])))
                # example of only 1
                # vins_dict: {'1FTYR3XM0KKB33822':{'pressure_list': [{'pressure_front_left': 380, 'pressure_front_right': 392, 'pressure_rear_left': 476, 'pressure_rear_right': 476}]}
                ############################################################################################
                for pressure_dict_index in range(len(vins_dict[agg_roc['vin']]['pressure_list'])-1):
                    
                    try:
                        roc_front_left = (vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index]['pressure_front_left'] - vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_front_left'])/vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_front_left']
                        roc_front_right = (vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index]['pressure_front_right'] - vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_front_right'])/vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_front_right']
                        roc_rear_left = (vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index]['pressure_rear_left'] - vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_rear_left'])/vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_rear_left']
                        roc_rear_right = (vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index]['pressure_rear_right'] - vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_rear_right'])/vins_dict[agg_roc['vin']]['pressure_list'][pressure_dict_index+1]['pressure_rear_right']
                    except:
                        logger.info("divideby0: {}".format(vins_dict))
                        roc_front_left = 0
                        roc_front_right = 0
                        roc_rear_left = 0
                        roc_rear_right = 0


                    front_right_tire_roc_list.append(roc_front_right*100)
                    front_left_tire_roc_list.append(roc_front_left*100)
                    rear_right_tire_roc_list.append(roc_rear_right*100)
                    rear_left_tire_roc_list.append(roc_rear_left*100)
                    

                logger.info("front_left_tire_roc_list: {}".format(front_left_tire_roc_list))
                logger.info("front_right_tire_roc_list: {}".format(front_right_tire_roc_list))
                logger.info("rear_left_tire_roc_list: {}".format(rear_left_tire_roc_list))
                logger.info("rear_right_tire_roc_list: {}".format(rear_right_tire_roc_list))

                ############################################################################################
                # added messy catch for 0 case so it doesnt break, 
                # Should deal with this scenario before it even gets to this section
                ############################################################################################
                if len(front_left_tire_roc_list):
                    agg_roc['roc_front_left'] =  sum(front_left_tire_roc_list)/len(front_left_tire_roc_list)
                else:
                    agg_roc['roc_front_left'] = 0

                if len(front_left_tire_roc_list):
                    agg_roc['roc_front_right'] = sum(front_right_tire_roc_list)/len(front_right_tire_roc_list)
                else:
                    agg_roc['roc_front_right'] = 0

                if len(front_left_tire_roc_list):
                    agg_roc['roc_rear_left'] =  sum(rear_left_tire_roc_list)/len(rear_left_tire_roc_list)
                else:
                    agg_roc['roc_rear_left'] = 0

                if len(front_left_tire_roc_list):
                    agg_roc['roc_rear_right'] = sum(rear_right_tire_roc_list)/len(rear_right_tire_roc_list)
                else:
                    agg_roc['roc_rear_right'] = 0

                roc_list.append(agg_roc)

        logger.info("Returning roc pressure list")
        return roc_list

    @staticmethod
    def build_vehicle_list(data):
        """return a list of mapped vehicle objects"""

        logger.info("Entering build_vehicle_list")

        temp_vehicle_list = list()

        for incoming_obj in data['hits']['hits']:
            logger.info("incoming_obj: {}".format(incoming_obj))

            # vehicle template
            vehicle_template = dict()

            # odometer to miles
            odometer_km = incoming_obj['_source']['odometer']['metres']
            conv_fac = 0.621371
            odometer_miles = odometer_km * conv_fac

            # convert speeds
            mph_current_speed = incoming_obj['_source']['geolocation']['speed'] * conv_fac
            mph_max_speed = incoming_obj['_source']['speed']['max'] * conv_fac
            mph_ave_speed = incoming_obj['_source']['speed']['average'] * conv_fac

            # convert fuel from ml to gal
            gallons = incoming_obj['_source']['fuel'] * 0.000264

            # oiltemp
            if 'oiltemp' in incoming_obj['_source']:
                oil_temp = incoming_obj['_source']['oiltemp']

            # static
            vehicle_template['vin'] = incoming_obj['_source']['vin']

            if 'attributes' in incoming_obj['_source'].keys():
                vehicle_template['make'] = incoming_obj['_source']['attributes']['make']
                vehicle_template['model'] = incoming_obj['_source']['attributes']['model']
                vehicle_template['modelYear'] = incoming_obj['_source']['attributes']['modelyear']
                vehicle_template['color'] = incoming_obj['_source']['attributes']['colorcode']

            # telemetry
            vehicle_template['telemetry'] = dict()
            vehicle_template['telemetry']['odometer'] = round(odometer_miles, 2)
            vehicle_template['telemetry']['fuelLevel'] = round(gallons, 2)
            vehicle_template['telemetry']['oilTemp'] = round(oil_temp, 2)
            vehicle_template['telemetry']['currentSpeed'] = round(mph_current_speed, 2)
            vehicle_template['telemetry']['maxSpeed'] = round(mph_max_speed, 2)
            vehicle_template['telemetry']['avgSpeed'] = round(mph_ave_speed, 2)

            # meta
            vehicle_template['geoLocation'] = dict()
            vehicle_template['geoLocation']['heading'] = incoming_obj['_source']['geolocation']['heading']
            vehicle_template['geoLocation']['coordinates'] = [float(incoming_obj['_source']['geolocation']['longitude']), float(incoming_obj['_source']['geolocation']['latitude'])]
            
            # device data
            if 'devices' in incoming_obj['_source'].keys():
                logger.info("this has devices")
                vehicle_template['devices'] = incoming_obj['_source']['devices']

            # service set data
            if 'service_set' in incoming_obj['_source'].keys():
                logger.info("this has service set")
                vehicle_template['service_set'] = incoming_obj['_source']['service_set']

            # service status data
            if 'service_status' in incoming_obj['_source'].keys():
                logger.info("this has service status")
                vehicle_template['service_status'] = incoming_obj['_source']['service_status']

            temp_vehicle_list.append(vehicle_template)

        return temp_vehicle_list

    @staticmethod
    def build_filter_data(data, single=None):
        """Build response object related to filter data."""

        logger.info("Entering build_filter_data:")

        return_object = {
            'filters': {
                'anomalies': [],
                'troubleCodes': []
            }
        }

        if single:
            if len(data['aggregations']['dtc_codes']['trouble_codes']['buckets']):
                for dtc in data['aggregations']['dtc_codes']['trouble_codes']['buckets']:
                    return_object['filters']['troubleCodes'].append(dtc['key'])

            if len(data['aggregations']['anomaly_codes']['anomalies']['buckets']):
                for anomaly in data['aggregations']['anomaly_codes']['anomalies']['buckets']:
                    return_object['filters']['anomalies'].append(anomaly['key'])
        else:
            if len(data['aggregations']['dtc_codes']['trouble_codes']['buckets']):
                    for dtc in data['aggregations']['dtc_codes']['trouble_codes']['buckets']:
                        temp_obj = {
                            'id': dtc['key'],
                            'count': dtc['doc_count']
                        }
                        return_object['filters']['troubleCodes'].append(temp_obj)

            if len(data['aggregations']['anomaly_codes']['anomalies']['buckets']):
                for anomaly in data['aggregations']['anomaly_codes']['anomalies']['buckets']:
                    temp_obj = {
                            'id': anomaly['key'],
                            'count': anomaly['doc_count']
                        }
                    return_object['filters']['anomalies'].append(temp_obj)

        return return_object

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
            gallons = trip['_source']['tripsummary']['fuel'] * 0.000264

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

        logger.info("Entering build_vin_list: %s for index: %s", data, index)

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
            logger.info("Error downloading s3 file: %s", err)
            raise ChaliceViewError("Download file from S3 error")
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
            logger.info("Error: %s", err)

    @staticmethod
    def _calculate_precision(zoom):
        """Incoming zoom level -> geoTile (0-29) precision level"""

        temp_zoom = math.floor(zoom) + 7

        # set max zoom level (cautious)
        if temp_zoom > 29:
            temp_precision = 29
        else:
            temp_precision = temp_zoom

        return temp_precision

    @staticmethod
    def calculate_geotile_center(bbox):
        # this method calculates the side of a geoTile
        # incoming from elasticsearch "20/190329/410545"
        # zoom / x / y
        # temp_values = geoTile.split('/')
        # ul(Tile(x=0, y=0, z=1))
        # return mercantile.ul(float(temp_values[1]), float(temp_values[2]), int(temp_values[0]))

        # this method calculates the middle of a bbox
        lat = (bbox[1] + bbox[3])/2
        lon = (bbox[2] + bbox[0])/2
        return [lon, lat]

    @staticmethod
    def calculate_geotile_bbox(geoTile):
        # incoming from elasticsearch "20/190329/410545"
        # zoom / x / y
        temp_values = geoTile.split('/')

        # mercantile library:
        # Expects: x, y, zoom
        # Response: LngLatBbox(west=-114.65572357177734, south=36.33670006939316, east=-114.65538024902344, north=36.33697663217258)
        bbox = mercantile.bounds(float(temp_values[1]), float(temp_values[2]), int(temp_values[0]))

        # Expected return: [left,bottom,right,top]
        return [bbox[0], bbox[1], bbox[2], bbox[3]]

    @staticmethod
    def ui_boundary_geotile_fix(agg_data, request_bbox):
        """Results from geotile es aggregation query:
        The geo tile precision extends outside UI map boundary,
        so the center calculations causes the cluster circles
        to be draw outside the map boundaries.
        Solution is to crop the cluster bboxes so they
        do not exceed the query boundary."""

        """Example agg_data (from elasticsearch):
        "0" : {
            "doc_count" : 20,
            "zoom" : {
                "buckets" : [
                {
                    "key" : "7/23/50",
                    "doc_count" : 15
                },
                {
                    "key" : "7/22/50",
                    "doc_count" : 5
                }
                ]
            }
        },
        "1" : {
            "doc_count" : 13,
            "zoom" : {
                "buckets" : [
                {
                    "key" : "7/20/44",
                    "doc_count" : 13
                }
                ]
            }
        }
        Example request bbox (from UI request)
        'boundaries': [
            [-118.40854904632315, 30.642548114839528, -112.21645095367988, 37.8185459622656],
            [-122.9376702997443, 43.36488633572981, -120.56198910044412, 49.35367772013916]
        ]
        agg_data keys will match request bbox, 'boundaries' index
        """

        for cluster_k, cluster_v in agg_data.items():

            if cluster_k != 'anomaly_codes' and cluster_k != 'dtc_codes' and cluster_k != 'vehicle_count':

                for cluster in cluster_v['zoom']['buckets']:

                    query_bbox = request_bbox[int(cluster_k)]

                    tile_bbox = CDFAutoUtils.calculate_geotile_bbox(cluster['key'])

                    # crop elasticsearch bbox to the incoming request bbox
                    if tile_bbox[0] < query_bbox[0]:
                        tile_bbox[0] = query_bbox[0]
                    if tile_bbox[1] < query_bbox[1]:
                        tile_bbox[1] = query_bbox[1]
                    if tile_bbox[2] > query_bbox[2]:
                        tile_bbox[2] = query_bbox[2]
                    if tile_bbox[3] > query_bbox[3]:
                        tile_bbox[3] = query_bbox[3]

                    cluster['bbox'] = tile_bbox

        return agg_data

    @staticmethod
    def process_clusters_of_one(cluster_list):
        """convert a geoTile for a single vehicle into
        the actual vehicle data and return to the UI"""
        logger.info("Entering process_clusters_of_one")

        logger.info("cluster_list: %s", cluster_list)

        temp_vehicle_list = list()

        temp_vehicle_query = {
            "query": {
                "bool": {
                    "filter": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "geo_bounding_box": {
                                            "geolocation.location": {
                                                "top_left": "",
                                                "bottom_right": ""
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }

        # fetch single vehicle data from ES via bounding box and store in list
        for cluster in cluster_list:
            bbox = CDFAutoUtils.calculate_geotile_bbox(cluster['key'])

            # [left,bottom,right,top]
            top_left = str(bbox[3]) + ', ' + str(bbox[0])
            bottom_right = str(bbox[1]) + ', ' + str(bbox[2])

            temp_vehicle_query['query']['bool']['filter'][0]['bool']['should'][0]['geo_bounding_box']['geolocation.location']['top_left'] = top_left
            temp_vehicle_query['query']['bool']['filter'][0]['bool']['should'][0]['geo_bounding_box']['geolocation.location']['bottom_right'] = bottom_right

            url = CDFAutoUtils.url_builder('latest_telemetry')
            single_response = CDFAutoUtils.es_request(url, temp_vehicle_query)
            json_response = json.loads(single_response.text)
            temp_vehicle_list.append(json_response['hits']['hits'][0])

        logger.info("LEN:::%s", len(temp_vehicle_list))
        # mock response from standard group of vehicles in ES
        temp_vehicle_list_parent = {
            'hits': {
                'hits': temp_vehicle_list
            }
        }
        logger.info("temp_vehicle_list_parent: %s", temp_vehicle_list_parent)

        # build respone for UI
        vehicle_data = CDFAutoUtils.build_vehicle_list(temp_vehicle_list_parent)
        return vehicle_data

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

