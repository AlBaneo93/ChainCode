const shim = require('fabric-shim')

const chaincode = class {
  async Init(stub) {
    console.info('Instantiated completed')
    return shim.success()
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters()
    let method = this[ret.fcn]

    // undefined method calling exception
    if (!method) {
      console.log('Method name [' + ret.fcn + '] is not defined')
      return shim.success()
    }

    // method execute
    try {
      let payload = await method(stub, ret.params)
      return shim.success(payload)
    } catch (err) {
      console.log(err)
      return shim.error(err)
    }
  }

  async registerItem(stub, args) {
    if (args.length != 2) {
      throw new Error(
        'Incorrect number of arguments. Expecting 2, but received ' +
          args.length
      )
    }

    // composite key 생성
    let compositeKey = stub.createCompositeKey('Asset.', [args[0]])
    // 중복 확인
    let dupCheck = await stub.getState(compositeKey)

    // TODO 다른데로 옮겨야됨
    let isExist = (value) => {
      if (
        !!!value ||
        (value != null &&
          typeof value == 'object' &&
          !Object.keys(value).length)
      ) {
        return false
      } else {
        return true
      }
    }

    if (isExist(dupCheck) == true) {
      throw new Error('AssetID' + compositeKey + 'is already registered.')
    }

    let txTimestamp = stub.getTxTimestamp()

    let txSec = txTimestamp.seconds
    let txSecValue = txSec.low + (540 + 60)
    let dataTimeObj = new Date(txSecValue * 1000)
    let timestamp = dataTimeObj
      .toISOString()
      .replace(/T|Z|\.\d{3}/g, ' ')
      .trim()

    let itemInfo = {
      assetID: args[0],
      recorder: args[1],
      createdAt: timestamp,
      state: 'ItemRegistered'
    }

    // Buffer는 뭐지???
    await stub.putState(compositeKey, Buffer.from(JSON.stringify(itemInfo)))
  }
}

shim.start(new chaincode())
