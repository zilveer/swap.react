import constants from './constants'
import StorageFactory from './StorageFactory'
import Collection from './Collection'
import Swap, { Flow } from '../swap.swap'
import SwapAuth from '../swap.auth'
import SwapInterface from './SwapInterface'
import ServiceInterface from './ServiceInterface'
import SwapRoom from 'swap.room'
import SwapOrders from 'swap.orders'


interface SwapAppServices {
  auth?: SwapAuth,
  room?: SwapRoom,
  orders?: SwapOrders,
}

interface SwapAppOptions {
  network?: string,
  env: any,
  services: SwapAppServices | Array<ServiceInterface>,
  swaps: Array<SwapInterface>,
  flows: Array<Flow>,
  whitelistBtc?: Array<string>,
}

class SwapApp {
  // White list BTC. Dont wait confirm
  private whitelistBtc: Array<string> = [
    'mzgKwRsfYLgApStDLwcN9Y6ce9qYPnTJNx', // @eneeseene testnet
    'mst6jZKU973gB6Jhei4WQFg381zb86UgBQ', // @eneeseene testnet btc address
    '17Hf3chwyWeNokLfuBcxEtpRYaYiU5RWBt', // swap.bot mainnet btc address
  ]
  private attachedSwaps: Collection = new Collection()

  options: any = {}
  inited: boolean = false
  network: any
  env: any
  services: SwapAppServices = {}
  swaps: Array<SwapInterface>
  flows: Array<Flow>
  

  static _swapAppInstance = null

  /**
   *
   * @param {object}  options
   * @param {string}  options.network
   * @param {object}  options.env
   * @param {array}   options.services
   * @param {array}   options.swaps
   * @param {array}   options.flows
   */
  constructor(options: SwapAppOptions) {
    this.options = options
    this.network = options.network || constants.NETWORKS.TESTNET
    this.env = {}
    this.services = {}

    this.swaps = new Array()
    this.flows = new Array()

    this._addEnv(options.env || {})
    this._addServices(options.services || {})

    this._addSwaps(options.swaps || [])
    this._addFlows(options.flows || [])

    if (options.whitelistBtc) this.whitelistBtc = options.whitelistBtc

    this.inited = true
  }

  static onInit(cb) {
    const waitInit = () => {
      if (SwapApp._swapAppInstance && SwapApp._swapAppInstance.isInited()) {
        cb()
      } else {
        setTimeout(waitInit, 100)
      }
    }
    waitInit()
  }

  isInited() {
    return this.inited
  }

  static init(options: SwapAppOptions, makeShared: boolean = false) {
    if (makeShared) {
      SwapApp._swapAppInstance = new SwapApp(options)
      return SwapApp._swapAppInstance
    }
    return new SwapApp(options)
  }

  setWeb3Provider(web3provider) {
    if (!SwapApp._swapAppInstance) {
      throw new Error(`Shared instance not initialized. Use SwapApp.setup() first.`)
    }
    SwapApp._swapAppInstance.env.web3 = web3provider
    SwapApp._swapAppInstance.initFlows()
  }

  initFlows() {
    this._addSwaps(this.options.swaps || [])
    this._addFlows(this.options.flows || [])
  }

  static setup(options, forceFreshSetup = false) {
    if (SwapApp._swapAppInstance && !forceFreshSetup) {
      throw new Error(`Shared instance already initialized. Use SwapApp.shared() to access it.`)
    }
    SwapApp._swapAppInstance = new SwapApp(options)
  }

  static shared() {
    SwapApp.required(
      SwapApp._swapAppInstance,
      `Shared instance not initialized. Call SwapApp.setup(config) first.`
    )
    return SwapApp._swapAppInstance
  }

  attachSwap(swap: Swap) {
    if (!this.attachedSwaps.isExistByKey(swap.id)) {
      this.attachedSwaps.append(swap, swap.id)
    }
  }

  getActiveSwaps(): Swap[] {
    return this.attachedSwaps.filter((swap: Swap) => {
      return (swap === null)
        ? false
        : !swap.isFinished()
    })
  }

