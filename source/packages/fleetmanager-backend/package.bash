#!/bin/bash

/usr/local/bin/chalice package --merge-template ./infrastructure/cfn-cms-fleetmanager-backend-resources.json ./infrastructure/build 2> /dev/null
