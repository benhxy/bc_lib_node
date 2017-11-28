/*
  blockchain utility functions
 */
 const stringify = require("json-stable-stringify"); //offer stable string with keys sorted for hash
 var axios = require("axios"); //json comm library
 var ursa = require("ursa"); //key pair generation library
 var sha256 = require("js-sha3").sha3_256; //hash function
 var bc_data = require("./blockchain_data");

module.exports = {

  test_function: function() {
    return bc_data.catalog.get("1");
  },


  //return hash of an object
  hash: function(object) {
    return sha256(stringify(object));
  },

  //valid proof
  valid_proof:function(prev_proof, cur_proof) {
    let guess_hash = sha256(prev_proof.concat(cur_proof));
    return guess_hash.substring(0,4) == "0000";
  },

  //valid whole chain
  valid_chain: function(chain) {
    if (chain.length == 1) {
      return true;
    }
    for (let i = 1; i < chain.length; i++) {
      //check if index is continuous
      if (chain[i].index != i) {
        return false;
      }
      //check if hash is continuous
      if (hash(chain[i - 1]) != chain[i].previous_hash) {
        return false;
      }
      //check if proof is continuous
      if (!valid_proof(chain[i - 1].proof, chain[i].proof)) {
        return false;
      }
    }
    return true;
  },

  //mining
  mine_proof: function(prev_proof) {

  },

  //create a new block, include all unposted transactions
  create_block: function(proof, unposted_trans) {


  },

  //render catalog
  render_catalog: function() {

  },

  //broadcast transaction
  broadcast_trans: function(trans, node_list, private_key) {
    //create signature and payload
    let trans_sig = private_key.hashAndSign("sha256", stringify(trans));
    let payload = {
      transaction: trans,
      signature: trans_sig
    };
    //send to each peer
    node_list.forEach(function(node){
      let peer_address = node.address + "/api/transactions";
      axios.post(peer_address, payload)
        .then(response => console.log(response))
        .catch(error => console.log(error));
    });
  },

  //broadcast blockchain
  broadcast_chain: function(chain, node_list) {
    let payload = {
      block_chain: chain
    };
    node_list.forEach(function(node){
      let peer_address = node.address + "/api/blockchain";
      axios.post(peer_address, payload)
        .then(response => console.log(response))
        .catch(error => console.log(error));
    });
  }

};
