/*********************************************************************************************************************
 *  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

console.log("Loading function");

const https = require("https");
const url = require("url");
const S3Helper = require("./lib/s3-helper.js");

/**
 * Request handler.
 */
exports.handler = (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  let responseStatus = "FAILED";
  let responseData = {};
  const request = event.RequestType;

  if (request === "Delete") {
    sendResponse(event, callback, context.logStreamName, "SUCCESS");
  } else if (request === "Update" || request === "Create") {
    if (event.ResourceProperties.customAction === "putConfigFile") {
      let _s3Helper = new S3Helper();
      console.log(event.ResourceProperties.configItem);
      _s3Helper
        .putConfigFile(
          event.ResourceProperties.configItem,
          event.ResourceProperties.destS3Bucket,
          event.ResourceProperties.destS3key
        )
        .then(data => {
          responseStatus = "SUCCESS";
          sendResponse(
            event,
            callback,
            context.logStreamName,
            responseStatus,
            responseData
          );
        })
        .catch(err => {
          responseData = {
            Error: `Saving config file to ${event.ResourceProperties.destS3Bucket}/${event.ResourceProperties.destS3key} failed`
          };
          console.log([responseData.Error, ":\n", err].join(""));
          sendResponse(
            event,
            callback,
            context.logStreamName,
            responseStatus,
            responseData
          );
        });
    } else if (event.ResourceProperties.customAction === "copyS3assets") {
      let _s3Helper = new S3Helper();

      _s3Helper
        .copyAssets(
          event.ResourceProperties.manifestKey,
          event.ResourceProperties.sourceS3Bucket,
          event.ResourceProperties.sourceS3key,
          event.ResourceProperties.destS3Bucket
        )
        .then(data => {
          responseStatus = "SUCCESS";
          responseData = {};
          sendResponse(
            event,
            callback,
            context.logStreamName,
            responseStatus,
            responseData
          );
        })
        .catch(err => {
          responseData = {
            Error: `Copy of website assets failed`
          };
          console.log([responseData.Error, ":\n", err].join(""));
          sendResponse(
            event,
            callback,
            context.logStreamName,
            responseStatus,
            responseData
          );
        });
    }
  }
};

/**
 * Sends a response to the pre-signed S3 URL
 */
let sendResponse = function (
  event,
  callback,
  logStreamName,
  responseStatus,
  responseData
) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: `See the details in CloudWatch Log Stream: ${logStreamName}`,
    PhysicalResourceId: logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log("RESPONSE BODY:\n", responseBody);
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "Content-Type": "",
      "Content-Length": responseBody.length
    }
  };

  const req = https.request(options, res => {
    console.log("STATUS:", res.statusCode);
    console.log("HEADERS:", JSON.stringify(res.headers));
    callback(null, "Successfully sent stack response!");
  });

  req.on("error", err => {
    console.log("sendResponse Error:\n", err);
    callback(err);
  });

  req.write(responseBody);
  req.end();
};
