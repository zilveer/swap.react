import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import ClickOutside from 'react-click-outside'
import Link from 'local_modules/sw-valuelink'
import { constants } from 'helpers'

import cssModules from 'react-css-modules'

import FieldLabel from 'components/forms/FieldLabel/FieldLabel'
import Tooltip from 'components/ui/Tooltip/Tooltip'
import Input from 'components/forms/Input/Input'

import styles from './DropDown.scss'

import closeBtn from './images/close.svg'


const isDark = localStorage.getItem(constants.localStorage.isDark)


@cssModules(styles, { allowMultiple: true })
export default class DropDown extends Component<any, any> {
  static propTypes = {
    initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedValue: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.any).isRequired,
    selectedItemRender: PropTypes.func,
    itemRender: PropTypes.func,
    onSelect: PropTypes.func,
    notIteractable: PropTypes.bool,
  }

  constructor({ initialValue, selectedValue }) {
    //@ts-ignore
    super()
    this.state = {
      isToggleActive: false,
      selectedValue: initialValue || selectedValue || 0,
      inputValue: '',
      infoAboutCurrency: '',
      error: false,
    }
  }

  toggleClose = () => {
    this.setState({
      isToggleActive: false,
    })
  }

  toggleOpen = () => {
    const { isToggleActive } = this.state

    if (isToggleActive) {
      return
    }

    this.setState({
      isToggleActive: true,
    })
  }

  componentDidUpdate(prevProps) {
    const { isToggleActive } = this.props
  }

  toggle = () => {
    if (this.state.isToggleActive) {
      this.toggleClose()
    } else {
      this.toggleOpen()
    }
  }

  handleOptionClick = (item) => {
    const { selectedValue, onSelect } = this.props

    // if there is no passed `selectedValue` then change it
    if (typeof selectedValue === 'undefined') {
      this.setState({ selectedValue: item.value })
    }

    // for example we'd like to change `selectedValue` manually
    if (typeof onSelect === 'function' && !item.disabled) {
      onSelect(item)
      this.setState({ selectedValue: item.value })
    }
    this.toggleClose()
  }

  renderItem = (item) => {
    const { itemRender } = this.props

    if (typeof itemRender === 'function') {
      return itemRender(item)
    }
    return <span>item.title</span>
  }

  renderSelectedItem = () => {
    const { items, selectedItemRender } = this.props

    const selectedValue = this.props.selectedValue || this.state.selectedValue
    const selectedItem = items.find(({ value }) => value === selectedValue)

    if (selectedItem !== undefined) {
      if (typeof selectedItemRender !== 'function') {
        const textToShow = selectedItem.title || selectedItem.fullTitle
        return (
          <div
            styleName={`selectedItemInner ${selectedItem.disabled ? 'disabled' : ''} ${
              selectedItem.reduceSelectedItemText ? 'reducedLength' : ''
            }`}
            //title={selectedItem.reduceSelectedItemText ? textToShow : ''}
          >
            {textToShow}
          </div>
        )
      } else {
        return selectedItemRender(selectedItem)
      }
    }
  }

  render() {
    const {
      className,
      items,
      selectedValue,
      name,
      placeholder,
      label,
      tooltip,
      id,
      notIteractable,
      disableSearch,
      dontScroll, // Show all items, for small lists
      arrowSide,
    } = this.props

    const { inputValue, infoAboutCurrency, isToggleActive } = this.state

    const dropDownStyleName = cx('dropDown', { active: isToggleActive })
    const linkedValue = Link.all(this, 'inputValue')

    let itemsFiltered = items
    if (inputValue) {
      itemsFiltered = items
        .filter((item) => item.name.includes(inputValue.toUpperCase()))
        .filter((item) => item.value !== selectedValue)
    }

    const dropDownListStyles = ['select']
    if (dontScroll) dropDownListStyles.push('dontscroll')

    return (
      <ClickOutside
        onClickOutside={
          isToggleActive
            ? () => {
                if (!disableSearch) {
                  //@ts-ignore
                  this.refs.searchInput.handleBlur()
                  linkedValue.inputValue.set('')
                }
                this.toggle()
              }
            : () => {}
        }
      >
        <div styleName={`${dropDownStyleName} ${isDark ? 'dark' : ''}`} className={className}>
          <div
            styleName={`
              selectedItem
              ${notIteractable ? ' selectedItem_disableIteract' : ''}
              ${arrowSide === 'left' ? 'left' : ''}
            `}
            onClick={notIteractable ? () => null : this.toggle}
          >
            {!notIteractable && <div styleName={`arrow ${arrowSide === 'left' ? 'left' : ''}`} />}
            {isToggleActive && !disableSearch ? (
              <Input
                styleName="searchInput"
                placeholder={placeholder}
                focusOnInit
                valueLink={linkedValue.inputValue}
                ref="searchInput"
              />
            ) : (
              this.renderSelectedItem()
            )}
          </div>
          {isToggleActive && (
            <div styleName={dropDownListStyles.join(` `)}>
              {name ? <span styleName="listName">{name}</span> : ''}
              {itemsFiltered.map((item) => {
                let inneedData = null
                if (infoAboutCurrency) {
                  inneedData = infoAboutCurrency.find((el) => el.name === item.name)
                }
                if (item.hidden) {
                  return
                }
                return (
                  <div
                    key={item.value}
                    styleName="option"
                    onClick={() => {
                      linkedValue.inputValue.set('')
                      this.handleOptionClick(item)
                    }}
                  >
                    <span styleName="shortTitle">{this.renderItem(item)}</span>
                    <span styleName="fullTitle">{item.fullTitle}</span>
                    {inneedData && (
                      <span styleName={`range ${+inneedData.change > 0 ? 'rangeUp' : 'rangeDown'}`}>
                        {inneedData.change} %
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <button styleName="closeBtn" onClick={this.toggle}>
            <img src={closeBtn} alt="" />
          </button>
          <div styleName="dropDownLabel">
            <FieldLabel inRow inDropDown>
              <strong>{label}</strong>
              &nbsp;
              <div styleName="smallTooltip">
                <Tooltip id={id}>{tooltip}</Tooltip>
              </div>
            </FieldLabel>
          </div>
        </div>
      </ClickOutside>
    )
  }
}
