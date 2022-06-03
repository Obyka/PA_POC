import Web3 from "web3";
import wlArtifact from "../../build/contracts/WL.json";


const App = {
  web3: null,
  account: null,
  wl: null,
  aliceAddress: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
  bobAddress: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
  carolAddress: "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const wlDeployedNetwork = wlArtifact.networks[networkId];

      this.wl = new web3.eth.Contract(
        wlArtifact.abi,
        wlDeployedNetwork.address,
      )
      console.log(this.wl)

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.setAddress();

      this.wl.events.newClient().on('data', event => 
      { 
        var table = document.getElementById("newClient");
        var row = table.insertRow(1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5)

        cell1.innerHTML = event.returnValues['0']
        cell2.innerHTML = event.returnValues['1']
        cell3.innerHTML = event.returnValues['2']
        cell4.innerHTML = event.returnValues['3']

        var buttonWL = document.createElement('button');
        var buttonBL = document.createElement('button');

        buttonWL.type = 'button';
        buttonWL.innerHTML = 'Whitelist this client';
        buttonWL.className = 'btn btn-primary';
        buttonWL.onclick = async function () {
          await App.whitelistClient(event.returnValues['0'].toString())
          var val2 = await App.isWhitelisted(event.returnValues['0'].toString());
          console.log("val2: " + val2)
          if(val2 == 1){
            buttonWL.disabled = true;
          }
          buttonBL.disabled = false;
        };
        cell5.appendChild(buttonWL);

        var buttonBL = document.createElement('button');
        buttonBL.type = 'button';
        buttonBL.innerHTML = 'Blacklist this client';
        buttonBL.className = 'btn btn-primary';
        buttonBL.onclick = async function () {
          await App.blacklistClient(event.returnValues['0'].toString())
          var val3 = await App.isWhitelisted(event.returnValues['0'].toString());
          if(val3 == 2){
            buttonBL.disabled = true;
          }
          buttonWL.disabled = false;
        };
        cell6.appendChild(buttonBL);

      });

    } catch (error) {
      console.log(error)
      console.error("Could not connect to contract or chain.");
    }
  },

  setStatus: function(arg){
    const status = document.getElementById("status");
    status.innerHTML = arg;
    if(arg==0){
      status.innerHTML = "You're not client yet."
      status.className = "text-warning";
    } 
    else if(arg == 1){
      status.innerHTML = "Congratulation, you are whitelisted."
      status.className = "text-success";
    } else if(arg==2){
      status.innerHTML = "Unfortunately, you are blacklisted";
      status.className = "text-danger"
    }

  },

  setAddress: function(arg){
    const status = document.getElementById("address");
    address.innerHTML = "<h3>My ETH address: " + this.account +"</h3>"
    if(this.account.toString().toUpperCase() === this.aliceAddress.toUpperCase()){
      address.innerHTML = "<h3>Alice (sender) <h3>"
      document.getElementById("sender").style.display = "block";
      document.getElementById("receiver").style.display = "none";
    } else if(this.account.toString().toUpperCase() == this.bobAddress.toUpperCase()){
      address.innerHTML = "<h3>Bob (receiver) <h3>"
      document.getElementById("sender").style.display = "none";
      document.getElementById("receiver").style.display = "block";
    } else if(this.account.toString().toUpperCase() == this.carolAddress.toUpperCase()){
      address.innerHTML = "<h3>Carol (sender) <h3>"
      document.getElementById("sender").style.display = "block";
      document.getElementById("receiver").style.display = "none";
    }
  },

  isWhitelisted: async function(val) {
    const { getStatus } = this.wl.methods;
    const result = await getStatus().call({ from: val});
    this.setStatus(result.toString());
    return result.toString()
  },

  blacklistClient: async function(val){
    const { blacklistAddress } = this.wl.methods;
    const result = await blacklistAddress(val).send({from: this.account});
    return result;
  },

  whitelistClient: async function(val){
    const { whitelistAddress } = this.wl.methods;
    const result = await whitelistAddress(val).send({from: this.account});
    return result;
  },

  makeRequest: async function(){
    const { makeRequest } = this.wl.methods;
    var hash_val = "TO_DO" 
    const mail = document.getElementById("mail_address").value
    await makeRequest(mail, "0x"+hash_val).send({from: this.account, value: Web3.utils.toWei('0.5', 'ether')});
  },
  payMeBack: async function(){
    const { payMeBack } = this.wl.methods;
    const result = await payMeBack().send({from: this.account});
  }
};

window.App = App;

window.ethereum.on('accountsChanged', function (accounts) {
  App.account = accounts[0]
  App.setAddress()
})

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }

  App.start();
});
