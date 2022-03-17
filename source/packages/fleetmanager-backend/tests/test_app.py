from chalice.test import Client
from app import app
from pytest import fixture
import boto3
import json
import logging
import jsonschema
import sys
from jsonschema import validate
from jsonschema import Draft7Validator, RefResolver

logger = logging.getLogger()
logger.setLevel('INFO')

@fixture
def test_client():
    with Client(app) as client:
        yield client

@fixture
def test_iot_client():
    #iot_client = boto3.client('iot-data', region_name='us-west-2')
    iot_client = boto3.client('iot-data')
    yield iot_client


#assigning values to variables
vin = "1AZKW21JXAD10005"
deviceId = ""
jobId = ""
sig_chnl_arn = ""
routeId = ""

def function_read_shadow_doc(deviceId,flag,iot_client):
    """
    Function to read the shadow document
    Args:
        deviceId (string): enter the deviceId
        flag (boolean): true/false
    """
    global sig_chnl_arn
    try:
        response = iot_client.get_thing_shadow(thingName=deviceId)
        streamingBody = response["payload"]
        jsonState = json.loads(streamingBody.read())
        logger.info("the jsonState is : {}".format(jsonState))
        sig_chnl_arn = jsonState["state"]["desired"]["sig_channel_arn"]
    except Exception as err:
        logger.error("get thing shadow error: {}".format(err))
    if flag :
        assert sig_chnl_arn != ""
    assert jsonState["state"]["desired"]["lvs_flag"] == flag

def function_update_reported_shadow_doc(deviceId,sig_chnl_arn,lvs_flag,iot_client):
    payload_json = json.dumps(
        {
            "state":
                {
                    "reported": {
                        "lvs_flag": lvs_flag,
                        "sig_channel_arn": sig_chnl_arn
                    }
                }
        }
    )
    logger.info("payload_json: {}".format(payload_json))
    try:
        response = iot_client.update_thing_shadow(
                thingName=deviceId,
                payload=payload_json
            )
            
        res_payload = json.loads(response['payload'].read().decode('utf-8'))
        logger.info('Reported: {}'.format(res_payload.get("state").get("reported"))) 
    except Exception as err:
        logger.info('Could not update the thing shadow with Reported state : {}'.format(err))


def function_delete_shadow_doc(deviceId,iot_client):
    try:
        response = iot_client.delete_thing_shadow(thingName = deviceId)
        logger.info("Cleanup success- The shadow document is deleted! : {}".format(response))
    except Exception as err:
        logger.info('Could not delete the thing shadow document : {}'.format(err))

def validate_jsonSchema(abs_path_to_schema, response):
    """
    Function to validate the jsonSchema
    Args:
        abs_path_to_schema (string): path to the json schema file
        response (json): The response returned by the get/post call

    Returns:
        [Boolean]: [true if validates else false]
    """
    try: 
        with open(abs_path_to_schema, 'r') as fp:
            schema = json.load(fp)
        resolver = RefResolver(abs_path_to_schema,schema)
        Draft7Validator.check_schema(schema)
        validator = Draft7Validator(schema, resolver=resolver, format_checker=None)
        validator.validate(response.json_body)
        return True
    except jsonschema.exceptions.ValidationError as err:
        logger.info("Validation exception : {}".format(err))
        return False

def test_single_vehicle(test_client):
    """
    Function to test the single vehicle data for a given vin
    should assert 200 if the vehicle for the vin exists
    stores the global deviceId for further testcases.
    """
    response = test_client.http.get('/vehicles/'+vin)
    assert response.status_code == 200
    assert validate_jsonSchema('tests/single_vehicle_validator.json',response)
    global deviceId
    deviceId = response.json_body["devices"][0]["deviceId"]
    logger.info("The deviceId is {}".format(deviceId))

def test_filtered_vehicle(test_client):
    """
    Function to test the filtered vehicle route - returns all the vehicles based on the filters passed in the query
    """
    response = test_client.http.get('/vehicles/filter?filters=%7B%22filters%22%3A%7B%22software%22%3A%20%7B%22swVersion%22%3A%20%22%22%7D%2C%20%22anomalies%22%3A%5B%5D%2C%22troubleCodes%22%3A%5B%5D%2C%22vehicle%22%3A%7B%22vin%22%3A%5B%5D%2C%22make%22%3A%5B%5D%2C%22model%22%3A%5B%5D%2C%22year%22%3A%5B%5D%7D%2C%22boundaries%22%3A%5B%5B-161.04972349663748%2C-22.866684487078942%2C-41.9414575905179%2C67.1720596538074%5D%5D%7D%7D')
    assert response.status_code == 200

