/**
    CivClicker
    Copyright (C) 2014; see the AUTHORS file for authorship.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program in the LICENSE file.
    If it is not there, see <http://www.gnu.org/licenses/>.
**/

/* global indexArrayByAttr isValid valOf dataset setElemDisplay
    logSearchFn matchType calcArithSum localStorage deleteCookie rndRound
    prompt DOMException readCookie mergeObj LZString alert XMLHttpRequest
    confirm VersionData civDataTable CivObj migrateGameData
    */

// FIXME: need to severely lint this file then remove this.
/* eslint operator-linebreak: [0] */
/* eslint guard-for-in: "off" */
/* eslint no-restricted-syntax: "off" */

function getCurDeityDomain() {
  return (window.vm.curCiv.deities.length > 0) ? window.vm.curCiv.deities[0].domain : undefined
}

// Tallies the number of each wonder from the wonders array.
function updateWonderCount() {
  window.vm.wonderCount = {}
  window.vm.curCiv.wonders.forEach((elem) => {
    const resourceId = elem.resourceId
    if (!isValid(window.vm.wonderCount[resourceId])) {
      window.vm.wonderCount[resourceId] = 0
    }
    window.vm.wonderCount[resourceId] += 1
  })
}

// Return the production multiplier from wonders for a resource.
function getWonderBonus(resourceObj) {
  if (!resourceObj) {
    return 1
  }
  return (1 + ((window.vm.wonderCount[resourceObj.id] || 0) / 10))
}

// Reset the raid data.
function resetRaiding() {
  window.vm.curCiv.raid.raiding = false
  window.vm.curCiv.raid.victory = false
  window.vm.curCiv.raid.epop = 0
  window.vm.curCiv.raid.plunderLoot = {}
  window.vm.curCiv.raid.last = ''

  // Also reset the enemy party units.
  window.vm.unitData.filter((elem) => ((elem.alignment === 'enemy') && (elem.place === 'party')))
    .forEach((elem) => {
      elem.reset()
    })
}

function preLoad() { // eslint-disable-line no-unused-vars
  window.vm.version = 19 // This is an ordinal used to trigger reloads.

  window.vm.versionData = new VersionData(1, 1, 59, 'alpha')

  window.vm.saveTag = 'civ'
  window.vm.saveTag2 = `${window.vm.saveTag}2` // For old saves.
  window.vm.saveSettingsTag = 'civSettings'
  window.vm.logRepeat = 1

  // Civ size category minimums
  /* beautify preserve:start */
  window.vm.civSizes = [
    { min_pop: 0, name: 'Thorp', id: 'thorp' },
    { min_pop: 20, name: 'Hamlet', id: 'hamlet' },
    { min_pop: 60, name: 'Village', id: 'village' },
    { min_pop: 200, name: 'Small Town', id: 'smallTown' },
    // xxx This is a really big jump.  Reduce it.
    { min_pop: 2000, name: 'Large Town', id: 'largeTown' },
    { min_pop: 5000, name: 'Small City', id: 'smallCity' },
    { min_pop: 10000, name: 'Large City', id: 'largeCity' },
    { min_pop: 20000, name: 'Metro&shy;polis', id: 'metropolis' },
    { min_pop: 50000, name: 'Small Nation', id: 'smallNation' },
    { min_pop: 100000, name: 'Nation', id: 'nation' },
    { min_pop: 200000, name: 'Large Nation', id: 'largeNation' },
    { min_pop: 500000, name: 'Empire', id: 'empire' },
  ]
  /* beautify preserve:end */
  indexArrayByAttr(window.vm.civSizes, 'id')

  // Annotate with max window.vm.population and index.
  window.vm.civSizes.forEach((elem, i, arr) => {
    elem.max_pop = (i + 1 < arr.length) ? (arr[i + 1].min_pop - 1) : Infinity
    elem.idx = i
  })

  window.vm.civSizes.getCivSize = function(popcnt) { // eslint-disable-line func-names
    let i
    for (i = 0; i < this.length; ++i) {
      if (popcnt <= this[i].max_pop) {
        return this[i]
      }
    }
    return this[0]
  }

  // Declare variables here so they can be referenced later.
  window.vm.curCiv = {
    civName: 'Woodstock',
    rulerName: 'Orteil',

    zombie: {
      owned: 0,
    },
    grave: {
      owned: 0,
    },
    enemySlain: {
      owned: 0,
    },
    morale: {
      mod: 1.0,
    },

    resourceClicks: 0, // For NeverClick
    attackCounter: 0, // How long since last attack?

    trader: {
      materialId: '',
      requested: 0,
      timer: 0,
      counter: 0, // How long since last trader?
    },

    raid: {
      raiding: false, // Are we in a raid right now?
      victory: false, // Are we in a "raid succeeded" (Plunder-enabled) state right now?
      epop: 0, // Population of enemy we're raiding.
      plunderLoot: {}, // Loot we get if we win.
      last: '',
      targetMax: window.vm.civSizes[0].id, // Largest target allowed
    },

    curWonder: {
      name: '',
      stage: 0, // 0 = Not started, 1 = Building, 2 = Built, awaiting selection, 3 = Finished.
      progress: 0, // Percentage completed.
      rushed: false,
    },
    wonders: [], // Array of {name: name, resourceId: resourceId} for all wonders.

    // Known deities.  The 0th element is the current game's deity.
    // If the name is "", no deity has been created (can also check for worship upgrade)
    // If the name is populated but the domain is not, the domain has not been selected.
    deities: [{
      name: '',
      domain: '',
      maxDev: 0,
    }], // array of { name, domain, maxDev }

    // xxx We're still accessing many of the properties put here by window.vm.civData
    // elements without going through the window.vm.civData accessors.  That should
    // change.
  }

  // These are not saved, but we need them up here for the asset data to init properly.
  window.vm.population = {
    current: 0,
    limit: 0,
    healthy: 0,
    totalSick: 0,
  }

  // These are settings that should probably be tied to the browser.
  window.vm.settings = {
    autosave: true,
    autosaveCounter: 1,
    autosaveTime: 60, // Currently autosave is every minute. Might change to 5 mins in future.
    customIncr: false,
    fontSize: 1.0,
    delimiters: true,
    textShadow: false,
    notes: true,
    worksafe: false,
    useIcons: true,
  }

  // Initialize Data
  window.vm.civData = civDataTable()

  window.vm.civData.forEach((elem) => {
    if (!(elem instanceof CivObj)) {
      return
    } // Unknown type
    if (elem.type === 'resource') {
      window.vm.resourceData.push(elem)
      if (elem.vulnerable === true) {
        window.vm.lootable.push(elem)
      }
      if (elem.subType === 'basic') {
        window.vm.basicResources.push(elem)
      }
    }
    if (elem.type === 'building') {
      window.vm.buildingData.push(elem)
      if (elem.vulnerable === true) {
        window.vm.sackable.push(elem)
      }
      if (elem.subType === 'normal' || elem.subType === 'land') {
        window.vm.homeBuildings.push(elem)
      }
    }
    if (elem.subType === 'prayer') {
      window.vm.powerData.push(elem)
    }
    else if (elem.type === 'upgrade') {
      window.vm.upgradeData.push(elem)
      if (elem.subType === 'upgrade') {
        window.vm.normalUpgrades.push(elem)
      }
    }
    if (elem.type === 'unit') {
      window.vm.unitData.push(elem)
      if (elem.vulnerable === true) {
        window.vm.killable.push(elem)
      }
      if (elem.place === 'home') {
        window.vm.homeUnits.push(elem)
      }
      if (elem.place === 'party') {
        window.vm.armyUnits.push(elem)
      }
    }
    if (elem.type === 'achievement') {
      window.vm.achData.push(elem)
    }
  })

  // The resources that Wonders consume, and can give bonuses for.
  window.vm.wonderResources = [
    window.vm.civData.food,
    window.vm.civData.wood,
    window.vm.civData.stone,
    window.vm.civData.skins,
    window.vm.civData.herbs,
    window.vm.civData.ore,
    window.vm.civData.leather,
    window.vm.civData.metal,
    window.vm.civData.piety,
  ]
}

function postLoad() { // eslint-disable-line no-unused-vars
  initCivclicker()

  // This sets up the main game loop, which is scheduled to execute once per second.
  window.setInterval(() => {
    // debugging - mark beginning of loop execution
    // var start = new Date().getTime();

    tickAutosave()

    // Production workers do their thing.
    doFarmers()
    doWoodcutters()
    doMiners()
    doBlacksmiths()
    doTanners()
    doClerics()

    // Check for starvation
    doStarve()
    // xxx Need to kill workers who die from exposure.

    // Resources occasionally go above their caps.
    // Cull the excess /after/ other workers have taken their inputs.
    window.vm.resourceData.forEach((elem) => {
      if (elem.owned > elem.limit) {
        elem.owned = elem.limit
      }
    })

    // Timers - routines that do not occur every second
    doMobs()
    doPestControl()
    tickGlory()
    doShades()
    doEsiege(window.vm.civData.esiege, window.vm.civData.fortification)
    doRaid('party', 'player', 'enemy')

    // Population-related
    doGraveyards()
    doHealers()
    doCorpses()
    doThrone()
    tickGrace()
    tickWalk()
    doLabourers()
    tickTraders()

    updateResourceTotals() // This is the point where the page is updated with new resource totals
    testAchievements()

    // Data changes should be done; now update the UI.
    updateUpgrades()
    updateResourceRows() // Update resource display
    updateBuildingButtons()
    updateJobButtons()
    updatePartyButtons()
    updatePopulationUI()
    updateTargets()
    updateDevotion()
    updateWonder()
    updateReset()

    // Debugging - mark end of main loop and calculate delta in milliseconds
    // var end = new Date().getTime();
    // var time = end - start;
    // console.log("Main loop execution time: " + time + "ms");
  }, 1000) // updates once per second (1000 milliseconds)
}

function playerCombatMods() { // eslint-disable-line no-unused-vars
  return (0.01 * ((window.vm.civData.riddle.owned) + (window.vm.civData.weaponry.owned) + (window.vm.civData.shields.owned)))
}

// Get an object's requirements in text form.
// Pass it a cost object and optional quantity
function getReqText(costObjArg, qty) {
  const costObj = valOf(costObjArg, isValid(qty) ? qty : 1) // valOf evals it if it's a function
  if (!isValid(costObj)) {
    return ''
  }

  let i
  let num
  let text = ''
  for (i in costObj) {
    // If the cost is a function, eval it with qty as a param.  Otherwise
    // just multiply by qty.
    num = (typeof costObj[i] === 'function') ? (costObj[i](qty)) : (costObj[i] * qty)
    if (!num) {
      continue
    }
    if (text) {
      text += ', '
    }
    text += `${prettify(Math.round(num))} ${window.vm.civData[i].getQtyName(num)}`
  }

  return text
}

// Returns when the player meets the given upgrade prereqs.
// Undefined prereqs are assumed to mean the item is unpurchasable
function meetsPrereqs(prereqObj) {
  if (!isValid(prereqObj)) {
    return false
  }
  let i
  for (i in prereqObj) { // eslint-disable-line no-restricted-syntax
    // xxx HACK:  Ugly special checks for non-upgrade pre-reqs.
    // This should be simplified/eliminated once the resource
    // system is unified.
    if (i === 'deity') { // Deity
      if (getCurDeityDomain() !== prereqObj[i]) {
        return false
      }
    }
    else if (i === 'wonderStage') { // xxx Hack to check if we're currently building a wonder.
      if (window.vm.curCiv.curWonder.stage !== prereqObj[i]) {
        return false
      }
    }
    else if (isValid(window.vm.civData[i]) && isValid(window.vm.civData[i].owned)) { // Resource/Building/Upgrade
      if (window.vm.civData[i].owned < prereqObj[i]) {
        return false
      }
    }
  }

  return true
}

// Returns how many of this item the player can afford.
// Looks only at the item's cost and the player's resources, and not
// at any other limits.
// Negative quantities are always fully permitted.
// An undefined cost structure is assumed to mean it cannot be purchased.
// A boolean quantity is converted to +1 (true) -1 (false)
// xxx Caps nonlinear purchases at +1, blocks nonlinear sales.
// costObj - The cost substructure of the object to purchase
function canAfford(costObj, qtyArg) {
  if (!isValid(costObj)) {
    return 0
  }
  // default to as many as we can
  let qty = (qtyArg === undefined) ? Infinity : qtyArg

  if (qty === false) {
    qty = -1
  } // Selling back a boolean item.

  for (const i in costObj) {
    if (costObj[i] === 0) {
      continue
    }

    // xxx We don't handle nonlinear costs here yet.
    // Cap nonlinear purchases to one at a time.
    // Block nonlinear sales.
    if (typeof costObj[i] === 'function') {
      qty = Math.max(0, Math.min(1, qty))
    }

    qty = Math.min(qty, Math.floor(window.vm.civData[i].owned / valOf(costObj[i])))
    if (qty === 0) {
      return qty
    }
  }

  return qty
}

// Tries to pay for the specified quantity of the given cost object.
// Pays for fewer if the whole amount cannot be paid.
// Return the quantity that could be afforded.
// xxx DOES NOT WORK for nonlinear building cost items!
function payFor(costObjArg, qtyArg) {
  // default to 1
  let qty = (qtyArg === undefined) ? 1 : qtyArg
  if (qty === false) {
    qty = -1
  } // Selling back a boolean item.
  const costObj = valOf(costObjArg, qty) // valOf evals it if it's a function
  if (!isValid(costObj)) {
    return 0
  }

  qty = Math.min(qty, canAfford(costObj))
  if (qty === 0) {
    return 0
  }

  let num
  for (const i in costObj) {
    // If the cost is a function, eval it with qty as a param.  Otherwise
    // just multiply by qty.
    num = (typeof costObj[i] === 'function') ? (costObj[i](qty)) : (costObj[i] * qty)
    if (!num) {
      continue
    }
    window.vm.civData[i].owned -= num
  }

  return qty
}

// Returns the number of the object that we could buy or sell, taking into
// account any applicable limits.
// purchaseObj - The object to purchase
// qty - Maximum number to buy/sell (use -Infinity for the max salable)
function canPurchase(purchaseObj, qtyArg) {
  if (!purchaseObj) {
    return 0
  }
  // Default to as many as we can.
  let qty = (qtyArg === undefined) ? Infinity : qtyArg
  if (qty === false) {
    qty = -1
  } // Selling back a boolean item.

  // Can't buy if we don't meet the prereqs.
  if (!meetsPrereqs(purchaseObj.prereqs)) {
    qty = Math.min(qty, 0)
  }

  // Can't sell more than we have (if salable at all)
  qty = Math.max(qty, -(purchaseObj.salable ? purchaseObj.owned : 0))

  // If this is a relocation, can't shift more than our source pool.
  if (purchaseObj.source) {
    qty = Math.min(qty, window.vm.civData[purchaseObj.source].owned)
  }

  // If this is a destination item, it's just a relocation of an existing
  // item, so we ignore purchase limits.  Otherwise we check them.
  if (purchaseObj.isDest && !purchaseObj.isDest()) {
    qty = Math.min(qty, purchaseObj.limit - purchaseObj.total)
  }

  // See if we can afford them; return fewer if we can't afford them all
  return Math.min(qty, canAfford(purchaseObj.require))
}

// Interface initialization code

// Much of this interface consists of tables of buttons, columns of which get
// revealed or hidden based on toggles and window.vm.population.  Currently, we do this
// by setting the "display" property on every affected <td>.  This is very
// inefficient, because it forces a table re-layout after every cell change.
//
// A better approach tried but ultimately abandoned was to use <col> elements
// to try to manipulate the columns wholesale.  Unfortunately, <col> is
// minimally useful, because only a few CSS properties are supported on <col>.
// Even though one of those, "visibility", purports to have the "collapse"
// value for just this purpose, it doesn't work; brower support for this
// property is very inconsistent, particularly in the handling of cell borders.
//
// Eventually, I hope to implement dynamic CSS rules, so that I can restyle
// lots of elements at once.

// Generate two HTML <span> texts to display an item's cost and effect note.
function getCostNote(civObj) {
  // Only add a ":" if both items are present.
  const reqText = getReqText(civObj.require)
  const effectText = (isValid(civObj.effectText)) ? civObj.effectText : ''
  const separator = (reqText && effectText) ? ': ' : ''

  return `<span id='${civObj.id}Cost' class='cost'>${reqText}</span>` +
    `<span id='${civObj.id}Note' class='note'>${separator}${civObj.effectText}</span>`
}

