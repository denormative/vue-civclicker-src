/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-01-31
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/* global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ('document' in self && !('classList' in document.createElement('_'))) {
  (function (view) {
    if (!('Element' in view)) return

    const classListProp = 'classList'
    const protoProp = 'prototype'
    const elemCtrProto = view.Element[protoProp]
    const objCtr = Object
    const strTrim = String[protoProp].trim || function () {
      return this.replace(/^\s+|\s+$/g, '')
    }
    const arrIndexOf = Array[protoProp].indexOf || function (item) {
      let i = 0
      const len = this.length

      for (; i < len; i++) {
        if (i in this && this[i] === item) {
          return i
        }
      }
      return -1
    }
    // Vendors: please allow content code to instantiate DOMExceptions
    const DOMEx = function (type, message) {
      this.name = type
      this.code = DOMException[type]
      this.message = message
    }
    const checkTokenAndGetIndex = function (classList, token) {
      if (token === '') {
        throw new DOMEx(
                  'SYNTAX_ERR'
                , 'An invalid or illegal string was specified',
            )
      }
      if (/\s/.test(token)) {
        throw new DOMEx(
                  'INVALID_CHARACTER_ERR'
                , 'String contains an invalid character',
            )
      }
      return arrIndexOf.call(classList, token)
    }
    const ClassList = function (elem) {
      const trimmedClasses = strTrim.call(elem.getAttribute('class') || '')
      const classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
      let i = 0
      const len = classes.length

      for (; i < len; i++) {
        this.push(classes[i])
      }
      this._updateClassName = function () {
        elem.setAttribute('class', this.toString())
      }
    }
    const classListProto = ClassList[protoProp] = []
    const classListGetter = function () {
      return new ClassList(this)
    }

// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp]
    classListProto.item = function (i) {
      return this[i] || null
    }
    classListProto.contains = function (token) {
      token += ''
      return checkTokenAndGetIndex(this, token) !== -1
    }
    classListProto.add = function () {
      const tokens = arguments
      let i = 0
      const l = tokens.length
      let token
      let updated = false

      do {
        token = `${tokens[i]}`
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token)
          updated = true
        }
      }
      while (++i < l)

      if (updated) {
        this._updateClassName()
      }
    }
    classListProto.remove = function () {
      const tokens = arguments
      let i = 0
      const l = tokens.length
      let token
      let updated = false

      do {
        token = `${tokens[i]}`
        const index = checkTokenAndGetIndex(this, token)
        if (index !== -1) {
          this.splice(index, 1)
          updated = true
        }
      }
      while (++i < l)

      if (updated) {
        this._updateClassName()
      }
    }
    classListProto.toggle = function (token, force) {
      token += ''

      const result = this.contains(token)
      const method = result ?
          force !== true && 'remove' :
          force !== false && 'add'

      if (method) {
        this[method](token)
      }

      return !result
    }
    classListProto.toString = function () {
      return this.join(' ')
    }

    if (objCtr.defineProperty) {
      const classListPropDesc = {
        get: classListGetter,
        enumerable: true,
        configurable: true,
      }
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc)
      }
      catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
          classListPropDesc.enumerable = false
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc)
        }
      }
    }
    else if (objCtr[protoProp].__defineGetter__) {
      elemCtrProto.__defineGetter__(classListProp, classListGetter)
    }
  }(self))
}