def test_aggregated_vehicle(test_client):
    """
    Function to test the aggregated vehicle route - returns the list of all the vehicles
    """
    response = test_client.http.get('/vehicles/aggregate?filters=%7B%22filters%22%3A%7B%22troubleCodes%22%3A%5B%5D%2C%22vehicle%22%3A%7B%22vin%22%3A%5B%5D%2C%22make%22%3A%5B%5D%2C%22model%22%3A%5B%5D%2C%22year%22%3A%5B%5D%7D%2C%22software%22%3A%7B%22swVersion%22%3A%22%22%7D%2C%22anomalies%22%3A%5B%5D%2C%22boundaries%22%3A%5B%5B-116.76818847656206%2C33.47269019266646%2C-113.43933105468699%2C38.50948995925506%5D%5D%7D%2C%22pagination%22%3A%7B%22offset%22%3A0%2C%22maxResults%22%3A26%7D%2C%22clusters%22%3A%7B%22zoom%22%3A6%7D%7D')
    assert validate_jsonSchema('tests/aggregate_vehicles_validator.json',response)
    assert response.status_code == 200

def test_create_otaJobSingledevice(test_client):
    """
    Function to test the create OTA Job for a single device route - returns a jobId for the deviceId passed in the query
    """
    logger.info("The deviceId is {}".format(deviceId))
    response = test_client.http.post(path='/ota/create/'+deviceId,headers={'Content-Type':'application/json'},body='{"desiredVersion": "2.6"}')
    assert response.status_code == 200
    global jobId
    jobId = response.json_body["jobId"]
    assert "jobId" in response.json_body 

def test_list_otaJobs(test_client):
    """
    Function to test the route to list all the ota jobs - returns the list of jobs
    """
    response = test_client.http.get('/ota')
    assert response.status_code == 200
    assert validate_jsonSchema('tests/list_ota_jobs_validator.json',response)
    
def test_list_otaJob_Devices(test_client):
    """
    Function to list the ota devices for a particular OTA jobId
    """
    logger.info("the Job Id is {}".format(jobId))
    response = test_client.http.get('/ota/'+jobId+'/devices')
    assert response.status_code == 200
    assert validate_jsonSchema('tests/ota_jobs_validator.json',response)

def test_list_otaJob_Device_status(test_client):
    """
    Function to list the OTA Job status for a particular job Id and DeviceId
    """
    logger.info("the Job Id is {}".format(jobId))
    logger.info("The deviceId is {}".format(deviceId))
    response = test_client.http.get('/ota/'+jobId+'/devices/status?filters='+deviceId)
    assert response.status_code == 200
    assert validate_jsonSchema('tests/ota_jobs_devstatus_validator.json',response)

def test_events(test_client):
    response = test_client.http.get('/vehicles/'+vin+'/events?filters=%7B%22filters%22%3A%7B%22dates%22%3A%7B%22start%22%3A%22%22%2C%20%22end%22%3A%20%22%22%7D%7D%2C%22pagination%22%3A%7B%22offset%22%3A0%2C%22maxResults%22%3A3%7D%7D')
    assert response.status_code == 200

def test_trips(test_client):
    """
    Function to retrieve trip details for a vehicle with a particular vin and also store the global routeId
    """
    response = test_client.http.get('/vehicles/'+vin+'/trips?filters=%7B%22filters%22%3A%7B%22dates%22%3A%7B%22start%22%3A%22%22%2C%20%22end%22%3A%20%22%22%7D%7D%2C%22pagination%22%3A%7B%22offset%22%3A0%2C%22maxResults%22%3A20%7D%7D')
    assert validate_jsonSchema('tests/trips_validator.json',response)
    global routeId
    routeId = response.json_body["trips"][0]["tripId"]
    assert response.status_code == 200

def test_route(test_client):
    """
    Function to retrive the details for a particular routeId of a vehicle
    """
    logger.info("the routeId is {}".format(routeId))
    response = test_client.http.get('/vehicles/route/'+routeId)
    assert response.status_code == 200
    assert validate_jsonSchema('tests/route_validator.json',response)

def test_getconfig_paramvalue(test_client):
    """
    Function to test the getconfig param value route 
    """
    response = test_client.http.get('/config?parameter=mapboxToken')
    assert response.status_code == 200

def test_putconfig_paramvalue(test_client):
    """
    Function to test the putconfig param value route 
    """
    response = test_client.http.put(path='/config',headers={'Content-Type':'application/json'},body='{"name": "test_param","description": "This is my test parameter","value": "348763784732974.^%#%^&*&*(&_____dfdFFJH.1"}')
    assert response.status_code == 200

def test_lvs_toggle_true(test_client,test_iot_client):
    """
    Function to test the lvs toggle true - by passing the lvs as true
    """
    logger.info("The deviceId is {}".format(deviceId))
    response = test_client.http.post(path='/lvs/'+deviceId,headers={'Content-Type':'application/json'}, body='{"lvs": true}')
    assert response.status_code == 200
    function_read_shadow_doc(deviceId,True,test_iot_client)

