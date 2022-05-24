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
import { connect } from "react-redux";
import { useIsMounted } from "utils/reactHooks";
import PropTypes from "prop-types";
import Downshift from "downshift";
import { makeStyles } from "@material-ui/core/styles";
import AutocompleteInput from "./AutocompleteInput";
import AutocompleteSuggestion from "./AutocompleteSuggestion";
import Paper from "@material-ui/core/Paper";
import debounce from "lodash.debounce";
import bboxPolygon from "@turf/bbox-polygon";
import { forwardGeocoder } from "apis/mapbox";
import { newUniqueLocation } from "utils/filterHelpers";

const MapboxAutocomplete = ({
  addNewLocation,
  selectedLocations,
  MAPBOX_TOKEN
}) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [inputValue, setInputValue] = React.useState("");
  const [results, setResults] = React.useState([]);

  const callMapboxGeocoder = React.useCallback(
    debounce(
      query => {
        if (query.length > 1) {
          forwardGeocoder({ query, MAPBOX_TOKEN })
            .then(({ features }) => isMounted.current && setResults(features))
            .catch(() => isMounted.current && setResults([]));
        }
      },
      200,
      {
        leading: false
      }
    ),
    []
  );

  const handleInputChange = event => {
    setInputValue(event.target.value);
    callMapboxGeocoder(event.target.value);
  };

  const handleKeyDown = event => {
    if (results.length && inputValue.length < 2 && event.key === "Backspace") {
      setResults([]);
    }
  };

  const changeHandler = newLocation => {
    if (newLocation && newUniqueLocation(newLocation, selectedLocations)) {
      const geoJSON = bboxPolygon(newLocation.bbox);
      const newLocationWithGeoJSON = {
        ...newLocation,
        label: newLocation.text,
        geoJSON
      };
      addNewLocation(newLocationWithGeoJSON);
    }
    setInputValue("");
    setResults([]);
  };

  return (
    <div>
      <Downshift
        id="downshift-multiple"
        inputValue={inputValue}
        onChange={changeHandler}
        selectedItem={selectedLocations}
        itemToString={item => item.text}
      >
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          isOpen,
          selectedItem,
          highlightedIndex
        }) => {
          const { onBlur, onChange, onFocus, ...inputProps } = getInputProps({
            onKeyDown: handleKeyDown,
            placeholder: "City / state / country"
          });

          return (
            <div className={classes.container}>
              {AutocompleteInput({
                fullWidth: true,
                classes,
                InputLabelProps: getLabelProps(),
                InputProps: {
                  onBlur,
                  onChange: event => {
                    handleInputChange(event);
                    onChange(event);
                  },
                  onFocus
                },
                inputProps
              })}

              {isOpen ? (
                <Paper className={classes.paper} square>
                  {results.map((suggestion, index) =>
                    AutocompleteSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({
                        item: suggestion
                      }),
                      highlightedIndex,
                      selectedItem
                    })
                  )}
                </Paper>
              ) : null}
            </div>
          );
        }}
      </Downshift>
    </div>
  );
};

const useStyles = makeStyles(theme => ({
  container: {
    flexGrow: 1,
    position: "relative"
  },
  paper: {
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0
  },
  inputRoot: {
    flexWrap: "wrap"
  },
  inputInput: {
    width: "auto",
    flexGrow: 1
  }
}));

const mapStateToProps = state => {
  const {
    map: { MAPBOX_TOKEN }
  } = state;
  return { MAPBOX_TOKEN };
};

MapboxAutocomplete.propTypes = {
  addNewLocation: PropTypes.func.isRequired,
  selectedLocations: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default connect(mapStateToProps)(MapboxAutocomplete);
