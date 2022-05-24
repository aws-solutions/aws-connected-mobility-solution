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
import PropTypes from "prop-types";
import moment from "moment";
import clsx from "clsx";
import _get from "lodash.get";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import VirtualListCustomScrollbar from "components/global/VirtualListCustomScrollbar";
import VideoPlayerModal from "components/global/VideoPlayerModal";
import { useIsMounted } from "utils/reactHooks";
import { connect } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import { getVehicleEvents, getEventVideoUrlStub } from "apis/vehicles";
import { setTripEventDataPromise } from "actions/dataActions";
import { setTripHistoryView } from "actions/viewActions";
import { setUserAlert } from "actions/userActions";
import { darkNavyText, offPink, white, grayVehicleBg } from "assets/colors";
import playIcon from "assets/img/play-white.svg";
import { buildEventForMap } from "utils/dataHelpers";
import { validCoord } from "utils/geojsonHelpers";
import { SINGLE_FEATURE_ZOOM_LEVEL } from "assets/appConfig";

const VideoEvents = ({
  vin,
  setEventData,
  openTripHistoryView,
  closeTripHistoryView,
  zoomToViewport,
  viewport,
  dataCacheRef,
  isParentMounted,
  hasPreviousViewport,
  vehicleCoordinates,
  setAlertMessage
}) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [state, setState] = React.useState({
    loading: true,
    loadingNextPage: false,
    offset: null,
    videoEvents: []
  });
  const [videoOpen, setVideoOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [selectedEventIdx, setSelectedEventIdx] = React.useState(null);
  const [videoStartStop] = React.useState([]);
  const viewportSnapshot = React.useRef();
  const listRef = React.useRef();
  const outerRef = React.useRef();
  const { loading, offset, videoEvents, loadingNextPage } = state;
  const hasNextPage = !!offset;
  const listScrollOffset = dataCacheRef.current.events.scrollOffset || 0;

  const setVideoEvents = (videoEvents = []) =>
    setState(state => ({ ...state, videoEvents }));

  const setLoadingNextPage = loadingNextPage =>
    setState(state => ({ ...state, loadingNextPage }));

  const closeModal = () => {
    if (isMounted.current) {
      setVideoOpen(false);
      setVideoUrl("");
    }
  };

  const addEventExampeRef = React.useRef(() => {
    let coordinates = [-122.33666632306694, 47.62202463203295];
    if (validCoord(vehicleCoordinates)) coordinates = vehicleCoordinates;
    setVideoEvents([
      {
        creationtimestamp: moment().toISOString(),
        alert: {
          videoevent: {
            event_id: "jEX4HFz2",
            event_location: {
              latitude: coordinates[1],
              longitude: coordinates[0]
            },
            event_name: "Motion detection",
            event_source: "dashcam"
          }
        }
      }
    ]);
  });

  const getPaginatedEvents = React.useCallback(
    async ({ initialize, offset: requestOffset = 0 } = {}) => {
      try {
        const { events = [], offset } = await getVehicleEvents({
          vin,
          offset: requestOffset
        });
        if (isMounted.current) {
          setState(state => ({
            ...state,
            videoEvents: initialize
              ? events
              : [...state.videoEvents, ...events],
            loading: false,
            offset: offset || null,
            loadingNextPage: false
          }));
          if (initialize && !events.length) addEventExampeRef.current();
        }
      } catch {
        if (isMounted.current) {
          setState(state => ({
            ...state,
            loading: false,
            offset: null,
            loadingNextPage: false
          }));
        }
      }
    },
    [vin, isMounted]
  );

  const scrollHandler = ({ scrollOffset }) => {
    if (listRef.current)
      dataCacheRef.current.events.scrollOffset = scrollOffset;
  };

  const loadNextPage = () => {
    return new Promise(resolve => {
      setLoadingNextPage(true);
      getPaginatedEvents({ offset }).finally(() => {
        if (isMounted.current) {
          setLoadingNextPage(false);
          resolve();
        } else {
          dataCacheRef.current.events.loadingNextPage = false;
        }
      });
    });
  };

  const itemCount = hasNextPage ? videoEvents.length + 1 : videoEvents.length;
  const loadMoreItems = loadingNextPage ? () => {} : loadNextPage;
  const isItemLoaded = index => !hasNextPage || index < videoEvents.length;

  const watchVideoHandler = eventData => () => {
    const eventId = _get(eventData, "alert.videoevent.event_id");
    if (!eventId) {
      return setAlertMessage({ message: "Missing video event ID" });
    }

    setVideoOpen(true);
    getEventVideoUrlStub(eventId)
      .then(url => setVideoUrl(url))
      .catch(() => setVideoOpen(false));
  };

  const handleEventClick = (alertData, idx) => e => {
    if (selectedEventIdx === idx) return;
    if (e.target.className.includes("watchVideo")) return;

    const { longitude, latitude } = _get(alertData, "event_location", {});
    const coordinates = [longitude, latitude];
    if (!validCoord(coordinates)) {
      return setAlertMessage({ message: "Invalid event coordinates" });
    }
    if (!viewportSnapshot.current) viewportSnapshot.current = { ...viewport };

    const eventPayload = buildEventForMap({ coordinates });

    setSelectedEventIdx(idx);
    setEventData(eventPayload).then(() => {
      openTripHistoryView();
      zoomToViewport({
        longitude,
        latitude,
        zoom: SINGLE_FEATURE_ZOOM_LEVEL
      });
    });
  };

  React.useEffect(() => {
    const { results, offset, loading, loadingNextPage } =
      dataCacheRef.current.events || {};
    if (results) {
      setState(state => ({
        ...state,
        videoEvents: results,
        loading,
        offset,
        loadingNextPage
      }));
    } else {
      getPaginatedEvents({ initialize: true }).finally(() => {
        if (!isMounted.current) {
          dataCacheRef.current.events = {};
        }
      });
    }
  }, [isMounted, dataCacheRef, getPaginatedEvents]);

  React.useEffect(() => {
    const { loading, offset, videoEvents: results, loadingNextPage } = state;
    dataCacheRef.current.events = {
      loading,
      offset,
      results,
      loadingNextPage
    };
  }, [state, dataCacheRef]);

  React.useEffect(() => {
    return () => {
      closeTripHistoryView();
      setEventData(null);

      if (viewportSnapshot.current) {
        const parentMounted = isParentMounted;
        const parentOpen = parentMounted.current;
        if (parentOpen || (!parentOpen && !hasPreviousViewport)) {
          zoomToViewport(viewportSnapshot.current);
        }
      }
    };
  }, [
    isParentMounted,
    zoomToViewport,
    hasPreviousViewport,
    closeTripHistoryView,
    setEventData
  ]);

  const EventRow = React.memo(({ index, style }) => {
    const notLoaded = !isItemLoaded(index);
    const evData = videoEvents[index];
    const vidEvtData = _get(evData, "alert.videoevent", {});
    const hasVideo = !!vidEvtData.event_id;
    const isSelected = index === selectedEventIdx;
    const isEven = (index + 1) % 2 === 0;

    return (
      <div
        className={clsx(classes.eventRow, {
          [classes.evenEventRow]: isEven,
          [classes.selectedEventRow]: isSelected,
          [classes.loadingRow]: notLoaded,
          [classes.eventRowHover]: !notLoaded
        })}
        onClick={notLoaded ? () => null : handleEventClick(vidEvtData, index)}
        style={style}
        key={index}
      >
        {notLoaded ? (
          "Loading..."
        ) : (
          <>
            <div className={classes.time}>
              {moment(evData.creationtimestamp).format("MMM D")} @{" "}
              {moment(evData.creationtimestamp).format("h:mm a")}
            </div>
            <div className={classes.source}>{vidEvtData.event_source}</div>
            <div className={classes.eventName}>{vidEvtData.event_name}</div>
            <div
              className={clsx(classes.video, {
                [classes.videoLink]: hasVideo,
                watchVideo: hasVideo
              })}
              onClick={watchVideoHandler(evData)}
            >
              {hasVideo && "Watch"}
            </div>
          </>
        )}
      </div>
    );
  });

  if (loading) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (!loading && !videoEvents.length)
    return <div style={{ textAlign: "center" }}>No video events</div>;

  return (
    <div className={classes.container}>
      <div className={classes.headerBar}>
        <div className={classes.time}>TIME</div>
        <div className={classes.source}>SOURCE</div>
        <div className={classes.eventName}>NAME</div>
        <div className={classes.video}>VIDEO</div>
      </div>
      <div className={classes.eventsContainer}>
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
                  className={classes.list}
                  height={height}
                  itemCount={itemCount}
                  onItemsRendered={onItemsRendered}
                  itemSize={40}
                  width={width}
                  outerElementType={VirtualListCustomScrollbar}
                  outerRef={outerRef}
                >
                  {EventRow}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
      {videoOpen && (
        <VideoPlayerModal
          open={videoOpen}
          handleClose={closeModal}
          videoUrl={videoUrl}
          videoStartStop={videoStartStop}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const {
    map: { viewport }
  } = state;
  return { viewport };
};

const mapDispatchToProps = dispatch => ({
  setEventData: eventData => dispatch(setTripEventDataPromise(eventData)),
  openTripHistoryView: () => dispatch(setTripHistoryView(true)),
  closeTripHistoryView: () => dispatch(setTripHistoryView(false)),
  setAlertMessage: ({ message }) => dispatch(setUserAlert({ message }))
});

VideoEvents.propTypes = {
  vin: PropTypes.string.isRequired,
  dataCacheRef: PropTypes.object.isRequired,
  isParentMounted: PropTypes.object.isRequired,
  zoomToViewport: PropTypes.func.isRequired,
  hasPreviousViewport: PropTypes.bool,
  vehicleCoordinates: PropTypes.array
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoEvents);

const highlightedEventRow = {
  backgroundColor: offPink,
  color: white
};

const useStyles = makeStyles(() => ({
  container: {
    height: "100%",
    fontSize: "0.75rem",
    color: darkNavyText,
    backgroundColor: white,
    display: "flex",
    flexDirection: "column"
  },
  headerBar: {
    flex: 0,
    padding: "0 1.4rem",
    height: "1.69rem",
    backgroundColor: darkNavyText,
    opacity: 0.5,
    color: white,
    fontSize: "0.61rem",
    display: "flex",
    alignItems: "center"
  },
  eventsContainer: {
    flex: 1
  },
  eventRow: {
    padding: "0.7rem 1.4rem",
    display: "flex",
    color: darkNavyText
  },
  eventRowHover: {
    "&:hover": {
      ...highlightedEventRow,
      cursor: "pointer"
    }
  },
  evenEventRow: {
    backgroundColor: grayVehicleBg
  },
  selectedEventRow: highlightedEventRow,
  loadingRow: {
    justifyContent: "center"
  },
  time: {
    flex: 1.7
  },
  eventName: {
    flex: 2,
    overflow: "hidden",
    hyphens: "auto",
    wordWrap: "break-word",
    paddingRight: "1rem"
  },
  source: {
    flex: 0.7,
    overflow: "hidden",
    paddingRight: "0.76rem",
    hyphens: "auto",
    wordWrap: "break-word"
  },
  video: {
    flex: 0.7
  },
  videoLink: {
    position: "relative",
    left: "-0.935rem",
    "&:before": {
      content: `"\\00a0 "`,
      width: "0.65625rem",
      marginRight: "0.28125rem",
      display: "inline-block"
    },
    "&:hover": {
      "&:before": {
        background: `url(${playIcon}) center no-repeat`,
        backgroundSize: "0.65625rem auto"
      }
    }
  }
}));