// Number format utility functions.
// - Allows testing the sign of strings that might be prefixed with '-' (like "-custom")
// - Output format uses the proper HTML entities for minus sign and infinity.
// Note that the sign of boolean false is treated as -1, since it indicates a
//   decrease in quantity (from 1 to 0).
function sgnnum(x) {
  return (x > 0) ? 1 : (x < 0) ? -1 : 0 // eslint-disable-line no-nested-ternary
}

function sgnstr(x) {
  return (x.length === 0) ? 0 : (x[0] === '-') ? -1 : 1 // eslint-disable-line no-nested-ternary
}

function sgnbool(x) {
  return (x ? 1 : -1)
}

function absstr(x) {
  return (x.length === 0) ? '' : (x[0] === '-') ? x.slice(1) : x // eslint-disable-line no-nested-ternary
}

function sgn(x) {
  return (typeof x === 'number') ? sgnnum(x) : // eslint-disable-line no-nested-ternary
    (typeof x === 'string') ? sgnstr(x) : // eslint-disable-line no-nested-ternary
    (typeof x === 'boolean') ? sgnbool(x) : 0 // eslint-disable-line no-nested-ternary
}

function abs(x) {
  return (typeof x === 'number') ? Math.abs(x) : (typeof x === 'string') ? absstr(x) : x // eslint-disable-line no-nested-ternary
}

// Pass this the item definition object.
// Or pass nothing, to create a blank row.
function getResourceRowText(purchaseObj) {
  // Make sure to update this if the number of columns changes.
  if (!purchaseObj) {
    return "<tr class='purchaseRow'><td colspan='6'/>&nbsp;</tr>"
  }

  const objId = purchaseObj.id
  const objName = purchaseObj.getQtyName(0)
  let s = `<tr id='${objId}Row' class='purchaseRow' data-target='${objId}'>`

  s += `<td><button class='btn btn-secondary btn-sm' data-action='increment'>${purchaseObj.verb} ${objName}</button></td>`
  s += `<td class='itemname'>${objName}: </td>`
  s += "<td class='number'><span data-action='display'>0</span></td>"
  s += `<td class='icon'><img src='/static/civclicker/images/${objId}.png' class='icon icon-lg' alt='${objName}'/></td>`
  s += `<td class='number'>(Max: <span id='max${objId}'>200</span>)</td>`
  s += "<td class='number net'><span data-action='displayNet'>0</span>/s</td>"

  s += '</tr>'

  return s
}

function getPurchaseCellText(purchaseObj, qty, inTableArg) {
  const inTable = (inTableArg === undefined) ? true : inTableArg

  // Internal utility functions.
  function sgnchr(x) {
    return (x > 0) ? '+' : (x < 0) ? '&minus;' : '' // eslint-disable-line no-nested-ternary
  }
  // xxx Hack: Special formatting for booleans, Infinity and 1k.
  function infchr(x) {
    return (x === Infinity) ? '&infin;' : (x === 1000) ? '1k' : x // eslint-disable-line no-nested-ternary
  }

  function fmtbool(x) {
    const neg = (sgn(x) < 0)
    return (neg ? '(' : '') + purchaseObj.getQtyName(0) + (neg ? ')' : '')
  }

  function fmtqty(x) {
    return (typeof x === 'boolean') ? fmtbool(x) : sgnchr(sgn(x)) + infchr(abs(x))
  }

  function allowPurchase() {
    if (!qty) {
      return false
    } // No-op

    // Can't buy/sell items not controlled by player
    if (purchaseObj.alignment && (purchaseObj.alignment !== 'player')) {
      return false
    }

    // Quantities > 1 are meaningless for boolean items.
    if ((typeof purchaseObj.initOwned === 'boolean') && (abs(qty) > 1)) {
      return false
    }

    // Don't buy/sell unbuyable/unsalable items.
    if ((sgn(qty) > 0) && (purchaseObj.require === undefined)) {
      return false
    }
    if ((sgn(qty) < 0) && (!purchaseObj.salable)) {
      return false
    }

    // xxx Right now, variable-cost items can't be sold, and are bought one-at-a-time.
    if ((qty !== 1) && purchaseObj.hasVariableCost()) {
      return false
    }

    return true
  }

  const tagName = inTable ? 'td' : 'span'
  const className = (abs(qty) === 'custom') ? 'buy' : purchaseObj.type // 'custom' buttons all use the same class.

  let s = `<${tagName} class='${className}${abs(qty)}' data-quantity='${qty}' >`
  if (allowPurchase()) {
    s += `<button class='btn btn-secondary btn-sm x${abs(qty)}' data-action='purchase' disabled='disabled'>${fmtqty(qty)}</button>`
  }
  s += `</${tagName}>`
  return s
}

// Pass this the item definition object.
// Or pass nothing, to create a blank row.
function getPurchaseRowText(purchaseObj) {
  // Make sure to update this if the number of columns changes.
  if (!purchaseObj) {
    return "<tr class='purchaseRow'><td colspan='13'/>&nbsp;</tr>"
  }

  const objId = purchaseObj.id
  let s = `<tr id='${objId}Row' class='purchaseRow' data-target='${purchaseObj.id}'>`;

  [-Infinity, '-custom', -100, -10, -1]
  .forEach((elem) => {
    s += getPurchaseCellText(purchaseObj, elem)
  })

  const enemyFlag = (purchaseObj.alignment === 'enemy') ? ' enemy' : ''
  s += `<td class='itemname${enemyFlag}'>${purchaseObj.getQtyName(0)}: </td>`

  const action = (isValid(window.vm.population[objId])) ? 'display_pop' : 'display' // xxx Hack
  s += `<td class='number'><span data-action='${action}'>0</span></td>`;

  // Don't allow Infinite (max) purchase on things we can't sell back.
  [1, 10, 100, 'custom', ((purchaseObj.salable) ? Infinity : 1000)]
  .forEach((elem) => {
    s += getPurchaseCellText(purchaseObj, elem)
  })

  s += `<td>${getCostNote(purchaseObj)}</td>`
  s += '</tr>'

  return s
}

// For efficiency, we set up a single bulk listener for all of the buttons, rather
// than putting a separate listener on each button.
function onBulkEvent(e) {
  switch (dataset(e.target, 'action')) {
    case 'increment':
      return onIncrement(e.target)
    case 'purchase':
      return onPurchase(e.target)
    case 'raid':
      return onInvade(e.target)
    default:
      return false
  }
}

function addUITable(civObjs, groupElemName) {
  let s = ''
  civObjs.forEach((elem) => {
    s += elem.type === 'resource' ? getResourceRowText(elem) : // eslint-disable-line no-nested-ternary
      elem.type === 'upgrade' ? getUpgradeRowText(elem) :
      getPurchaseRowText(elem)
  })
  const groupElem = document.getElementById(groupElemName)
  groupElem.innerHTML += s
  groupElem.onmousedown = onBulkEvent
  return groupElem
}

// xxx This should become an onGain() member method of the building classes
function updateRequirements(buildingObj) {
  const displayNode = document.getElementById(`${buildingObj.id}Cost`)
  if (displayNode) {
    displayNode.innerHTML = getReqText(buildingObj.require)
  }
}

function updatePurchaseRow(purchaseObj) {
  if (!purchaseObj) {
    return
  }

  const elem = document.getElementById(`${purchaseObj.id}Row`)
  if (!elem) {
    console.error(`Missing UI for ${purchaseObj.id}`)
    return
  }

  // If the item's cost is variable, update its requirements.
  if (purchaseObj.hasVariableCost()) {
    updateRequirements(purchaseObj)
  }

  // Already having one reveals it as though we met the prereq.
  const havePrereqs = (purchaseObj.owned > 0) || meetsPrereqs(purchaseObj.prereqs)

  // Special check: Hide one-shot upgrades after purchase; they're
  // redisplayed elsewhere.
  const hideBoughtUpgrade = ((purchaseObj.type === 'upgrade') && (purchaseObj.owned === purchaseObj.limit) && !purchaseObj.salable)

  // Reveal the row if  prereqs are met
  setElemDisplay(elem, havePrereqs && !hideBoughtUpgrade)

  const maxQty = canPurchase(purchaseObj)
  const minQty = canPurchase(purchaseObj, -Infinity)

  const buyElems = elem.querySelectorAll("[data-action='purchase']")
  let i
  let purchaseQty
  let absQty
  let curElem
  for (i = 0; i < buyElems.length; ++i) {
    curElem = buyElems[i]
    purchaseQty = dataset(curElem, 'quantity')
    // Treat 'custom' or Infinity as +/-1.
    // xxx Should we treat 'custom' as its appropriate value instead?
    absQty = abs(purchaseQty)
    if ((absQty === 'custom') || (absQty === Infinity)) {
      purchaseQty = sgn(purchaseQty)
    }

    curElem.disabled = ((purchaseQty > maxQty) || (purchaseQty < minQty))
  }
}

// Only set up for the basic resources right now.
function updateResourceRows() {
  window.vm.basicResources.forEach((elem) => {
    updatePurchaseRow(elem)
  })
}
// Enables/disabled building buttons - calls each type of building in turn
// Can't do altars; they're not in the proper format.
function updateBuildingButtons() {
  window.vm.homeBuildings.forEach((elem) => {
    updatePurchaseRow(elem)
  })
}
// Update the page with the latest worker distribution and stats
function updateJobButtons() {
  window.vm.homeUnits.forEach((elem) => {
    updatePurchaseRow(elem)
  })
}
// Updates the party (and enemies)
function updatePartyButtons() {
  window.vm.armyUnits.forEach((elem) => {
    updatePurchaseRow(elem)
  })
}

// We have a separate row generation function for upgrades, because their
// layout is differs greatly from buildings/units:
//  - Upgrades are boolean, so they don't need multi-purchase buttons.
//  - Upgrades don't need quantity labels, and put the name in the button.
//  - Upgrades are sometimes generated in a table with <tr>, but sometimes
//    outside of one with <span>.
function getUpgradeRowText(upgradeObj, inTableArg) {
  const inTable = (inTableArg === undefined) ? true : inTableArg
  const cellTagName = inTable ? 'td' : 'span'
  const rowTagName = inTable ? 'tr' : 'span'
  // Make sure to update this if the number of columns changes.
  if (!upgradeObj) {
    return inTable ? `<${rowTagName} class='purchaseRow'><td colspan='2'/>&nbsp;</${rowTagName}>` : ''
  }

  let s = `<${rowTagName} id='${upgradeObj.id}Row' class='purchaseRow'`
  s += ` data-target='${upgradeObj.id}'>`
  s += getPurchaseCellText(upgradeObj, true, inTable)
  s += `<${cellTagName}>${getCostNote(upgradeObj)}</${cellTagName}>`
  if (!inTable) {
    s += '<br>'
  }
  s += `</${rowTagName}>`
  return s
}

function getPantheonUpgradeRowText(upgradeObj) {
  if (!upgradeObj) {
    return ''
  }

  let s = `<tr id='${upgradeObj.id}Row' class='purchaseRow'>`
  // Don't include devotion if it isn't valid.
  // xxx Should write a chained dereference eval
  s += "<td class='devcost'>"
  s += `${(isValid(upgradeObj.prereqs) && isValid(upgradeObj.prereqs.devotion)) ?
    (`${upgradeObj.prereqs.devotion}d&nbsp;`) : ''}</td>`
  // xxx The 'fooRow' id is added to make altars work, but should be redesigned.
  s += `<td class='${upgradeObj.type}true'><button id='${upgradeObj.id}' class='btn btn-secondary btn-sm xtrue'`
  s += ` data-action='purchase' data-quantity='true' data-target=${upgradeObj.id}`
  s += " disabled='disabled' onmousedown=\""
  // The event handler can take three forms, depending on whether this is
  // an altar, a prayer, or a pantheon upgrade.
  s += ((upgradeObj.subType === 'prayer') ? (`${upgradeObj.id}()`) :
    ('onPurchase(this)'))
  s += `">${upgradeObj.getQtyName()}</button>`
  s += `${isValid(upgradeObj.extraText) ? upgradeObj.extraText : ''}</td>`
  s += `<td>${getCostNote(upgradeObj)}</td>`
  s += '</tr>'

  return s
}
// Returns the new element
function setPantheonUpgradeRowText(upgradeObj) {
  if (!upgradeObj) {
    return null
  }
  const elem = document.getElementById(`${upgradeObj.id}Row`)
  if (!elem) {
    return null
  }

  elem.outerHTML = getPantheonUpgradeRowText(upgradeObj) // Replaces elem
  return document.getElementById(`${upgradeObj.id}Row`) // Return replaced element
}
// Dynamically create the upgrade purchase buttons.
function addUpgradeRows() {
  document.getElementById('upgradesPane').innerHTML +=
    "<h3>Purchased Upgrades</h3><div id='purchasedUpgrades'></div>"

  // Fill in any pre-existing stubs.
  window.vm.upgradeData.forEach((elem) => {
    if (elem.subType === 'upgrade') {
      return
    } // Did these above.
    if (elem.subType === 'pantheon') {
      setPantheonUpgradeRowText(elem)
    }
    else { // One of the 'atypical' upgrades not displayed in the main upgrade list.
      let stubElem = document.getElementById(`${elem.id}Row`)
      if (!stubElem) {
        console.error(`Missing UI element for ${elem.id}`)
        return
      }
      stubElem.outerHTML = getUpgradeRowText(elem, false) // Replaces stubElem
      stubElem = document.getElementById(`${elem.id}Row`) // Get stubElem again.
      stubElem.onmousedown = onBulkEvent
    }
  })

  // Altars
  window.vm.buildingData.forEach((elem) => {
    if (elem.subType === 'altar') {
      setPantheonUpgradeRowText(elem)
    }
  })

  // Deity granted powers
  window.vm.powerData.forEach((elem) => {
    if (elem.subType === 'prayer') {
      setPantheonUpgradeRowText(elem)
    }
  })

  // Dynamically create two lists for purchased upgrades.
  // One for regular upgrades, one for pantheon upgrades.
  let text = ''
  let standardUpgStr = ''
  let pantheonUpgStr = ''

  window.vm.upgradeData.forEach((upgradeObj) => {
    text = `<span id='P${upgradeObj.id}' class='Pupgrade'>` +
      `<strong>${upgradeObj.getQtyName()}</strong>` +
      ` &ndash; ${upgradeObj.effectText}<br></span>`
    if (upgradeObj.subType === 'pantheon') {
      pantheonUpgStr += text
    }
    else {
      standardUpgStr += text
    }
  })

  document.getElementById('purchasedUpgrades').innerHTML += standardUpgStr
  document.getElementById('purchasedPantheon').innerHTML = pantheonUpgStr
}

// Update functions. Called by other routines in order to update the interface.

