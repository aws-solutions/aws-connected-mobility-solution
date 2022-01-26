/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import update from "immutability-helper";
import PropTypes from "prop-types";

const TextFiltersList = ({ listData, onChange }) => {
  const classes = useStyles();

  const handleDelete = idx => () => {
    const updatedList = update(listData, { $splice: [[idx, 1]] });
    onChange(updatedList);
  };

  return (
    <div className={classes.root}>
      {listData.map((data, idx) => {
        return (
          <Chip
            key={data.label}
            label={data.label}
            onDelete={handleDelete(idx)}
            className={classes.chip}
          />
        );
      })}
    </div>
  );
};

TextFiltersList.propTypes = {
  listData: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired
};

export default TextFiltersList;

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingTop: "1rem",
    maxWidth: "100%"
  },
  chip: {
    maxWidth: "inherit",
    margin: theme.spacing(0, 0.75, 1, 0),
    "& > .MuiChip-label": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginRight: 12,
      paddingRight: 0
    }
  }
}));
