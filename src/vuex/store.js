import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const storeState = {
  settings: {
  },
  // These are not saved, but we need them up here for the asset data to init properly.
  population: {
    current: 0,
    limit: 0,
    healthy: 0,
    totalSick: 0,
  },
  notes: [],
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
  ADD_NOTE (state) {
    const newNote = {
      text: 'New note',
      favorite: false,
    }
    state.notes.push(newNote)
    state.activeNote = newNote
  },

  EDIT_NOTE (state, text) {
    state.activeNote.text = text
  },

  DELETE_NOTE (state) {
    state.notes.$remove(state.activeNote)
    state.activeNote = state.notes[0]
  },

  TOGGLE_FAVORITE (state) {
    state.activeNote.favorite = !state.activeNote.favorite
  },

  SET_ACTIVE_NOTE (state, note) {
    state.activeNote = note
  },
}

export default new Vuex.Store({
  state: storeState,
  mutations: storeMutations,
})