  getSwapsByAddress(coin: string, address: string): Swap[] {
    return this.attachedSwaps.filter((swap: Swap) => {
      if (swap
        && swap.participant
        && swap.participant[coin.toLowerCase()]
        && swap.participant[coin.toLowerCase()].address
        && swap.participant[coin.toLowerCase()].address.toLowerCase() === address.toLowerCase()
        && !swap.isFinished()
      ) return true
      return false
    })
  }

  // Check address is whitelisted
  isWhitelistBtc(address: string) {
    return this.whitelistBtc.indexOf(address) !== -1
  }
  // Configure -------------------------------------------------------- /

  _addEnv(env) {
    Object.keys(env).forEach((name) => {
      if (Object.values(constants.ENV).indexOf(name) < 0) {
        throw new Error(`SwapApp.addEnv(): Only ${Object.values(constants.ENV)} available`)
      }
    })

    env.storage = new StorageFactory(env.storage)

    if (!env.getWeb3) {
      env.getWeb3 = () => {
        return this.env.web3
      }
    }
    this.env = env
  }

  _addService(service) {
    if (!service._serviceName) {
      throw new Error('SwapApp service should contain "_serviceName" property')
    }

    if (!Object.values(constants.SERVICES).includes(service._serviceName)) {
      throw new Error(
        `SwapApp service should contain "_serviceName" property should be one of ${Object.values(
          constants.SERVICES
        )}, got "${service._serviceName}"`
      )
    }

    service._attachSwapApp(this)
    this.services[service._serviceName] = service
  }

  _addServices(services) {
    // add service to app by _serviceName
    services.forEach((service) => this._addService(service))
    // spy expects
    Object.keys(this.services).forEach((serviceName) =>
      this.services[serviceName]._waitRelationsResolve()
    )
    // init services
    Object.keys(this.services).forEach((serviceName) =>
      this.services[serviceName]._tryInitService()
    )
  }

  _addSwap(swap) {
    if (!swap._swapName) {
      throw new Error('SwapApp swap should contain "_swapName" property')
    }

    if (!Object.values(constants.COINS).includes(swap._swapName.toUpperCase())) {
      throw new Error(
        `SwapApp swap should contain "_swapName" property should be one of ${Object.values(
          constants.COINS
        )}, got "${swap._swapName.toUpperCase()}"`
      )
    }

    this.swaps[swap._swapName] = swap

    if (typeof swap._initSwap === 'function') {
      swap._initSwap(this)
    }
  }

  _addSwaps(swaps) {
    swaps.forEach((swap) => {
      this._addSwap(swap)
    })
  }

  _addFlow(Flow) {
    const flowName = Flow.getName()

    if (
      !Object.values(constants.COINS).includes(Flow.getFromName()) ||
      !Object.values(constants.COINS).includes(Flow.getToName())
    ) {
      throw new Error(
        `SwapApp flow "_flowName" property should contain only: ${Object.values(
          constants.COINS
        )}. Got: "${flowName.toUpperCase()}"`
      )
    }

    this.flows[flowName] = Flow
  }

  _addFlows(flows) {
    flows.forEach((flow) => {
      this._addFlow(flow)
    })
  }

  // Public methods --------------------------------------------------- /

  isMainNet() {
    return this.network.toLowerCase() === constants.NETWORKS.MAINNET
  }

  isTestNet() {
    return this.network.toLowerCase() === constants.NETWORKS.TESTNET
  }

  isSwapApp() {
    return true
  }

  getMyEthAddress() {
    return this.env.metamask && this.env.metamask.isEnabled() && this.env.metamask.isConnected()
      ? this.env.metamask.getAddress()
      : this.services.auth.accounts.eth.address
  }

  getParticipantEthAddress(swap) {
    const { participant, participantMetamaskAddress } = swap
    return participantMetamaskAddress ? participantMetamaskAddress : participant.eth.address
  }

  static is(app) {
    return app && app.isSwapApp && app.isSwapApp() && app instanceof SwapApp
  }

  static required(app, errorMessage = ``) {
    if (!SwapApp.is(app)) {
      throw new Error(`SwapApp required, got: ${app}. ${errorMessage}`)
    }
  }
}

export default SwapApp
