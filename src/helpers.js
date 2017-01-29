function prettyify(v) {
  return (window.vm.settings.delimiters) ? Number(v).toLocaleString() : v.toString()
}

function prettyint(v) {
  const vv = Math.round(v)
  return (window.vm.settings.delimiters) ? Number(vv).toLocaleString() : vv.toString()
}

export {
  prettyify,
  prettyint,
}
