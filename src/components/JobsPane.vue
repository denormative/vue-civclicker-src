<template>
  <div class="jobs-pane">
    <div id="jobsContainer">
      <h3>Jobs</h3>
      <p id="customJobQuantity">
        Custom Quantity <input id="homeCustomQty" type="number" min="1" step="1" value="1" />
      </p>
      <table id="jobs"></table>
    </div>
    <div id="tradeContainer">
      Trader offers 1 gold for <span id="tradeRequested">0</span> <span id="tradeType">food</span><br>
      <button id="trader" onmousedown="trade()">Trade</button>
    </div>
    <div id="eventsContainer">
      <h3>Events</h3>
      <table id="logTable">
        <tr id="log0">
          <td id="logT"></td>
          <td id="logL"></td>
          <td id="logR"></td>
        </tr>
        <tr id="log1">
          <td colspan="3"></td>
        </tr>
        <tr id="log2">
          <td colspan="3"></td>
        </tr>
        <tr id="log3">
          <td colspan="3"></td>
        </tr>
        <tr id="log4">
          <td colspan="3"></td>
        </tr>
        <!-- <tr id="log5"><td colspan="3"></td></tr>
            <tr id="log6"><td colspan="3"></td></tr>
            <tr id="log7"><td colspan="3"></td></tr>
            <tr id="log8"><td colspan="3"></td></tr>
            <tr id="log9"><td colspan="3"></td></tr> -->
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'jobs-pane',
  data () {
    return {
    }
  }
}
</script>

<style>
#customJobQuantity {
  display: none;
}

#logTable td {
  padding-right: 20px;
}

#tradeContainer {
  display: none;
  padding: 0.3em 0 0.5em 0;
  margin: 0.5em 0;
  text-align: center;
  background-color: #9d9;
  border-radius: 1.5em;
}

#trader {
  height: 2em;
  width: 70%;
}
</style>
