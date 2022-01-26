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
import { SignIn } from "aws-amplify-react";
import { withStyles } from "@material-ui/core/styles";
import Input from "./StyledInput";
import Submit from "./SubmitButton";
import { detectEnterKey } from "utils/helpers";
import landingImg from "assets/img/landing_bg.jpg";
import awsLogo from "assets/img/aws-logo.svg";
import { darkNavyText, white } from "assets/colors";

class LandingPage extends SignIn {
  constructor(props) {
    super(props);

    this._validAuthStates = ["signIn", "signedOut"];
    this.state = { loading: false };
  }

  handleSignIn = async () => {
    try {
      this.setState({ loading: true });
      await super.signIn();
    } catch {
      this.setState({ loading: false });
    }
  };

  handleEnterKey = event => detectEnterKey(event) && this.handleSignIn();

  showComponent = () => {
    const { classes } = this.props;
    const { loading } = this.state;

    return (
      <div className={classes.root}>
        <div className={classes.content}>
          <img src={awsLogo} alt="AWS" className="awsLogo" />
          <div className="appName">Fleet Manager</div>
          <div className="intro">AWS Connected Mobility Solution</div>
          <div className="divider" />
          <div className={classes.userBox}>
            <Input
              autoFocus
              fullWidth
              placeholder="Username"
              name="username"
              onChange={this.handleInputChange}
            />
            <Input
              fullWidth
              type="password"
              placeholder="Password"
              name="password"
              onChange={this.handleInputChange}
              onKeyPress={this.handleEnterKey}
              style={{ margin: "0.56rem 0 1.31rem 0" }}
            />
            <Submit onClick={this.handleSignIn}>
              {loading ? "Signing in" : "Sign In"}
            </Submit>
            <div
              className={classes.forgotPassword}
              onClick={() => super.changeState("forgotPassword")}
            >
              Forgot Password
            </div>
          </div>
        </div>
      </div>
    );
  };
}

const useStyles = theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    width: "100%",
    background: `${darkNavyText} url(${landingImg}) center / cover no-repeat`,
    userSelect: "none"
  },
  content: {
    color: white,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 1.5rem",
    margin: "3rem 0 2rem 0",
    "& .awsLogo": {
      width: "4.69rem",
      marginBottom: "1.88rem"
    },
    "& .appName": {
      textAlign: "center",
      fontSize: "4.69rem",
      fontWeight: 300,
      lineHeight: "6.23rem",
      marginBottom: "2.16rem"
    },
    "& .intro": {
      fontSize: "1.69rem",
      fontWeight: 300
    },
    "& .divider": {
      opacity: 0.1,
      width: "100%",
      height: 1,
      backgroundColor: "#ffffff",
      margin: "4.6rem 0",
      [theme.breakpoints.up("md")]: {
        width: "50rem"
      }
    }
  },
  userBox: {
    width: "100%",
    marginTop: "0.5rem",
    [theme.breakpoints.up("sm")]: {
      width: "16.875rem",
      padding: 0
    }
  },
  forgotPassword: {
    textAlign: "center",
    marginTop: "0.8rem",
    "&:hover": {
      cursor: "pointer",
      textDecoration: "underline"
    }
  }
});

export default withStyles(useStyles)(LandingPage);