def test_lvs_toggle_status_fail(test_client):
    """Function to test if the edge device has received the device shadow payload
    and updated state for a particular deviceId - this will fail as the edge reported state is not updated yet
    """
    logger.info("the deviceId is {}".format(deviceId))
    response =test_client.http.get(path='/lvs/'+deviceId+'/toggle-status')
    assert response.status_code == 400

def test_lvs_toggle_status(test_client,test_iot_client):
    """Function to test if the edge device has received the device shadow payload
    and updated state for a particular deviceId - passes as the reported state is updated
    """
    logger.info("the deviceId is {}".format(deviceId))
    function_update_reported_shadow_doc(deviceId,sig_chnl_arn,True,test_iot_client)
    response =test_client.http.get(path='/lvs/'+deviceId+'/toggle-status')
    assert response.status_code == 200

def test_lvs_stream(test_client):
    """
    Function to test the lvs stream - generate the presigned urls etc. for the particular deviceId and signalchannelarn
    """
    logger.info("The deviceId is {}".format(deviceId))
    logger.info("the global sig chan arn is : {}".format(sig_chnl_arn))
    response = test_client.http.post(path='/lvs/'+deviceId+'/stream',headers={'Content-Type':'application/json'}, body='{"signalChannelArn": "'+sig_chnl_arn+'"}')
    logger.info("the response body is : {}".format(response.json_body))
    assert response.status_code == 200
    assert validate_jsonSchema('tests/lvs_streams_validator.json',response)

def test_lvs_stream_fail(test_client):
    """
    Function to test the lvs stream - generate the presigned urls etc. for the particular deviceId and signalchannelarn sending the wrong signchalarn should fail
    """
    logger.info("The deviceId is {}".format(deviceId))
    logger.info("the global sig chan arn is : {}".format(sig_chnl_arn))
    response = test_client.http.post(path='/lvs/'+deviceId+'/stream',headers={'Content-Type':'application/json'}, body='{"signalChannelArn": "'+sig_chnl_arn+'abc"}')
    logger.info("the response body is : {}".format(response.json_body))
    assert response.status_code == 400
    
def test_lvs_toggle_false(test_client,test_iot_client):
    """
    Function to test the lvs toggle false - by passing the lvs as false and signalchannel arn
    """
    logger.info("The deviceId is {}".format(deviceId))
    logger.info("the global sig chan arn is : {}".format(sig_chnl_arn))
    response = test_client.http.post(path='/lvs/'+deviceId,headers={'Content-Type':'application/json'}, body='{"lvs": false,"signalChannelArn": "'+sig_chnl_arn+'"}')
    assert response.status_code == 204
    function_read_shadow_doc(deviceId,False,test_iot_client)

def test_lvs_toggle_status_changed(test_client):
    """Function to test if the edge device has received the device shadow payload
    and updated state for a particular deviceId - this will report 'Device shadow not updated'
    """
    logger.info("the deviceId is {}".format(deviceId))
    response =test_client.http.get(path='/lvs/'+deviceId+'/toggle-status')
    assert response.status_code == 200
    assert response.json_body["status"] == False

def test_lvs_toggle_status_change_updated(test_client,test_iot_client):
    """Function to test if the edge device has received the device shadow payload
    and updated state for a particular deviceId - this will report 'Edge device successfully communicated w/ device shadow'
    """
    function_update_reported_shadow_doc(deviceId,'',False,test_iot_client)
    logger.info("the deviceId is {}".format(deviceId))
    response =test_client.http.get(path='/lvs/'+deviceId+'/toggle-status')
    assert response.status_code == 200
    function_delete_shadow_doc(deviceId,test_iot_client)

def test_lvs_stream_deleted_arn(test_client):
    """
    Function to test the lvs stream - generate the presigned urls etc. for the particular deviceId and signalchannelarn that was deleted
    it should throw Resource not found exception
    """
    logger.info("The deviceId is {}".format(deviceId))
    logger.info("the global sig chan arn is : {}".format(sig_chnl_arn))
    response = test_client.http.post(path='/lvs/'+deviceId+'/stream',headers={'Content-Type':'application/json'}, body='{"signalChannelArn": "'+sig_chnl_arn+'"}')
    logger.info("the response body is : {}".format(response.json_body))
    assert response.status_code == 400

def test_lvs_toggle_false_fail(test_client):
    """
    Function to test the failure of the toggle false fail
    """
    logger.info("The deviceId is {}".format(deviceId))
    response = test_client.http.post(path='/lvs/'+deviceId,headers={'Content-Type':'application/json'}, body='{"lvs": false}')
    assert response.status_code == 400