// xxx Maybe add a function here to look in various locations for vars, so it
// doesn't need multiple action types?
function updateResourceTotals() {
  let i
  let displayElems
  let elem
  let val

  // Scan the HTML document for elements with a "data-action" element of
  // "display".  The "data-target" of such elements (or their ancestors)
  // is presumed to contain
  // the global variable name to be displayed as the element's content.
  // xxx Note that this is now also updating nearly all updatable values,
  // including window.vm.population.
  displayElems = document.querySelectorAll("[data-action='display']")
  for (i = 0; i < displayElems.length; ++i) {
    elem = displayElems[i]
    // xxx Have to use window.vm.curCiv here because of zombies and other non-window.vm.civData displays.
    elem.innerHTML = prettify(Math.floor(window.vm.curCiv[dataset(elem, 'target')].owned))
  }

  // Update net production values for primary resources.  Same as the above,
  // but look for "data-action" == "displayNet".
  displayElems = document.querySelectorAll("[data-action='displayNet']")
  for (i = 0; i < displayElems.length; ++i) {
    elem = displayElems[i]
    val = window.vm.civData[dataset(elem, 'target')].net
    if (!isValid(val)) {
      continue
    }

    // Colourise net production values.
    if (val < 0) {
      elem.style.color = '#f00'
    }
    else if (val > 0) {
      elem.style.color = '#0b0'
    }
    else {
      elem.style.color = '#000'
    }

    elem.innerHTML = prettify(val.toFixed(1))
  }

  if (window.vm.civData.gold.owned >= 1) {
    setElemDisplay('goldRow', true)
  }

  // Update page with building numbers, also stockpile limits.
  document.getElementById('maxfood').innerHTML = prettify(window.vm.civData.food.limit)
  document.getElementById('maxwood').innerHTML = prettify(window.vm.civData.wood.limit)
  document.getElementById('maxstone').innerHTML = prettify(window.vm.civData.stone.limit)

  // Update land values
  let buildingCount = 0
  let landCount = 0
  window.vm.buildingData.forEach(function(elem) { // eslint-disable-line
    if (elem.subType === 'land') {
      landCount += elem.owned
    }
    else {
      buildingCount += elem.owned
    }
  })
  document.getElementById('totalBuildings').innerHTML = prettify(buildingCount)
  document.getElementById('totalLand').innerHTML = prettify(buildingCount + landCount)

  // Unlock advanced control tabs as they become enabled (they never disable)
  // Temples unlock Deity, barracks unlock Conquest, having gold unlocks Trade.
  // Deity is also unlocked if there are any prior deities present.
  if ((window.vm.civData.temple.owned > 0) || (window.vm.curCiv.deities.length > 1)) {
    setElemDisplay('deitySelect', true)
  }
  if (window.vm.civData.barracks.owned > 0) {
    setElemDisplay('conquestSelect', true)
  }
  if (window.vm.civData.gold.owned > 0) {
    setElemDisplay('tradeSelect', true)
  }

  // Need to have enough resources to trade
  document.getElementById('trader').disabled = !window.vm.curCiv.trader || !window.vm.curCiv.trader.timer ||
    (window.vm.civData[window.vm.curCiv.trader.materialId].owned < window.vm.curCiv.trader.requested)

  // Cheaters don't get names.
  document.getElementById('renameRuler').disabled = (window.vm.curCiv.rulerName === 'Cheater')

  updatePopulation() // updatePopulation() handles the window.vm.population limit, which is determined by buildings.
  updatePopulationUI() // xxx Maybe remove this?
}

function updatePopulation() {
  // Update window.vm.population limit by multiplying out housing numbers
  window.vm.population.limit = window.vm.civData.tent.owned +
      (window.vm.civData.hut.owned * 3) + (window.vm.civData.cottage.owned * 6) +
      (window.vm.civData.house.owned * (10 + ((window.vm.civData.tenements.owned) * 2) +
      ((window.vm.civData.slums.owned) * 2))) + (window.vm.civData.mansion.owned * 50)

  // Update sick workers
  window.vm.population.totalSick = 0
  window.vm.unitData.forEach(function(elem) { // eslint-disable-line
    if (elem.alignment === 'player') {
      window.vm.population.totalSick += (elem.ill || 0)
    }
  })
  setElemDisplay('totalSickRow', (window.vm.population.totalSick > 0))

  // Calculate healthy workers (excludes sick, zombies and deployed units)
  // xxx Should this use 'window.vm.killable'?
  window.vm.population.healthy = 0
  window.vm.unitData.forEach((elem) => {
    if ((elem.vulnerable)) {
      window.vm.population.healthy += elem.owned
    }
  })
  // xxx Doesn't subtracting the zombies here throw off the calculations in randomHealthyWorker()?
  window.vm.population.healthy -= window.vm.curCiv.zombie.owned

  // Calculate housed/fed window.vm.population (excludes zombies)
  window.vm.population.current = window.vm.population.healthy + window.vm.population.totalSick
  window.vm.unitData.forEach((elem) => {
    if ((elem.alignment === 'player') && (elem.subType === 'normal') && (elem.place === 'party')) {
      window.vm.population.current += elem.owned
    }
  })

  // Zombie soldiers dying can drive window.vm.population.current negative if they are killed and zombies are the only thing left.
  // xxx This seems like a hack that should be given a real fix.
  if (window.vm.population.current < 0) {
    if (window.vm.curCiv.zombie.owned > 0) {
      // This fixes that by removing zombies and setting to zero.
      window.vm.curCiv.zombie.owned += window.vm.population.current
      window.vm.population.current = 0
    }
    else {
      console.error('Warning: Negative current window.vm.population detected.')
    }
  }
}

// Update page with numbers
function updatePopulationUI() {
  let i
  let elem
  let elems

  // Scan the HTML document for elements with a "data-action" element of
  // "display_pop".  The "data-target" of such elements is presumed to contain
  // the window.vm.population subproperty to be displayed as the element's content.
  // xxx This selector should probably require data-target too.
  // xxx Note that relatively few values are still stored in the window.vm.population
  // struct; most of them are now updated by the 'display' action run
  // by updateResourceTotals().
  const displayElems = document.querySelectorAll("[data-action='display_pop']")
  for (i = 0; i < displayElems.length; ++i) {
    elem = displayElems[i]
    elem.innerHTML = prettify(Math.floor(window.vm.population[dataset(elem, 'target')]))
  }

  window.vm.civData.house.update() // xxx Effect might change dynamically.  Need a more general way to do this.

  setElemDisplay('graveTotal', (window.vm.curCiv.grave.owned > 0))

  // As window.vm.population increases, various things change
  // Update our civ type name
  let civType = window.vm.civSizes.getCivSize(window.vm.population.current).name
  if (window.vm.population.current === 0 && window.vm.population.limit >= 1000) {
    civType = 'Ghost Town'
  }
  if (window.vm.curCiv.zombie.owned >= 1000 && window.vm.curCiv.zombie.owned >= 2 * window.vm.population.current) { // easter egg
    civType = 'Necropolis'
  }
  document.getElementById('civType').innerHTML = civType

  // Unlocking interface elements as window.vm.population increases to reduce unnecessary clicking
  // xxx These should be reset in reset()
  if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 10) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('unit10')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }
  if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 100) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('building10')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
      elems = document.getElementsByClassName('unit100')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }
  if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 1000) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('building100')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
      elems = document.getElementsByClassName('unit1000')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
      elems = document.getElementsByClassName('unitInfinity')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }
  if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 10000) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('building1000')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }

  // Turning on/off buttons based on free space.
  const maxSpawn = Math.max(0, Math.min(
    (window.vm.population.limit - window.vm.population.current),
    logSearchFn(calcWorkerCost, window.vm.civData.food.owned)))

  document.getElementById('spawn1button').disabled = (maxSpawn < 1)
  document.getElementById('spawnCustomButton').disabled = (maxSpawn < 1)
  document.getElementById('spawnMaxbutton').disabled = (maxSpawn < 1)
  document.getElementById('spawn10button').disabled = (maxSpawn < 10)
  document.getElementById('spawn100button').disabled = (maxSpawn < 100)
  document.getElementById('spawn1000button').disabled = (maxSpawn < 1000)

  const canRaise = (getCurDeityDomain() === 'underworld' && window.vm.civData.devotion.owned >= 20)
  const maxRaise = canRaise ? logSearchFn(calcZombieCost, window.vm.civData.piety.owned) : 0
  setElemDisplay('raiseDeadRow', canRaise)
  document.getElementById('raiseDead').disabled = (maxRaise < 1)
  document.getElementById('raiseDeadMax').disabled = (maxRaise < 1)
  document.getElementById('raiseDead100').disabled = (maxRaise < 100)

  // Calculates and displays the cost of buying workers at the current window.vm.population.
  document.getElementById('raiseDeadCost').innerHTML = prettify(Math.round(calcZombieCost(1)))
  document.getElementById('workerCost').innerHTML = prettify(Math.round(calcWorkerCost(1)))
  document.getElementById('workerCost10').innerHTML = prettify(Math.round(calcWorkerCost(10)))
  document.getElementById('workerCost100').innerHTML = prettify(Math.round(calcWorkerCost(100)))
  document.getElementById('workerCost1000').innerHTML = prettify(Math.round(calcWorkerCost(1000)))
  document.getElementById('workerNumMax').innerHTML = prettify(Math.round(maxSpawn))
  document.getElementById('workerCostMax').innerHTML = prettify(Math.round(calcWorkerCost(maxSpawn)))
  updateJobButtons() // handles the display of units in the player's kingdom.
  updatePartyButtons() // handles the display of units out on raids.
  updateMorale()
  updateAchievements() // handles display of achievements
}

function idToType(domainId) {
  if (domainId === 'battle') {
    return 'Battle'
  }
  if (domainId === 'cats') {
    return 'Cats'
  }
  if (domainId === 'fields') {
    return 'the Fields'
  }
  if (domainId === 'underworld') {
    return 'the Underworld'
  }
  return domainId
}

// Check to see if the player has an upgrade and hide as necessary
// Check also to see if the player can afford an upgrade and enable/disable as necessary
function updateUpgrades() {
  // Update all of the upgrades
  window.vm.upgradeData.forEach((elem) => {
    updatePurchaseRow(elem) // Update the purchase row.

    // Show the already-purchased line if we've already bought it.
    setElemDisplay((`P${elem.id}`), elem.owned)
  })

  // deity techs
  document.getElementById('renameDeity').disabled = (!window.vm.civData.worship.owned)
  setElemDisplay('deityDomains', ((window.vm.civData.worship.owned) && (getCurDeityDomain() === '')))
  setElemDisplay('battleUpgrades', (getCurDeityDomain() === 'battle'))
  setElemDisplay('fieldsUpgrades', (getCurDeityDomain() === 'fields'))
  setElemDisplay('underworldUpgrades', (getCurDeityDomain() === 'underworld'))
  setElemDisplay('zombieWorkers', (window.vm.curCiv.zombie.owned > 0))
  setElemDisplay('catsUpgrades', (getCurDeityDomain() === 'cats'))

  const deitySpecEnable = window.vm.civData.worship.owned && (getCurDeityDomain() === '') && (window.vm.civData.piety.owned >= 500)
  document.getElementById('battleDeity').disabled = !deitySpecEnable
  document.getElementById('fieldsDeity').disabled = !deitySpecEnable
  document.getElementById('underworldDeity').disabled = !deitySpecEnable
  document.getElementById('catsDeity').disabled = !deitySpecEnable

  // standard
  setElemDisplay('conquest', window.vm.civData.standard.owned)

  // Trade
  setElemDisplay('tradeUpgradeContainer', window.vm.civData.trade.owned)
}

function updateDeity() {
  // Update page with deity details
  document.getElementById('deityAName').innerHTML = window.vm.curCiv.deities[0].name
  document.getElementById('deityADomain').innerHTML = getCurDeityDomain() ? `, deity of ${idToType(getCurDeityDomain())}` : ''
  document.getElementById('deityADevotion').innerHTML = window.vm.civData.devotion.owned

  // Display if we have an active deity, or any old ones.
  setElemDisplay('oldDeities', (window.vm.curCiv.deities[0].name || window.vm.curCiv.deities.length > 1))
  setElemDisplay('iconoclasmGroup', (window.vm.curCiv.deities.length > 1))
}

function getDeityRowText(deityId, deityObj) {
  if (!deityObj) {
    deityObj = { // eslint-disable-line no-param-reassign
      name: 'No deity',
      domain: '',
      maxDev: 0,
    }
  }

  return `<tr id='${deityId}'>` +
    `<td><strong><span id='${deityId}Name'>${deityObj.name}</span></strong>` +
    `<span id=${deityId}Domain' class='deityDomain'></td><td>${idToType(deityObj.domain)}</span></td>` +
    `<td><span id='${deityId}Devotion'>${deityObj.maxDev}</span></td></tr>`
}

function makeDeitiesTables() {
  // Display the active deity
  const deityId = 'deityA'
  document.getElementById('activeDeity').innerHTML = `<tr id="${deityId}">` +
    `<td><strong><span id="${deityId}Name"></span></strong>` +
    `<span id="${deityId}Domain" class="deityDomain"></span></td>` +
    `<td>Devotion: <span id="${deityId}Devotion"></span></td></tr>`

  // Display the table of prior deities.
  // xxx Change this to <th>, need to realign left.
  let s = '<tr><td><b>Name</b></td><td><b>Domain</b></td><td><b>Max Devotion</b></td></tr>'
  window.vm.curCiv.deities.forEach((elem, i) => {
    if ((i === 0) && (!elem.name)) {
      return
    } // Don't display current deity-in-waiting.
    s += getDeityRowText(`deity${i}`, elem)
  })
  document.getElementById('oldDeities').innerHTML = s

  updateDeity()
}

// Enables or disables availability of activated religious powers.
// Passive religious benefits are handled by the upgrade system.
function updateDevotion() {
  document.getElementById('deityADevotion').innerHTML = window.vm.civData.devotion.owned

  // Process altars
  window.vm.buildingData.forEach((elem) => {
    if (elem.subType === 'altar') {
      setElemDisplay((`${elem.id}Row`), meetsPrereqs(elem.prereqs))
      document.getElementById(elem.id).disabled = (!(meetsPrereqs(elem.prereqs) && canAfford(elem.require)))
    }
  })

  // Process activated powers
  window.vm.powerData.forEach((elem) => {
    if (elem.subType === 'prayer') {
      // xxx raiseDead buttons updated by UpdatePopulationUI
      if (elem.id === 'raiseDead') {
        return
      }
      setElemDisplay((`${elem.id}Row`), meetsPrereqs(elem.prereqs))
      document.getElementById(elem.id).disabled = !(meetsPrereqs(elem.prereqs) && canAfford(elem.require))
    }
  })

  // xxx Smite should also be disabled if there are no foes.

  // xxx These costs are not yet handled by canAfford().
  if (window.vm.population.healthy < 1) {
    document.getElementById('wickerman').disabled = true
    document.getElementById('walk').disabled = true
  }

  document.getElementById('ceaseWalk').disabled = (window.vm.civData.walk.rate === 0)
}

// Displays achievements if they are unlocked
function updateAchievements() {
  window.vm.achData.forEach((achObj) => {
    setElemDisplay(achObj.id, achObj.owned)
  })
}

function testAchievements() {
  window.vm.achData.forEach((achObj) => {
    if (window.vm.civData[achObj.id].owned) {
      return true
    }
    if (isValid(achObj.test) && !achObj.test()) {
      return false
    }
    window.vm.civData[achObj.id].owned = true
    gameLog(`Achievement Unlocked: ${achObj.getQtyName()}`)
    return true
  })

  updateAchievements()
}

// Enable the raid buttons for eligible targets.
function updateTargets() {
  let i
  const raidButtons = document.getElementsByClassName('raid')
  let haveArmy = false

  setElemDisplay('victoryGroup', window.vm.curCiv.raid.victory)

  // Raid buttons are only visible when not already raiding.
  if (setElemDisplay('raidGroup', !window.vm.curCiv.raid.raiding)) {
    if (getCombatants('party', 'player').length > 0) {
      haveArmy = true
    }

    let curElem
    for (i = 0; i < raidButtons.length; ++i) {
      // Disable if we have no standard, no army, or they are too big a target.
      curElem = raidButtons[i]
      curElem.disabled = (!window.vm.civData.standard.owned || !haveArmy ||
        (window.vm.civSizes[dataset(curElem, 'target')].idx > window.vm.civSizes[window.vm.curCiv.raid.targetMax].idx))
    }
  }
}

function updateMorale() {
  // updates the morale stat
  let text
  let color
  // first check there's someone to be happy or unhappy, not including zombies
  if (window.vm.population.current < 1) {
    window.vm.curCiv.morale.efficiency = 1.0
  }

  if (window.vm.curCiv.morale.efficiency > 1.4) {
    text = 'Blissful'
    color = '#f0f'
  }
  else if (window.vm.curCiv.morale.efficiency > 1.2) {
    text = 'Happy'
    color = '#00f'
  }
  else if (window.vm.curCiv.morale.efficiency > 0.8) {
    text = 'Content'
    color = '#0b0'
  } // Was "#0d0" if pop === 0
  else if (window.vm.curCiv.morale.efficiency > 0.6) {
    text = 'Unhappy'
    color = '#880'
  }
  else {
    text = 'Angry'
    color = '#f00'
  }
  document.getElementById('morale').innerHTML = text
  document.getElementById('morale').style.color = color
}

