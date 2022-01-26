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
"""Util class for all cvra data in elasticsearch"""

import os
import json
import math
import boto3
import requests
from collections import Counter
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
    def url_builder(_index):
        """create elasticsearch url for request"""

        logger.info("Entering url_builder: %s", _index)

        url = HOST + '/' + _index + '/_search'
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

        logger.info("Final query: %s", json.dumps(return_query))
        return return_query

    @staticmethod
    def build_vehicle_list(data):
        """return a list of mapped vehicle objects"""

        logger.info("Entering build_vehicle_list")

        temp_vehicle_list = list()

        for incoming_obj in data['hits']['hits']:

            # odometer to miles
            odometer_km = incoming_obj['_source']['odometer']['metres']
            conv_fac = 0.621371
            odometer_miles = odometer_km * conv_fac

            # convert speeds
            mph_current_speed = incoming_obj['_source']['geolocation']['speed'] * conv_fac
            mph_max_speed = incoming_obj['_source']['speed']['max'] * conv_fac
            mph_ave_speed = incoming_obj['_source']['speed']['average'] * conv_fac

            # convert fuel from l to gal * 
            gallons = incoming_obj['_source']['fuel']*0.264

            # oiltemp
            if 'oiltemp' in incoming_obj['_source']:
                oil_temp = incoming_obj['_source']['oiltemp']

            # get vehicle template
            vehicle_template = CDFAutoUtils.load_data_template('vehicle_template.json')

            # static
            vehicle_template['vin'] = incoming_obj['_source']['vin']

            if 'attributes' in incoming_obj['_source'].keys():
                vehicle_template['make'] = incoming_obj['_source']['attributes']['make']
                vehicle_template['model'] = incoming_obj['_source']['attributes']['model']
                vehicle_template['modelYear'] = incoming_obj['_source']['attributes']['modelyear']
                vehicle_template['color'] = incoming_obj['_source']['attributes']['colorcode']
            # telemetry
            vehicle_template['telemetry']['odometer'] = round(odometer_miles, 1)
            vehicle_template['telemetry']['fuelLevel'] = round(gallons, 1)
            vehicle_template['telemetry']['oilTemp'] = round(oil_temp, 2)
            vehicle_template['telemetry']['currentSpeed'] = round(mph_current_speed, 1)
            vehicle_template['telemetry']['maxSpeed'] = round(mph_max_speed, 1)
            vehicle_template['telemetry']['avgSpeed'] = round(mph_ave_speed, 1)
            # meta
            vehicle_template['geoLocation']['heading'] = incoming_obj['_source']['geolocation']['heading']
            vehicle_template['geoLocation']['coordinates'] = [float(incoming_obj['_source']['geolocation']['longitude']), float(incoming_obj['_source']['geolocation']['latitude'])]
            # device data
            if 'devices' in incoming_obj['_source'].keys():
                if len(incoming_obj['_source']['devices']):
                    for device in incoming_obj['_source']['devices']:
                        device_template = CDFAutoUtils.load_data_template('device_template.json')
                        device_template['swVersion'] = device['softwareversion']
                        device_template['deviceId'] = device['deviceid'].upper()
                        vehicle_template['devices'].append(device_template)

            trip_odometer = incoming_obj['_source']['odometer'].get('tripodometer')
            fuelinfo = incoming_obj['_source'].get('fuelinfo')
            if fuelinfo:
                trip_fuel = fuelinfo.get('currenttripconsumption')
                tankcapacity = fuelinfo.get('tankcapacity')

            if trip_odometer:
                vehicle_template['telemetry']['tripOdometer'] = round(trip_odometer*conv_fac, 2)
            
            if fuelinfo:
                if trip_fuel:
                    vehicle_template['telemetry']['tripFuel'] = round(trip_fuel*0.000264, 2)
                if tankcapacity:
                    vehicle_template['telemetry']['tankCapacity'] = round(tankcapacity, 2)


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
