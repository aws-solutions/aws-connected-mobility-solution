# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------

from chalice import Chalice
from chalicelib.apis.cdf_auto_fleetmanager_config.config_controller import parameter_store_module
from chalicelib.apis.cdf_auto_fleetmanager_event.event_controller import event_module
from chalicelib.apis.cdf_auto_fleetmanager_ota.ota_controller import ota_module
from chalicelib.apis.cdf_auto_fleetmanager_route.route_controller import route_module
from chalicelib.apis.cdf_auto_fleetmanager_trip.trip_controller import trip_module
from chalicelib.apis.cdf_auto_fleetmanager_vehicles.vehicles_controller import vehicles_module
from chalicelib.apis.cdf_auto_fleetmanager_dashboard.dashboard_controller import dashboard_module
from chalicelib.apis.cdf_auto_fleetmanager_charts.charts_controller import charts_module

app = Chalice(app_name='cdf-auto-fleetmanager-backend')
app.register_blueprint(parameter_store_module)
app.register_blueprint(event_module)
app.register_blueprint(ota_module)
app.register_blueprint(route_module)
app.register_blueprint(trip_module)
app.register_blueprint(vehicles_module)
app.register_blueprint(dashboard_module)
app.register_blueprint(charts_module)