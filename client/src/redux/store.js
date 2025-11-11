import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user";
import loadingReducer from "./loading";
import messagesReducer from "./messages";

const store = configureStore({
  reducer: {
    user: userReducer,
    loading: loadingReducer,
    messages: messagesReducer,
  },
});

export default store;
