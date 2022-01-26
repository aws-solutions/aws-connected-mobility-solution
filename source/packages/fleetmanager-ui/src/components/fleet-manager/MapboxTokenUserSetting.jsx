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
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { useIsMounted } from "utils/reactHooks";
import TextField from "@material-ui/core/TextField";
import EditIcon from "@material-ui/icons/Create";
import DoneIcon from "@material-ui/icons/Done";
import { verifyToken } from "apis/mapbox";
import { putMapboxToken } from "apis/config";
import { setMapboxToken, setValidMapboxToken } from "actions/mapActions";
import { setUserAlert } from "actions/userActions";
import { detectEnterKey } from "utils/helpers";
import { lightGray, darkNavyText, veryLightGray } from "assets/colors";

const UserAccountDropdown = ({
  cacheMapboxToken,
  MAPBOX_TOKEN,
  setValidToken,
  fromTokenWarning,
  setAlertMessage
}) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [token, setToken] = React.useState(MAPBOX_TOKEN);
  const [editingToken, setEditingToken] = React.useState(false);

  const handleEnterKey = e => detectEnterKey(e) && saveClickHandler();
  const editClickHandler = () => setEditingToken(true);

  const saveClickHandler = async () => {
    if (token.length < 80) {
      return setAlertMessage({
        alertType: "warning",
        message: "Please enter a valid Mapbox token"
      });
    }

    if (await verifyToken(token)) {
      isMounted.current && setEditingToken(false);
      cacheMapboxToken(token);
      setValidToken();
      putMapboxToken(token).catch(() => {
        setAlertMessage({
          message: "Error saving Mapbox token to Parameter Store"
        });
      });
    } else {
      setAlertMessage({ message: "Mapbox token is not valid" });
    }
  };

  React.useEffect(() => {
    MAPBOX_TOKEN && setToken(MAPBOX_TOKEN);
  }, [MAPBOX_TOKEN]);

  return (
    <div className={classes.tokenContainer}>
      {!fromTokenWarning && <div>Mapbox</div>}
      <div className="inputCol">
        <StyledTextField
          variant="filled"
          fullWidth
          disabled={fromTokenWarning ? false : !editingToken}
          value={token}
          onChange={e => setToken(e.target.value)}
          InputProps={{
            type: fromTokenWarning || editingToken ? "text" : "password",
            classes: {
              input: fromTokenWarning
                ? classes.fromTokenWarning
                : classes.customInput
            },
            onKeyPress: handleEnterKey
          }}
        />
      </div>
      <div className={`icon ${fromTokenWarning && "large"}`}>
        {fromTokenWarning || editingToken ? (
          <DoneIcon onClick={saveClickHandler} />
        ) : (
          <EditIcon onClick={editClickHandler} />
        )}
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    map: { MAPBOX_TOKEN }
  } = state;
  return { MAPBOX_TOKEN };
};

const mapDispatchToProps = dispatch => ({
  cacheMapboxToken: token => dispatch(setMapboxToken(token)),
  setValidToken: () => dispatch(setValidMapboxToken(true)),
  setAlertMessage: ({ alertType, message }) =>
    dispatch(setUserAlert({ alertType, message }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserAccountDropdown);

const useStyles = makeStyles(() => ({
  tokenContainer: {
    display: "flex",
    alignItems: "center",
    "& > div": {
      flex: 0
    },
    "& .inputCol": {
      flex: 1,
      margin: "0 0.6rem"
    },
    "& .icon": {
      display: "flex",
      alignItems: "center",
      "&:hover": {
        cursor: "pointer"
      },
      "& > svg": {
        height: "0.9rem",
        width: "0.9rem"
      }
    },
    "& .icon.large": {
      "& > svg": {
        height: "2rem",
        width: "2rem"
      }
    }
  },
  customInput: {
    padding: "0.2rem 0.5rem",
    backgroundColor: veryLightGray
  },
  fromTokenWarning: {
    paddingTop: "0.7rem",
    fontSize: "1rem !important"
  }
}));

const StyledTextField = withStyles({
  root: {
    "& .MuiFilledInput-underline:after": {
      borderBottomColor: darkNavyText,
      opacity: 0.8
    },
    "& .MuiInputBase-input": {
      color: darkNavyText,
      fontSize: "0.75rem",
      fontWeight: "normal"
    },
    "& .Mui-disabled": {
      backgroundColor: lightGray,
      color: "silver",
      "&::selection": {
        backgroundColor: "transparent"
      }
    }
  }
})(TextField);
