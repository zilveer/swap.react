import Libp2p from 'libp2p'
import wrtc from 'wrtc'
import WebrtcStar from 'libp2p-webrtc-star'
import Bootstrap from 'libp2p-bootstrap'
import Gossipsub from 'libp2p-gossipsub'
import KadDHT from 'libp2p-kad-dht'
import MPLEX from 'libp2p-mplex'
import SECIO from 'libp2p-secio'
import PeerId from 'peer-id'


const createP2PNode = (options) => {
  const {
    listen,
    discoveryPeers,
    peerIdJson,
  } = options

  const defaultListen = [
    //'/ip4/0.0.0.0/tcp/4002',
    '/dns4/webrtc-star-1.swaponline.io/tcp/443/wss/p2p-webrtc-star/',
    //'/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star',
    //'/dns4/secure-beyond-12878.herokuapp.com/tcp/443/wss/p2p-webrtc-star/',
    //'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/'
  ]

  const defaultDiscoveryPeers = [
    '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
    '/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
    '/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
    '/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
    '/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
    '/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
  ]

  /*
    ipfs discovery peers
    0: "/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd"
    1: "/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3"
    2: "/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM"
    3: "/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu"
    4: "/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm"
    5: "/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64"
    6: "/dns4/node0.preload.ipfs.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic"
    7: "/dns4/node1.preload.ipfs.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6"
  */

  // Build and return our libp2p node
  return new Promise(async (resolve, reject) => {
    // Generate peerId
    let peerId = null
    if (peerIdJson) {
      try {
        peerId = await PeerId.createFromJSON(peerIdJson)
      } catch (e) {}
    }

    if (!peerId) {
      peerId = await PeerId.create()
    }

    console.log('Peer id:', peerId._idB58String)

    const p2pNode = new Libp2p({
      peerId,
      addresses: {
        listen: (listen || defaultListen),
      },
      modules: {
        transport: [WebrtcStar],
        streamMuxer: [MPLEX],
        connEncryption: [SECIO],
        // @ts-ignore
        peerDiscovery: [Bootstrap],
        dht: KadDHT,
        pubsub: Gossipsub
      },
      config: {
        transport: {
          [WebrtcStar.prototype[Symbol.toStringTag]]: {
            wrtc
          }
        },
        peerDiscovery: {
          autoDial: true,
          // @ts-ignore
          webRTCStar: {
            enabled: true
          },
          bootstrap: {
            enabled: true,
            interval: 10e3,
            list: discoveryPeers || defaultDiscoveryPeers,
          }
        },
        dialer: {
          maxParallelDials: 100,
          maxDialsPerPeer: 100,
          dialTimeout: 30e3
        },
        connectionManager: {
          maxConnections: Infinity,
          minConnections: 0,
          pollInterval: 500,
          defaultPeerValue: 1,
          maxData: Infinity,
          maxSentData: Infinity,
          maxReceivedData: Infinity,
          maxEventLoopDelay: Infinity,
          movingAverageInterval: 1000
        },
        // @ts-ignore
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: true,
          }
        },
        dht: {
          enabled: true,
          randomWalk: {
            enabled: true,
          }
        }
      }
    })
    resolve(p2pNode)
  })
}


export default createP2PNode
