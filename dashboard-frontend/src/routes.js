import React from 'react'

const DatasetDashboard = React.lazy(() => import('./views/datasets/DatasetDashboard'))
const ServerDashboard = React.lazy(() => import('./views/servers/ServerDashboard'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/datasets/:id', name: 'Dataset', element: DatasetDashboard },
  { path: '/servers/:id', name: 'Server', element: ServerDashboard },
]

export default routes
