import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

import routes from './routes'
import { AppSidebar, AppHeader } from './components/index'
import { isAuth } from './utils'

// Containers
const Login = React.lazy(() => import('./views/login/Login'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path='/login' element={
            isAuth() ?
              <Navigate to="/" replace />
              :
              <div className="body vh-100 w-100 d-flex flex-column justify-content-center align-items-center p-3" style={{ height: 0 }}>
                <Login />
              </div>
          } />
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={
                    isAuth() ?
                      <div>
                        <AppSidebar />
                        <div className="wrapper d-flex flex-column vh-100">
                          <AppHeader />
                          <div className="body flex-grow-1 w-100 d-flex flex-column justify-content-center align-items-center p-3 overflow-auto">
                            <route.element />
                          </div>
                        </div>
                      </div>
                      :
                      <Navigate to="/login" replace />
                  }
                />
              )
            )
          })}
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
