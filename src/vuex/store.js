import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

/* global indexArrayByAttr VersionData */

function VersionData(major, minor, sub, mod) {
  this.major = major
  this.minor = minor
  this.sub = sub
  this.mod = mod
}
VersionData.prototype.toNumber = function() { return this.major * 1000 + this.minor + this.sub / 1000 } // eslint-disable-line
VersionData.prototype.toString = function() { // eslint-disable-line
  return `${String(this.major)}.${
    String(this.minor)}.${String(this.sub)}${String(this.mod)}`
}

const storeState = {
  /* beautify preserve:start */
  // These are settings that should probably be tied to the browser.
  settings: {
    autosave:        true,
    autosaveCounter: 1,
    autosaveTime:    60, // Currently autosave is every minute. Might change to 5 mins in future.
    customIncr:      false,
    fontSize:        1.0,
    delimiters:      true,
    textShadow:      false,
    notes:           true,
    worksafe:        false,
    useIcons:        true,
  },
  // These are not saved, but we need them up here for the asset data to init properly.
  population: {
    current:   0,
    limit:     0,
    healthy:   0,
    totalSick: 0,
  },
  civSizes:    [],
  // Caches the total number of each wonder, so that we don't have to recount repeatedly.
  wonderCount: {},
  // then set material and requested amount
  // Item and base amount
  tradeItems:  [],
  notes:       [],
  activeNote:  {},
  version:     19, // This is an ordinal used to trigger reloads.
  versionData: new VersionData(1, 1, 59, 'alpha'),
  // Declare variables here so they can be referenced later.
  curCiv:      {
    civName:   'Woodstock',
    rulerName: 'Orteil',

    zombie:     { owned: 0 },
    grave:      { owned: 0 },
    enemySlain: { owned: 0 },
    morale:     { mod: 1.0 },

    resourceClicks: 0, // For NeverClick
    attackCounter:  0, // How long since last attack?

    trader: {
      materialId: '',
      requested:  0,
      timer:      0,
      counter:    0, // How long since last trader?
    },

    raid: {
      raiding:     false, // Are we in a raid right now?
      victory:     false, // Are we in a "raid succeeded" (Plunder-enabled) state right now?
      epop:        0, // Population of enemy we're raiding.
      plunderLoot: {}, // Loot we get if we win.
      last:        '',
      targetMax:   '', // Largest target allowed
    },

    curWonder: {
      name:     '',
      stage:    0, // 0 = Not started, 1 = Building, 2 = Built, awaiting selection, 3 = Finished.
      progress: 0, // Percentage completed.
      rushed:   false,
    },
    wonders: [], // Array of {name: name, resourceId: resourceId} for all wonders.

    // Known deities.  The 0th element is the current game's deity.
    // If the name is "", no deity has been created (can also check for worship upgrade)
    // If the name is populated but the domain is not, the domain has not been selected.
    deities: [{
      name:   '',
      domain: '',
      maxDev: 0,
    }], // array of { name, domain, maxDev }

    // xxx We're still accessing many of the properties put here by this.civData
    // elements without going through the this.civData accessors.  That should
    // change.
  },
  /* beautify preserve:end */
}

const storeGetters = {
  doneTodos:  state => state.todos.filter(todo => todo.done),
  getCivSize: (state) => (popcnt) => {
    for (let i = 0; i < state.civSizes.length; ++i) {
      if (popcnt <= state.civSizes[i].max_pop) {
        return state.civSizes[i]
      }
    }
    return state.civSizes[0]
  },
}

const storeMutations = {
  healSick(state, num) {
    state.population.totalSick -= num
    state.population.healthy += num
  },
  kill(state, num) {
    state.population.current -= num
    state.population.healthy -= num
  },
  setSick(state, num) {
    state.population.totalSick = num
  },
  setPopulationLimit(state, num) {
    state.population.limit = num
  },
  setPopulationSick(state, num) {
    state.population.totalSick = num
  },
  setPopulationHealthy(state, num) {
    state.population.healthy = num
  },
  setPopulationCurrent(state, num) {
    state.population.current = num
  },
  setWonderCount(state, wonderCount) {
    state.wonderCount = wonderCount
  },
  resizeFontSize(state, sizeMod) {
    state.settings.fontSize += sizeMod
  },
  incrementAutosaveCounter(state) {
    state.settings.autosaveCounter += 1
  },
  resetAutosaveCounter(state) {
    state.settings.autosaveCounter = 0
  },
  disableAutosave(state) {
    state.settings.autosave = false
  },
  loadSettings(state, savedSettings) {
    state.settings = savedSettings
  },
  setCustomIncr(state, val) {
    state.settings.customIncr = val
  },
  setAutosave(state, val) {
    state.settings.autosave = val
  },
  setDelimiters(state, val) {
    state.settings.delimiters = val
  },
  setTextShadow(state, val) {
    state.settings.textShadow = val
  },
  setNotes(state, val) {
    state.settings.notes = val
  },
  setWorksafe(state, val) {
    state.settings.worksafe = val
  },
  setUseIcons(state, val) {
    state.settings.useIcons = val
  },
  populate(state, { tradeItems, civSizes }) {
    state.tradeItems = tradeItems

    indexArrayByAttr(civSizes, 'id')
    state.civSizes = civSizes

    // Annotate with max population and index.
    state.civSizes.forEach((elem, i, arr) => {
      elem.max_pop = (i + 1 < arr.length) ? (arr[i + 1].min_pop - 1) : Infinity
      elem.idx = i
    })

    state.curCiv.raid.targetMax = state.civSizes[0].id
  },
  startRaid(state, newRaid) {
    state.curCiv.raid.raiding = newRaid.raiding
    state.curCiv.raid.last = newRaid.last
    state.curCiv.raid.epop = newRaid.epop
    state.curCiv.raid.plunderLoot = newRaid.plunderLoot
  },
  finishRaid(state, newRaid) {
    state.curCiv.raid.raiding = newRaid.raiding
    state.curCiv.raid.victory = newRaid.victory
    state.curCiv.raid.last = newRaid.last
    state.curCiv.raid.epop = newRaid.epop
    state.curCiv.raid.plunderLoot = newRaid.plunderLoot
  },
  ADD_NOTE(state) {
    const newNote = {
      text:     'New note',
      favorite: false,
    }
    state.notes.push(newNote)
    state.activeNote = newNote
  },

  EDIT_NOTE(state, text) {
    state.activeNote.text = text
  },

  DELETE_NOTE(state) {
    state.notes.$remove(state.activeNote)
    state.activeNote = state.notes[0]
  },

  TOGGLE_FAVORITE(state) {
    state.activeNote.favorite = !state.activeNote.favorite
  },

  SET_ACTIVE_NOTE(state, note) {
    state.activeNote = note
  },
}

export default new Vuex.Store({
  state:     storeState,
  mutations: storeMutations,
  getters:   storeGetters,
  // strict:    process.env.NODE_ENV !== 'production',
})
