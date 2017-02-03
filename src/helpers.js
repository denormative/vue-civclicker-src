import store from './vuex/store'

function prettyify(v) {
  return (store.state.settings.delimiters) ? Number(v).toLocaleString() : v.toString()
}

function prettyint(v) {
  const vv = Math.round(v)
  return (store.state.settings.delimiters) ? Number(vv).toLocaleString() : vv.toString()
}

export {
  prettyify,
  prettyint,
}