// updates the display of wonders and wonder building
function updateWonder() {
  const haveTech = (window.vm.civData.architecture.owned && window.vm.civData.civilservice.owned)

  // Display this section if we have any wonders or could build one.
  setElemDisplay('wondersContainer', (haveTech || window.vm.curCiv.wonders.length > 0))

  // Can start building a wonder, but haven't yet.
  setElemDisplay('startWonderLine', (haveTech && window.vm.curCiv.curWonder.stage === 0))
  document.getElementById('startWonder').disabled = (!haveTech || window.vm.curCiv.curWonder.stage !== 0)

  // Construction in progress; show/hide building area and labourers
  setElemDisplay('labourerRow', (window.vm.curCiv.curWonder.stage === 1))
  document.getElementById('speedWonder').disabled = (window.vm.curCiv.curWonder.stage !== 1 || !canAfford({
    gold: 100,
  }))

  // Finished, but haven't picked the resource yet.
  setElemDisplay('wonderCompleted', (window.vm.curCiv.curWonder.stage === 2))

  updateWonderList()
}

function updateWonderList() {
  if (window.vm.curCiv.wonders.length === 0) {
    return
  }

  let i
  // update wonder list
  let wonderhtml = '<tr><td><strong>Name</strong></td><td><strong>Type</strong></td></tr>'
  for (i = (window.vm.curCiv.wonders.length - 1); i >= 0; --i) {
    try {
      wonderhtml += `<tr><td>${window.vm.curCiv.wonders[i].name}</td><td>${window.vm.curCiv.wonders[i].resourceId}</td></tr>`
    }
    catch (err) {
      console.error(`Could not build wonder row ${i}`)
    }
  }
  document.getElementById('pastWonders').innerHTML = wonderhtml
}

function updateReset() {
  setElemDisplay('resetNote', (window.vm.civData.worship.owned || window.vm.curCiv.curWonder.stage === 3))
  setElemDisplay('resetDeity', (window.vm.civData.worship.owned))
  setElemDisplay('resetWonder', (window.vm.curCiv.curWonder.stage === 3))
  setElemDisplay('resetBoth', (window.vm.civData.worship.owned && window.vm.curCiv.curWonder.stage === 3))
}

function update() {
  // unified update function. NOT YET IMPLEMENTED

  // debugging - mark beginning of function execution
  const start = new Date().getTime()

  // call each existing update subfunction in turn
  updateResourceTotals() // need to remove call to updatePopulation, move references to upgrades
  updatePopulation() // move enabling/disabling by space to updateJobButtons, remove calls to updateJobButtons, updateMorale, updateAchievements
  updatePopulationUI()
  updateResourceRows()
  updateBuildingButtons()
  updateJobButtons()
  updatePartyButtons()
  updateUpgrades()
  // updateDeity(); --- only needs to be called on initialisation and deity-related interactions ---
  // makeDeitiesTables(); --- only needs to be called on initialisation and deity-related interactions ---
  updateDevotion() // need to add else clauses to disable buttons, change the way updates are revealed (unhidden as devotion increases)
  // updateRequirements(); --- only needs to be called on building-related interactions, though must subsequently call the update() function ---
  updateAchievements() // should probably include else clauses
  // updateTargets();  --- only to be called at initialisation and targetMax alterations
  updateMorale()
  updateWonder() // remove reference to updateWonderList
  // updateWonderList(); --- only to be called at initialisation and when wonders are created ---
  updateReset()

  // Debugging - mark end of function, calculate delta in milliseconds, and print to console
  const end = new Date().getTime()
  const time = end - start
  // console.log("Update loop execution time: " + time + "ms"); //temporary altered to return time in order to run a debugging function
  return time
}

// Game functions

// This function is called every time a player clicks on a primary resource button
function increment(objId) {
  const purchaseObj = window.vm.civData[objId]
  if (!purchaseObj) {
    console.error(`Unknown purchase: ${objId}`)
    return
  }

  let numArmy = 0
  window.vm.unitData.forEach((elem) => {
    if ((elem.alignment === 'player') && (elem.species === 'human') &&
      (elem.combatType) && (elem.place === 'home')) {
      numArmy += elem.owned
    }
  }) // Nationalism adds military units.

  purchaseObj.owned += purchaseObj.increment +
    (purchaseObj.increment * 9 * (window.vm.civData.civilservice.owned)) +
    (purchaseObj.increment * 40 * (window.vm.civData.feudalism.owned)) +
    ((window.vm.civData.serfs.owned) * Math.floor(Math.log((window.vm.civData.unemployed.owned * 10) + 1))) +
    ((window.vm.civData.nationalism.owned) * Math.floor(Math.log((numArmy * 10) + 1)))

  // Handles random collection of special resources.
  let specialChance = purchaseObj.specialChance
  if (specialChance && purchaseObj.specialMaterial && window.vm.civData[purchaseObj.specialMaterial]) {
    if ((purchaseObj === window.vm.civData.food) && (window.vm.civData.flensing.owned)) {
      specialChance += 0.1
    }
    if ((purchaseObj === window.vm.civData.stone) && (window.vm.civData.macerating.owned)) {
      specialChance += 0.1
    }
    if (Math.random() < specialChance) {
      const specialMaterial = window.vm.civData[purchaseObj.specialMaterial]
      const specialQty = purchaseObj.increment * (1 + (9 * (window.vm.civData.guilds.owned)))
      specialMaterial.owned += specialQty
      gameLog(`Found ${specialMaterial.getQtyName(specialQty)} while ${purchaseObj.activity}`) // I18N
    }
  }
  // Checks to see that resources are not exceeding their limits
  if (purchaseObj.owned > purchaseObj.limit) {
    purchaseObj.owned = purchaseObj.limit
  }

  window.vm.curCiv.resourceClicks += 1
  updateResourceTotals() // Update the page with totals
}

function onIncrement(control) {
  // We need a valid target to complete this action.
  const targetId = dataset(control, 'target')
  if (targetId === null) {
    return false
  }

  return increment(targetId)
}

// Buys or sells a unit, building, or upgrade.
// Pass a positive number to buy, a negative number to sell.
// If it can't add/remove as many as requested, does as many as it can.
// Pass Infinity/-Infinity as the num to get the max possible.
// Pass "custom" or "-custom" to use the custom increment.
// Returns the actual number bought or sold (negative if fired).
function doPurchase(objId, numArg) {
  const purchaseObj = window.vm.civData[objId]
  if (!purchaseObj) {
    console.error(`Unknown purchase: ${objId}`)
    return 0
  }
  let num = (numArg === undefined) ? 1 : numArg
  if (abs(num) === 'custom') {
    num = sgn(num) * getCustomNumber(purchaseObj)
  }

  num = canPurchase(purchaseObj, num) // How many can we actually get?

  // Pay for them
  num = payFor(purchaseObj.require, num)
  if (abs(num) < 1) {
    gameLog('Could not build, insufficient resources.') // I18N
    return 0
  }

  // Then increment the total number of that building
  // Do the actual purchase; coerce to the proper type if needed
  purchaseObj.owned = matchType(purchaseObj.owned + num, purchaseObj.initOwned)
  if (purchaseObj.source) {
    window.vm.civData[purchaseObj.source].owned -= num
  }

  // Post-purchase triggers
  if (isValid(purchaseObj.onGain)) {
    purchaseObj.onGain(num)
  } // Take effect

  // Increase devotion if the purchase provides it.
  if (isValid(purchaseObj.devotion)) {
    window.vm.civData.devotion.owned += purchaseObj.devotion * num
    // If we've exceeded this deity's prior max, raise it too.
    if (window.vm.curCiv.deities[0].maxDev < window.vm.civData.devotion.owned) {
      window.vm.curCiv.deities[0].maxDev = window.vm.civData.devotion.owned
      makeDeitiesTables()
    }
  }

  // Then check for overcrowding
  if ((purchaseObj.type === 'building') && --window.vm.civData.freeLand.owned < 0) { // eslint-disable-line no-plusplus
    gameLog('You are suffering from overcrowding.') // I18N
    adjustMorale(Math.max(num, -window.vm.civData.freeLand.owned) * -0.0025 * (window.vm.civData.codeoflaws.owned ? 0.5 : 1.0))
  }

  updateRequirements(purchaseObj) // Increases buildings' costs
  updateResourceTotals() // Update page with lower resource values and higher building total
  updatePopulationUI() // Updates the army display
  updateResourceRows() // Update resource display
  updateBuildingButtons() // Update the buttons themselves
  updateJobButtons() // Update page with individual worker numbers, since limits might have changed.
  updatePartyButtons()
  updateUpgrades() // Update which upgrades are available to the player
  updateDevotion() // might be necessary if building was an altar
  updateTargets() // might enable/disable raiding

  return num
}

function onPurchase(control) {
  // We need a valid target and a quantity to complete this action.
  const targetId = dataset(control, 'target')
  if (targetId === null) {
    return false
  }

  const qty = dataset(control, 'quantity')
  if (qty === null) {
    return false
  }

  return doPurchase(targetId, qty)
}

function getCustomNumber(civObj) {
  if (!civObj || !civObj.customQtyId) {
    return undefined
  }
  const elem = document.getElementById(civObj.customQtyId)
  if (!elem) {
    return undefined
  }

  let num = Number(elem.value)

  // Check the above operations haven't returned NaN
  // Also don't allow negative increments.
  if (isNaN(num) || num < 0) {
    elem.style.background = '#f99' // notify user that the input failed
    return 0
  }

  num = Math.floor(num) // Round down

  elem.value = num // reset fractional numbers, check nothing odd happened
  elem.style.background = '#fff'

  return num
}

// Calculates and returns the cost of adding a certain number of workers at the present window.vm.population
// xxx Make this work for negative numbers
function calcWorkerCost(num, curPopArg) {
  const curPop = (curPopArg === undefined) ? window.vm.population.current : curPopArg
  return (20 * num) + calcArithSum(0.01, curPop, curPop + num)
}

function calcZombieCost(num) {
  return calcWorkerCost(num, window.vm.curCiv.zombie.owned) / 5
}

// Create a cat
function spawnCat() {
  window.vm.civData.cat.owned += 1
  gameLog('Found a cat!')
}

// Creates or destroys workers
function spawn(numArg) { // eslint-disable-line no-unused-vars
  const jobObj = window.vm.civData.unemployed
  let num = numArg
  if (num === 'custom') {
    num = getCustomNumber(jobObj)
  }
  if (num === '-custom') {
    num = -getCustomNumber(jobObj)
  }

  // Find the most workers we can spawn
  num = Math.max(num, -jobObj.owned) // Cap firing by # in that job.
  num = Math.min(num, logSearchFn(calcWorkerCost, window.vm.civData.food.owned))

  // Apply window.vm.population limit, and only allow whole workers.
  num = Math.min(num, (window.vm.population.limit - window.vm.population.current))

  // Update numbers and resource levels
  window.vm.civData.food.owned -= calcWorkerCost(num)

  // New workers enter as farmers, but we only destroy idle ones.
  if (num >= 0) {
    window.vm.civData.farmer.owned += num
  }
  else {
    jobObj.owned += num
  }
  updatePopulation() // Run through the window.vm.population->job update cycle

  // This is intentionally independent of the number of workers spawned
  if (Math.random() * 100 < 1 + (window.vm.civData.lure.owned)) {
    spawnCat()
  }

  updateResourceTotals() // update with new resource number
  updatePopulationUI()

  return num
}

// Picks the next worker to starve.  Kills the sick first, then the healthy.
// Deployed military starve last.
// Return the job ID of the selected target.
function pickStarveTarget() {
  let modNum
  let jobNum
  const modList = ['ill', 'owned'] // The sick starve first
  // xxx Remove this hard-coded list.
  const jobList = ['unemployed', 'blacksmith', 'tanner', 'miner', 'woodcutter',
    'cleric', 'cavalry', 'soldier', 'healer', 'labourer', 'farmer',
  ]

  for (modNum = 0; modNum < modList.length; ++modNum) {
    for (jobNum = 0; jobNum < jobList.length; ++jobNum) {
      if (window.vm.civData[jobList[jobNum]][modList[modNum]] > 0) {
        return window.vm.civData[jobList[jobNum]]
      }
    }
  }
  // These don't have Ill variants at the moment.
  if (window.vm.civData.cavalryParty.owned > 0) {
    return window.vm.civData.cavalryParty
  }
  if (window.vm.civData.soldierParty.owned > 0) {
    return window.vm.civData.soldierParty
  }

  return null
}

// Culls workers when they starve.
function starve(numArg) {
  let targetObj
  let i
  let num = (numArg === undefined) ? 1 : numArg
  num = Math.min(num, window.vm.population.current)

  for (i = 0; i < num; ++i) {
    targetObj = pickStarveTarget()
    if (!targetObj) {
      return i
    }

    if (targetObj.ill) {
      targetObj.ill -= 1
    }
    else {
      targetObj.owned -= 1
    }
    updatePopulation()

    window.vm.civData.corpses.owned += 1 // Increments corpse number
    // Workers dying may trigger Book of the Dead
    if (window.vm.civData.book.owned) {
      window.vm.civData.piety.owned += 10
    }
  }

  return num
}

function doStarve() {
  let corpsesEaten
  let numStarve
  if (window.vm.civData.food.owned < 0 && window.vm.civData.waste.owned) { // Workers eat corpses if needed
    corpsesEaten = Math.min(window.vm.civData.corpses.owned, -window.vm.civData.food.owned)
    window.vm.civData.corpses.owned -= corpsesEaten
    window.vm.civData.food.owned += corpsesEaten
  }

  if (window.vm.civData.food.owned < 0) { // starve if there's not enough food.
    // xxx This is very kind.  Only 0.1% deaths no matter how big the shortage?
    numStarve = starve(Math.ceil(window.vm.population.current / 1000))
    if (numStarve === 1) {
      gameLog('A worker starved to death')
    }
    if (numStarve > 1) {
      gameLog(`${prettify(numStarve)} workers starved to death`)
    }
    adjustMorale(-0.01)
    window.vm.civData.food.owned = 0
  }
}

// Creates or destroys zombies
// Pass a positive number to create, a negative number to destroy.
// Only idle zombies can be destroyed.
// If it can't create/destroy as many as requested, does as many as it can.
// Pass Infinity/-Infinity as the num to get the max possible.
// Pass "custom" or "-custom" to use the custom increment.
// Returns the actual number created or destroyed (negative if destroyed).
function raiseDead(numArg) { // eslint-disable-line no-unused-vars
  let num = (numArg === undefined) ? 1 : numArg
  if (num === 'custom') {
    num = getCustomNumber(window.vm.civData.unemployed)
  }
  if (num === '-custom') {
    num = -getCustomNumber(window.vm.civData.unemployed)
  }

  // Find the most zombies we can raise
  num = Math.min(num, window.vm.civData.corpses.owned)
  num = Math.max(num, -window.vm.curCiv.zombie.owned) // Cap firing by # in that job.
  num = Math.min(num, logSearchFn(calcZombieCost, window.vm.civData.piety.owned))

  // Update numbers and resource levels
  window.vm.civData.piety.owned -= calcZombieCost(num)
  window.vm.curCiv.zombie.owned += num
  window.vm.civData.unemployed.owned += num
  window.vm.civData.corpses.owned -= num

  // Notify player
  if (num === 1) {
    gameLog('A corpse rises, eager to do your bidding.')
  }
  else if (num > 1) {
    gameLog('The corpses rise, eager to do your bidding.')
  }
  else if (num === -1) {
    gameLog('A zombie crumples to the ground, inanimate.')
  }
  else if (num < -1) {
    gameLog('The zombies fall, mere corpses once again.')
  }

  updatePopulation() // Run through window.vm.population->jobs cycle to update page with zombie and corpse totals
  updatePopulationUI()
  updateResourceTotals() // Update any piety spent

  return num
}

function summonShade() { // eslint-disable-line no-unused-vars
  if (window.vm.curCiv.enemySlain.owned <= 0) {
    return 0
  }
  if (!payFor(window.vm.civData.summonShade.require)) {
    return 0
  }

  const num = Math.ceil((window.vm.curCiv.enemySlain.owned / 4) + (Math.random() * (window.vm.curCiv.enemySlain.owned / 4)))
  window.vm.curCiv.enemySlain.owned -= num
  window.vm.civData.shade.owned += num

  return num
}

