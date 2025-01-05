import React, { useEffect, useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilAccountLogout,
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilUser,
  cilSettings
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { getLocal, getNextcloudSettings, storeLocal } from '../utils'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
    const are = getLocal("auto-refresh-enabled");
    if (are) {
      setAutoRefreshEnabled(true);
    }
  }, [])

  const handleAutoRefreshChange = (e) => {
    setAutoRefreshEnabled(e.target.checked);
    storeLocal("auto-refresh-enabled", e.target.checked);
    window.location.reload();
  }

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex">
          <CNavItem>
            <CNavLink to="/dashboard" as={NavLink}>
              Dashboard
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink to="/settings" as={NavLink}>Settings</CNavLink>
          </CNavItem>
        </CHeaderNav>
        <CHeaderNav>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle className="pe-0" caret={false}>
              {(getNextcloudSettings("nextcloud-username") && getNextcloudSettings("nextcloud-domain")) ?
                (getNextcloudSettings("nextcloud-username") + '@' + getNextcloudSettings("nextcloud-domain")) : ""
              }
            </CDropdownToggle>
            <CDropdownMenu className="pt-0">
              <CDropdownItem href="/logout">
                <CIcon icon={cilAccountLogout} className="me-2" />
                Log out
              </CDropdownItem>
              <CDropdownItem href="#">
                <CIcon icon={cilUser} className="me-2" />
                Profile
              </CDropdownItem>
              <CDropdownItem>
                <CFormCheck label="Auto-refresh" checked={autoRefreshEnabled} onChange={handleAutoRefreshChange}></CFormCheck>
              </CDropdownItem>
              <CDropdownItem href="#">
                <CIcon icon={cilSettings} className="me-2" />
                Settings
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
