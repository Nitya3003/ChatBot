import React, { useLayoutEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { setLoading } from "./redux/loading";
import instance from "./config/instance";
import { emptyUser, insertUser } from "./redux/user";
import { emptyAllRes } from "./redux/messages";

const ProtectedRoute = ({ offline, authed }) => {
  const [component, setComponent] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(setLoading(true));
    
    // For unauthenticated routes (like homepage), show immediately if offline
    if (offline && !authed) {
      setComponent(<Outlet />);
      dispatch(setLoading(false));
      return;
    }

    const getResponse = async () => {
      try {
        // use a relative URL so the axios instance `baseURL` and `withCredentials`
        // settings are applied consistently and we avoid accidental origin mismatches
        const res = await instance.post('/api/user/checkLogged', {});

        if (res?.data?.data) {
          dispatch(insertUser(res?.data?.data));
        }

        if (res?.data?.status === 208) {
          if (!authed) navigate("/chat");
          else setComponent(<Outlet />);
        } else {
          // If no status 208, user is not authenticated
          if (!authed) setComponent(<Outlet />);
          else if (authed) navigate("/login");
        }
      } catch (err) {
        console.log(err);

        // **FIXED: Changed status code from 405 to 401**
        if (err?.response?.status === 401 || err?.response?.status === 404 || !err?.response) {
          dispatch(emptyUser());
          dispatch(emptyAllRes());

          if (authed) navigate("/login");
          else setComponent(<Outlet />);
        } else if (err?.code === "ERR_NETWORK") {
          // For network errors, allow unauthenticated routes to show
          if (!authed) setComponent(<Outlet />);
          else dispatch(setLoading(false));
        } else {
          navigate("/something-went-wrong");
        }
      } finally {
        // **FIXED: Ensure loading is always set to false after check**
        dispatch(setLoading(false));
      }
    };

    if (!offline) {
      getResponse();
    } else {
      // **FIXED: Also set loading to false in offline mode and show component for unauthed routes**
      dispatch(setLoading(false));
      if (!authed) setComponent(<Outlet />);
    }
  }, [location]);

  return component;
};

export default ProtectedRoute;