// Deity Domains upgrades
function selectDeity(domain, force) {
  if (!force) {
    if (window.vm.civData.piety.owned < 500) {
      return
    } // Can't pay
    window.vm.civData.piety.owned -= 500
  }
  window.vm.curCiv.deities[0].domain = domain

  document.getElementById(`${domain}Upgrades`).style.display = 'inline'
  document.getElementById('deityDomains').style.display = 'none'
  makeDeitiesTables()
}

function digGraves(num) { // eslint-disable-line no-unused-vars
  // Creates new unfilled graves.
  window.vm.curCiv.grave.owned += 100 * num
  updatePopulationUI() // Update page with grave numbers
}

// Selects a random healthy worker based on their proportions in the current job distribution.
// xxx Doesn't currently pick from the army
// xxx Take a parameter for how many people to pick.
// xxx Make this able to return multiples by returning a cost structure.
function randomHealthyWorker() {
  const num = Math.random() * window.vm.population.healthy
  let chance = 0
  let i
  for (i = 0; i < window.vm.killable.length; ++i) {
    chance += window.vm.civData[window.vm.killable[i].id].owned
    if (chance > num) {
      return window.vm.killable[i].id
    }
  }

  return ''
}

function getRewardMessage(rewardObj, qty) {
  switch (rewardObj.id) {
    case 'food':
      return 'The crops are abundant!'
    case 'wood':
      return 'The trees grow stout!'
    case 'stone':
      return 'The stone splits easily!'
    case 'skins':
      return 'The animals are healthy!'
    case 'herbs':
      return 'The gardens flourish!'
    case 'ore':
      return 'A new vein is struck!'
    case 'leather':
      return 'The tanneries are productive!'
    case 'metal':
      return 'The steel runs pure.'
    default:
      return `You gain ${rewardObj.getQtyName(qty)}!`
  }
}

// Selects a random worker, kills them, and then adds a random resource
// xxx This should probably scale based on window.vm.population (and maybe devotion).
function wickerman() { // eslint-disable-line no-unused-vars
  // Select a random worker
  const job = randomHealthyWorker()
  if (!job) {
    return
  }

  // Pay the price
  if (!payFor(window.vm.civData.wickerman.require)) {
    return
  }
  window.vm.civData[job].owned -= 1
  updatePopulation() // Removes killed worker

  // Select a random window.vm.lootable resource
  const rewardObj = window.vm.lootable[Math.floor(Math.random() * window.vm.lootable.length)]

  let qty = Math.floor(Math.random() * 1000)
  // xxx Note that this presumes the price is 500 wood.
  if (rewardObj.id === 'wood') {
    qty = (qty / 2) + 500
  } // Guaranteed to at least restore initial cost.
  rewardObj.owned += qty

  gameLog(`Burned a ${window.vm.civData[job].getQtyName(1)}. ${getRewardMessage(rewardObj, qty)}`)
  updateResourceTotals() // Adds new resources
  updatePopulationUI()
}

function walk(incrementArg) { // eslint-disable-line no-unused-vars
  let inc = (incrementArg === undefined) ? 1 : incrementArg
  if (inc === false) {
    inc = 0
    window.vm.civData.walk.rate = 0
  }

  window.vm.civData.walk.rate += inc

  // xxx This needs to move into the main loop in case it's reloaded.
  document.getElementById('walkStat').innerHTML = prettify(window.vm.civData.walk.rate)
  document.getElementById('ceaseWalk').disabled = (window.vm.civData.walk.rate === 0)
  setElemDisplay('walkGroup', (window.vm.civData.walk.rate > 0))
}

function tickWalk() {
  let i
  let target = ''
  if (window.vm.civData.walk.rate > window.vm.population.healthy) {
    window.vm.civData.walk.rate = window.vm.population.healthy
    document.getElementById('ceaseWalk').disabled = true
  }
  if (window.vm.civData.walk.rate <= 0) {
    return
  }

  for (i = 0; i < window.vm.civData.walk.rate; ++i) {
    target = randomHealthyWorker() // xxx Need to modify this to do them all at once.
    if (!target) {
      break
    }
    window.vm.civData[target].owned -= 1
      // We don't want to do UpdatePopulation() in a loop, so we just do the
      // relevent adjustments directly.
    window.vm.population.current -= 1
    window.vm.population.healthy -= 1
  }
  updatePopulation()
  updatePopulationUI()
}

// Give a temporary bonus based on the number of cats owned.
function pestControl(lengthArg) { // eslint-disable-line no-unused-vars
  const length = (lengthArg === undefined) ? 10 : lengthArg
  if (window.vm.civData.piety.owned < (10 * length)) {
    return
  }
  window.vm.civData.piety.owned -= (10 * length)
  window.vm.civData.pestControl.timer = length * window.vm.civData.cat.owned
  gameLog('The vermin are exterminated.')
}

/* Iconoclasm */

function iconoclasmList() { // eslint-disable-line no-unused-vars
  let i
  // Lists the deities for removing
  if (window.vm.civData.piety.owned >= 1000) {
    window.vm.civData.piety.owned -= 1000
    updateResourceTotals()
    document.getElementById('iconoclasm').disabled = true
    let append = '<br>'
    for (i = 1; i < window.vm.curCiv.deities.length; ++i) {
      append += `<button class="btn btn-danger btn-sm" onclick="iconoclasm(${i})">`
      append += window.vm.curCiv.deities[i].name
      append += '</button><br>'
    }
    append += '<br><button class="btn btn-primary btn-sm" onclick=\'iconoclasm("cancel")\'>Cancel</button>'
    document.getElementById('iconoclasmList').innerHTML = append
  }
}

function iconoclasm(index) { // eslint-disable-line no-unused-vars
  // will splice a deity from the deities array unless the user has cancelled
  document.getElementById('iconoclasmList').innerHTML = ''
  document.getElementById('iconoclasm').disabled = false
  if ((index === 'cancel') || (index >= window.vm.curCiv.deities.length)) {
    // return the piety
    window.vm.civData.piety.owned += 1000
    return
  }

  // give gold
  window.vm.civData.gold.owned += Math.floor((window.vm.curCiv.deities[index].maxDev ** (1 / 1.25)))

  // remove the deity
  window.vm.curCiv.deities.splice(index, 1)

  makeDeitiesTables()
}

/* Enemies */

function spawnMob(mobObj, numArg) {
  let num = numArg
  let numSge = 0
  let msg = ''

  if (num === undefined) { // By default, base numbers on current window.vm.population
    const maxMob = ((window.vm.population.current + window.vm.curCiv.zombie.owned) / 50)
    num = Math.ceil(maxMob * Math.random())
  }

  if (num === 0) {
    return num
  } // Nobody came

  // Human mobs might bring siege engines.
  if (mobObj.species === 'human') {
    numSge = Math.floor((Math.random() * num) / 100)
  }

  mobObj.owned += num
  window.vm.civData.esiege.owned += numSge

  msg = `${prettify(num)} ${mobObj.getQtyName(num)} attacked` // xxx L10N
  if (numSge > 0) {
    msg += `, with ${prettify(numSge)} ${window.vm.civData.esiege.getQtyName(numSge)}`
  } // xxx L10N
  gameLog(msg)

  return num
}

function smiteMob(mobObj) {
  if (!isValid(mobObj.owned) || mobObj.owned <= 0) {
    return 0
  }
  const num = Math.min(mobObj.owned, Math.floor(window.vm.civData.piety.owned / 100))
  window.vm.civData.piety.owned -= num * 100
  mobObj.owned -= num
  window.vm.civData.corpses.owned += num // xxx Should dead wolves count as corpses?
  window.vm.curCiv.enemySlain.owned += num
  if (window.vm.civData.throne.owned) {
    window.vm.civData.throne.count += num
  }
  if (window.vm.civData.book.owned) {
    window.vm.civData.piety.owned += num * 10
  }
  gameLog(`Struck down ${num} ${mobObj.getQtyName(num)}`) // L10N
  return num
}

function smite() { // eslint-disable-line no-unused-vars
  smiteMob(window.vm.civData.barbarian)
  smiteMob(window.vm.civData.bandit)
  smiteMob(window.vm.civData.wolf)
  updateResourceTotals()
  updateJobButtons()
}

/* War Functions */

function invade(ecivtype) {
  // invades a certain type of civilisation based on the button clicked
  window.vm.curCiv.raid.raiding = true
  window.vm.curCiv.raid.last = ecivtype

  window.vm.curCiv.raid.epop = window.vm.civSizes[ecivtype].max_pop + 1
  // If no max pop, use 2x min pop.
  if (window.vm.curCiv.raid.epop === Infinity) {
    window.vm.curCiv.raid.epop = window.vm.civSizes[ecivtype].min_pop * 2
  }
  if (window.vm.civData.glory.timer > 0) {
    window.vm.curCiv.raid.epop *= 2
  } // doubles soldiers fought

  // 5-25% of enemy window.vm.population is soldiers.
  window.vm.civData.esoldier.owned += (window.vm.curCiv.raid.epop / 20) +
    Math.floor(Math.random() * (window.vm.curCiv.raid.epop / 5))
  window.vm.civData.efort.owned += Math.floor(Math.random() * (window.vm.curCiv.raid.epop / 5000))

  // Glory redoubles rewards (doubled here because doubled already above)
  const baseLoot = window.vm.curCiv.raid.epop / (1 + (window.vm.civData.glory.timer <= 0))

  // Set rewards of land and other random plunder.
  // xxx Maybe these should be partially proportionate to the actual number of defenders?
  window.vm.curCiv.raid.plunderLoot = {
    freeLand: Math.round(baseLoot * (1 + (window.vm.civData.administration.owned))),
  }
  window.vm.lootable.forEach((elem) => {
    window.vm.curCiv.raid.plunderLoot[elem.id] = Math.round(baseLoot * Math.random())
  })

  updateTargets() // Hides raid buttons until the raid is finished
  updatePartyButtons()
}

function onInvade(control) {
  return invade(dataset(control, 'target'))
}

function plunder() { // eslint-disable-line no-unused-vars
  let plunderMsg = ''

  // If we fought our largest eligible foe, but not the largest possible, raise the limit.
  if ((window.vm.curCiv.raid.targetMax !== window.vm.civSizes[window.vm.civSizes.length - 1].id) &&
      window.vm.curCiv.raid.last === window.vm.curCiv.raid.targetMax) {
    window.vm.curCiv.raid.targetMax = window.vm.civSizes[window.vm.civSizes[window.vm.curCiv.raid.targetMax].idx + 1].id
  }

  // Improve morale based on size of defeated foe.
  adjustMorale((window.vm.civSizes[window.vm.curCiv.raid.last].idx + 1) / 100)

  // Lamentation
  if (window.vm.civData.lament.owned) {
    window.vm.curCiv.attackCounter -= Math.ceil(window.vm.curCiv.raid.epop / 2000)
  }

  // Collect loot
  payFor(window.vm.curCiv.raid.plunderLoot, -1) // We pay for -1 of these to receive them.

  // Create message to notify player
  plunderMsg = `${window.vm.civSizes[window.vm.curCiv.raid.last].name} defeated! `
  plunderMsg += `Plundered ${getReqText(window.vm.curCiv.raid.plunderLoot)}. `
  gameLog(plunderMsg)

  // Victory outcome has been handled, end raid
  resetRaiding()
  updateResourceTotals()
  updateTargets()
}

function glory(timeArg) { // eslint-disable-line no-unused-vars
  const time = (timeArg === undefined) ? 180 : timeArg
  if (!payFor(window.vm.civData.glory.require)) {
    return
  } // check it can be bought

  window.vm.civData.glory.timer = time // set timer
  // xxx This needs to move into the main loop in case it's reloaded.
  document.getElementById('gloryTimer').innerHTML = window.vm.civData.glory.timer // update timer to player
  document.getElementById('gloryGroup').style.display = 'block'
}

function grace(deltaArg) { // eslint-disable-line no-unused-vars
  const delta = (deltaArg === undefined) ? 0.1 : deltaArg
  if (window.vm.civData.piety.owned >= window.vm.civData.grace.cost) {
    window.vm.civData.piety.owned -= window.vm.civData.grace.cost
    window.vm.civData.grace.cost = Math.floor(window.vm.civData.grace.cost * 1.2)
    document.getElementById('graceCost').innerHTML = prettify(window.vm.civData.grace.cost)
    adjustMorale(delta)
    updateResourceTotals()
    updateMorale()
  }
}

// xxx Eventually, we should have events like deaths affect morale (scaled by %age of total pop)
function adjustMorale(delta) {
  // Changes and updates morale given a delta value
  if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0) { // dividing by zero is bad for hive
    // calculates zombie proportion (zombies do not become happy or sad)
    const fraction = window.vm.population.current / (window.vm.population.current + window.vm.curCiv.zombie.owned)
    // alters morale
    window.vm.curCiv.morale.efficiency += delta * fraction
    // Then check limits (50 is median, limits are max 0 or 100, but moderated by fraction of zombies)
    if (window.vm.curCiv.morale.efficiency > 1 + (0.5 * fraction)) {
      window.vm.curCiv.morale.efficiency = 1 + (0.5 * fraction)
    }
    else if (window.vm.curCiv.morale.efficiency < 1 - (0.5 * fraction)) {
      window.vm.curCiv.morale.efficiency = 1 - (0.5 * fraction)
    }
    updateMorale() // update to player
  }
}

/* Wonders functions */

function startWonder() { // eslint-disable-line no-unused-vars
  if (window.vm.curCiv.curWonder.stage !== 0) {
    return
  }
  window.vm.curCiv.curWonder.stage += 1
  renameWonder()
  updateWonder()
}

function renameWonder() {
  // Can't rename before you start, or after you finish.
  if (window.vm.curCiv.curWonder.stage === 0 || window.vm.curCiv.curWonder.stage > 2) {
    return
  }
  const n = prompt('Please name your Wonder:', window.vm.curCiv.curWonder.name) // eslint-disable-line no-alert
  if (!n) {
    return
  }
  window.vm.curCiv.curWonder.name = n
  const wc = document.getElementById('wonderNameC')
  if (wc) {
    wc.innerHTML = window.vm.curCiv.curWonder.name
  }
}

function wonderSelect(resourceId) { // eslint-disable-line no-unused-vars
  if (window.vm.curCiv.curWonder.stage !== 2) {
    return
  }
  window.vm.curCiv.curWonder.stage += 1
  window.vm.curCiv.curWonder[resourceId] += 1
  gameLog(`You now have a permanent bonus to ${resourceId} production.`)
  window.vm.curCiv.wonders.push({
    name: window.vm.curCiv.curWonder.name,
    resourceId,
  })
  window.vm.curCiv.curWonder.name = ''
  window.vm.curCiv.curWonder.progress = 0
  updateWonder()
}

/* Trade functions */

function tradeTimer() {
  // Set timer length (10 sec + 5 sec/upgrade)
  window.vm.curCiv.trader.timer = 10 + (5 * (window.vm.civData.currency.owned +
    window.vm.civData.commerce.owned + window.vm.civData.stay.owned))

  // then set material and requested amount
  const tradeItems = // Item and base amount
    [{
      materialId: 'food',
      requested: 5000,
    },
    {
      materialId: 'wood',
      requested: 5000,
    },
    {
      materialId: 'stone',
      requested: 5000,
    },
    {
      materialId: 'skins',
      requested: 500,
    },
    {
      materialId: 'herbs',
      requested: 500,
    },
    {
      materialId: 'ore',
      requested: 500,
    },
    {
      materialId: 'leather',
      requested: 250,
    },
    {
      materialId: 'metal',
      requested: 250,
    },
    ]

  // Randomly select and merge one of the above.
  const selected = tradeItems[Math.floor(Math.random() * tradeItems.length)]
  window.vm.curCiv.trader.materialId = selected.materialId
  window.vm.curCiv.trader.requested = selected.requested * (Math.ceil(Math.random() * 20)) // Up to 20x amount

  document.getElementById('tradeContainer').style.display = 'block'
  document.getElementById('tradeType').innerHTML =
    window.vm.civData[window.vm.curCiv.trader.materialId].getQtyName(window.vm.curCiv.trader.requested)
  document.getElementById('tradeRequested').innerHTML = prettify(window.vm.curCiv.trader.requested)
}

