
Using example `<infrastructure>/simulator/engine/<env>.config`:
```json
{
    "aws": {
        "region": "us-west-2",
        "iot": {
            "keyPath": "/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/c18ca946a8-private.pem.key",
            "certPath": "/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/c18ca946a8-certificate.pem.crt",
            "caPath": "/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/aws-ca.pem",
            "host": "aofuby49j6efy-ats.iot.us-west-2.amazonaws.com"
        }
    }
}
```

To run from source (via pnpm):

```sh
auto-simulation-engine>  CONFIG_LOCATION="../../../cdf-infrastructure-auto" pnpm run start -- --deviceId=ECU-AWS-2014-YCSPOTF_X --vin=1azcv91lx9e10003 --odometer=12340 --fuelTankCapacity=50 --routePath=/Users/deanhart/git/cdf-ts/cdf-simulator/packages/auto-simulation-engine/routes/route-a.json
```

To run from compiled js:

```sh
# first, package it:
auto-simulation-engine>  pnpm run bundle:quick
# the above will create build/build.zip. Distribute/unzip the build.zip as needed
# then run compiled js from the extracted build.zip
build>  NODE_CONFIG='{"aws":{"region":"us-west-2","iot":{"keyPath":"/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/c18ca946a8-private.pem.key","certPath":"/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/c18ca946a8-certificate.pem.crt","caPath":"/Users/deanhart/git/cdf-ts/cdf-infrastructure-auto/simulator/engine/certs/1557/aws-ca.pem","host":"aofuby49j6efy-ats.iot.us-west-2.amazonaws.com"}},"cvra":{"templates":{"carData":"templates/cardata.template","dtc":"templates/dtc.template","event":"templates/event.template","trip":"templates/trip.template"}}}' NODE_CONFIG_DIR='./config' node app.js --deviceId=ECU-AWS-2014-YCSPOTF_X --vin=1azcv91lx9e10003 --odometer=12340 --fuelTankCapacity=50 --routePath=/Users/deanhart/git/cdf-ts/cdf-simulator/packages/auto-simulation-engine/routes/route-a.json
```

## Running Simulations

In order to run all routes for a given simulation, The user can run a simple command with the following parameters to run the simulations.
The certificates for the simulation clients are included in the auto-simulation-engine package under certs directory. 

Pre-reqs: 
- Run `npm install` to install dependencies

- The root file path for the certificate configuration should be modified. There are 2 places where the certs root path configurtion needs to modified.
1. ~/cdf-simulator/packages/auto-simulation-engine/src/config/default.yaml

Once the correct root path is configured. The following command can be executed to run all the simulations in parallel. 

*Note: Upon the simulation completion, the process will not end on its but will wait for manual interrupt.

```sh
npm run start:simulations
```


The command will load all the routes and run parallel simulations. 