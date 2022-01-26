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
import React, { useRef, memo } from "react";
import { useIsMounted } from "utils/reactHooks";
import { connect } from "react-redux";
import clsx from "clsx";
import _get from "lodash.get";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import VirtualListCustomScrollbar from "components/global/VirtualListCustomScrollbar";
import { makeStyles } from "@material-ui/core/styles";
import { setSingleVehicleViewOpen } from "actions/viewActions";
import {
  setSelectedVehicleData,
  setVehicleListNextPage
} from "actions/dataActions";
import { addCommasToNumber } from "utils/helpers";
import { darkNavyText, veryLightGray, lightGray } from "assets/colors";
import RightArrowBlack from "assets/img/right-arrow-black.svg";

const VehiclesList = ({
  filters,
  vehicles,
  vehicleCount,
  offset,
  setSelectedVehicle,
  openSingleVehicleView,
  loadNextVehicles
}) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const listRef = useRef();
  const outerRef = useRef();
  const hasNextPage = !!offset && !!filters;
  const [loadingNextPage, setLoadingNextPage] = React.useState(false);

  const loadNextPage = () => {
    return new Promise(resolve => {
      setLoadingNextPage(true);
      loadNextVehicles({ offset, filters })
        .then(resolve)
        .catch(resolve)
        .finally(() => {
          if (isMounted.current) setLoadingNextPage(false);
        });
    });
  };

  const itemCount = hasNextPage ? vehicles.length + 1 : vehicles.length;
  const loadMoreItems = loadingNextPage ? () => {} : loadNextPage;
  const isItemLoaded = index => !hasNextPage || index < vehicles.length;

  const setVehicleAndOpenSingleView = vehicleObj => () => {
    setSelectedVehicle(vehicleObj);
    openSingleVehicleView();
  };

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current._listRef.scrollToItem(0);
    }
  }, [filters]);

  const VehicleRow = memo(({ index, style }) => {
    const notLoaded = !isItemLoaded(index);
    const vehicle = vehicles[index];
    const isEven = (index + 1) % 2 === 0;
    const { vin, make, model, modelYear, swVersion } = _get(
      vehicle,
      "properties",
      {}
    );
    const safeVehicleTypeLabel = `${modelYear || ""} ${make || ""} ${
      model || ""
    }`;

    return notLoaded ? (
      <div
        style={{
          ...style,
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        Loading...
      </div>
    ) : (
      <div
        className={clsx(
          classes.columnsContainer,
          classes.flexCenter,
          classes.listItem,
          classes.hoveredArrowImg,
          {
            [classes.listItemEven]: isEven
          }
        )}
        style={style}
        onClick={setVehicleAndOpenSingleView(vehicle)}
      >
        <div className={classes.vin}>{vin}</div>
        <div className={clsx(classes.type, classes.halfOpacity)}>
          {safeVehicleTypeLabel}
        </div>
        <div className={classes.software}>
          <span className={classes.halfOpacity}>{swVersion}</span>
        </div>
      </div>
    );
  });

  return (
    <div className={classes.root}>
      <div className={clsx(classes.managerBar, classes.flexCenter)}>
        <div className={clsx(classes.vin, classes.myFleet)}>My Fleet</div>
        <div className={clsx(classes.fleetStats, classes.flexCenter)}>
          {addCommasToNumber(vehicleCount)} vehicles
        </div>
      </div>
      <div
        className={clsx(
          classes.columnsContainer,
          classes.flexCenter,
          classes.headerBar
        )}
      >
        <div className={clsx(classes.vin, classes.boldText)}>VIN</div>
        <div className={clsx(classes.type, classes.boldText)}>TYPE</div>
        <div className={clsx(classes.software, classes.boldText)}>SOFTWARE</div>
        <div />
      </div>
      <div className={classes.content}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              threshold={1}
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              ref={listRef}
            >
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  ref={ref}
                  className={classes.list}
                  height={height}
                  itemCount={itemCount}
                  onItemsRendered={onItemsRendered}
                  itemSize={35}
                  width={width}
                  outerElementType={VirtualListCustomScrollbar}
                  outerRef={outerRef}
                >
                  {VehicleRow}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    data: {
      vehicleList: { vehicles, offset, vehicleCount, filters }
    }
  } = state;
  return {
    filters,
    vehicles,
    offset,
    vehicleCount
  };
};

const mapDispatchToProps = dispatch => ({
  openSingleVehicleView: () => dispatch(setSingleVehicleViewOpen()),
  setSelectedVehicle: vehicleData =>
    dispatch(setSelectedVehicleData(vehicleData, { fromVehicleList: true })),
  loadNextVehicles: ({ offset, filters }) =>
    dispatch(setVehicleListNextPage({ offset, filters }))
});

export default connect(mapStateToProps, mapDispatchToProps)(VehiclesList);

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflowY: "auto"
  },
  flexCenter: {
    display: "flex",
    alignItems: "center"
  },
  columnsContainer: {
    padding: "0 1.31rem"
  },
  vin: {
    flex: 2.6,
    overflow: "hidden",
    textTransform: "uppercase"
  },
  type: {
    flex: 2.57
  },
  software: {
    flex: 1
  },
  headerBar: {
    flex: "0 0 1.69rem",
    backgroundColor: darkNavyText,
    opacity: 0.5,
    color: "white",
    paddingLeft: "1.31rem",
    fontSize: "0.61rem"
  },
  content: {
    flex: 1,
    overflow: "hidden"
  },
  list: {
    border: 0
  },
  listItem: {
    paddingLeft: "1.31rem",
    "&:hover": {
      cursor: "pointer"
    },
    fontSize: "0.75rem",
    color: darkNavyText,
    backgroundColor: veryLightGray
  },
  listItemEven: {
    backgroundColor: lightGray
  },
  managerBar: {
    flex: "0 0 2.25rem",
    background: darkNavyText,
    opacity: 0.7,
    color: "white",
    padding: "0 1.31rem"
  },
  myFleet: {
    fontSize: "1.125rem",
    fontWeight: "bold"
  },
  fleetStats: {
    fontSize: "0.75rem",
    flex: 3.57,
    "& > div": {
      margin: "0 0.3rem"
    }
  },
  hoveredArrowImg: {
    "&:hover": {
      backgroundImage: `url(${RightArrowBlack})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center right 1.31rem",
      backgroundSize: "0.5rem"
    }
  },
  halfOpacity: {
    opacity: 0.5
  },
  boldText: {
    fontWeight: "bold"
  }
}));
