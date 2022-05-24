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
import { connect } from "react-redux";
import { useIsMounted } from "utils/reactHooks";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import VirtualOtaListScrollbar from "components/global/VirtualOtaListScrollbar";
import OtaJobCard from "./OtaJobCard";
import { toggleJobIdOpen } from "actions/viewActions";
import {
  otaClosedCardHeightPx,
  calcOtaOpenCardHeightPx
} from "assets/dimensions";

const OtaJobsList = ({
  dataCacheRef,
  otaJobsList,
  jobIdOpen,
  toggleOpenByJobId,
  otaJobsPaginationHandler
}) => {
  const { jobs, nextToken } = otaJobsList;
  const isMounted = useIsMounted();
  const [hasScrollbar, setHasScrollbar] = React.useState(false);
  const listRef = React.useRef();
  const outerRef = React.useRef();
  const [loadingNextPage, setLoadingNextPage] = React.useState(false);
  const hasNextPage = !!nextToken;
  const listScrollOffset = dataCacheRef.current.scrollOffset || 0;

  const updateDataCache = (newValuesObj = {}) => {
    dataCacheRef.current = {
      ...dataCacheRef.current,
      ...newValuesObj
    };
  };

  React.useEffect(() => {
    if (jobs.length && listRef.current) {
      const { cachedOpenJobId } = dataCacheRef.current;
      if (cachedOpenJobId) resetListIndex(0);
    }
  }, [jobs.length, dataCacheRef]);

  const loadNextPage = () => {
    return new Promise(resolve => {
      setLoadingNextPage(true);
      otaJobsPaginationHandler(nextToken).finally(() => {
        if (isMounted.current) {
          setLoadingNextPage(false);
          resolve();
        }
      });
    });
  };

  const itemCount = hasNextPage ? jobs.length + 1 : jobs.length;
  const loadMoreItems = loadingNextPage ? () => {} : loadNextPage;
  const isItemLoaded = index => !hasNextPage || index < jobs.length;

  const resetListIndex = index =>
    listRef.current && listRef.current._listRef.resetAfterIndex(index);

  const onJobToggle = ({ jobId, index }) => {
    const { cachedOpenJobId, cachedOpenIndex } = dataCacheRef.current;
    const lowestIndex = Math.min(cachedOpenIndex || 0, index);
    const closeAction = jobId === jobIdOpen;

    if (closeAction) {
      updateDataCache({ cachedOpenIndex: null, cachedOpenJobId: null });
      const sameIndex = cachedOpenJobId === jobId && cachedOpenIndex === index;
      resetListIndex(sameIndex ? cachedOpenIndex : lowestIndex);
    } else {
      updateDataCache({ cachedOpenJobId: jobId, cachedOpenIndex: index });
      const allClosed = !cachedOpenJobId && !cachedOpenIndex;
      resetListIndex(allClosed ? index : lowestIndex);
    }

    toggleOpenByJobId(jobId);
  };

  const scrollHandler = ({ scrollOffset }) => {
    if (listRef.current) updateDataCache({ scrollOffset });
  };

  const hasScrollbarHandler = () => {
    if (listRef.current) {
      const list = listRef.current._listRef._outerRef;
      const containerHeight = list.parentElement.offsetHeight;
      const listHeight = list.firstChild.offsetHeight;
      setHasScrollbar(listHeight > containerHeight);
    }
  };

  const getItemSize = index => {
    const jobData = jobs[index] || {};
    const vehiclesCount = (jobData.vehicles || []).length;
    const isOpen = jobData.jobId === jobIdOpen;
    return isOpen
      ? calcOtaOpenCardHeightPx(vehiclesCount)
      : otaClosedCardHeightPx;
  };

  const JobCard = ({ index, style }) => {
    const notLoaded = !isItemLoaded(index);
    const data = jobs[index];

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
      <OtaJobCard
        data={data}
        index={index}
        style={style}
        jobIdOpen={jobIdOpen}
        onJobToggle={onJobToggle}
        dataCacheRef={dataCacheRef}
        hasScrollbar={hasScrollbar}
        resetListIndex={resetListIndex}
        jobTitle={`Job #${jobs.length - index}`}
      />
    );
  };

  return (
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
            <VariableSizeList
              ref={ref}
              onScroll={scrollHandler}
              initialScrollOffset={listScrollOffset}
              height={height}
              itemCount={itemCount}
              onItemsRendered={props => {
                onItemsRendered(props);
                hasScrollbarHandler();
              }}
              itemSize={getItemSize}
              width={width}
              outerElementType={VirtualOtaListScrollbar}
              outerRef={outerRef}
            >
              {JobCard}
            </VariableSizeList>
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  );
};

const mapStateToProps = state => {
  const {
    data: { otaJobsList },
    views: { jobIdOpen }
  } = state;
  return { otaJobsList, jobIdOpen };
};

const mapDispatchToProps = dispatch => ({
  toggleOpenByJobId: jobId => dispatch(toggleJobIdOpen(jobId))
});

OtaJobsList.propTypes = {
  dataCacheRef: PropTypes.object.isRequired,
  otaJobsPaginationHandler: PropTypes.func.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps)(OtaJobsList);
