import React, { Component, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'
import { useDropzone } from 'react-dropzone'

export const AppSidebarNav = ({ items }) => {
  const navLink = (name, icon, badge, indent = false) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>
          )}
        {name && name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, ...rest } = item
    const Component = component
    return (
      <Component as="div" key={index} {...getRootProps()}>
        {rest.to || rest.href ? (
          <CNavLink {...(rest.to && { as: NavLink })} {...rest}>
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }
  const onDrop = useCallback((acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      console.log("File is here!")
      formData.append("files", file);
    });

    // axios
    //   .post("http://localhost:5000/upload", formData, {
    //     headers: { "Content-Type": "multipart/form-data" },
    //   })
    //   .then((response) => console.log(response.data))
    //   .catch((error) => console.error(error));
  }, []);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const navGroup = (item, index) => {
    const { component, name, icon, items, to, ...rest } = item
    const Component = component
    return (
      <Component compact as="div" key={index} toggler={navLink(name, icon)} {...rest}>
        {item.items?.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index, true),
        )}
      </Component>
    )
  }




  return (
    <CSidebarNav as={SimpleBar}>
      {items &&
        items.map((item, index) => (item.items ? navGroup(item, index) : navItem(item, index)))}
      {/* <Component as="div" {...getRootProps()}>
        Upload new dataset
      </Component> */}
    </CSidebarNav>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}
