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

    const getResponse = async () => {
      try {
        const res = await instance.post(
          `${import.meta.env.VITE_SERVER_URL}/api/user/checkLogged`,
          {},
          { withCredentials: true }
        );

        if (res?.data?.data) {
          dispatch(insertUser(res?.data?.data));
        }

        if (res?.data?.status === 208) {
          if (!authed) navigate("/");
          else setComponent(<Outlet />);
        }
      } catch (err) {
        console.log(err);

        // **FIXED: Changed status code from 405 to 401**
        if (err?.response?.status === 401) {
          dispatch(emptyUser());
          dispatch(emptyAllRes());

          if (authed) navigate("/login");
          else setComponent(<Outlet />);
        } else if (err?.code !== "ERR_NETWORK") {
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
      // **FIXED: Also set loading to false in offline mode**
      dispatch(setLoading(false));
    }
  }, [location]);

  return component;
};

export default ProtectedRoute;