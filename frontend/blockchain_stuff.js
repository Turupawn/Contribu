const NETWORK_ID = 10

const METADA_API_URL = "https://contribu.xyz"

const MY_CONTRACT_ADDRESS = "0x8d5cDc7d6cABc13bf982F3c39f3FA5bcaC7Da59b"
const MY_CONTRACT_ABI_PATH = "./json_abi/ContributionsNFTABI.json"
var my_contract

var accounts
var web3

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};

const getContract = async (web3, address, abi_path) => {
  const response = await fetch(abi_path);
  const data = await response.json();
  
  const netId = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    address
    );
  return contract
}

async function loadDapp() {
  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          my_contract = await getContract(web3, MY_CONTRACT_ADDRESS, MY_CONTRACT_ABI_PATH)
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
          web3.eth.getAccounts(function(err, _accounts){
            accounts = _accounts
            if (err != null)
            {
              console.error("An error occurred: "+err)
            } else if (accounts.length > 0)
            {
              onWalletConnectedCallback()
              document.getElementById("account_address").style.display = "block"
            } else
            {
              document.getElementById("connect_button").style.display = "block"
            }
          });
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to OP Mainnet";
      }
    });
  };
  awaitWeb3();
}

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}

loadDapp()

const onContractInitCallback = async () => {
  //document.getElementById("contract_state").textContent = contract_state;
  let contributionTypes = []
  for(let i=1; ; i++)
  {
    let contributionTypeName = await my_contract.methods.contributionTypes(i).call()
    if(contributionTypeName == "")
      break;
    contributionTypes.push({id: i, name: contributionTypeName})
  }

  var select = document.getElementById('_contributionType');
  // Loop through the JSON data
  contributionTypes.forEach(function(item) {
      // Create a new option element
      var option = document.createElement('option');

      // Set the value and text content of the option element
      option.value = item.id;
      option.textContent = item.name;

      // Append the option element to the select element
      select.appendChild(option);
  });

}

const onWalletConnectedCallback = async () => {
}


//// Functions ////

const setContribution = async (nftId, contributionType, contributionAmount, description) => {
  if(!description || description=="" || description==null)
  {
    const result = await my_contract.methods.setContributionLean(nftId, contributionType, contributionAmount)
    .send({ from: accounts[0], gas: 0, value: 0 })
    .on('transactionHash', function(hash){
      document.getElementById("web3_message").textContent="Executing...";
    })
    .on('receipt', function(receipt){
      document.getElementById("web3_message").textContent="Success.";    })
      console.log("Updating NFT id: " + nftId)
      updateMetadata(nftId)
    .catch((revertReason) => {
      console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
    });
  }else
  {
    const result = await my_contract.methods.setContribution(nftId, contributionType, contributionAmount, description)
    .send({ from: accounts[0], gas: 0, value: 0 })
    .on('transactionHash', function(hash){
      document.getElementById("web3_message").textContent="Executing...";
    })
    .on('receipt', function(receipt){
      document.getElementById("web3_message").textContent="Success.";    })
      console.log("Updating NFT id: " + nftId)
      updateMetadata(nftId)
    .catch((revertReason) => {
      console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
    });
  }
}

const updateMetadata = async (nftId) => {
  fetch(METADA_API_URL + "/update/" + nftId)
  .then(res => res.json())
  .then(out =>
    console.log(out))
  .catch();
}