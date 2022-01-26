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
import { useIsMounted } from "utils/reactHooks";
import { connect } from "react-redux";
import clsx from "clsx";
import debounce from "lodash.debounce";
import PropTypes from "prop-types";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import VirtualListCustomScrollbar from "components/global/VirtualListCustomScrollbar";
import { FixedSizeList } from "react-window";
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import OtaStatusBadge from "./OtaStatusBadge";
import {
  setPaginatedJobDetails,
  updateMultipleDeviceExecutions
} from "actions/dataActions";
import { listJobExecutionsPaginated, getDeviceJobExecutions } from "apis/ota";
import { convertRemToPx } from "utils/helpers";
import { useAnimationFrameInterval } from "utils/reactHooks";
import { ota, calcOtaJobDetailsHeightPx } from "assets/dimensions";
import { JOB_EXECUTIONS_REFRESH_INTERVAL } from "assets/appConfig";
import {
  darkNavyText,
  pastelGreen,
  veryLightGray,
  lightGray,
  errorRed
} from "assets/colors";

const OtaJobCardDetails = ({
  data,
  jobIdx,
  updateJobDetails,
  dataCacheRef,
  resetListIndex,
  updateDeviceStatuses
}) => {
  const classes = useStyles();
  const listRef = React.useRef();
  const outerRef = React.useRef();
  const deviceIndexMapRef = React.useRef({});
  const visibleVehiclesRef = React.useRef({
    startIndex: undefined,
    stopIndex: undefined
  });
  const isMounted = useIsMounted();
  const [loadingNextPage, setLoadingNextPage] = React.useState(false);
  const { jobId, vehicles = [], nextToken } = data;
  const hasNextPage = !!nextToken;
  const listScrollOffset = dataCacheRef.current.jobScrollMap[jobId] || 0;

  const rerenderJobsList = React.useCallback(() => resetListIndex(jobIdx), [
    resetListIndex,
    jobIdx
  ]);

  const jobDetailsPaginationHandler = React.useCallback(
    async ({ nextToken: reqToken = null, initialize }) => {
      try {
        const {
          executionSummaries,
          nextToken
        } = await listJobExecutionsPaginated({ jobId, nextToken: reqToken });
        updateJobDetails({ jobId, executionSummaries, nextToken });
        if (initialize) rerenderJobsList();
      } catch {
        updateJobDetails({ jobId, nextToken: null });
      }
    },
    [updateJobDetails, jobId, rerenderJobsList]
  );

  React.useEffect(() => {
    if (!vehicles.length) {
      jobDetailsPaginationHandler({ initialize: true });
    }
  }, [vehicles.length, jobDetailsPaginationHandler]);

  React.useEffect(() => {
    vehicles.forEach(({ deviceId }, index) => {
      if (deviceIndexMapRef.current[deviceId] === undefined) {
        deviceIndexMapRef.current[deviceId] = index;
      }
    });
  }, [vehicles]);

  const updateScrollOffset = ({ scrollOffset }) => {
    dataCacheRef.current = {
      ...dataCacheRef.current,
      jobScrollMap: {
        ...dataCacheRef.current.jobScrollMap,
        [jobId]: scrollOffset
      }
    };
  };

  const loadNextPage = () => {
    return new Promise(resolve => {
      setLoadingNextPage(true);
      jobDetailsPaginationHandler({ nextToken }).finally(() => {
        if (isMounted.current) {
          setLoadingNextPage(false);
          resolve();
        }
      });
    });
  };

  const itemCount = hasNextPage ? vehicles.length + 1 : vehicles.length;
  const loadMoreItems = loadingNextPage ? () => {} : loadNextPage;
  const isItemLoaded = index => !hasNextPage || index < vehicles.length;

  const visibleVehiclesHandler = React.useCallback(
    debounce(({ visibleStartIndex, visibleStopIndex }) => {
      const startIndex = visibleStartIndex;
      const stopIndex = visibleStopIndex + 1;
      visibleVehiclesRef.current = { startIndex, stopIndex };
    }, 500),
    [vehicles, isMounted]
  );

  const scrollHandler = ({ scrollOffset }) => {
    if (listRef.current) updateScrollOffset({ scrollOffset });
  };

  const getUnfinishedDeviceIds = React.useCallback(() => {
    const { startIndex, stopIndex } = visibleVehiclesRef.current;
    if (startIndex === undefined || stopIndex === undefined) return [];
    const visibleVehicles = vehicles.slice(startIndex, stopIndex);
    const unfinishedVehicles = visibleVehicles.filter(
      ({ status }) =>
        status === "QUEUED" ||
        status === "IN_PROGRESS" ||
        status === "TIMED_OUT"
    );
    return unfinishedVehicles.map(({ deviceId }) => deviceId);
  }, [vehicles]);

  const refreshDeviceStatuses = React.useCallback(async () => {
    const unfinishedDeviceIds = getUnfinishedDeviceIds();
    if (unfinishedDeviceIds.length) {
      const executionSummaries = await getDeviceJobExecutions({
        jobId,
        deviceIds: unfinishedDeviceIds
      });
      const deviceIndexMap = deviceIndexMapRef.current;
      updateDeviceStatuses({ jobId, executionSummaries, deviceIndexMap });
    }
  }, [jobId, getUnfinishedDeviceIds, updateDeviceStatuses]);

  useAnimationFrameInterval(() => {
    refreshDeviceStatuses();
  }, JOB_EXECUTIONS_REFRESH_INTERVAL);

  const SingleStatusRow = React.memo(({ style, index }) => {
    const notLoaded = !isItemLoaded(index);
    const vehicleOtaData = vehicles[index] || {};
    const { vin, deviceId, status } = vehicleOtaData;
    const completed = status === "SUCCEEDED";
    const queued = status === "QUEUED";
    const inProgress = status === "IN_PROGRESS";
    const error = !completed && !queued && !inProgress;
    const isEven = (index + 1) % 2 === 0;

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
        style={style}
        className={clsx(classes.singleStatusRow, {
          [classes.evenBgColor]: isEven
        })}
      >
        <div
          className={clsx(classes.vinColumn, {
            [classes.queuedText]: queued,
            [classes.errorText]: error
          })}
        >
          {vin || deviceId}
        </div>
        <div className={classes.statusColumn}>
          <OtaStatusBadge data={vehicleOtaData} />
        </div>
      </div>
    );
  });

  return (
    <ExpansionPanelDetails
      style={{ height: calcOtaJobDetailsHeightPx(vehicles.length) }}
    >
      <div className={clsx(classes.subHeader, classes.flexCenter)}>
        <div className={classes.vinColumn}>VIN</div>
        <div className={classes.statusColumn}>STATUS</div>
      </div>
      <div className={classes.statusListContainer}>
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
                  onScroll={scrollHandler}
                  initialScrollOffset={listScrollOffset}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  onItemsRendered={props => {
                    onItemsRendered(props);
                    visibleVehiclesHandler(props);
                  }}
                  itemSize={convertRemToPx(ota.singleJobRowHeight)}
                  outerElementType={VirtualListCustomScrollbar}
                  outerRef={outerRef}
                >
                  {SingleStatusRow}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    </ExpansionPanelDetails>
  );
};

