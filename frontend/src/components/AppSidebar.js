import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import axios from "axios";

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

import { updateDatasetList, updateServerList } from "../utils";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const autoRefresh = useSelector((state) => state.autoRefresh);

  const datasetList = useSelector((state) => state.datasetList);
  const serverList = useSelector((state) => state.serverList);
  useEffect(() => {
    updateDatasetList(dispatch);
    updateServerList(dispatch);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        updateDatasetList(dispatch);
        updateServerList(dispatch);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh])

  let navigation = [
    {
      component: CNavItem,
      name: 'Overview',
      to: '/',
    },
    {
      component: CNavTitle,
      name: 'Datasets',
    },
  ]

  if (datasetList) {
    datasetList.forEach(function (item) {
      navigation.push(
        {
          component: CNavItem,
          name: item.name,
          to: '/datasets/' + item.id
        }
      )
    })
  }

  navigation.push(
    {
      component: CNavTitle,
      name: 'SSH servers',
    },
  )
  if (serverList) {
    serverList.forEach(function (item) {
      navigation.push(
        {
          component: CNavItem,
          name: item.name,
          to: '/servers/' + item.id
        }
      )
    })
  }


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
        <span>&copy; 2025 Tin Plavec</span>
        {/* <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        /> */}
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
