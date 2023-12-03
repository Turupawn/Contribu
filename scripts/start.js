var MAX_SUPPLY = 9999999999
const CONTRACT_ADDRESS = "0xeA374ECc42E6CA0279F61772Af62a99Ccc950227"
const PORT = 3000
const IS_REVEALED = true
const UNREVEALED_METADATA = {
  "name":"Unrevealed Croc",
  "description":"???",
  "image":"http://134.209.33.178:3000/unrevealed/image.png",
  "attributes":[{"???":"???"}]
}

const fs = require('fs')
const express = require('express')
const Web3 = require('web3')
require('dotenv').config()
const abi = require('../Contract.json')
const Contract = require('web3-eth-contract')
Contract.setProvider(process.env.RPC_URL)
//Contract.setProvider("wss://ethereum-sepolia.publicnode.com")
const contract = new Contract(abi, CONTRACT_ADDRESS)

const app = express()

app.use(express.static(__dirname + 'public'))
app.use('/unrevealed', express.static(__dirname + '/unrevealed'));

async function initAPI() {
  //MAX_SUPPLY = parseInt(await contract.methods.MAX_SUPPLY().call())
  //console.log("MAX_SUPPLY is: " + MAX_SUPPLY)
  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
  })
}
async function serveMetadata(res, nft_id) {
  var token_count = parseInt(await contract.methods.tokenCount().call())
  let return_value = {}
  if(nft_id < 0)
  {
    return_value = {error: "NFT ID must be greater than 0"}
  }else if(nft_id >= MAX_SUPPLY)
  {
    return_value = {error: "NFT ID must be lesser than max supply"}
  }else if (nft_id > token_count)
  {
    return_value = {error: "NFT ID must be already minted"}
  }else
  {
    return_value = fs.readFileSync("./metadata/" + nft_id).toString().trim()
  }
  res.send(return_value)
}

async function updateMetadata(res, nftId) {
  var contributionTypes = ["art","logistics","dev"]
  var contributionAmounts = await contract.methods.getContributions(nftId, contributionTypes).call();
  console.log(contributionAmounts)
  var jsonResult = ''
  jsonResult+='{"name":"ContributionNFTs#0","description":"Community contributions NFT, WIP","image":"https://raw.githubusercontent.com/Turupawn/NFTMetadata/main/contributionsNFTs/wip.png","attributes":['
  for(var i=0; i<contributionAmounts.length; i++)
  {
    if(i!=0) jsonResult+=','
    jsonResult += '{"trait_type":"' + contributionTypes[i] + '","value":"' + contributionAmounts[i] + '"}'
  }
  jsonResult+=']}'

  fs.writeFile('metadata/' + nftId, jsonResult, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('File written successfully.');
    }
  });

  res.setHeader('Content-Type', 'application/json');
  res.send({result: "Updated stuff"})
}

app.get('/:id', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if(isNaN(req.params.id))//in not number
  {
    res.send(UNREVEALED_METADATA)    
  }
  else if(!IS_REVEALED)
  {
    res.send(
      )
  }else
  {
    serveMetadata(res, req.params.id)
  }
})

app.get('/update/:id', (req, res) => {
  updateMetadata(res, req.params.id)
})

initAPI()
