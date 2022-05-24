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

/**
 * @author Solution Builders
 */

const fs = require("fs");
const path = require("path");
const buildDir = "build";
const manifestFilename = "site-manifest.json";

// List all files in a directory in Node.js recursively in a synchronous fashion
let walkSync = function (dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      filelist.push(path.join(dir, file));
    }
  });

  return filelist;
};

let _filelist = [];
let _manifest = {
  files: []
};

console.log(
  `Generating a manifest file ${manifestFilename} for directory ${buildDir}`
);

walkSync(buildDir, _filelist);

for (let i = 0; i < _filelist.length; i++) {
  const formattedPath = _filelist[i].replace(/\\/gi, "/").replace("build/", "");
  _manifest.files.push(formattedPath);
}

fs.writeFileSync(
  buildDir + "/" + manifestFilename,
  JSON.stringify(_manifest, null, 4)
);
console.log(`Manifest file ${manifestFilename} generated.`);