function trade() { // eslint-disable-line no-unused-vars
  // check we have enough of the right type of resources to trade
  if (!window.vm.curCiv.trader.materialId || (window.vm.curCiv.trader.materialId.owned < window.vm.curCiv.trader.requested)) {
    gameLog('Not enough resources to trade.')
    return
  }

  // subtract resources, add gold
  const material = window.vm.civData[window.vm.curCiv.trader.materialId]

  material.owned -= window.vm.curCiv.trader.requested
  window.vm.civData.gold.owned += 1
  updateResourceTotals()
  gameLog(`Traded ${window.vm.curCiv.trader.requested} ${material.getQtyName(window.vm.curCiv.trader.requested)}`)
}

function buy(materialId) { // eslint-disable-line no-unused-vars
  const material = window.vm.civData[materialId]
  if (window.vm.civData.gold.owned < 1) {
    return
  }
  window.vm.civData.gold.owned -= 1

  if (material === window.vm.civData.food || material === window.vm.civData.wood || material === window.vm.civData.stone) {
    material.owned += 5000
  }
  if (material === window.vm.civData.skins || material === window.vm.civData.herbs || material === window.vm.civData.ore) {
    material.owned += 500
  }
  if (material === window.vm.civData.leather || material === window.vm.civData.metal) {
    material.owned += 250
  }

  updateResourceTotals()
}

function getWonderCostMultiplier() { // Based on the most wonders in any single resource.
  let i
  let mostWonders = 0
  for (i in window.vm.wonderCount) {
    if (Object.prototype.hasOwnProperty.call(window.vm.wonderCount, i)) {
      mostWonders = Math.max(mostWonders, window.vm.wonderCount[i])
    }
  }
  return (1.5 ** mostWonders)
}

function speedWonder() { // eslint-disable-line no-unused-vars
  if (window.vm.civData.gold.owned < 100) {
    return
  }
  window.vm.civData.gold.owned -= 100

  window.vm.curCiv.curWonder.progress += 1 / getWonderCostMultiplier()
  window.vm.curCiv.curWonder.rushed = true
  updateWonder()
}

// Game infrastructure functions

function handleStorageError(err) {
  let msg
  if ((err instanceof DOMException) && (err.code === DOMException.SECURITY_ERR)) {
    msg = 'Browser security settings blocked access to local storage.'
  }
  else {
    msg = 'Cannot access localStorage - browser may not support localStorage, or storage may be corrupt'
  }
  console.error(err.toString())
  console.error(msg)
}

// Load in saved data
function load(loadType) {
  // define load variables
  let loadVar = {}
  let loadVar2 = {}
  let settingsVar = {}

  if (loadType === 'cookie') {
    // check for cookies
    if (readCookie(window.vm.saveTag) && readCookie(window.vm.saveTag2)) {
      // set variables to load from
      loadVar = readCookie(window.vm.saveTag)
      loadVar2 = readCookie(window.vm.saveTag2)
      loadVar = mergeObj(loadVar, loadVar2)
      loadVar2 = undefined
      // notify user
      gameLog('Loaded saved game from cookie')
      gameLog('Save system switching to localStorage.')
    }
    else {
      console.warn('Unable to find cookie')
      return false
    }
  }

  if (loadType === 'localStorage') {
    // check for local storage
    let string1
    let string2
    let settingsString
    try {
      settingsString = localStorage.getItem(window.vm.saveSettingsTag)
      string1 = localStorage.getItem(window.vm.saveTag)
      string2 = localStorage.getItem(window.vm.saveTag2)

      if (!string1) {
        console.error('Unable to find variables in localStorage. Attempting to load cookie.')
        return load('cookie')
      }
    }
    catch (err) {
      if (!string1) { // It could be fine if string2 or settingsString fail.
        handleStorageError(err)
        return load('cookie')
      }
    }

    // Try to parse the strings
    if (string1) {
      try {
        loadVar = JSON.parse(string1)
      }
      catch (ignore) { /* empty */ }
    }
    if (string2) {
      try {
        loadVar2 = JSON.parse(string2)
      }
      catch (ignore) { /* empty */ }
    }
    if (settingsString) {
      try {
        settingsVar = JSON.parse(settingsString)
      }
      catch (ignore) { /* empty */ }
    }

    // If there's a second string (old save game format), merge it in.
    if (loadVar2) {
      loadVar = mergeObj(loadVar, loadVar2)
      loadVar2 = undefined
    }

    if (!loadVar) {
      console.error('Unable to parse variables in localStorage. Attempting to load cookie.')
      return load('cookie')
    }

    // notify user
    gameLog('Loaded saved game from localStorage')
  }

  if (loadType === 'import') {
    // take the import string, decompress and parse it
    const compressed = document.getElementById('impexpField').value
    const decompressed = LZString.decompressFromBase64(compressed)
    const revived = JSON.parse(decompressed)
    // set variables to load from
    loadVar = revived[0]
    if (isValid(revived[1])) {
      loadVar2 = revived[1]
      // If there's a second string (old save game format), merge it in.
      if (loadVar2) {
        loadVar = mergeObj(loadVar, loadVar2)
        loadVar2 = undefined
      }
    }
    if (!loadVar) {
      console.error('Unable to parse saved game string.')
      return false
    }

    // notify user
    gameLog('Imported saved game')
    // close import/export dialog
    // impexp();
  }

  let saveVersion = new VersionData(1, 0, 0, 'legacy')
  saveVersion = mergeObj(saveVersion, loadVar.versionData)
  if (saveVersion.toNumber() > window.vm.versionData.toNumber()) {
    // Refuse to load saved games from future versions.
    const alertStr = `Cannot load; saved game version ${saveVersion} is newer than game version ${window.vm.versionData}`
    console.error(alertStr)
    alert(alertStr) // eslint-disable-line no-alert
    return false
  }
  if (saveVersion.toNumber() < window.vm.versionData.toNumber()) {
    // Migrate saved game data from older versions.
    const settingsVarReturn = {
      val: {},
    }
    migrateGameData(loadVar, settingsVarReturn)
    settingsVar = settingsVarReturn.val

    // Merge the loaded data into our own, in case we've added fields.
    mergeObj(window.vm.curCiv, loadVar.curCiv)
  }
  else {
    mergeObj(window.vm.curCiv, loadVar.curCiv)
    // window.vm.curCiv = loadVar.window.vm.curCiv // No need to merge if the versions match; this is quicker.
  }

  console.warn(`Loaded save game version ${saveVersion.major
    }.${saveVersion.minor}.${saveVersion.sub}(${saveVersion.mod}).`)

  if (isValid(settingsVar)) {
    window.vm.settings = mergeObj(window.vm.settings, settingsVar)
  }

  adjustMorale(0)
  updateRequirements(window.vm.civData.mill)
  updateRequirements(window.vm.civData.fortification)
  updateRequirements(window.vm.civData.battleAltar)
  updateRequirements(window.vm.civData.fieldsAltar)
  updateRequirements(window.vm.civData.underworldAltar)
  updateRequirements(window.vm.civData.catAltar)
  updateResourceTotals()
  updateJobButtons()
  makeDeitiesTables()
  updateDeity()
  updateUpgrades()
  updateTargets()
  updateDevotion()
  updatePartyButtons()
  updateMorale()
  updateWonder()
  updateWonderCount()
  document.getElementById('wonderNameC').innerHTML = window.vm.curCiv.curWonder.name

  return true
}

// Create objects and populate them with the variables, these will be stored in HTML5 localStorage.
// Cookie-based saves are no longer supported.
function save(savetype) {
  let xmlhttp

  const saveVar = {
    versionData: window.vm.versionData, // Version information header
    curCiv: window.vm.curCiv, // Game data
  }

  const settingsVar = window.vm.settings // UI Settings are saved separately.

  // //////////////////////////////////////////////////

  // Handle export
  if (savetype === 'export') {
    const savestring = `[${JSON.stringify(saveVar)}]`
    const compressed = LZString.compressToBase64(savestring)
    console.warn(`Compressed save from ${savestring.length} to ${compressed.length} characters`)
    document.getElementById('impexpField').value = compressed
    gameLog('Exported game to text')
    return true
  }

  // set localstorage
  try {
    // Delete the old cookie-based save to avoid mismatched saves
    deleteCookie(window.vm.saveTag)
    deleteCookie(window.vm.saveTag2)

    localStorage.setItem(window.vm.saveTag, JSON.stringify(saveVar))

    // We always save the game settings.
    localStorage.setItem(window.vm.saveSettingsTag, JSON.stringify(settingsVar))

    // Update console for debugging, also the player depending on the type of save (manual/auto)
    if (savetype === 'auto') {
      console.warn('Autosave')
      gameLog('Autosaved')
    }
    else if (savetype === 'manual') {
      alert('Game Saved') // eslint-disable-line no-alert
      console.warn('Manual Save')
      gameLog('Saved game')
    }
  }
  catch (err) {
    handleStorageError(err)

    if (savetype === 'auto') {
      console.error('Autosave Failed')
      gameLog('Autosave Failed')
    }
    else if (savetype === 'manual') {
      alert('Save Failed!') // eslint-disable-line no-alert
      console.error('Save Failed')
      gameLog('Save Failed')
    }
    return false
  }

  try {
    xmlhttp = new XMLHttpRequest()
    xmlhttp.overrideMimeType('text/plain')
    xmlhttp.open('GET', `/static/civclicker/version.txt?r=${Math.random()}`, true)
    xmlhttp.onreadystatechange = function() { // eslint-disable-line func-names
      if (xmlhttp.readyState === 4) {
        const sVersion = parseInt(xmlhttp.responseText, 10)
        if (window.vm.version < sVersion) {
          versionAlert()
        }
      }
    }
    xmlhttp.send(null)
  }
  catch (err) {
    console.error('XMLHttpRequest failed')
  }

  return true
}

function deleteSave() { // eslint-disable-line no-unused-vars
  // Deletes the current savegame by setting the game's cookies to expire in the past.
  if (!confirm('Really delete save?')) { // eslint-disable-line no-alert
    return
  } // Check the player really wanted to do that.

  try {
    deleteCookie(window.vm.saveTag)
    deleteCookie(window.vm.saveTag2)
    localStorage.removeItem(window.vm.saveTag)
    localStorage.removeItem(window.vm.saveTag2)
    localStorage.removeItem(window.vm.saveSettingsTag)
    gameLog('Save Deleted')
  }
  catch (err) {
    handleStorageError(err)
    alert('Save Deletion Failed!') // eslint-disable-line no-alert
  }
}

function renameCiv(newName) {
  // Prompts player, uses result as new civName
  while (!newName) {
    newName = prompt('Please name your civilisation', (newName || window.vm.curCiv.civName || 'Woodstock')) // eslint-disable-line
    if ((newName === null) && (window.vm.curCiv.civName)) {
      return
    } // Cancelled
  }

  window.vm.curCiv.civName = newName
}

// Note:  Returns the index (which could be 0), or 'false'.
function haveDeity(name) {
  let i
  for (i = 0; i < window.vm.curCiv.deities.length; ++i) {
    if (window.vm.curCiv.deities[i].name === name) {
      return i
    }
  }

  return false
}

function renameRuler(newNameArg) {
  let newName = newNameArg
  if (window.vm.curCiv.rulerName === 'Cheater') {
    return
  } // Reputations suck, don't they?
  // Prompts player, uses result as rulerName
  while (!newName || haveDeity(newName) !== false) {
    newName = prompt('What is your name?', (newName || window.vm.curCiv.rulerName || 'Orteil')) // eslint-disable-line no-alert
    if ((newName === null) && (window.vm.curCiv.rulerName)) {
      return
    } // Cancelled
    if (haveDeity(newName) !== false) {
      alert(`That would be a blasphemy against the deity ${newName}.`) // eslint-disable-line no-alert
      newName = ''
    }
  }

  window.vm.curCiv.rulerName = newName
}

// Looks to see if the deity already exists.  If it does, that deity
// is moved to the first slot, overwriting the current entry, and the
// player's domain is automatically assigned to match (for free).
function renameDeity(newNameArg) { // eslint-disable-line no-unused-vars
  let newName = newNameArg
  let i = false
  while (!newName) {
    // Default to ruler's name.  Hey, despots tend to have big egos.
    newName = prompt('Whom do your people worship?', (newName || window.vm.curCiv.deities[0].name || window.vm.curCiv.rulerName)) // eslint-disable-line no-alert
    if ((newName === null) && (window.vm.curCiv.deities[0].name)) {
      return
    } // Cancelled

    // If haveDeity returns a number > 0, the name is used by a legacy deity.
    // This is only allowed when naming (not renaming) the active deity.
    i = haveDeity(newName)
    if (i && window.vm.curCiv.deities[0].name) {
      alert('That deity already exists.') // eslint-disable-line no-alert
      newName = ''
    }
  }

  // Rename the active deity.
  window.vm.curCiv.deities[0].name = newName

  // If the name matches a legacy deity, make the legacy deity the active deity.
  if (i) {
    window.vm.curCiv.deities[0] = window.vm.curCiv.deities[i] // Copy to front position
    window.vm.curCiv.deities.splice(i, 1) // Remove from old position
    if (getCurDeityDomain()) { // Does deity have a domain?
      selectDeity(getCurDeityDomain(), true) // Automatically pick that domain.
    }
  }

  makeDeitiesTables()
}

function reset() { // eslint-disable-line no-unused-vars
  // Resets the game, keeping some values but resetting most back to their initial values.
  const msg = 'Really reset? You will keep past deities and wonders (and cats)' // Check player really wanted to do that.
  if (!confirm(msg)) { // eslint-disable-line no-alert
    return false
  } // declined

  // Let each data subpoint re-init.
  window.vm.civData.forEach((elem) => {
    if (elem instanceof CivObj) {
      elem.reset()
    }
  })

  window.vm.curCiv.zombie.owned = 0
  window.vm.curCiv.grave.owned = 0
  window.vm.curCiv.enemySlain.owned = 0
  window.vm.curCiv.resourceClicks = 0 // For NeverClick
  window.vm.curCiv.attackCounter = 0 // How long since last attack?
  window.vm.curCiv.morale = {
    mod: 1.0,
  }

  // If our current deity is powerless, delete it.
  if (!window.vm.curCiv.deities[0].maxDev) {
    window.vm.curCiv.deities.shift()
  }
  // Insert space for a fresh deity.
  window.vm.curCiv.deities.unshift({
    name: '',
    domain: '',
    maxDev: 0,
  })

  updateRequirements(window.vm.civData.mill)
  updateRequirements(window.vm.civData.fortification)
  updateRequirements(window.vm.civData.battleAltar)
  updateRequirements(window.vm.civData.fieldsAltar)
  updateRequirements(window.vm.civData.underworldAltar)
  updateRequirements(window.vm.civData.catAltar)

  window.vm.population = {
    current: 0,
    limit: 0,
    healthy: 0,
    totalSick: 0,
  }

  resetRaiding()
  window.vm.curCiv.raid.targetMax = window.vm.civSizes[0].id

  window.vm.curCiv.trader.materialId = ''
  window.vm.curCiv.trader.requested = 0
  window.vm.curCiv.trader.timer = 0
  window.vm.curCiv.trader.counter = 0 // How long since last trader?

  window.vm.curCiv.curWonder.name = ''
  window.vm.curCiv.curWonder.stage = 0
  window.vm.curCiv.curWonder.rushed = false
  window.vm.curCiv.curWonder.progress = 0

  document.getElementById('graceCost').innerHTML = prettify(window.vm.civData.grace.cost)
  // Update page with all new values
  updateResourceTotals()
  updateUpgrades()
  updateDeity()
  makeDeitiesTables()
  updateDevotion()
  updateTargets()
  updateJobButtons()
  updatePartyButtons()
  updateWonder()
  // Reset upgrades and other interface elements that might have been unlocked
  // xxx Some of this probably isn't needed anymore; the update routines will handle it.
  document.getElementById('renameDeity').disabled = 'true'
  document.getElementById('raiseDead').disabled = 'true'
  document.getElementById('raiseDead100').disabled = 'true'
  document.getElementById('raiseDeadMax').disabled = 'true'
  document.getElementById('smite').disabled = 'true'
  document.getElementById('wickerman').disabled = 'true'
  document.getElementById('pestControl').disabled = 'true'
  document.getElementById('grace').disabled = 'true'
  document.getElementById('walk').disabled = 'true'
  document.getElementById('ceaseWalk').disabled = 'true'
  document.getElementById('lure').disabled = 'true'
  document.getElementById('companion').disabled = 'true'
  document.getElementById('comfort').disabled = 'true'
  document.getElementById('book').disabled = 'true'
  document.getElementById('feast').disabled = 'true'
  document.getElementById('blessing').disabled = 'true'
  document.getElementById('waste').disabled = 'true'
  document.getElementById('riddle').disabled = 'true'
  document.getElementById('throne').disabled = 'true'
  document.getElementById('glory').disabled = 'true'
  document.getElementById('summonShade').disabled = 'true'

  setElemDisplay('deitySelect', (window.vm.civData.temple.owned > 0))
  setElemDisplay('conquestSelect', (window.vm.civData.barracks.owned > 0))
  setElemDisplay('tradeSelect', (window.vm.civData.gold.owned > 0))

  document.getElementById('conquest').style.display = 'none'

  document.getElementById('tradeContainer').style.display = 'none'
  document.getElementById('tradeUpgradeContainer').style.display = 'none'
  document.getElementById('iconoclasmList').innerHTML = ''
  document.getElementById('iconoclasm').disabled = false
  gameLog('Game Reset') // Inform player.

  renameCiv()
  renameRuler()

  return true
}

