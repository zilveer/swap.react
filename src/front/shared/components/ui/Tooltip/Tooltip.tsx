import React, { Fragment } from 'react'
import CSSModules from 'react-css-modules'
import { FormattedMessage } from 'react-intl'

import ThemeTooltip from './ThemeTooltip'
import styles from './Tooltip.scss'


const Tooltip = ({ mark = true, children, id, dontHideMobile = null, place = null }) => (
  <Fragment>
    {
      mark && (
        <span data-tip data-for={id} styleName={`tooltip${dontHideMobile ? ' tooltip_truesight' : ''}`}>
          <FormattedMessage id="Tooltip11" defaultMessage="?" />
        </span>
      )
    }
    <ThemeTooltip id={id} effect="solid" multiline {...{ place }} styleName="r-tooltip">
      {children}
    </ThemeTooltip>
  </Fragment>
)

export default CSSModules(Tooltip, styles, { allowMultiple: true })
