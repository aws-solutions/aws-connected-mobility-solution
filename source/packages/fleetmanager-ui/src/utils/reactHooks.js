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
import { useRef, useCallback, useEffect, useState } from "react";
import throttle from "lodash.throttle";
import { useDispatch } from "react-redux";
import { setMapboxToken, setValidMapboxToken } from "actions/mapActions";
import { getMapboxToken } from "apis/config";
import { verifyToken } from "apis/mapbox";

export const useAnimationFrameInterval = (callback, delay) => {
  const requestRef = useRef();
  const isMounted = useIsMounted();
  const throttledCallback = useCallback(
    throttle(() => isMounted.current && callback(), delay),
    [delay]
  );

  const animateFn = useCallback(() => {
    if (delay !== null) {
      throttledCallback();
      requestRef.current = requestAnimationFrame(animateFn);
    }
  }, [throttledCallback, delay]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateFn);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animateFn]);
};

export const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);
  return isMounted;
};

export const useLoadMapboxToken = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getMapboxToken();
        dispatch(setMapboxToken(token));
        const valid = await verifyToken(token);
        dispatch(setValidMapboxToken(valid));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  return loading;
};
