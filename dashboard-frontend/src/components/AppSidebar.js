import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CNavGroup,
  CNavItem,
  CNavTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const [datasetList, setDatasetList] = useState("");
  useEffect(() => {
    fetch("http://localhost:8000/datasets")
      .then((res) => res.json())
      .then((data) => setDatasetList(data));
  }, []);
  let navigation = [
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/dashboard',
      badge: {
        color: 'info',
        text: 'NEW',
      },
    },
    {
      component: CNavTitle,
      name: 'Datasets',
    },
  ]

  if (datasetList) {
    datasetList.forEach(function (item) {
      console.log(item)
      navigation.push(
        {
          component: CNavItem,
          name: item,
          to: '/dataset'
        }
      )
    }
    )

  }
  // {
  //   component: CNavItem,
  //   name: 'maps',
  //   to: '/dataset',
  // },



  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <CIcon customClassName="sidebar-brand-full" icon={logo} height={32} />
          <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
