module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  "env": {
    "browser": true,
    "es6": true
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  // extends: ['egoist-vue', 'airbnb-base'],
  extends: ['vue', 'airbnb-base'],
  // extends: ['egoist-vue', 'standard'],
  // extends: ['eslint:recommended', 'standard'],
  // extends: ['eslint:all', 'standard'],
  // required to lint *.vue files
  plugins: [
    'html',
    'vue',
    'import',
  ],
  // add your custom rules here
  'rules': {
    'space-before-function-paren': 0,
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'brace-style': [ 2, "stroustrup", { "allowSingleLine": true } ],
    'operator-linebreak': [ 2, "after" ],
    'semi': ["error", "never"],
    "import/extensions": ["off", "always", { // TODO: fixme
      "js": "never",
      "vue": "never"
    }],
    "import/no-unresolved":  ["off"] // TODO: fixme
  },
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": "build/webpack.base.conf.js"
      }
    }
  },
  // settings: {
  //   'import/extensions': ['.js', '.vue']
  // }
}
