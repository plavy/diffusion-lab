import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  theme: 'light',
  autoRefresh: false,
  blockAutoRefresh: false,
  serverList: [],
  datasetList: [],
  downsizingList: [],
  augmentationList: [],
  modelList: [],
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