function tickAutosave() {
  if (window.vm.settings.autosave && (++window.vm.settings.autosaveCounter >= window.vm.settings.autosaveTime)) { // eslint-disable-line no-plusplus
    window.vm.settings.autosaveCounter = 0
    // If autosave fails, disable it.
    if (!save('auto')) {
      window.vm.settings.autosave = false
    }
  }
}

// xxx Need to improve 'net' handling.
function doFarmers() {
  const specialChance = window.vm.civData.food.specialChance + (0.1 * window.vm.civData.flensing.owned)
  let millMod = 1
  if (window.vm.population.current > 0 || window.vm.curCiv.zombie.owned > 0) {
    millMod = window.vm.population.current / (window.vm.population.current + window.vm.curCiv.zombie.owned)
  }
  window.vm.civData.food.net = window.vm.civData.farmer.owned *
    (1 + (window.vm.civData.farmer.efficiency * window.vm.curCiv.morale.efficiency)) *
    ((window.vm.civData.pestControl.timer > 0) ? 1.01 : 1) * getWonderBonus(window.vm.civData.food) *
    (1 + (window.vm.civData.walk.rate / 120)) * (1 + ((window.vm.civData.mill.owned * millMod) / 200)) // Farmers farm food
  window.vm.civData.food.net -= window.vm.population.current // The living window.vm.population eats food.
  window.vm.civData.food.owned += window.vm.civData.food.net
  if (window.vm.civData.skinning.owned && window.vm.civData.farmer.owned > 0) { // and sometimes get skins
    const numSkins = specialChance * (window.vm.civData.food.increment +
      ((window.vm.civData.butchering.owned * window.vm.civData.farmer.owned) / 15.0)) * getWonderBonus(window.vm.civData.skins)
    window.vm.civData.skins.owned += rndRound(numSkins)
  }
}

function doWoodcutters() {
  window.vm.civData.wood.net = window.vm.civData.woodcutter.owned *
    (window.vm.civData.woodcutter.efficiency * window.vm.curCiv.morale.efficiency) *
    getWonderBonus(window.vm.civData.wood) // Woodcutters cut wood
  window.vm.civData.wood.owned += window.vm.civData.wood.net
  if (window.vm.civData.harvesting.owned && window.vm.civData.woodcutter.owned > 0) { // and sometimes get herbs
    const numHerbs = window.vm.civData.wood.specialChance * (window.vm.civData.wood.increment +
      ((window.vm.civData.gardening.owned * window.vm.civData.woodcutter.owned) / 5.0)) * getWonderBonus(window.vm.civData.herbs)
    window.vm.civData.herbs.owned += rndRound(numHerbs)
  }
}

function doMiners() {
  const specialChance = window.vm.civData.stone.specialChance + (window.vm.civData.macerating.owned ? 0.1 : 0)
  window.vm.civData.stone.net = window.vm.civData.miner.owned *
    (window.vm.civData.miner.efficiency * window.vm.curCiv.morale.efficiency) * getWonderBonus(window.vm.civData.stone) // Miners mine stone
  window.vm.civData.stone.owned += window.vm.civData.stone.net
  if (window.vm.civData.prospecting.owned && window.vm.civData.miner.owned > 0) { // and sometimes get ore
    const numOre = specialChance * (window.vm.civData.stone.increment +
        ((window.vm.civData.extraction.owned * window.vm.civData.miner.owned) / 5.0)) * getWonderBonus(window.vm.civData.ore)
    window.vm.civData.ore.owned += rndRound(numOre)
  }
}

function doBlacksmiths() {
  const numUsed = Math.min(window.vm.civData.ore.owned,
    (window.vm.civData.blacksmith.owned * window.vm.civData.blacksmith.efficiency * window.vm.curCiv.morale.efficiency))
  window.vm.civData.ore.owned -= numUsed
  window.vm.civData.metal.owned += numUsed * getWonderBonus(window.vm.civData.metal)
}

function doTanners() {
  const numUsed = Math.min(window.vm.civData.skins.owned,
    (window.vm.civData.tanner.owned * window.vm.civData.tanner.efficiency * window.vm.curCiv.morale.efficiency))
  window.vm.civData.skins.owned -= numUsed
  window.vm.civData.leather.owned += numUsed * getWonderBonus(window.vm.civData.leather)
}

function doClerics() {
  window.vm.civData.piety.owned += window.vm.civData.cleric.owned *
    (window.vm.civData.cleric.efficiency + (window.vm.civData.cleric.efficiency *
      (window.vm.civData.writing.owned))) * (1 + ((window.vm.civData.secrets.owned) *
      (1 - (100 / (window.vm.civData.graveyard.owned + 100))))) * window.vm.curCiv.morale.efficiency *
        getWonderBonus(window.vm.civData.piety)
}
// Try to heal the specified number of people in the specified job
// Makes them sick if the number is negative.
function heal(job, numArg) {
  if (!isValid(job) || !job) {
    return 0
  }
  let num = (numArg === undefined) ? 1 : numArg

  num = Math.min(num, window.vm.civData[job].ill)
  num = Math.max(num, -window.vm.civData[job].owned)
  window.vm.civData[job].ill -= num
  window.vm.population.totalSick -= num
  window.vm.civData[job].owned += num
  window.vm.population.healthy += num

  return num
}

// Selects random workers, transfers them to their Ill variants
function plague(sickNum) {
  let actualNum = 0
  let i

  updatePopulation()
  // Apply in 1-worker groups to spread it out.
  for (i = 0; i < sickNum; i++) {
    actualNum += -heal(randomHealthyWorker(), -1)
  }

  return actualNum
}

// Select a sick worker type to cure, with certain priorities
function getNextPatient() {
  let i
  // xxx Need to generalize this list.
  const jobs = ['healer', 'cleric', 'farmer', 'soldier', 'cavalry', 'labourer',
    'woodcutter', 'miner', 'tanner', 'blacksmith', 'unemployed',
  ]
  for (i = 0; i < jobs.length; ++i) {
    if (window.vm.civData[jobs[i]].ill > 0) {
      return jobs[i]
    }
  }

  return ''
}

function doHealers() {
  let job
  let numHealed = 0
  const numHealers = window.vm.civData.healer.owned + (window.vm.civData.cat.owned * (window.vm.civData.companion.owned))

  // How much healing can we do?
  window.vm.civData.healer.cureCount += (numHealers * window.vm.civData.healer.efficiency * window.vm.curCiv.morale.efficiency)

  // We can't cure more sick people than there are
  window.vm.civData.healer.cureCount = Math.min(window.vm.civData.healer.cureCount, window.vm.population.totalSick)

  // Cure people until we run out of healing capacity or herbs
  while (window.vm.civData.healer.cureCount >= 1 && window.vm.civData.herbs.owned >= 1) {
    job = getNextPatient()
    if (!job) {
      break
    }
    heal(job)
    window.vm.civData.healer.cureCount -= 1
    window.vm.civData.herbs.owned -= 1
    numHealed += 1
  }

  return numHealed
}

function doGraveyards() {
  let i
  if (window.vm.civData.corpses.owned > 0 && window.vm.curCiv.grave.owned > 0) {
    // Clerics will bury corpses if there are graves to fill and corpses lying around
    for (i = 0; i < window.vm.civData.cleric.owned; i++) {
      if (window.vm.civData.corpses.owned > 0 && window.vm.curCiv.grave.owned > 0) {
        window.vm.civData.corpses.owned -= 1
        window.vm.curCiv.grave.owned -= 1
      }
    }
    updatePopulationUI()
  }
}

function doCorpses() {
  if (window.vm.civData.corpses.owned <= 0) {
    return
  }

  // Corpses lying around will occasionally make people sick.
  // 1-in-50 chance (1-in-100 with feast)
  const sickChance = 50 * Math.random() * (1 + window.vm.civData.feast.owned)
  if (sickChance >= 1) {
    return
  }

  // Infect up to 1% of the window.vm.population.
  let num = Math.floor((window.vm.population.current / 100) * Math.random())
  if (num <= 0) {
    return
  }

  num = plague(num)
  if (num > 0) {
    updatePopulation()
    gameLog(`${prettify(num)} workers got sick`) // notify player
  }
}

// Returns all of the combatants present for a given place and alignment that.
function getCombatants(place, alignment) {
  return window.vm.unitData.filter((elem) => ((elem.alignment === alignment) && (elem.place === place) &&
    (elem.combatType) && (elem.owned > 0)))
}

// Some attackers get a damage mod against some defenders
function getCasualtyMod(attacker, defender) {
  // Cavalry take 50% more casualties vs infantry
  if ((defender.combatType === 'cavalry') && (attacker.combatType === 'infantry')) {
    return 1.50
  }

  return 1.0 // Otherwise no modifier
}

function doFight(attacker, defender) {
  if ((attacker.owned <= 0) || (defender.owned <= 0)) {
    return
  }

  // Defenses vary depending on whether the player is attacking or defending.
  const fortMod = (defender.alignment === 'player' ?
    (window.vm.civData.fortification.owned * window.vm.civData.fortification.efficiency) :
    (window.vm.civData.efort.owned * window.vm.civData.efort.efficiency))
  const palisadeMod = ((defender.alignment === 'player') &&
    (window.vm.civData.palisade.owned)) * window.vm.civData.palisade.efficiency

  // Determine casualties on each side.  Round fractional casualties
  // probabilistically, and don't inflict more than 100% casualties.
  const attackerCas = Math.min(attacker.owned,
    rndRound(getCasualtyMod(defender, attacker) * defender.owned * defender.efficiency))
  const defenderCas = Math.min(defender.owned,
    rndRound(getCasualtyMod(attacker, defender) * attacker.owned * (attacker.efficiency - palisadeMod) * Math.max(1 - fortMod, 0)))

  attacker.owned -= attackerCas
  defender.owned -= defenderCas

  // Give player credit for kills.
  const playerCredit = ((attacker.alignment === 'player') ? defenderCas : // eslint-disable-line no-nested-ternary
    (defender.alignment === 'player') ? attackerCas : 0)

  // Increments enemies slain, corpses, and piety
  window.vm.curCiv.enemySlain.owned += playerCredit
  if (window.vm.civData.throne.owned) {
    window.vm.civData.throne.count += playerCredit
  }
  window.vm.civData.corpses.owned += (attackerCas + defenderCas)
  if (window.vm.civData.book.owned) {
    window.vm.civData.piety.owned += (attackerCas + defenderCas) * 10
  }

  // Updates window.vm.population figures (including total window.vm.population)
  updatePopulation()
}

function doSlaughter(attacker) {
  const killVerb = (attacker.species === 'animal') ? 'eaten' : 'killed'
  const target = randomHealthyWorker() // Choose random worker
  if (target) {
    // An attacker may disappear after killing
    if (Math.random() < attacker.killExhaustion) {
      attacker.owned -= 1
    }

    window.vm.civData[target].owned -= 1

    if (attacker.species !== 'animal') {
      window.vm.civData.corpses.owned += 1
    } // Animals will eat the corpse
    gameLog(`${window.vm.civData[target].getQtyName(1)} ${killVerb} by ${attacker.getQtyName(attacker.owned)}`)
  }
  else { // Attackers slowly leave once everyone is dead
    const leaving = Math.ceil(attacker.owned * Math.random() * attacker.killFatigue)
    attacker.owned -= leaving
  }
  updatePopulation()
}

function doLoot(attacker) {
  // Select random resource, steal random amount of it.
  const target = window.vm.lootable[Math.floor(Math.random() * window.vm.lootable.length)]
  let stolenQty = Math.floor((Math.random() * 1000)) // Steal up to 1000.
  stolenQty = Math.min(stolenQty, target.owned)
  if (stolenQty > 0) {
    gameLog(`${stolenQty} ${target.getQtyName(stolenQty)
      } stolen by ${attacker.getQtyName(attacker.owned)}`)
  }
  target.owned -= stolenQty
  if (target.owned <= 0) {
    // some will leave
    const leaving = Math.ceil(attacker.owned * Math.random() * attacker.lootFatigue)
    attacker.owned -= leaving
  }

  if (--attacker.owned < 0) { // eslint-disable-line no-plusplus
    attacker.owned = 0
  } // Attackers leave after stealing something.
  updateResourceTotals()
}

function doSack(attacker) {
  // Destroy buildings
  const target = window.vm.sackable[Math.floor(Math.random() * window.vm.sackable.length)]

  // Slightly different phrasing for fortifications
  let destroyVerb = 'burned'
  if (target === window.vm.civData.fortification) {
    destroyVerb = 'damaged'
  }

  if (target.owned > 0) {
    target.owned -= 1
    window.vm.civData.freeLand.owned += 1
    gameLog(`${target.getQtyName(1)} ${destroyVerb} by ${attacker.getQtyName(attacker.owned)}`)
  }
  else {
    // some will leave
    const leaving = Math.ceil(attacker.owned * Math.random() * (1 / 112))
    attacker.owned -= leaving
  }

  if (--attacker.owned < 0) { // eslint-disable-line no-plusplus
    attacker.owned = 0
  } // Attackers leave after sacking something.
  updateRequirements(target)
  updateResourceTotals()
  updatePopulation() // Limits might change
}

function doHavoc(attacker) { // eslint-disable-line no-unused-vars
  const havoc = Math.random() // barbarians do different things
  if (havoc < 0.3) {
    doSlaughter(attacker)
  }
  else if (havoc < 0.6) {
    doLoot(attacker)
  }
  else {
    doSack(attacker)
  }
}

function doShades() {
  const defender = window.vm.civData.shade
  if (defender.owned <= 0) {
    return
  }

  // Attack each enemy in turn.
  getCombatants(defender.place, 'enemy').forEach((attacker) => {
    const num = Math.floor(Math.min((attacker.owned / 4), defender.owned))
    // xxx Should we give book and throne credit here?
    defender.owned -= num
    attacker.owned -= num
  })

  // Shades fade away even if not killed.
  defender.owned = Math.max(Math.floor(defender.owned * 0.95), 0)
}

// Deals with potentially capturing enemy siege engines.
function doEsiege(siegeObj, targetObj) {
  if (siegeObj.owned <= 0) {
    return
  }

  // First check there are enemies there defending them
  if (!getCombatants(siegeObj.place, siegeObj.alignment).length &&
    getCombatants(targetObj.place, targetObj.alignment).length) {
    // the siege engines are undefended; maybe capture them.
    if ((targetObj.alignment === 'player') && window.vm.civData.mathematics.owned) { // Can we use them?
      gameLog(`Captured ${prettify(siegeObj.owned)} enemy siege engines.`)
      window.vm.civData.siege.owned += siegeObj.owned // capture them
    }
    siegeObj.owned = 0
  }
  else if (doSiege(siegeObj, targetObj) > 0) {
    if (targetObj.id === 'fortification') {
      updateRequirements(targetObj)
      gameLog('Enemy siege engine damaged our fortifications')
    }
  }
}

