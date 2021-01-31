import React from "react";
import { constants } from 'helpers'
import cx from "classnames";

import cssModules from 'react-css-modules'
import styles from './Button.scss'

type ButtonProps = {
  dataTut?: any
  children?: any
  fullWidth?: boolean
  autoHeight?: boolean
  transparent?: boolean
  brand?: boolean
  white?: boolean
  blue?: boolean
  gray?: boolean
  big?: boolean
  small?: boolean
  empty?: boolean
  fill?: boolean
  disabled?: boolean
  className?: string
  id?: string
  onClick?: () => void
}

const isDark = localStorage.getItem(constants.localStorage.isDark)
const Button = (props: ButtonProps) => {
  const {
    children,
    className,
    fullWidth,
    brand,
    transparent,
    blue,
    white,
    gray,
    disabled,
    big,
    small,
    empty,
    autoHeight,
    onClick,
    id = '',
    fill,
    dataTut,
  } = props

  const styleName = cx('button', {
    fill,
    fullWidth,
    brand,
    transparent,
    blue,
    white,
    gray,
    big,
    small,
    empty,
    autoHeight,
    disabled,
    "darkTheme-white": isDark && white,
    "darkTheme-gray": isDark && gray,
  })

  return (
    <button
      data-tut={dataTut}
      styleName={styleName}
      className={className}
      onClick={onClick}
      id={id}
      disabled={disabled}
      data-tip
      data-for={id}
    >
      {children}
    </button>
  )
}

export default cssModules(Button, styles, { allowMultiple: true })
