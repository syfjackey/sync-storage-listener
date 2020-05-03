class Storage {
  static _throwError(msg) { throw new Error(msg); }
  static _createSetStorageByType() {
    let _this = this
    if (this._storageType === 'sessionStorage') {
      return function (type, key, value) {
        if (!_this._isTypeValue(key, 'string')) return null
        let result = sessionStorage[type](`${_this.prefix}_${key}`, value)
        try { result = JSON.parse(result) } catch (error) { }
        return result || null
      }
    }
    if (this._storageType === 'localStorage') {
      return function (type, key, value, expire) {
        if (!_this._isTypeValue(key, 'string')) return null
        let nexpire = !_this._isType(expire, 'number') ? null : expire * 1000 * 60 * 60 + new Date().getTime();
        let obj = localStorage[type](`${_this.prefix}_${key}`, JSON.stringify({ value, expire: nexpire }))
        if (obj) {
          obj = JSON.parse(obj)
          if (!obj.expire || obj.expire > new Date().getTime()) {
            let result = obj.value
            try { result = JSON.parse(result) } catch (error) { }
            return result
          }
          _this._setStorageByType('removeItem', key, null)
          return null
        }
        return obj
      };
    }
    if (this._storageType === 'cookie') {
      return function (type, key, value, expire) {
        if (!_this._isTypeValue(key, 'string')) return null
        let nexpire = !_this._isType(expire, 'number') ? null : expire * 1000 * 60 * 60 + new Date().getTime();
        let result = null
        switch (type) {
          case 'getItem':
            result = _this._getCookie(`${_this.prefix}_${key}`)
            try { result = JSON.parse(result) } catch (error) { }
            break
          case 'removeItem':
            _this._setCookie(`${_this.prefix}_${key}`, '', -1)
            break
          case 'setItem':
            _this._setCookie(`${_this.prefix}_${key}`, value, nexpire)
            break
        }
        return result
      }
    }
    this._throwError('storageType类型解析失败!')
  }
  static _getCookie(key) {
    let reg = new RegExp("(^| )" + key + "=([^;]*)(;|$)");
    let arr = document.cookie.match(reg)
    return arr ? unescape(arr[2]) : null
  }
  static _setCookie(key, val, expire) {
    if (expire) {
      let date = new Date(expire).toUTCString();
      document.cookie = `${key}=${escape(val)};expires=${date}`;
    } else {
      document.cookie = `${key}=${escape(val)}`
    }
  }
  static _backRelated(keys, vals) {
    let ks = []
    let vs = []
    if (this._related.length === 0) {
      ks = keys
      vs = vals
    } else {
      for (let i = 0; i < keys.length; i++) {
        if (this._related.includes(keys[i])) {
          ks.push(keys[i])
          vs.push(vals[i])
        }
      }
    }
    return [ks, vs]
  }
  static _sendStorage(type, keys, vals) {
    if (!this._enable) return
    let [ks, vs] = this._backRelated(keys, vals)
    if (type === 'requestStorage' || type === 'receiveStorage' || ks.length > 0) {
      let key = `${this.prefix}_${type}_${JSON.stringify(ks)}`
      localStorage.setItem(key, JSON.stringify(vs))
      localStorage.removeItem(key)
    }
  }
  static getItem(key) {
    this._checkInit()
    if (!this._isTypeValue(key, 'string', true)) return this._throwError('key只能是String|Array<String>类型!')
    if (this._isTypeValue(key, 'string')) { return this._setStorageByType('getItem', key, null) }
    let values = []
    for (let i = 0; i < key.length; i++) {
      const k = key[i];
      values.push(this._setStorageByType('getItem', k, null))
    }
    return values
  }
  static _resolveFn(setKey, setValue, setExpire) {
    if (this._isTypeValue(setKey, 'object')) {
      let { key, value, expire } = setKey
      if (!this._isTypeValue(value, 'string')) {
        value = JSON.stringify(value)
      }
      return [[key], [value], [expire]]
    }
    if (this._isTypeValue(setKey, 'string')) {
      return [[setKey], [setValue], [setExpire]]
    }
    if (this._isTypeValue(setKey, 'array')) {
      let ks = []
      let vs = []
      let es = []
      setKey.forEach(obj => {
        let [key, value, expire] = this._resolveFn(obj)
        ks = ks.concat(key)
        vs = vs.concat(value)
        es = es.concat(expire)
      })
      return [ks, vs, es]
    }
  }
  static setItem(setKey, setValue, setExpire) {
    this._checkInit()
    if (!(this._isTypeValue(setKey, 'string') || this._isTypeValue(setKey, 'object', true))) return this._throwError('key只能是String|object|Array<object>类型!')
    let [keys, values, expires] = this._resolveFn(setKey, setValue, setExpire)
    const vs = []
    const ks = []
    for (let i = 0; i < keys.length; i++) {
      let val = typeof values[i] === 'string' ? values[i] : JSON.stringify(values[i])
      if (this._isFilterInvalid) {
        let oldVal = this._setStorageByType('getItem', keys[i], null)
        oldVal = typeof oldVal === 'string' ? oldVal : JSON.stringify(oldVal)
        if (val === oldVal) {
          continue
        }
      }
      ks.push(keys[i])
      vs.push(val)
      this._setStorageByType('setItem', keys[i], val, expires[i])
    }
    ks.length > 0 && this._sendStorage('setStorage', ks, vs)
  }
  static removeItem(key) {
    this._checkInit()
    if (!this._isTypeValue(key, 'string', true)) return this._throwError('key只能是String|Array<String>类型!')
    let keys = this._isTypeValue(key, 'string') ? [key] : key
    let ks = []
    for (let i = 0; i < keys.length; i++) {
      if (!this._isFilterInvalid || this._setStorageByType('getItem', keys[i]) !== null) {
        ks.push(keys[i])
        this._setStorageByType('removeItem', keys[i], null)
      }
    }
    if (ks.length > 0) { this._sendStorage('removeStorage', ks, Array(ks.length).fill(null)) }
  }
  static clear() {
    this._checkInit()
    let [keys] = this._findStorage()
    for (const key of keys) {
      this._setStorageByType('removeItem', key, null)
    }
    if (keys.length > 0 || !this._isFilterInvalid) { this._sendStorage('removeStorage', keys, Array(keys.length).fill(null)) }
  }
  static _createFindStorageFn() {
    let _this = this
    const reg = new RegExp(`^${this.prefix}_`)
    if (this._storageType === 'sessionStorage') {
      return function () {
        let keys = []
        let vals = []
        for (const [key, value] of Object.entries(sessionStorage)) {
          if (_this._isOwnSession(key)) {
            let k = key.replace(reg, ``)
            keys.push(k)
            vals.push(value)
          }
        }
        return [keys, vals]
      }
    }
    if (this._storageType === 'localStorage') {
      return function () {
        let keys = []
        let vals = []
        for (const [key, value] of Object.entries(localStorage)) {
          if (_this._isOwnSession(key)) {
            let k = key.replace(reg, ``)
            let val = JSON.parse(value)
            if (!val.expires || new Date().getTime() > parseInt(val.expires, 10)) {
              vals.push(val.value)
              keys.push(k)
            } else {
              _this._setStorageByType('removeItem', key, null)
            }
          }
        }
        return [keys, vals]
      }
    }
    if (this._storageType === 'cookie') {
      return function () {
        let keys = []
        let vals = []
        let aCookie = document.cookie.split(";")
        for (let i = 0; i < aCookie.length; i++) {
          let aCrumb = aCookie[i].split("=");
          let key = aCrumb[0].toString().trim()
          if (_this._isOwnSession(key)) {
            let k = key.replace(reg, ``)
            keys.push(k)
            vals.push(aCrumb[1])
          }
        }
        return [keys, vals]
      }
    }
    this._throwError('storageType类型解析失败!')
  }
  static _onRequestStorage() {
    let [keys, vals] = this._findStorage()
    this._sendStorage('receiveStorage', keys, vals)
    this._handleCallback([], [], 'request', this)
    return
  }
  static _checkInit() {
    if (!this._isInit()) return this._throwError('使用Storage前,请先调用init初始化或者使用Vue.use注册!')
  }
  static _isInit() {
    return this._initStatus === 'INIT'
  }
  static _isOwnSession(key) {
    const isSetsession = new RegExp(`^${this.prefix}_`);
    return isSetsession.test(key)
  }
  static _sendType(key) {
    if (!key) return
    const reg = new RegExp(`^${this.prefix + '_([^_]+Storage)_'}`)
    const sendType = key.match(reg);
    return sendType && sendType[1]
  }
  static _questStorage() {
    if (window.name !== this._winName) {
      if (this._storageType !== 'sessionStorage') {
        let [keys, vals] = this._backRelated(...this._findStorage())
        this._doEventByType('set', keys, vals, true)
        return
      }
      this._sendStorage('requestStorage', [], [])
      this._timer = setTimeout(() => {
        window.name = this._winName
        this._receiveBack && this._receiveBack()
      }, this._timeout);
    } else {
      if (this._isRefeshEmit) {
        let [keys, vals] = this._backRelated(...this._findStorage())
        this._doEventByType('set', keys, vals, false, true)
      }
    }
  }
  static _onEvent(key, val) {
    if (!key) return
    const reg = new RegExp(`^${this.prefix + '_([^_]+Storage)_'}`)
    let sendType = key.match(reg);
    sendType = sendType && sendType[1]
    if (!sendType || val === null || val === undefined) return
    let nkey = key.replace(reg, '')
    const k = JSON.parse(nkey)
    const v = JSON.parse(val)
    switch (sendType) {
      case 'removeStorage':
        this._doEventByType('remove', k, v, false)
        break;
      case 'setStorage':
        this._doEventByType('set', k, v, false)
        break;
      case 'requestStorage':
        this._onRequestStorage()
        break;
      case 'receiveStorage':
        this._doEventByType('set', k, v, true)
        break;
    }
  }
  static _emitListenerCallback(key, val, type) {
    this._listenerMap[key] && this._listenerMap[key].forEach(cb => {
      cb(val, type, key, this)
    });
  }
  static _doEventByType(type, keys, vals, isSyncData, isOnlyEmit = false) {
    let vs = []
    for (let i = 0; i < keys.length; i++) {
      !isOnlyEmit && this._storageType === 'sessionStorage' && (type === 'remove' ? this._setStorageByType('removeItem', keys[i], null) : this._setStorageByType('setItem', keys[i], vals[i]))
      let v = vals[i]
      try { v = JSON.parse(vals[i]) } catch (e) { }
      this._emitListenerCallback(keys[i], v, type)
      vs.push(v)
    }
    this._handleCallback(keys, vs, type, this)
    if (isSyncData) {
      window.name = this._winName
      clearTimeout(this._timer)
      this._receiveBack && this._receiveBack()
    }
  }
  static ready() {
    this._checkInit()
    return new Promise((res) => {
      !this._enable || window.name === this._winName ? res() : this._receiveBack = () => res();
    });
  }
  static _registerEvent() {
    window.addEventListener('storage', (e) => {
      this._onEvent(e.key, e.newValue)
    });
  }
  static _initListener(listener) {
    this._listenerMap = {}
    if (!listener) return
    let listeners = this._isTypeValue(listener, 'object') ? [listener] : listener
    for (let i = 0; i < listeners.length; i++) {
      const ilistener = listeners[i];
      let cb = this._isTypeValue(ilistener.callback, 'function') ? [ilistener.callback] : ilistener.callback.flat(Infinity)
      let key = ilistener.key
      if (this._listenerMap[key]) {
        this._listenerMap[key].concat(cb)
      } else {
        this._listenerMap[key] = cb
      }
    }
  }
  static _initRelated(related = [], enable) {
    this._enable = enable
    this._related = this._isTypeValue(related, 'string') ? [related] : [...related]
  }
  static _isLikeListener(l) {
    return !!l && typeof l === 'object' && this._isTypeValue(l.key, 'string') && (this._isTypeValue(l.callback, 'function') || this._isTypeValue(l.callback, 'function', true))
  }
  static _isListener(listener) {
    if (this._isTypeValue(listener, 'object')) return this._isLikeListener(listener)
    if (this._isTypeValue(listener, 'array') && listener.length > 0) {
      for (let i = 0; i < listener.length; i++) {
        const l = listener[i];
        if (!this._isLikeListener(l)) return false
      }
      return true
    }
    return false
  }
  static _isType(val, type) {
    return type.toLowerCase() === Object.prototype.toString.call(val).split(' ')[1].replace(']', '').toLowerCase()
  }
  static _isTypeValue(val, type, isMayArray = false) {
    if (!type) return false
    let types = type.split('|')
    for (let i = 0; i < types.length; i++) {
      if (this._isType(val, types[i])) return true
    }
    if (isMayArray && Array.isArray(val) && val.length > 0) {
      for (let i = 0; i < val.length; i++) {
        if (!this._isTypeValue(val[i], type, false)) return false
      }
      return true
    }
    return false
  }
  static _validOptions({ prefix = 'cps', filterInvalid = true, callback = () => null, listener, related, enable = true, storageType = 'sessionStorage', timeout = 30, refeshEmit = true }) {
    if (!this._isTypeValue(prefix, 'string')) return this._throwError('prefix必须是String类型')
    if (related !== undefined && !this._isTypeValue(related, 'string', true)) return this._throwError('related必须是String|Array<String>类型')
    if (!this._isTypeValue(callback, 'function')) return this._throwError('callback必须是Function类型')
    if (listener && !this._isListener(listener)) return this._throwError('listener必须是Object{key<String>,callback<Function>}|Array<Object>类型')
    if (!this._isTypeValue(enable, 'boolean')) return this._throwError('enable必须是Boolean类型')
    if (storageType !== 'sessionStorage' && storageType !== 'localStorage' && storageType !== 'cookie') this._throwError('storageType只能是sessionStorage|localStorage|cookie')
    if (!(/^[0-9]+$/.test(timeout))) this._throwError('timeout只能是正整数')
    if (!this._isTypeValue(refeshEmit, 'boolean')) return this._throwError('refeshEmit必须是Boolean类型')
    if (!this._isTypeValue(filterInvalid, 'boolean')) return this._throwError('filterInvalid必须是Boolean类型')
    return { prefix, callback, listener, related, enable, storageType, timeout, refeshEmit, filterInvalid }
  }
  static _initStaticData() {
    this._initStatus = 'INIT'
    this._timer = null
    this._winName = 'syf_completed'
  }
  static _initPrefix(prefix) {
    this.prefix = prefix
  }
  static _initCallback(callback) {
    this._handleCallback = callback
  }
  static init(options) {
    if (this._initStatus === 'INIT') return this._throwError('Storage已经初始化!')
    let { prefix, callback, listener, related, enable, storageType, timeout, refeshEmit, filterInvalid } = this._validOptions(options || {})
    this._initStaticData()
    this._timeout = timeout
    this._storageType = storageType
    this._isRefeshEmit = refeshEmit
    this._isFilterInvalid = filterInvalid
    this._initPrefix(prefix)
    this._initCallback(callback)
    this._initRelated(related, enable)
    this._findStorage = this._createFindStorageFn()
    this._setStorageByType = this._createSetStorageByType()
    if (enable) {
      this._initListener(listener)
      this._registerEvent()
      this._questStorage()
    }
  }
  static install(Vue, options = {}) {
    this.init(options)
    let mountKey = options.mountKey && typeof options.mountKey === 'string' ? options.mountKey : '$storage'
    if (Vue.prototype[mountKey]) console.warn(`${mountKey}已存在,原功能将被覆盖!`);
    Vue.prototype[mountKey] = this
  }
}

export default Storage