// Process siege engine attack.
// Returns the number of hits.
function doSiege(siegeObj, targetObj) {
  let i
  let hit
  let hits = 0
  // Only half can fire every round due to reloading time.
  // We also allow no more than 2 per defending fortification.
  const firing = Math.ceil(Math.min(siegeObj.owned / 2, targetObj.owned * 2))
  for (i = 0; i < firing; ++i) {
    hit = Math.random()
    if (hit > 0.95) {
      siegeObj.owned -= 1
    } // misfire; destroys itself
    if (hit >= siegeObj.efficiency) {
      continue
    } // miss
    hits += 1 // hit
    if (--targetObj.owned <= 0) { // eslint-disable-line no-plusplus
      break
    }
  }

  return hits
}

// Handling raids
function doRaid(place, attackerID, defenderID) {
  if (!window.vm.curCiv.raid.raiding) {
    return
  } // We're not raiding right now.

  const attackers = getCombatants(place, attackerID)
  const defenders = getCombatants(place, defenderID)

  if (attackers.length && !defenders.length) { // Win check.
    // Slaughter any losing noncombatant units.
    // xxx Should give throne and corpses for any human ones?
    window.vm.unitData.filter((elem) => ((elem.alignment === defenderID) && (elem.place === place)))
      .forEach((elem) => {
        elem.owned = 0
      })

    if (!window.vm.curCiv.raid.victory) {
      gameLog('Raid victorious!')
    } // Notify player on initial win.
    window.vm.curCiv.raid.victory = true // Flag victory for future handling
  }

  if (!attackers.length && defenders.length) { // Loss check.
    // Slaughter any losing noncombatant units.
    // xxx Should give throne and corpses for any human ones?
    window.vm.unitData.filter((elem) => ((elem.alignment === attackerID) && (elem.place === place)))
      .forEach((elem) => {
        elem.owned = 0
      })

    gameLog('Raid defeated') // Notify player
    resetRaiding()
    return
  }

  // Do the actual combat.
  attackers.forEach((attacker) => {
    defenders.forEach((defender) => {
      doFight(attacker, defender)
    }) // FIGHT!
  })

  // Handle siege engines
  doSiege(window.vm.civData.siege, window.vm.civData.efort)
}

function doLabourers() {
  if (window.vm.curCiv.curWonder.stage !== 1) {
    return
  }

  if (window.vm.curCiv.curWonder.progress >= 100) {
    // Wonder is finished! First, send workers home
    window.vm.civData.unemployed.owned += window.vm.civData.labourer.owned
    window.vm.civData.unemployed.ill += window.vm.civData.labourer.ill
    window.vm.civData.labourer.owned = 0
    window.vm.civData.labourer.ill = 0
    updatePopulation()
    // hide limited notice
    document.getElementById('lowResources').style.display = 'none'
      // then set wonder.stage so things will be updated appropriately
    window.vm.curCiv.curWonder.stage += 1
  }
  else {
    // we're still building

    // First, check our labourers and other resources to see if we're limited.
    let num = window.vm.civData.labourer.owned
    window.vm.wonderResources.forEach((elem) => {
      num = Math.min(num, elem.owned)
    })

    // remove resources
    window.vm.wonderResources.forEach((elem) => {
      elem.owned -= num
    })

    // increase progress
    window.vm.curCiv.curWonder.progress += num / (1000000 * getWonderCostMultiplier())

    // show/hide limited notice
    setElemDisplay('lowResources', (num < window.vm.civData.labourer.owned))

    let lowItem = null
    let i = 0
    for (i = 0; i < window.vm.wonderResources.length; ++i) {
      if (window.vm.wonderResources[i].owned < 1) {
        lowItem = window.vm.wonderResources[i]
        break
      }
    }
    if (lowItem) {
      document.getElementById('limited').innerHTML = ` by low ${lowItem.getQtyName()}`
    }
  }
  updateWonder()
}

function doMobs() {
  // Checks when mobs will attack
  // xxx Perhaps this should go after the mobs attack, so we give 1 turn's warning?
  let mobType
  let choose
  if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0) {
    window.vm.curCiv.attackCounter += 1
  } // No attacks if deserted.
  if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0 && window.vm.curCiv.attackCounter > (60 * 5)) { // Minimum 5 minutes
    if (600 * Math.random() < 1) {
      window.vm.curCiv.attackCounter = 0
      // Choose which kind of mob will attack
      mobType = 'wolf' // Default to wolves
      if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 10000) {
        choose = Math.random()
        if (choose > 0.5) {
          mobType = 'barbarian'
        }
        else if (choose > 0.2) {
          mobType = 'bandit'
        }
      }
      else if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 1000) {
        if (Math.random() > 0.5) {
          mobType = 'bandit'
        }
      }
      spawnMob(window.vm.civData[mobType])
    }
  }

  // Handling mob attacks
  getCombatants('home', 'enemy').forEach((attacker) => {
    if (attacker.owned <= 0) {
      return
    } // In case the last one was killed in an earlier iteration.

    const defenders = getCombatants(attacker.place, 'player')
    if (!defenders.length) {
      attacker.onWin()
      return
    } // Undefended

    defenders.forEach((defender) => {
      doFight(attacker, defender)
    }) // FIGHT!
  })
}

function tickTraders() {
  // traders occasionally show up
  if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0) {
    window.vm.curCiv.trader.counter += 1
  }
  const delayMult = 60 * (3 - ((window.vm.civData.currency.owned) + (window.vm.civData.commerce.owned)))
  let check
  if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0 && window.vm.curCiv.trader.counter > delayMult) {
    check = Math.random() * delayMult
    if (check < (1 + (0.2 * (window.vm.civData.comfort.owned)))) {
      window.vm.curCiv.trader.counter = 0
      tradeTimer()
    }
  }

  // Trader stuff
  if (window.vm.curCiv.trader.timer > 0) {
    if (--window.vm.curCiv.trader.timer <= 0) { // eslint-disable-line no-plusplus
      setElemDisplay('tradeContainer', false)
    }
  }
}

function doPestControl() {
  // Decrements the pestControl Timer
  if (window.vm.civData.pestControl.timer > 0) {
    window.vm.civData.pestControl.timer -= 1
  }
}

function tickGlory() {
  // Handles the Glory bonus
  if (window.vm.civData.glory.timer > 0) {
    document.getElementById('gloryTimer').innerHTML = window.vm.civData.glory.timer-- // eslint-disable-line no-plusplus
  }
  else {
    document.getElementById('gloryGroup').style.display = 'none'
  }
}

function doThrone() {
  if (window.vm.civData.throne.count >= 100) {
    // If sufficient enemies have been slain, build new temples for free
    window.vm.civData.temple.owned += Math.floor(window.vm.civData.throne.count / 100)
    window.vm.civData.throne.count = 0 // xxx This loses the leftovers.
    updateResourceTotals()
  }
}

function tickGrace() {
  if (window.vm.civData.grace.cost > 1000) {
    window.vm.civData.grace.cost = Math.floor(--window.vm.civData.grace.cost) // eslint-disable-line no-plusplus
    document.getElementById('graceCost').innerHTML = prettify(window.vm.civData.grace.cost)
  }
}

// Start of init program code
function initCivclicker() {
  makeDeitiesTables()

  if (!load('localStorage')) { // immediately attempts to load
    // Prompt player for names
    renameCiv()
    renameRuler()
  }
}

/* UI functions */

// Called when user switches between the various panes on the left hand side of the interface
// Returns the target pane element.
function paneSelect(control) { // eslint-disable-line no-unused-vars
  let i
  let oldTarget

  // Identify the target pane to be activated, and the currently active
  // selector tab(s).
  const newTarget = dataset(control, 'target')
  const selectors = document.getElementById('selectors')
  if (!selectors) {
    console.error('No selectors found')
    return null
  }
  const curSelects = selectors.getElementsByClassName('selected')

  // Deselect the old panels.
  for (i = 0; i < curSelects.length; ++i) {
    oldTarget = dataset(curSelects[i], 'target')
    if (oldTarget === newTarget) {
      continue
    }
    document.getElementById(oldTarget).classList.remove('selected')
    curSelects[i].classList.remove('selected')
  }

  // Select the new panel.
  control.classList.add('selected')
  const targetElem = document.getElementById(newTarget)
  if (targetElem) {
    targetElem.classList.add('selected')
  }
  return targetElem
}

function impExp() { // eslint-disable-line no-unused-vars
  setElemDisplay('impexp') // Toggles visibility state
}

function versionAlert() {
  console.warn('New Version Available')
  document.getElementById('versionAlert').style.display = 'inline'
}

function prettify(input) {
  // xxx TODO: Add appropriate format options
  return (window.vm.settings.delimiters) ? Number(input).toLocaleString() : input.toString()
}

function setAutosave(value) {
  if (value !== undefined) {
    window.vm.settings.autosave = value
  }
  document.getElementById('toggleAutosave').checked = window.vm.settings.autosave
}

function onToggleAutosave(control) { // eslint-disable-line no-unused-vars
  return setAutosave(control.checked)
}

function setCustomQuantities(value) {
  let i
  let elems
  const curPop = window.vm.population.current + window.vm.curCiv.zombie.owned

  if (value !== undefined) {
    window.vm.settings.customIncr = value
  }
  document.getElementById('toggleCustomQuantities').checked = window.vm.settings.customIncr

  setElemDisplay('customPartyQuantity', window.vm.settings.customIncr)
  setElemDisplay('customBuildQuantity', window.vm.settings.customIncr)
  setElemDisplay('customSpawnQuantity', window.vm.settings.customIncr)

  elems = document.getElementsByClassName('unit10')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10))
  }

  elems = document.getElementsByClassName('unit100')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 100))
  }

  elems = document.getElementsByClassName('unit1000')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
  }

  elems = document.getElementsByClassName('unitInfinity')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
  }

  elems = document.getElementsByClassName('building10')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 100))
  }

  elems = document.getElementsByClassName('building100')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
  }

  elems = document.getElementsByClassName('building1000')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10000))
  }

  elems = document.getElementsByClassName('buildingInfinity')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10000))
  }

  elems = document.getElementsByClassName('buycustom')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], window.vm.settings.customIncr)
  }
}

function onToggleCustomQuantities(control) { // eslint-disable-line no-unused-vars
  return setCustomQuantities(control.checked)
}

// Toggles the display of the .notes class
function setNotes(value) {
  if (value !== undefined) {
    window.vm.settings.notes = value
  }
  document.getElementById('toggleNotes').checked = window.vm.settings.notes

  let i
  const elems = document.getElementsByClassName('note')
  for (i = 0; i < elems.length; ++i) {
    setElemDisplay(elems[i], window.vm.settings.notes)
  }
}

function onToggleNotes(control) { // eslint-disable-line no-unused-vars
  return setNotes(control.checked)
}

// value is the desired change in 0.1em units.
function textSize(value) {
  if (value !== undefined) {
    window.vm.settings.fontSize += 0.1 * value
  }
  document.getElementById('smallerText').disabled = (window.vm.settings.fontSize <= 0.5)

  // xxx Should this be applied to the document instead of the body?
  document.getElementsByTagName('body')[0].style.fontSize = `${window.vm.settings.fontSize}em`
}

function setShadow(value) {
  if (value !== undefined) {
    window.vm.settings.textShadow = value
  }
  document.getElementById('toggleShadow').checked = window.vm.settings.textShadow
  const shadowStyle = '3px 0 0 #fff, -3px 0 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff' +
    ', 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff'
  document.getElementsByTagName('body')[0].style.textShadow = window.vm.settings.textShadow ? shadowStyle : 'none'
}

function onToggleShadow(control) { // eslint-disable-line no-unused-vars
  return setShadow(control.checked)
}

// Does nothing yet, will probably toggle display for "icon" and "word" classes
// as that's probably the simplest way to do this.
function setIcons(value) {
  if (value !== undefined) {
    window.vm.settings.useIcons = value
  }
  document.getElementById('toggleIcons').checked = window.vm.settings.useIcons

  let i
  const elems = document.getElementsByClassName('icon')
  for (i = 0; i < elems.length; ++i) {
    // Worksafe implies no icons.
    elems[i].style.visibility = (window.vm.settings.useIcons && !window.vm.settings.worksafe) ? 'visible' : 'hidden'
  }
}

function onToggleIcons(control) { // eslint-disable-line no-unused-vars
  return setIcons(control.checked)
}

function setDelimiters(value) {
  if (value !== undefined) {
    window.vm.settings.delimiters = value
  }
  document.getElementById('toggleDelimiters').checked = window.vm.settings.delimiters
  // updateResourceTotals() // FIXME: re-enable later or just remove since they'll autoupdate
}

function onToggleDelimiters(control) { // eslint-disable-line no-unused-vars
  return setDelimiters(control.checked)
}

function setWorksafe(value) {
  if (value !== undefined) {
    window.vm.settings.worksafe = value
  }
  document.getElementById('toggleWorksafe').checked = window.vm.settings.worksafe

  // xxx Should this be applied to the document instead of the body?
  if (window.vm.settings.worksafe) {
    document.getElementsByTagName('body')[0].classList.remove('hasBackground')
  }
  else {
    document.getElementsByTagName('body')[0].classList.add('hasBackground')
  }

  setIcons() // Worksafe overrides icon settings.
}

function onToggleWorksafe(control) { // eslint-disable-line no-unused-vars
  return setWorksafe(control.checked)
}

/* Debug functions */

// Not strictly a debug function so much as it is letting the user know when
// something happens without needing to watch the console.
function gameLog(message) {
  // get the current date, extract the current time in HH.MM format
  // xxx It would be nice to use Date.getLocaleTimeString(locale,options) here, but most browsers don't allow the options yet.
  const d = new Date()
  const curTime = `${d.getHours()}.${(d.getMinutes() < 10) ? '0' : ''}${d.getMinutes()}`

  // Check to see if the last message was the same as this one, if so just increment the (xNumber) value
  if (document.getElementById('logL').innerHTML !== message) {
    window.vm.logRepeat = 0 // Reset the (xNumber) value

    // Go through all the logs in order, moving them down one and successively overwriting them.
    let i = 5 // Number of lines of log to keep.
    while (--i > 1) { // eslint-disable-line no-plusplus
      document.getElementById(`log${i}`).innerHTML = document.getElementById(`log${i - 1}`).innerHTML
    }
    // Since ids need to be unique, log1 strips the ids from the log0 elements when copying the contents.
    document.getElementById('log1').innerHTML = `<td>${document.getElementById('logT').innerHTML
      }</td><td>${document.getElementById('logL').innerHTML
      }</td><td>${document.getElementById('logR').innerHTML}</td>`
  }
  // Updates most recent line with new time, message, and xNumber.
  let s = `<td id='logT'>${curTime}</td><td id='logL'>${message}</td><td id='logR'>`
  if (++window.vm.logRepeat > 1) { // eslint-disable-line no-plusplus
    s += `(x${window.vm.logRepeat})`
  } // Optional (xNumber)
  s += '</td>'
  document.getElementById('log0').innerHTML = s
}

function updateTest() { // eslint-disable-line no-unused-vars
  // Debug function, runs the update() function 1000 times, adds the results together, and calculates a mean
  let total = 0
  let i
  for (i = 0; i < 1000; i++) {
    total += update()
  }
  console.warn(total)
  total /= 1000
  console.warn(total)
}

function ruinFun() { // eslint-disable-line no-unused-vars
  // Debug function adds loads of stuff for free to help with testing.
  window.vm.civData.food.owned += 1000000
  window.vm.civData.wood.owned += 1000000
  window.vm.civData.stone.owned += 1000000
  window.vm.civData.barn.owned += 5000
  window.vm.civData.woodstock.owned += 5000
  window.vm.civData.stonestock.owned += 5000
  window.vm.civData.herbs.owned += 1000000
  window.vm.civData.skins.owned += 1000000
  window.vm.civData.ore.owned += 1000000
  window.vm.civData.leather.owned += 1000000
  window.vm.civData.metal.owned += 1000000
  window.vm.civData.piety.owned += 1000000
  window.vm.civData.gold.owned += 10000
  renameRuler('Cheater')
  updatePopulation()
  updateUpgrades()
  updateResourceTotals()
}

/*
 * If you're reading this, thanks for playing!
 * This project was my first major HTML5/Javascript game, and was as
 * much about learning Javascript as it is anything else. I hope it
 * inspires others to make better games. :)
 *
 *     David Holley
 */
