// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.3.3
var LZString = {

  // private property
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  _f: String.fromCharCode,

  compressToBase64: function (input) {
    if (input == null) return ''
    var output = ''
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4
    var i = 0

    input = LZString.compress(input)

    while (i < input.length * 2) {
      if (i % 2 === 0) {
        chr1 = input.charCodeAt(i / 2) >> 8
        chr2 = input.charCodeAt(i / 2) & 255
        if (i / 2 + 1 < input.length) {
          chr3 = input.charCodeAt(i / 2 + 1) >> 8
        }
        else {
          chr3 = NaN
        }
      }
      else {
        chr1 = input.charCodeAt((i - 1) / 2) & 255
        if ((i + 1) / 2 < input.length) {
          chr2 = input.charCodeAt((i + 1) / 2) >> 8
          chr3 = input.charCodeAt((i + 1) / 2) & 255
        }
        else {
          chr2 = chr3 = NaN
        }
      }
      i += 3

      enc1 = chr1 >> 2
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      enc4 = chr3 & 63

      if (isNaN(chr2)) {
        enc3 = enc4 = 64
      }
      else if (isNaN(chr3)) {
        enc4 = 64
      }

      output = output +
        LZString._keyStr.charAt(enc1) + LZString._keyStr.charAt(enc2) +
          LZString._keyStr.charAt(enc3) + LZString._keyStr.charAt(enc4)
    }

    return output
  },

  decompressFromBase64: function (input) {
    if (input == null) return ''
    var output = ''
    var ol = 0
    var output_
    var chr1
    var chr2
    var chr3
    var enc1
    var enc2
    var enc3
    var enc4
    var i = 0
    var f = LZString._f

    input = input.replace(/[^A-Za-z0-9+/=]/g, '')

    while (i < input.length) {
      enc1 = LZString._keyStr.indexOf(input.charAt(i++))
      enc2 = LZString._keyStr.indexOf(input.charAt(i++))
      enc3 = LZString._keyStr.indexOf(input.charAt(i++))
      enc4 = LZString._keyStr.indexOf(input.charAt(i++))

      chr1 = (enc1 << 2) | (enc2 >> 4)
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      chr3 = ((enc3 & 3) << 6) | enc4

      if (ol % 2 === 0) {
        output_ = chr1 << 8

        if (enc3 !== 64) {
          output += f(output_ | chr2)
        }
        if (enc4 !== 64) {
          output_ = chr3 << 8
        }
      }
      else {
        output = output + f(output_ | chr1)

        if (enc3 !== 64) {
          output_ = chr2 << 8
        }
        if (enc4 !== 64) {
          output += f(output_ | chr3)
        }
      }
      ol += 3
    }

    return LZString.decompress(output)
  },

  compressToUTF16: function (input) {
    if (input == null) return ''
    var output = ''
    var i
    var c
    var current
    var status = 0
    var f = LZString._f

    input = LZString.compress(input)

    for (i = 0; i < input.length; i++) {
      c = input.charCodeAt(i)
      switch (status++) {
        case 0:
          output += f((c >> 1) + 32)
          current = (c & 1) << 14
          break
        case 1:
          output += f((current + (c >> 2)) + 32)
          current = (c & 3) << 13
          break
        case 2:
          output += f((current + (c >> 3)) + 32)
          current = (c & 7) << 12
          break
        case 3:
          output += f((current + (c >> 4)) + 32)
          current = (c & 15) << 11
          break
        case 4:
          output += f((current + (c >> 5)) + 32)
          current = (c & 31) << 10
          break
        case 5:
          output += f((current + (c >> 6)) + 32)
          current = (c & 63) << 9
          break
        case 6:
          output += f((current + (c >> 7)) + 32)
          current = (c & 127) << 8
          break
        case 7:
          output += f((current + (c >> 8)) + 32)
          current = (c & 255) << 7
          break
        case 8:
          output += f((current + (c >> 9)) + 32)
          current = (c & 511) << 6
          break
        case 9:
          output += f((current + (c >> 10)) + 32)
          current = (c & 1023) << 5
          break
        case 10:
          output += f((current + (c >> 11)) + 32)
          current = (c & 2047) << 4
          break
        case 11:
          output += f((current + (c >> 12)) + 32)
          current = (c & 4095) << 3
          break
        case 12:
          output += f((current + (c >> 13)) + 32)
          current = (c & 8191) << 2
          break
        case 13:
          output += f((current + (c >> 14)) + 32)
          current = (c & 16383) << 1
          break
        case 14:
          output += f((current + (c >> 15)) + 32, (c & 32767) + 32)
          status = 0
          break
      }
    }

    return output + f(current + 32)
  },

  decompressFromUTF16: function (input) {
    if (input == null) return ''
    var output = ''
    var current
    var c
    var status = 0
    var i = 0
    var f = LZString._f

    while (i < input.length) {
      c = input.charCodeAt(i) - 32

      switch (status++) {
        case 0:
          current = c << 1
          break
        case 1:
          output += f(current | (c >> 14))
          current = (c & 16383) << 2
          break
        case 2:
          output += f(current | (c >> 13))
          current = (c & 8191) << 3
          break
        case 3:
          output += f(current | (c >> 12))
          current = (c & 4095) << 4
          break
        case 4:
          output += f(current | (c >> 11))
          current = (c & 2047) << 5
          break
        case 5:
          output += f(current | (c >> 10))
          current = (c & 1023) << 6
          break
        case 6:
          output += f(current | (c >> 9))
          current = (c & 511) << 7
          break
        case 7:
          output += f(current | (c >> 8))
          current = (c & 255) << 8
          break
        case 8:
          output += f(current | (c >> 7))
          current = (c & 127) << 9
          break
        case 9:
          output += f(current | (c >> 6))
          current = (c & 63) << 10
          break
        case 10:
          output += f(current | (c >> 5))
          current = (c & 31) << 11
          break
        case 11:
          output += f(current | (c >> 4))
          current = (c & 15) << 12
          break
        case 12:
          output += f(current | (c >> 3))
          current = (c & 7) << 13
          break
        case 13:
          output += f(current | (c >> 2))
          current = (c & 3) << 14
          break
        case 14:
          output += f(current | (c >> 1))
          current = (c & 1) << 15
          break
        case 15:
          output += f(current | c)
          status = 0
          break
      }

      i++
    }

    return LZString.decompress(output)
    // return output;
  },

  compress: function (uncompressed) {
    if (uncompressed == null) return ''
    var i
    var value
    var contextDictionary = {}
    var contextDictionaryToCreate = {}
    var contextC = ''
    var contextWC = ''
    var contextW = ''
    var contextEnlargeIn = 2 // Compensate for the first entry which should not count
    var contextDictSize = 3
    var contextNumBits = 2
    var contextDataString = ''
    var contextDataVal = 0
    var contextDataPosition = 0
    var ii
    var f = LZString._f

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      contextC = uncompressed.charAt(ii)
      if (!Object.prototype.hasOwnProperty.call(contextDictionary, contextC)) {
        contextDictionary[contextC] = contextDictSize++
        contextDictionaryToCreate[contextC] = true
      }

      contextWC = contextW + contextC
      if (Object.prototype.hasOwnProperty.call(contextDictionary, contextWC)) {
        contextW = contextWC
      }
      else {
        if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
          if (contextW.charCodeAt(0) < 256) {
            for (i = 0; i < contextNumBits; i++) {
              contextDataVal = (contextDataVal << 1)
              if (contextDataPosition === 15) {
                contextDataPosition = 0
                contextDataString += f(contextDataVal)
                contextDataVal = 0
              }
              else {
                contextDataPosition++
              }
            }
            value = contextW.charCodeAt(0)
            for (i = 0; i < 8; i++) {
              contextDataVal = (contextDataVal << 1) | (value & 1)
              if (contextDataPosition === 15) {
                contextDataPosition = 0
                contextDataString += f(contextDataVal)
                contextDataVal = 0
              }
              else {
                contextDataPosition++
              }
              value = value >> 1
            }
          }
          else {
            value = 1
            for (i = 0; i < contextNumBits; i++) {
              contextDataVal = (contextDataVal << 1) | value
              if (contextDataPosition === 15) {
                contextDataPosition = 0
                contextDataString += f(contextDataVal)
                contextDataVal = 0
              }
              else {
                contextDataPosition++
              }
              value = 0
            }
            value = contextW.charCodeAt(0)
            for (i = 0; i < 16; i++) {
              contextDataVal = (contextDataVal << 1) | (value & 1)
              if (contextDataPosition === 15) {
                contextDataPosition = 0
                contextDataString += f(contextDataVal)
                contextDataVal = 0
              }
              else {
                contextDataPosition++
              }
              value = value >> 1
            }
          }
          contextEnlargeIn--
          if (contextEnlargeIn === 0) {
            contextEnlargeIn = Math.pow(2, contextNumBits)
            contextNumBits++
          }
          delete contextDictionaryToCreate[contextW]
        }
        else {
          value = contextDictionary[contextW]
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1)
            if (contextDataPosition === 15) {
              contextDataPosition = 0
              contextDataString += f(contextDataVal)
              contextDataVal = 0
            }
            else {
              contextDataPosition++
            }
            value = value >> 1
          }
        }
        contextEnlargeIn--
        if (contextEnlargeIn === 0) {
          contextEnlargeIn = Math.pow(2, contextNumBits)
          contextNumBits++
        }
        // Add wc to the dictionary.
        contextDictionary[contextWC] = contextDictSize++
        contextW = String(contextC)
      }
    }

    // Output the code for w.
    if (contextW !== '') {
      if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
        if (contextW.charCodeAt(0) < 256) {
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1)
            if (contextDataPosition === 15) {
              contextDataPosition = 0
              contextDataString += f(contextDataVal)
              contextDataVal = 0
            }
            else {
              contextDataPosition++
            }
          }
          value = contextW.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1)
            if (contextDataPosition === 15) {
              contextDataPosition = 0
              contextDataString += f(contextDataVal)
              contextDataVal = 0
            }
            else {
              contextDataPosition++
            }
            value = value >> 1
          }
        }
        else {
          value = 1
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1) | value
            if (contextDataPosition === 15) {
              contextDataPosition = 0
              contextDataString += f(contextDataVal)
              contextDataVal = 0
            }
            else {
              contextDataPosition++
            }
            value = 0
          }
          value = contextW.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1)
            if (contextDataPosition === 15) {
              contextDataPosition = 0
              contextDataString += f(contextDataVal)
              contextDataVal = 0
            }
            else {
              contextDataPosition++
            }
            value = value >> 1
          }
        }
        contextEnlargeIn--
        if (contextEnlargeIn === 0) {
          contextEnlargeIn = Math.pow(2, contextNumBits)
          contextNumBits++
        }
        delete contextDictionaryToCreate[contextW]
      }
      else {
        value = contextDictionary[contextW]
        for (i = 0; i < contextNumBits; i++) {
          contextDataVal = (contextDataVal << 1) | (value & 1)
          if (contextDataPosition === 15) {
            contextDataPosition = 0
            contextDataString += f(contextDataVal)
            contextDataVal = 0
          }
          else {
            contextDataPosition++
          }
          value = value >> 1
        }
      }
      contextEnlargeIn--
      if (contextEnlargeIn === 0) {
        contextEnlargeIn = Math.pow(2, contextNumBits)
        contextNumBits++
      }
    }

    // Mark the end of the stream
    value = 2
    for (i = 0; i < contextNumBits; i++) {
      contextDataVal = (contextDataVal << 1) | (value & 1)
      if (contextDataPosition === 15) {
        contextDataPosition = 0
        contextDataString += f(contextDataVal)
        contextDataVal = 0
      }
      else {
        contextDataPosition++
      }
      value = value >> 1
    }

    // Flush the last char
    while (true) {
      contextDataVal = (contextDataVal << 1)
      if (contextDataPosition === 15) {
        contextDataString += f(contextDataVal)
        break
      }
      else contextDataPosition++
    }
    return contextDataString
  },

  decompress: function (compressed) {
    if (compressed == null) return ''
    if (compressed === '') return null
    var dictionary = []
    var enlargeIn = 4
    var dictSize = 4
    var numBits = 3
    var entry = ''
    var result = ''
    var i
    var w
    var bits
    var resb
    var maxpower
    var power
    var c
    var f = LZString._f
    var data = {string: compressed, val: compressed.charCodeAt(0), position: 32768, index: 1}

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i
    }

    bits = 0
    maxpower = Math.pow(2, 2)
    power = 1
    while (power !== maxpower) {
      resb = data.val & data.position
      data.position >>= 1
      if (data.position === 0) {
        data.position = 32768
        data.val = data.string.charCodeAt(data.index++)
      }
      bits |= (resb > 0 ? 1 : 0) * power
      power <<= 1
    }

    switch (bits) {
      case 0:
        bits = 0
        maxpower = Math.pow(2, 8)
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = 32768
            data.val = data.string.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = f(bits)
        break
      case 1:
        bits = 0
        maxpower = Math.pow(2, 16)
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = 32768
            data.val = data.string.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = f(bits)
        break
      case 2:
        return ''
    }
    dictionary[3] = c
    w = result = c
    while (true) {
      if (data.index > data.string.length) {
        return ''
      }

      bits = 0
      maxpower = Math.pow(2, numBits)
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = 32768
          data.val = data.string.charCodeAt(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }

      switch (c = bits) {
        case 0:
          bits = 0
          maxpower = Math.pow(2, 8)
          power = 1
          while (power !== maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position === 0) {
              data.position = 32768
              data.val = data.string.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }

          dictionary[dictSize++] = f(bits)
          c = dictSize - 1
          enlargeIn--
          break
        case 1:
          bits = 0
          maxpower = Math.pow(2, 16)
          power = 1
          while (power !== maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position === 0) {
              data.position = 32768
              data.val = data.string.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }
          dictionary[dictSize++] = f(bits)
          c = dictSize - 1
          enlargeIn--
          break
        case 2:
          return result
      }

      if (enlargeIn === 0) {
        enlargeIn = Math.pow(2, numBits)
        numBits++
      }

      if (dictionary[c]) {
        entry = dictionary[c]
      }
      else {
        if (c === dictSize) {
          entry = w + w.charAt(0)
        }
        else {
          return null
        }
      }
      result += entry

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0)
      enlargeIn--

      w = entry

      if (enlargeIn === 0) {
        enlargeIn = Math.pow(2, numBits)
        numBits++
      }
    }
  }
}

if (typeof module !== 'undefined' && module != null) {
  module.exports = LZString
}
