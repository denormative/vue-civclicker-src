<template>
<div role="tabpanel" id="upgradesPane" class="upgrades-pane tab-pane">
  <table id="upgrades"></table>
</div>
</template>

<script>
export default {
  name: 'upgrades-pane',
  props: ['normalUpgrades'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      this.addUpgradeRows() // This sets up the framework for the upgrade items.
      window.vm.addUITable(window.vm.normalUpgrades, 'upgrades') // Place the stubs for most upgrades under the upgrades tab.
    })
  },
  methods: {
    getPantheonUpgradeRowText(upgradeObj) {
      if (!upgradeObj) {
        return ''
      }

      let s = `<tr id='${upgradeObj.id}Row' class='purchaseRow'>`
      // Don't include devotion if it isn't valid.
      // xxx Should write a chained dereference eval
      s += "<td class='devcost'>"
      s += `${(window.isValid(upgradeObj.prereqs) && window.isValid(upgradeObj.prereqs.devotion)) ?
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
      s += `${window.isValid(upgradeObj.extraText) ? upgradeObj.extraText : ''}</td>`
      s += `<td>${window.vm.getCostNote(upgradeObj)}</td>`
      s += '</tr>'

      return s
    },
    // Returns the new element
    setPantheonUpgradeRowText(upgradeObj) {
      if (!upgradeObj) {
        return null
      }
      const elem = document.getElementById(`${upgradeObj.id}Row`)
      if (!elem) {
        return null
      }

      elem.outerHTML = this.getPantheonUpgradeRowText(upgradeObj) // Replaces elem
      return document.getElementById(`${upgradeObj.id}Row`) // Return replaced element
    },
    // Dynamically create the upgrade purchase buttons.
    addUpgradeRows() { // eslint-disable-line no-unused-vars
      document.getElementById('upgradesPane').innerHTML +=
        "<h3>Purchased Upgrades</h3><div id='purchasedUpgrades'></div>"

      // Fill in any pre-existing stubs.
      window.vm.upgradeData.forEach((elem) => {
        if (elem.subType === 'upgrade') {
          return
        } // Did these above.
        if (elem.subType === 'pantheon') {
          this.setPantheonUpgradeRowText(elem)
        }
        else { // One of the 'atypical' upgrades not displayed in the main upgrade list.
          let stubElem = document.getElementById(`${elem.id}Row`)
          if (!stubElem) {
            console.error(`Missing UI element for ${elem.id}`)
            return
          }
          stubElem.outerHTML = window.vm.getUpgradeRowText(elem, false) // Replaces stubElem
          stubElem = document.getElementById(`${elem.id}Row`) // Get stubElem again.
          stubElem.onmousedown = window.onBulkEvent
        }
      })

      // Altars
      window.vm.buildingData.forEach((elem) => {
        if (elem.subType === 'altar') {
          this.setPantheonUpgradeRowText(elem)
        }
      })

      // Deity granted powers
      window.vm.powerData.forEach((elem) => {
        if (elem.subType === 'prayer') {
          this.setPantheonUpgradeRowText(elem)
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
    },
  },
}
</script>

<style scoped>

</style>