OtaJobCardDetails.propTypes = {
  data: PropTypes.object.isRequired,
  jobIdx: PropTypes.number.isRequired,
  dataCacheRef: PropTypes.object.isRequired,
  resetListIndex: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
  updateJobDetails: ({ jobId, executionSummaries, nextToken }) =>
    dispatch(setPaginatedJobDetails({ jobId, executionSummaries, nextToken })),
  updateDeviceStatuses: ({ jobId, executionSummaries, deviceIndexMap }) =>
    dispatch(
      updateMultipleDeviceExecutions({
        jobId,
        executionSummaries,
        deviceIndexMap
      })
    )
});

export default connect(null, mapDispatchToProps)(OtaJobCardDetails);

const useStyles = makeStyles(() => ({
  flexCenter: {
    display: "flex",
    alignItems: "center"
  },
  subHeader: {
    background: darkNavyText,
    opacity: 0.5,
    height: ota.singleJobHeaderHeight,
    fontSize: "0.61rem",
    fontWeight: "bold",
    color: "#FFFFFF",
    padding: "0 1.31rem"
  },
  vinColumn: {
    flex: 2.5,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  },
  statusColumn: {
    flex: 1,
    display: "flex"
  },
  statusListContainer: {
    flex: 1,
    overflow: "hidden"
  },
  completed: {
    color: pastelGreen
  },
  singleStatusRow: {
    display: "flex",
    height: ota.singleJobRowHeight,
    alignItems: "center",
    opacity: 1,
    background: veryLightGray,
    color: darkNavyText,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    flexWrap: "nowrap",
    padding: "0 1.31rem"
  },
  evenBgColor: {
    background: lightGray
  },
  queuedText: {
    opacity: 0.5
  },
  errorText: {
    color: errorRed
  }
}));

const ExpansionPanelDetails = withStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: 0,
    maxHeight: ota.maxJobListHeight
  }
}))(MuiExpansionPanelDetails);
