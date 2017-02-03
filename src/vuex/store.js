import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const storeState = {
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
  // Caches the total number of each wonder, so that we don't have to recount repeatedly.
  wonderCount: {},
  // then set material and requested amount
  // Item and base amount
  tradeItems:  [
    /* beautify preserve:start */
    { materialId: 'food',    requested: 5000 },
    { materialId: 'wood',    requested: 5000 },
    { materialId: 'stone',   requested: 5000 },
    { materialId: 'skins',   requested: 500  },
    { materialId: 'herbs',   requested: 500  },
    { materialId: 'ore',     requested: 500  },
    { materialId: 'leather', requested: 250  },
    { materialId: 'metal',   requested: 250  },
    /* beautify preserve:end */
  ],
  notes:      [],
  activeNote: {},
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
  strict:    process.env.NODE_ENV !== 'production',
})
