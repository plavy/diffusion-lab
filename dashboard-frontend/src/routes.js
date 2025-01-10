import { element } from 'prop-types'
import React from 'react'

const Overview = React.lazy(() => import('./views/overview/Overview'))
const DatasetDashboard = React.lazy(() => import('./views/datasets/DatasetDashboard'))
const ServerDashboard = React.lazy(() => import('./views/servers/ServerDashboard'))
const Settings = React.lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', name: 'Overview', element: Overview },
  { path: '/settings', name: 'Settings', element: Settings },
  { path: '/datasets/:id', name: 'Dataset', element: DatasetDashboard },
  { path: '/servers/:id', name: 'Server', element: ServerDashboard },
]

export default routes
