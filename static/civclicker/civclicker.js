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
function getWonderBonus(resourceObj) { // eslint-disable-line no-unused-vars
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
    text += `${window.vm.prettify(Math.round(num))} ${window.vm.civData[i].getQtyName(num)}`
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
// revealed or hidden based on toggles and population.  Currently, we do this
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

// For efficiency, we set up a single bulk listener for all of the buttons, rather
// than putting a separate listener on each button.
function onBulkEvent(e) { // eslint-disable-line
  switch (dataset(e.target, 'action')) {
    case 'increment':
      return onIncrement(e.target)
    case 'purchase':
      return onPurchase(e.target)
    case 'raid':
      console.error("onBulkEvent: can't happen")
      return undefined
    default:
      return false
  }
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
  // including population.
  displayElems = document.querySelectorAll("[data-action='display']")
  for (i = 0; i < displayElems.length; ++i) {
    elem = displayElems[i]
    // xxx Have to use window.vm.curCiv here because of zombies and other non-window.vm.civData displays.
    elem.innerHTML = window.vm.prettify(Math.floor(window.vm.curCiv[dataset(elem, 'target')].owned))
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

    elem.innerHTML = window.vm.prettify(val.toFixed(1))
  }

  if (window.vm.civData.gold.owned >= 1) {
    setElemDisplay('goldRow', true)
  }

  // Update page with building numbers, also stockpile limits.
  document.getElementById('maxfood').innerHTML = window.vm.prettify(window.vm.civData.food.limit)
  document.getElementById('maxwood').innerHTML = window.vm.prettify(window.vm.civData.wood.limit)
  document.getElementById('maxstone').innerHTML = window.vm.prettify(window.vm.civData.stone.limit)

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
  document.getElementById('totalBuildings').innerHTML = window.vm.prettify(buildingCount)
  document.getElementById('totalLand').innerHTML = window.vm.prettify(buildingCount + landCount)

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

  updatePopulation() // updatePopulation() handles the population limit, which is determined by buildings.
  updatePopulationUI() // xxx Maybe remove this?
}

function updatePopulation() {
  // Update population limit by multiplying out housing numbers
  window.vm.$store.commit('setPopulationLimit', window.vm.civData.tent.owned +
    (window.vm.civData.hut.owned * 3) + (window.vm.civData.cottage.owned * 6) +
    (window.vm.civData.house.owned * (10 + ((window.vm.civData.tenements.owned) * 2) +
      ((window.vm.civData.slums.owned) * 2))) + (window.vm.civData.mansion.owned * 50))
  // Update sick workers
  let totalSick = 0
  window.vm.unitData.forEach(function(elem) { // eslint-disable-line
    if (elem.alignment === 'player') {
      totalSick += (elem.ill || 0)
    }
  })
  window.vm.$store.commit('setPopulationSick', totalSick)

  setElemDisplay('totalSickRow', (window.vm.$store.state.population.totalSick > 0))

  // Calculate healthy workers (excludes sick, zombies and deployed units)
  // xxx Should this use 'window.vm.killable'?
  let healthy = 0
  window.vm.unitData.forEach((elem) => {
    if ((elem.vulnerable)) {
      healthy += elem.owned
    }
  })

  // xxx Doesn't subtracting the zombies here throw off the calculations in randomHealthyWorker()?
  window.vm.$store.commit('setPopulationHealthy', healthy - window.vm.curCiv.zombie.owned)

  // Calculate housed/fed population (excludes zombies)
  let current = window.vm.$store.state.population.healthy + window.vm.$store.state.population.totalSick
  window.vm.unitData.forEach((elem) => {
    if ((elem.alignment === 'player') && (elem.subType === 'normal') && (elem.place === 'party')) {
      current += elem.owned
    }
  })
  window.vm.$store.commit('setPopulationCurrent', current)

  // Zombie soldiers dying can drive population.current negative if they are killed and zombies are the only thing left.
  // xxx This seems like a hack that should be given a real fix.
  if (window.vm.$store.state.population.current < 0) {
    if (window.vm.curCiv.zombie.owned > 0) {
      // This fixes that by removing zombies and setting to zero.
      window.vm.curCiv.zombie.owned += window.vm.$store.state.population.current
      window.vm.$store.commit('setPopulationCurrent', 0)
    }
    else {
      console.error('Warning: Negative current population detected.')
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
  // the population subproperty to be displayed as the element's content.
  // xxx This selector should probably require data-target too.
  // xxx Note that relatively few values are still stored in the population
  // struct; most of them are now updated by the 'display' action run
  // by updateResourceTotals().
  const displayElems = document.querySelectorAll("[data-action='display_pop']")
  for (i = 0; i < displayElems.length; ++i) {
    elem = displayElems[i]
    elem.innerHTML = window.vm.prettify(Math.floor(window.vm.$store.state.population[dataset(elem, 'target')]))
  }

  window.vm.civData.house.update() // xxx Effect might change dynamically.  Need a more general way to do this.

  setElemDisplay('graveTotal', (window.vm.curCiv.grave.owned > 0))

  // As population increases, various things change
  // Update our civ type name
  let civType = window.vm.civSizes.getCivSize(window.vm.$store.state.population.current).name
  if (window.vm.$store.state.population.current === 0 && window.vm.$store.state.population.limit >= 1000) {
    civType = 'Ghost Town'
  }
  if (window.vm.curCiv.zombie.owned >= 1000 && window.vm.curCiv.zombie.owned >= 2 * window.vm.$store.state.population.current) { // easter egg
    civType = 'Necropolis'
  }
  document.getElementById('civType').innerHTML = civType

  // Unlocking interface elements as population increases to reduce unnecessary clicking
  // xxx These should be reset in reset()
  if (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned >= 10) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('unit10')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }
  if (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned >= 100) {
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
  if (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned >= 1000) {
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
  if (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned >= 10000) {
    if (!window.vm.settings.customIncr) {
      elems = document.getElementsByClassName('building1000')
      for (i = 0; i < elems.length; i++) {
        setElemDisplay(elems[i], !window.vm.settings.customincr)
      }
    }
  }

  // Turning on/off buttons based on free space.
  const maxSpawn = Math.max(0, Math.min(
    (window.vm.$store.state.population.limit - window.vm.$store.state.population.current),
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

  // Calculates and displays the cost of buying workers at the current population.
  document.getElementById('raiseDeadCost').innerHTML = window.vm.prettify(Math.round(calcZombieCost(1)))
  document.getElementById('workerNumMax').innerHTML = window.vm.prettify(Math.round(maxSpawn))
  document.getElementById('workerCostMax').innerHTML = window.vm.prettify(Math.round(calcWorkerCost(maxSpawn)))
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
  if (window.vm.$store.state.population.healthy < 1) {
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
  if (window.vm.$store.state.population.current < 1) {
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

// Calculates and returns the cost of adding a certain number of workers at the present population
// xxx Make this work for negative numbers
function calcWorkerCost(num, curPopArg) {
  const curPop = (curPopArg === undefined) ? window.vm.$store.state.population.current : curPopArg
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

  // Apply population limit, and only allow whole workers.
  num = Math.min(num, (window.vm.$store.state.population.limit - window.vm.$store.state.population.current))

  // Update numbers and resource levels
  window.vm.civData.food.owned -= calcWorkerCost(num)

  // New workers enter as farmers, but we only destroy idle ones.
  if (num >= 0) {
    window.vm.civData.farmer.owned += num
  }
  else {
    jobObj.owned += num
  }
  updatePopulation() // Run through the population->job update cycle

  // This is intentionally independent of the number of workers spawned
  if (Math.random() * 100 < 1 + (window.vm.civData.lure.owned)) {
    spawnCat()
  }

  updateResourceTotals() // update with new resource number
  updatePopulationUI()

  return num
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

  updatePopulation() // Run through population->jobs cycle to update page with zombie and corpse totals
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
  const num = Math.random() * window.vm.$store.state.population.healthy
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
// xxx This should probably scale based on population (and maybe devotion).
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
  document.getElementById('walkStat').innerHTML = window.vm.prettify(window.vm.civData.walk.rate)
  document.getElementById('ceaseWalk').disabled = (window.vm.civData.walk.rate === 0)
  setElemDisplay('walkGroup', (window.vm.civData.walk.rate > 0))
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
    document.getElementById('graceCost').innerHTML = window.vm.prettify(window.vm.civData.grace.cost)
    adjustMorale(delta)
    updateResourceTotals()
    updateMorale()
  }
}

// xxx Eventually, we should have events like deaths affect morale (scaled by %age of total pop)
function adjustMorale(delta) {
  // Changes and updates morale given a delta value
  if (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned > 0) { // dividing by zero is bad for hive
    // calculates zombie proportion (zombies do not become happy or sad)
    const fraction = window.vm.$store.state.population.current /
      (window.vm.$store.state.population.current + window.vm.curCiv.zombie.owned)
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

// Based on the most wonders in any single resource.
function getWonderCostMultiplier() { // eslint-disable-line no-unused-vars
  let i
  let mostWonders = 0
  for (i in window.vm.wonderCount) {
    if (Object.prototype.hasOwnProperty.call(window.vm.wonderCount, i)) {
      mostWonders = Math.max(mostWonders, window.vm.wonderCount[i])
    }
  }
  return (1.5 ** mostWonders)
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
function load(loadType) { // eslint-disable-line
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
function save(savetype) { // eslint-disable-line no-unused-vars
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

  window.vm.$store.commit('setPopulationCurrent', 0)
  window.vm.$store.commit('setPopulationLimit', 0)
  window.vm.$store.commit('setPopulationHealthy', 0)
  window.vm.$store.commit('setPopulationSick', 0)

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

  document.getElementById('graceCost').innerHTML = window.vm.prettify(window.vm.civData.grace.cost)
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

// Returns all of the combatants present for a given place and alignment that.
function getCombatants(place, alignment) {
  return window.vm.unitData.filter((elem) => ((elem.alignment === alignment) && (elem.place === place) &&
    (elem.combatType) && (elem.owned > 0)))
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

/* UI functions */

function impExp() { // eslint-disable-line no-unused-vars
  setElemDisplay('impexp') // Toggles visibility state
}

function versionAlert() {
  console.warn('New Version Available')
  document.getElementById('versionAlert').style.display = 'inline'
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
