import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user";
import loadingReducer from "./loading";
import messagesReducer from "./messages";
import historyReducer from "./history";

const store = configureStore({
  reducer: {
    user: userReducer,
    loading: loadingReducer,
    messages: messagesReducer,
    history: historyReducer,
  },
});

export default store;
