import React, { useState, useEffect } from 'react'
import config from 'app-config'

import CSSModules from 'react-css-modules'
import styles from './CreateWallet.scss'

import { connect } from 'redaction'
import actions from 'redux/actions'

import { FormattedMessage, injectIntl, useIntl, IntlShape } from 'react-intl'
import { withRouter } from 'react-router-dom'
import { isMobile } from 'react-device-detect'
import reducers from 'redux/core/reducers'
import links from 'helpers/links'
import metamask from 'helpers/metamask'
import { localisedUrl } from 'helpers/locale'

import StepsWrapper from './Steps/StepsWrapper'
import Tooltip from 'components/ui/Tooltip/Tooltip'

import { constants, localStorage } from 'helpers'
import CloseIcon from 'components/ui/CloseIcon/CloseIcon'
import web3Icons from '../../images'

const isWidgetBuild = config && config.isWidget
const isDark = localStorage.getItem(constants.localStorage.isDark)



const CreateWallet: React.FC<any> = (props) => {
  const {
    history,
    createWallet: { currencies, secure },
    location: { pathname },
    userData,
    core: { hiddenCoinsList },
    activeFiat,
  } = props

  const { locale } = useIntl()

  const allCurrencies = props.currencies.items

  const {
    ethData,
    btcData,
    ghostData,
    nextData,
    btcMultisigSMSData,
    btcMultisigUserData,
  } = userData

  const userWallets = actions.core
    .getWallets({})
    .filter(({ currency }) => !hiddenCoinsList.includes(currency))

  const currencyBalance = [
    btcData,
    btcMultisigSMSData,
    btcMultisigUserData,
    ethData,
    ghostData,
    nextData,
  ].map(({ balance, currency, infoAboutCurrency }) => ({
    balance,
    infoAboutCurrency,
    name: currency,
  }))

  let btcBalance = 0
  let fiatBalance = 0

  const widgetCurrencies = [
    'BTC',
    'BTC (SMS-Protected)',
    'BTC (PIN-Protected)',
    'BTC (Multisig)',
    'ETH',
    'GHOST',
    'NEXT',
  ]

  if (isWidgetBuild) {
    if (window.widgetERC20Tokens && Object.keys(window.widgetERC20Tokens).length) {
      // Multi token widget build
      Object.keys(window.widgetERC20Tokens).forEach((key) => {
        widgetCurrencies.push(key.toUpperCase())
      })
    } else {
      widgetCurrencies.push(config.erc20token.toUpperCase())
    }
  }

  if (currencyBalance) {
    currencyBalance.forEach(async (item) => {
      if (
        (!isWidgetBuild || widgetCurrencies.includes(item.name)) &&
        item.infoAboutCurrency &&
        item.balance !== 0
      ) {
        btcBalance += item.balance * item.infoAboutCurrency.price_btc
        fiatBalance +=
          item.balance * (item.infoAboutCurrency.price_fiat ? item.infoAboutCurrency.price_fiat : 1)
      }
    })
  }

  useEffect(() => {
    const forcedCurrency = pathname.split('/')[2]

    if (forcedCurrency) {
      const hiddenList = localStorage.getItem('hiddenCoinsList')

      const isExist = hiddenList.find((el) => {
        if (el.includes(':')) {
          return el.includes(forcedCurrency.toUpperCase())
        }
        return el === forcedCurrency.toUpperCase()
      })

      if (!isExist) {
        setExist(true)
      }

      if (forcedCurrency.toUpperCase() === 'SWAP') {
        // SWAP has no security options
        // just add and redirect
        const isWasOnWallet = localStorage
          .getItem('hiddenCoinsList')
          .find((cur) => cur.includes(forcedCurrency))
        actions.core.markCoinAsVisible(isWasOnWallet || forcedCurrency.toUpperCase(), true)
        handleClick()
      }
    }
  }, [pathname])

  useEffect(() => {
    const widgetCurrencies = [
      'BTC',
      'BTC (SMS-Protected)',
      'BTC (PIN-Protected)',
      'BTC (Multisig)',
      'ETH',
      'GHOST',
      'NEXT',
    ]

    if (isWidgetBuild) {
      if (window.widgetERC20Tokens && Object.keys(window.widgetERC20Tokens).length) {
        // Multi token widget build
        Object.keys(window.widgetERC20Tokens).forEach((key) => {
          widgetCurrencies.push(key.toUpperCase())
        })
      } else {
        widgetCurrencies.push(config.erc20token.toUpperCase())
      }
    }

    if (currencyBalance) {
      currencyBalance.forEach((item) => {
        if (
          (!isWidgetBuild || widgetCurrencies.includes(item.name)) &&
          item.infoAboutCurrency &&
          item.balance !== 0
        ) {
          btcBalance += item.balance * item.infoAboutCurrency.price_btc
          fiatBalance +=
            item.balance *
            (item.infoAboutCurrency.price_fiat ? item.infoAboutCurrency.price_fiat : 1)
        }
      })
    }
  }, [])

  const [step, setStep] = useState(1)
  const [error, setError] = useState('Choose something')
  const [isExist, setExist] = useState(false)

  const goHome = () => {
    history.push(localisedUrl(locale, links.home))
  }

  const handleConnectWallet = () => {
    history.push(localisedUrl(locale, links.connectWallet))
  }

  const handleClick = () => {
    setError(null)
    if (step !== 2 && !forcedCurrencyData) {
      reducers.createWallet.newWalletData({ type: 'step', data: step + 1 })
      return setStep(step + 1)
    }
    localStorage.setItem(constants.localStorage.isWalletCreate, true)
    goHome()
  }

  const handleRestoreMnemonic = () => {
    actions.modals.open(constants.modals.RestoryMnemonicWallet, { btcBalance, fiatBalance })
  }

  const validate = () => {
    setError(null)

    if (!Object.values(currencies).includes(true) && step === 1) {
      setError('Choose something')
      return
    }

    const isIgnoreSecondStep = !Object.keys(currencies).includes('BTC') // ['ETH', 'SWAP', 'EURS', 'Custom ERC20'].find(el => Object.keys(currencies).includes(el))

    if (isIgnoreSecondStep && !currencies['Custom ERC20']) {
      Object.keys(currencies).forEach((currency) => {
        if (currencies[currency]) {
          actions.core.markCoinAsVisible(currency.toUpperCase(), true)
        }
      })
      localStorage.setItem(constants.localStorage.isWalletCreate, true)
      goHome()
      return
    }

    if (!secure.length && (step === 2 || forcedCurrencyData)) {
      setError('Choose something')
      return
    }

    if (currencies['Custom ERC20']) {
      goHome()
      actions.modals.open(constants.modals.AddCustomERC20)
      return
    }

    if (step === 2 || forcedCurrencyData) {
      switch (secure) {
        case 'withoutSecure':
          Object.keys(currencies).forEach((el) => {
            if (currencies[el]) {
              const isWasOnWallet = localStorage
                .getItem('hiddenCoinsList')
                .find((cur) => cur.includes(`${el}:`))
              actions.core.markCoinAsVisible(isWasOnWallet || el.toUpperCase(), true)
            }
          })
          break
        case 'sms':
          if (currencies.BTC) {
            if (!actions.btcmultisig.checkSMSActivated()) {
              actions.modals.open(constants.modals.RegisterSMSProtected, {
                callback: () => {
                  actions.core.markCoinAsVisible('BTC (SMS-Protected)', true)
                  handleClick()
                },
              })
              return
            }
            actions.modals.open(constants.modals.Confirm, {
              title: (
                <FormattedMessage
                  id="ConfirmActivateSMS_Title"
                  defaultMessage="Добавление кошелька BTC (SMS-Protected)"
                />
              ),
              message: (
                <FormattedMessage
                  id="ConfirmActivateSMS_Message"
                  defaultMessage="У вас уже активирован этот тип кошелька. Хотите активировать другой кошелек?"
                />
              ),
              labelYes: <FormattedMessage id="ConfirmActivateSMS_Yes" defaultMessage="Да" />,
              labelNo: <FormattedMessage id="ConfirmActivateSMS_No" defaultMessage="Нет" />,
              onAccept: () => {
                actions.modals.open(constants.modals.RegisterSMSProtected, {
                  callback: () => {
                    actions.core.markCoinAsVisible('BTC (SMS-Protected)', true)
                    handleClick()
                  },
                })
              },
              onCancel: () => {
                actions.core.markCoinAsVisible('BTC (SMS-Protected)', true)
                handleClick()
              },
            })
            return
          }
          break
        case 'pin':
          if (currencies.BTC) {
            if (!actions.btcmultisig.checkPINActivated()) {
              actions.modals.open(constants.modals.RegisterPINProtected, {
                callback: () => {
                  actions.core.markCoinAsVisible('BTC (PIN-Protected)', true)
                  handleClick()
                },
              })
              return
            }
            actions.modals.open(constants.modals.Confirm, {
              title: (
                <FormattedMessage
                  id="ConfirmActivatePIN_Title"
                  defaultMessage="Добавление кошелька BTC (PIN-Protected)"
                />
              ),
              message: (
                <FormattedMessage
                  id="ConfirmActivatePIN_Message"
                  defaultMessage="У вас уже активирован этот тип кошелька. Хотите активировать другой кошелек?"
                />
              ),
              labelYes: <FormattedMessage id="ConfirmActivatePIN_Yes" defaultMessage="Да" />,
              labelNo: <FormattedMessage id="ConfirmActivatePIN_No" defaultMessage="Нет" />,
              onAccept: () => {
                actions.modals.open(constants.modals.RegisterPINProtected, {
                  callback: () => {
                    actions.core.markCoinAsVisible('BTC (PIN-Protected)', true)
                    handleClick()
                  },
                })
              },
              onCancel: () => {
                actions.core.markCoinAsVisible('BTC (PIN-Protected)', true)
                handleClick()
              },
            })
            return
          }
          break
        case 'multisignature':
          if (currencies.BTC) {
            actions.modals.open(constants.modals.MultisignJoinLink, {
              callback: () => {
                actions.core.markCoinAsVisible('BTC (Multisig)', true)
                handleClick()
              },
              showCloseButton: false,
            })
            return
          }
          break
        default:
          console.warn('unconnected secure type')
      }
    }
    handleClick()
  }

  const forcedCurrency = pathname.split('/')[2]
  let forcedCurrencyData

  if (forcedCurrency) {
    forcedCurrencyData = allCurrencies.find(({ name }) => name === forcedCurrency.toUpperCase())
    if (forcedCurrencyData) {
      currencies[forcedCurrency.toLowerCase()] = true
    }
  }

  if (isExist) {
    goHome()
  }

  useEffect(() => {
    // Link from index.html (first screen)
    const starterModalRestoreWallet = document.getElementById('starter-modal__link-restore-wallet')
    if (starterModalRestoreWallet) {
      starterModalRestoreWallet.addEventListener('click', redirectToRestoreWallet)

      return () => {
        starterModalRestoreWallet.removeEventListener('click', redirectToRestoreWallet)
      }

      function redirectToRestoreWallet() {
        document.location.href = '#/restoreWallet'
        handleRestoreMnemonic()
        document.getElementById('starter-modal').classList.add('d-none')
      }
    }
  }, [])

  const web3Type = metamask.web3connect.getInjectedType()
  const web3Icon = (web3Icons[web3Type] && web3Type !== `UNKNOWN` && web3Type !== `NONE`) ? web3Icons[web3Type] : false

  return (
    <div styleName={`wrapper ${isDark ? '--dark' : ''}`}>
      {
        //@ts-ignore
        userWallets.length && !localStorage.getItem(constants.wasOnWallet) ? (
          <>
            {/*
            //@ts-ignore */}
            <CloseIcon
              styleName="closeButton"
              onClick={() => goHome()}
              data-testid="modalCloseIcon"
            />
          </>
        ) : (
          ''
        )
      }

      <div styleName={isMobile ? 'mobileFormBody' : 'formBody'}>
        <h2>
          <FormattedMessage id="createWalletHeader1" defaultMessage="Создание кошелька" />{' '}
          {forcedCurrency && forcedCurrency.toUpperCase()}
        </h2>
        <div styleName="buttonWrapper">
          <div>
            <button onClick={handleRestoreMnemonic}>
              <FormattedMessage id="ImportKeys_RestoreMnemonic" defaultMessage="Restore from 12-word seed" />
            </button>
            &nbsp;
            <Tooltip id="ImportKeys_RestoreMnemonic_tooltip">
              <span>
                <FormattedMessage
                  id="ImportKeys_RestoreMnemonic_Tooltip"
                  defaultMessage="12-word backup phrase"
                />
                {(btcBalance > 0 || fiatBalance > 0) && (
                  <React.Fragment>
                    <br />
                    <br />
                    <div styleName="alertTooltipWrapper">
                      <FormattedMessage
                        id="ImportKeys_RestoreMnemonic_Tooltip_withBalance"
                        defaultMessage="Please, be causious!"
                      />
                    </div>
                  </React.Fragment>
                )}
              </span>
            </Tooltip>
          </div>
          {!metamask.isConnected() && (
            <div>
              <button onClick={handleConnectWallet}>
                {web3Icon && (
                  <img styleName="connectWalletIcon" src={web3Icon} />
                )}
                <FormattedMessage id="ImportKeys_ConnectWallet" defaultMessage="Connect Wallet" />
              </button>
              &nbsp;
              <Tooltip id="CreateWallet_ConnectWalletTooltip">
                <FormattedMessage
                  id="CreateWallet_ConnectWalletButton"
                  defaultMessage="Use this if you already have ethereum wallet"
                />
              </Tooltip>
            </div>
          )}
        </div>

        <StepsWrapper
          step={step}
          forcedCurrencyData={forcedCurrencyData}
          error={error}
          onClick={validate}
          setError={setError}
          btcData={btcData}
          currenciesForSecondStep={currencies}
          ethData={ethData}
        />
      </div>
    </div>
  )
}
export default connect({
  createWallet: 'createWallet',
  currencies: 'currencies',
  userData: 'user',
  core: 'core',
  activeFiat: 'user.activeFiat',
})(withRouter(CSSModules(CreateWallet, styles, { allowMultiple: true })))
