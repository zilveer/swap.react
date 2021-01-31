import React, { Component } from 'react'
import actions from 'redux/actions/index'
import PropTypes from 'prop-types'

import { Line } from 'rc-progress'

interface ProgressBarProps {
  step?: number
  endTime?: number
  maxValue?: number
  handleClick?(): void
}

interface ProgressBarState {
  step?: number
  endTime?: number
  maxValue?: number
  progressNow?: number
}

export default class ProgressBar extends Component<ProgressBarProps, ProgressBarState> {
  static defaultProps = {
    maxValue: 100,
    endTime: 60000,
    step: 1000,
  }

  timer = null

  constructor(props: ProgressBarProps) {
    super(props)
    const { maxValue, endTime, step } = props

    this.state = {
      step,
      endTime,
      maxValue,
      progressNow: 0,
    }
  }

  componentDidMount() {
    this.step()
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  step = () => {
    const { progressNow, maxValue, endTime, step } = this.state
    const { handleClick } = this.props

    const progress = maxValue / (endTime / step)
    const newValue = progressNow + progress

    if (progressNow >= maxValue) {
      actions.pubsubRoom.allPeersLoaded()
      handleClick()
    } else {
      this.timer = setTimeout(this.step, step)
      this.setState(() => ({ progressNow: newValue }))
    }
  }

  render() {
    const { progressNow } = this.state

    return <Line strokeColor="#2181F7" percent={progressNow} strokeWidth={1} />
  }
}
