<template>
<div role="tabpanel" id="achievementsPane" class="achievements-pane tab-pane">
  <div id="achievements">
    <h3>Achievements</h3>
  </div>
</div>
</template>

<script>
export default {
  name: 'achievements-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      this.addAchievementRows()
    })
  },
  methods: {
    // achObj can be:
    //   true:  Generate a line break
    //   false: Generate a gap
    //   An achievement (or civ size) object: Generate the display of that achievement
    getAchRowText(achObj) {
      if (achObj === true) {
        return "<div style='clear:both;'><br></div>"
      }
      if (achObj === false) {
        return "<div class='break'>&nbsp;</div>"
      }
      return `<div class='achievement' title='${achObj.getQtyName()}'>` +
        `<div class='unlockedAch' id='${achObj.id}'>${achObj.getQtyName()}</div></div>`
    },
    // Dynamically create the achievement display
    addAchievementRows() {
      let s = ''
      window.vm.achData.forEach((elem) => {
        s += this.getAchRowText(elem)
      })
      document.getElementById('achievements').innerHTML += s
    },
  },
}
</script>

<style>
.achievement {
  display: block;
  float: left;
  width: 50px;
  height: 50px;
  border: 2px solid black;
  background-color: #aaa;
  background-image: url('/static/civclicker/images/achLocked.jpg');
}

.unlockedAch {
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  /* Firefox needs a nonstandard name */
  width: 100%;
  height: 100%;
  padding: 0.2em;
  font-size: 0.9em;
  text-shadow: none;
  font-weight: normal;
  background-color: #fff;
  display: none;
  /* Initially */
}
</style>
