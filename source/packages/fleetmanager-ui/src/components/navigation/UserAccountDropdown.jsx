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
import { Auth } from "aws-amplify";
import { makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { useIsMounted } from "utils/reactHooks";
import { userLogOutAction } from "actions/userActions";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Fade from "@material-ui/core/Fade";
import MapboxTokenUserSetting from "components/fleet-manager/MapboxTokenUserSetting";
import avatarIcon from "assets/img/avatar-icon.svg";
import { appBar as appBarDimensions } from "assets/dimensions";
import {
  veryLightGray,
  white,
  grayVehicleBg,
  boxShadowColor,
  darkNavyText
} from "assets/colors";

const UserAccountDropdown = ({ userLogOutCleanup, alertOpen }) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [open, setOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");

  const toggleDropdown = () => setOpen(open => !open);
  const handleMenuAwayClick = () => !alertOpen && setOpen(false);
  const handleSignOut = React.useCallback(
    () => Auth.signOut().then(userLogOutCleanup),
    [userLogOutCleanup]
  );

  React.useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(({ attributes = {}, username }) => {
        isMounted.current && setUsername(attributes.email || username);
      })
      .catch(handleSignOut);
  }, [isMounted, handleSignOut]);

  return (
    <ClickAwayListener onClickAway={handleMenuAwayClick}>
      <div className={classes.wrapper}>
        <img
          src={avatarIcon}
          onClick={toggleDropdown}
          className={classes.avatarIcon}
          alt="User avatar"
        />
        {open && (
          <Fade in={open} timeout={500}>
            <div className={classes.dropdownMenu}>
              <div className={classes.userContainer}>
                <div className={classes.userEmail}>{username}</div>
                <div className={classes.userTitle}>Fleet Manager</div>
              </div>
              <div className={classes.actionContainer}>
                <div className={classes.actionBox}>
                  <MapboxTokenUserSetting />
                </div>
                <div className={classes.actionBox} onClick={handleSignOut}>
                  Sign out
                </div>
              </div>
            </div>
          </Fade>
        )}
      </div>
    </ClickAwayListener>
  );
};

const mapStateToProps = state => {
  const {
    user: {
      alert: { message }
    }
  } = state;
  return { alertOpen: !!message };
};

const mapDispatchToProps = dispatch => ({
  userLogOutCleanup: () => dispatch(userLogOutAction())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserAccountDropdown);

const useStyles = makeStyles(() => ({
  wrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  avatarIcon: {
    height: "1.69rem",
    "&:hover": {
      cursor: "pointer"
    }
  },
  dropdownMenu: {
    position: "fixed",
    top: `${parseFloat(appBarDimensions.height) - 0.3}rem`,
    right: "1rem",
    minWidth: "17rem",
    minHeight: "5rem",
    backgroundColor: white,
    boxShadow: `0px 0.47rem 1.4rem ${boxShadowColor}`,
    borderRadius: "0.328rem",
    overflow: "hidden",
    color: darkNavyText,
    fontSize: "0.75rem",
    zIndex: 20
  },
  userContainer: {
    padding: "1.5rem 1.5rem 0.7rem 1.5rem"
  },
  userEmail: {
    fontWeight: "bold",
    lineHeight: "22.5px",
    display: "flex",
    flexWrap: "nowrap",
    whiteSpace: "nowrap"
  },
  userTitle: {
    fontStyle: "italic",
    opacity: 0.5
  },
  actionContainer: {
    backgroundColor: grayVehicleBg,
    marginTop: "0.5rem"
  },
  actionBox: {
    padding: "1.2rem 1.5rem",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(35, 47, 62, 0.1)",
    "&:last-of-type": {
      borderBottom: 0,
      "&:hover": {
        cursor: "pointer",
        backgroundColor: veryLightGray
      }
    }
  }
}));
