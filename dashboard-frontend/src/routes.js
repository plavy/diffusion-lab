import { element } from 'prop-types'
import React from 'react'

const Home = React.lazy(() => import('./views/home/Home'))
const DatasetDashboard = React.lazy(() => import('./views/datasets/DatasetDashboard'))
const ServerDashboard = React.lazy(() => import('./views/servers/ServerDashboard'))
const Settings = React.lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', name: 'Home', element: Home },
  { path: '/settings', name: 'Settings', element: Settings },
  { path: '/datasets/:id', name: 'Dataset', element: DatasetDashboard },
  { path: '/servers/:id', name: 'Server', element: ServerDashboard },
]

export default routes
