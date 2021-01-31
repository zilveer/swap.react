import * as bitcoin from 'bitcoinjs-lib'
import * as bip32 from 'bip32'
import { hdkey } from 'ethereumjs-wallet'
import * as bip39 from 'bip39'



const convertMnemonicToValid = (mnemonic) => {
  return mnemonic
    .trim()
    .toLowerCase()
    .split(` `)
    .filter((word) => word)
    .join(` `)
}


const getBtcWallet = (network, mnemonic, walletNumber = 0, path) => {
  mnemonic = convertMnemonicToValid(mnemonic)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, network)
  const node = root.derivePath((path) ? path : `m/44'/0'/0'/0/${walletNumber}`)

  const account = bitcoin.payments.p2pkh({
    pubkey: node.publicKey,
    network: network,
  })

  return {
    mnemonic,
    address: account.address,
    //@ts-ignore
    publicKey: node.publicKey.toString('Hex'),
    WIF: node.toWIF(),
    node,
    account,
  }
}

const getEthWallet = (network, mnemonic, walletNumber = 0, path) => {
  mnemonic = convertMnemonicToValid(mnemonic)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const hdwallet = hdkey.fromMasterSeed(seed)
  const wallet = hdwallet.derivePath((path) || `m/44'/60'/0'/0/${walletNumber}`).getWallet()

  return {
    mnemonic,
    //@ts-ignore
    address: `0x${wallet.getAddress().toString('Hex')}`,
    //@ts-ignore
    publicKey: `0x${wallet.pubKey.toString('Hex')}`,
    //@ts-ignore
    privateKey: `0x${wallet.privKey.toString('Hex')}`,
    wallet,
  }
}

const getGhostWallet = (network, mnemonic, walletNumber = 0, path) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, network)
  const node = root.derivePath((path) || `m/44'/0'/0'/0/${walletNumber}`)

  const account = bitcoin.payments.p2pkh({
    pubkey: node.publicKey,
    network: network,
  })

  return {
    mnemonic,
    address: account.address,
    //@ts-ignore
    publicKey: node.publicKey.toString('Hex'),
    WIF: node.toWIF(),
    node,
    account,
  }
}

const getNextWallet = (network, mnemonic, walletNumber = 0, path) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, network)
  const node = root.derivePath((path) || `m/44'/707'/0'/0/${walletNumber}`)

  const account = bitcoin.payments.p2pkh({
    pubkey: node.publicKey,
    network: network,
  })

  return {
    mnemonic,
    address: account.address,
    //@ts-ignore
    publicKey: node.publicKey.toString('Hex'),
    WIF: node.toWIF(),
    node,
    account,
  }
}

const mnemonicIsValid = (mnemonic:string):boolean => bip39.validateMnemonic(convertMnemonicToValid(mnemonic))


const forCoin = {
  BTC:    getBtcWallet,
  ETH:    getEthWallet,
  GHOST:  getGhostWallet,
  NEXT:   getNextWallet,
}

export {
  mnemonicIsValid,
  convertMnemonicToValid,
  getBtcWallet,
  getEthWallet,
  getGhostWallet,
  getNextWallet,
  forCoin,
}