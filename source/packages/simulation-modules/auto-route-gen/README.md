# CMS Route Generator
> Simulation module to generate simulation friendly random routes based on Mapbox route API

This project provides an application that can be used to generate Random GIS routes. The app takes in set of inputs and provides you a simulator friendly GIS routes. 
The application uses Mapbox Route API for the actual driving directions and then process/convert the driving directions into a simulator friendly route.

## Installing / Getting started

To install run the following command

```shell
npm install
```

## Developing

### Built With
    "@mapbox/polyline": "1.1.0",
    "axios": "0.19.0",
    "config": "3.2.6",
    "geodesy": "1.1.3",
    "js-yaml": "3.12.2",
    "logform": "2.1.2",
    "readable-stream": "2.3.6",
    "shortid": "2.2.15",
    "winston": "3.2.1",
    "winston-transport": "4.3.0",
    "yargs": "15.1.0",
    "yargs-parser": "16.1.0"

### Prerequisites

- Node JS > 12.x

### Setting up Dev

### Building

To build run the following command
```shell
npm run build
```

## Configuration

The app requires a Mapbox API token which is needs to be configured in the src/config

```
mapbox:
  access_token: CDF_AUTO_ROUTE_GEN_MAPBOX_ACCESS_CONTROL
```


## Running the Route Generator

To run from source (via pnpm):

```sh
auto-route-gen>  CONFIG_LOCATION="../../../cdf-infrastructure-auto" pnpm run start -- \
    --latitude=39.829558 \
    --longitude=-104.974211  \
    --saveAs=./sample/route.json \
    --triggers=[{"type":"dtc","occurances":2},{"type":"oiltemp","occurances":2}] 
    --distance=20000
```


