# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Service file for dashboard requests"""

import json
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, NotFoundError
import logging
import datetime
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

# class for calculation for battery,tire pressure, that would recieve object queired from elastic search to work on that. 
class Dashboard:
    
    @staticmethod
    def tire_pressure_event(json_payload):
        logger.info("Dashboard tire_presssure_event table: %s", json_payload)

        final_pressure_response = {}
        roc_pressures = []
        pressure_data = []
        payload_list = []

        # get roc
        url = CDFAutoUtils.url_builder('cardata', '_search')
        query_current_pressure_rocs_queries = CDFAutoUtils.es_query_builder('tire_pressure_roc', json_payload)
        if len(query_current_pressure_rocs_queries):
            for query in query_current_pressure_rocs_queries:
                es_response = CDFAutoUtils.es_request(url, query)
                json_response = json.loads(es_response.text)
                payload_list.append(json_response)

        if len(payload_list):
            roc_pressures = CDFAutoUtils.build_roc_pressure_list(payload_list)

        # get current pressure
        url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
        query_current_pressure = CDFAutoUtils.es_query_builder('tire_pressure_current', json_payload)
        es_response = CDFAutoUtils.es_request(url, query_current_pressure)
        json_response = json.loads(es_response.text)
        logger.info("json_response: {}".format(json_response))

        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                # build pressure_data response object(s) [{'vin','pressure_front_left','pressure_front_right','pressure_rear_left','pressure_rear_right'},....]
                pressure_data = CDFAutoUtils.build_pressure_list(json_response)
        
        logger.info("roc_pressures: {}".format(roc_pressures))
        logger.info("pressure_data: {}".format(pressure_data))
        datalist = []
        if len(roc_pressures) and len(pressure_data):
            
            for vins_dict in pressure_data:
                for vins_dict_roc in roc_pressures:
                    if vins_dict['vin'] == vins_dict_roc['vin']:
                        agg_dict = {}
                        agg_dict['vin'] =  vins_dict['vin']
                        agg_dict['pressure_front_left'] = vins_dict['pressure_front_left']
                        agg_dict['pressure_front_right'] = vins_dict['pressure_front_right']
                        agg_dict['pressure_rear_left'] = vins_dict['pressure_rear_left']
                        agg_dict['pressure_rear_right'] = vins_dict['pressure_rear_right']
                        agg_dict['roc_front_left'] = vins_dict_roc['roc_front_left']
                        agg_dict['roc_front_right'] = vins_dict_roc['roc_front_right']
                        agg_dict['roc_rear_left'] = vins_dict_roc['roc_rear_left']
                        agg_dict['roc_rear_right'] = vins_dict_roc['roc_rear_right']
                        datalist.append(agg_dict)
        final_pressure_response = {'total_count':len(pressure_data),'data':datalist}
        return final_pressure_response

    @staticmethod
    def battery_event(json_payload):
        logger.info("Dashboard battery table: {}".format(json_payload))

        payload_list = []
        final_battery_response = {}
        battery_levels =[]
        battery_current = []
        # get min/max battery last 24 hours
        url = CDFAutoUtils.url_builder('cardata', '_search')
        query_battery_queries = CDFAutoUtils.es_query_builder('get_battery_levels', json_payload)
        if len(query_battery_queries):
            for query in query_battery_queries:
                es_response = CDFAutoUtils.es_request(url, query)
                json_response = json.loads(es_response.text)
                payload_list.append(json_response)

        if len(payload_list):
            battery_levels = CDFAutoUtils.build_battery_level_list(payload_list)

        # get current battery
        url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
        query_current_battery = CDFAutoUtils.es_query_builder('get_current_battery', json_payload)
        es_response = CDFAutoUtils.es_request(url, query_current_battery)
        json_response = json.loads(es_response.text)

        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                # build pressure_data response object(s) [{'vin','pressure_front_left','pressure_front_right','pressure_rear_left','pressure_rear_right'},....]
                battery_current = CDFAutoUtils.build_battery_current_list(json_response)
        datalist = []
        if len(battery_levels) and len(battery_current):
            
            logger.info("battery_current: {}".format(battery_current))
            logger.info("battery_minmax: {}".format(battery_levels))
            for vins_dict_current in battery_current:
                for vins_dict_minmax in battery_levels:
                    if vins_dict_minmax['vin'] == vins_dict_current['vin']:
                        agg_dict = {}
                        agg_dict['vin'] =  vins_dict_minmax['vin']
                        agg_dict['max_soc'] =  vins_dict_minmax['max_soc']
                        agg_dict['min_soc'] =  vins_dict_minmax['min_soc']
                        agg_dict['current_soc'] =  vins_dict_current['current_battery']
                        agg_dict['electricenergyin'] =  vins_dict_current['electricenergyin']
                        agg_dict['electricenergyout'] =  vins_dict_current['electricenergyout']
                        
                        datalist.append(agg_dict)
        
        final_battery_response = {'total_count':len(battery_current),'data':datalist}
        
        return final_battery_response

    @staticmethod
    def not_charging_event(json_payload):
        logger.info("Dashboard not-charging table: %s", json_payload)
        final_notcharging_response = {}
        payload_list = []
        not_charging_response = []
        notcharging_current = []
        
        url = CDFAutoUtils.url_builder('cardata', '_search')
        query_notcharging_queries = CDFAutoUtils.es_query_builder('get_notcharging', json_payload)
        if len(query_notcharging_queries):
            for query in query_notcharging_queries:
                es_response = CDFAutoUtils.es_request(url, query)
                json_response = json.loads(es_response.text)
                payload_list.append(json_response)
        if len(payload_list):
            not_charging_response = CDFAutoUtils.notcharging_calc(payload_list)
        datalist = not_charging_response

        url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
        query_current_notcharging = CDFAutoUtils.es_query_builder('notcharging_current', json_payload)
        es_response = CDFAutoUtils.es_request(url, query_current_notcharging)
        json_response = json.loads(es_response.text)


        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                # build pressure_data response object(s) [{'vin','pressure_front_left','pressure_front_right','pressure_rear_left','pressure_rear_right'},....]
                notcharging_current = CDFAutoUtils.build_notcharging_current_list(json_response)
        datalist = []
        if len(not_charging_response) and len(notcharging_current):
            
            logger.info("not_charging_response: {}".format(not_charging_response))
            logger.info("notcharging_current: {}".format(notcharging_current))
            for vins_dict_current in notcharging_current:
                for vins_dict_response in not_charging_response:
                    if vins_dict_response['vin'] == vins_dict_current['vin']:
                        try:
                            start = datetime.datetime.strptime(vins_dict_current["current_battery"], '%Y-%m-%dT%H:%M:%S.%f')
                        except ValueError:
                            start = datetime.datetime.strptime(vins_dict_current["current_battery"], '%Y-%m-%dT%H:%M:%S')
                        try:
                            ends = datetime.datetime.strptime(vins_dict_response["ttm"], '%Y-%m-%dT%H:%M:%S.%f')
                        except ValueError:
                            ends = datetime.datetime.strptime(vins_dict_response["ttm"], '%Y-%m-%dT%H:%M:%S')
                        c = ends - start
                        hours = c.total_seconds() / 3600
                        agg_dict = {}
                        agg_dict['vin'] =  vins_dict_response['vin']
                        agg_dict['hours'] =  hours
                        agg_dict['current_soc'] =  vins_dict_current["current_soc"]
                        agg_dict['electricenergyin'] =  vins_dict_current["electricenergyin"]
                        agg_dict['electricenergyout'] =  vins_dict_current["electricenergyout"]
                        datalist.append(agg_dict)
        
        final_notcharging_response = {'total_count':len(notcharging_current),'data':datalist}
        
        return final_notcharging_response

        


    
    @staticmethod
    def efficency_event(json_payload):
        logger.info("Dashboard efficency table: %s", json_payload)
        final_efficency_response = {}
        payload_list = []
        efficency_response = []
        efficiency_current = []

        url = CDFAutoUtils.url_builder('cardata', '_search')
        query_efficency_queries = CDFAutoUtils.es_query_builder('get_efficency', json_payload)
        if len(query_efficency_queries):
            for query in query_efficency_queries:
                es_response = CDFAutoUtils.es_request(url, query)
                json_response = json.loads(es_response.text)
                payload_list.append(json_response)

        if len(payload_list):
            efficency_response = CDFAutoUtils.efficency_cal(payload_list)
        # datalist = efficency_response               

        url = CDFAutoUtils.url_builder('latest_telemetry', '_search')
        query_current_battery = CDFAutoUtils.es_query_builder('efficency_current', json_payload)
        es_response = CDFAutoUtils.es_request(url, query_current_battery)
        json_response = json.loads(es_response.text)

        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                efficiency_current = CDFAutoUtils.build_efficiency_current_list(json_response)
        
        datalist = []
        if len(efficency_response) and len(efficiency_current):
            
            logger.info("efficiency_current: {}".format(efficiency_current))
            logger.info("efficency_response: {}".format(efficency_response))
            for vins_dict_current in efficiency_current:
                for vins_dictcal in efficency_response:
                    if vins_dictcal['vin'] == vins_dict_current['vin']:
                        agg_dict = {}
                        agg_dict['vin'] =  vins_dictcal['vin']
                        agg_dict['efficiency'] =  vins_dictcal['efficiency']
                        agg_dict['current_soc'] =  vins_dict_current['current_battery']
                        agg_dict['electricenergyin'] =  vins_dictcal['electricenergyin']
                        agg_dict['electricenergyout'] =  vins_dictcal['electricenergyout']
                        
                        datalist.append(agg_dict)
        
        final_efficency_response = {'total_count':len(efficiency_current),'data':datalist}
        
        return final_efficency_response





