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
import React, { useState, useRef, Suspense } from "react";
import { useIsMounted } from "utils/reactHooks";
import { connect } from "react-redux";
import clsx from "clsx";
import PropTypes from "prop-types";
import { Scrollbars } from "react-custom-scrollbars";
import { makeStyles } from "@material-ui/core/styles";
import TabPanel from "components/global/TabPanel";
import _get from "lodash.get";
import { zoomToCustomViewport } from "actions/mapActions";
import { darkNavyText, offPink, white } from "assets/colors";
import amzVehicle from "assets/img/amz_vehicle.jpg";

const vehicleTabs = [
  {
    label: "Details",
    id: "details",
    Comp: React.lazy(() => import("./VehicleDetails"))
  },
  {
    label: "Trips",
    id: "trips",
    Comp: React.lazy(() => import("./VehicleTripHistory"))
  },
  {
    label: "Video Events",
    id: "video",
    Comp: React.lazy(() => import("./VehicleVideoEvents"))
  }
];

const VehicleTabsContainer = ({
  selectedVehicleData,
  zoomToViewport,
  closingPanelRef
}) => {
  const classes = useStyles();
  const tabsRef = useRef();
  const isMounted = useIsMounted();
  const [selectedTabId, setSelectedTabId] = useState("details");
  const dataCacheRef = useRef(defaultCache());
  const scrollTopRef = useRef(0);
  const scrollbarRef = useRef();

  const { previousViewport, coordinates } = selectedVehicleData;
  const handleSelectTab = tabId => () => setSelectedTabId(tabId);
  const viewingDetails = selectedTabId === "details";
  const { vin, make, model, modelYear } = _get(
    selectedVehicleData,
    "properties",
    {}
  );
  const safeVehicleLabel = `${modelYear || ""} ${make || ""} ${model || ""}`;

  const scrollHandler = () => {
    if (selectedTabId === "details" && scrollbarRef.current) {
      const { scrollTop } = scrollbarRef.current.getValues();
      if (scrollTop !== undefined) scrollTopRef.current = scrollTop;
    }
  };

  const scroll = top =>
    scrollbarRef.current &&
    scrollbarRef.current.view.scroll({ top, left: 0, behavior: "smooth" });

  const scrollTo = ({ details, prevPos } = {}) => {
    if (details && tabsRef.current) {
      scroll(tabsRef.current.offsetTop);
    } else if (prevPos) {
      scroll(scrollTopRef.current);
    }
  };

  const renderTabButtons = () =>
    vehicleTabs.map(({ id, label }) => (
      <div
        key={id}
        className={clsx(classes.tab, {
          [classes.selectedTab]: selectedTabId === id
        })}
        onClick={handleSelectTab(id)}
      >
        {label}
      </div>
    ));

  const renderTabComponents = () => {
    return vehicleTabs.map(({ id, Comp }) => {
      return (
        <TabPanel tabId={id} selectedTabId={selectedTabId} key={id}>
          <Suspense fallback={<div />}>
            <Comp
              vin={vin}
              dataCacheRef={dataCacheRef}
              isParentMounted={isMounted}
              hasPreviousViewport={!!previousViewport}
              vehicleCoordinates={coordinates}
              zoomToViewport={zoomToViewport}
              scrollTo={scrollTo}
            />
          </Suspense>
        </TabPanel>
      );
    });
  };

  React.useEffect(() => {
    if (vin) {
      dataCacheRef.current = defaultCache();
      setSelectedTabId("details");
    }
  }, [vin]);

  React.useEffect(() => {
    return () => {
      const closingPanel = closingPanelRef;
      if (closingPanel.current && previousViewport) {
        zoomToViewport(previousViewport);
      }
    };
  }, [previousViewport, zoomToViewport, closingPanelRef]);

  return (
    <Scrollbars
      ref={scrollbarRef}
      autoHide
      onScroll={scrollHandler}
      hideTracksWhenNotNeeded
      renderTrackHorizontal={props => (
        <div {...props} style={{ display: "none" }} />
      )}
    >
      <div
        className={clsx({
          [classes.detailsContainer]: viewingDetails,
          [classes.listContainer]: !viewingDetails
        })}
      >
        <div className={clsx({ [classes.hiddenHeader]: !viewingDetails })}>
          <div className={classes.imgBox}>
            <img src={amzVehicle} alt={safeVehicleLabel} />
          </div>
          <div className={classes.vehicleHeader}>
            <div className={classes.vinText}>{vin}</div>
            <div className={classes.yearMakeModel}>{safeVehicleLabel}</div>
          </div>
          <hr className={classes.hrStyle} />
        </div>
        <div className={classes.tabs} ref={tabsRef}>
          {renderTabButtons()}
        </div>
        <div className={clsx({ [classes.fullHeight]: !viewingDetails })}>
          {renderTabComponents()}
        </div>
      </div>
    </Scrollbars>
  );
};

VehicleTabsContainer.propTypes = {
  selectedVehicleData: PropTypes.object.isRequired,
  closingPanelRef: PropTypes.object.isRequired
};

const mapDispatchToProps = dispatch => ({
  zoomToViewport: viewport => dispatch(zoomToCustomViewport(viewport))
});

export default connect(null, mapDispatchToProps)(VehicleTabsContainer);

const useStyles = makeStyles(() => ({
  detailsContainer: {
    height: "auto"
  },
  listContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  hiddenHeader: { display: "none" },
  imgBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    height: "16.875rem",
    "& > img": {
      height: "100%"
    }
  },
  vehicleHeader: {
    color: darkNavyText,
    margin: "2.6rem auto 2.5rem auto",
    textAlign: "center"
  },
  vinText: {
    fontSize: "1.69rem"
  },
  yearMakeModel: {
    fontSize: "1.125rem",
    opacity: 0.5,
    marginTop: "0.2rem"
  },
  hrStyle: {
    border: 0,
    height: "1px",
    marginBottom: "1.4rem",
    opacity: 0.2,
    backgroundImage:
      "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0))"
  },
  tabs: {
    flex: 0,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: "1.3rem"
  },
  fullHeight: {
    flex: 1,
    overflow: "hidden"
  },
  tab: {
    padding: "0 0.52rem",
    display: "flex",
    alignItems: "center",
    height: "1.22rem",
    fontSize: "0.61rem",
    color: darkNavyText,
    background: `${white} 0% 0% no-repeat padding-box`,
    "&:hover": {
      cursor: "pointer"
    },
    "&:first-of-type": {
      borderRadius: "0.14rem 0 0 0.14rem",
      marginRight: "1px"
    },
    "&:last-of-type": {
      borderRadius: "0 0.14rem 0.14rem 0",
      marginLeft: "1px"
    }
  },
  selectedTab: {
    background: `${offPink} 0% 0% no-repeat padding-box`,
    color: white
  }
}));

const defaultCache = () => ({ tripHistory: {}, events: {} });
