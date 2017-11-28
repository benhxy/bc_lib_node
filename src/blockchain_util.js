/*
  blockchain utility functions
 */
var stringify = require("json-stable-stringify"); //offer stable string with keys sorted for hash
var axios = require("axios"); //json comm library
var ursa = require("ursa"); //key pair generation library
var sha256 = require("js-sha3").sha3_256; //hash function
var data = require("./blockchain_data");
var node_util = require("./node_util");

var blockchain_util = {

  //return hash of an object - DONE
  hash: function(object) {
    return sha256(stringify(object));
  },

  //valid proof - DONE
  valid_proof:function(prev_proof, cur_proof) {
    let guess_hash = sha256("" + prev_proof + cur_proof);
    return guess_hash.substring(0,4) == "0000";
  },

  //valid whole chain - DONE
  valid_chain: function(chain) {
    console.log("Enter valide chain");

    if (chain.length == 1) {
      return true;
    }
    for (let i = 1; i < chain.length; i++) {
      //check if index is continuous
      if (chain[i].index != i) {
        return false;
      }
      //check if hash is continuous
      if (this.hash(chain[i - 1]) != chain[i].prev_hash) {
        return false;
      }
      //check if proof is continuous
      if (!this.valid_proof(chain[i - 1].proof, chain[i].proof)) {
        return false;
      }
    }
    return true;
  },

  //mine the next proof - DONE
  mine_proof: function(prev_proof) {
    console.log("Enter mine proof");
    let cur_proof = 0;
    while (!this.valid_proof(prev_proof, cur_proof)) {
      cur_proof++;
    }
    return cur_proof;
  },

  //validate transaction against catalog - DONE
  valid_trans: function(trans) {
    console.log("Enter validate transaction");

    //check completeness of transaction
    if (!trans.type || !trans.owner_pk || !trans.owner_name || !trans.owner_address || !trans.isbn || !trans.title) {
      console.log("No book or owner information");
      return false;
    }
    if ((trans.type == "BORROW" || trans.type == "RETURN") && (!trans.borrower_pk || !trans.borrower_name || !trans.borrower_address || !trans.borrow_date || !trans.due_date)) {
      console.log("No borrower information");
      return false;
    }
    if (trans.type != "LIST" && trans.type != "UNLIST" && trans.type != "BORROW" && trans.type != "RETURN") {
      console.log("Illegal transaction type");
      return false;
    }

    //check against catalog
    let key = trans.isbn + trans.owner_pk;
    //cannot double list
    if (trans.type == "LIST" && data.catalog.has(key)) {
      return false;
    }
    //cannot unlist or borrow non-exist or unavailable books
    if ((trans.type == "UNLIST" || trans.type == "BORROW") && (!data.catalog.has(key) || !data.catalog.get(key).available)) {
      return false;
    }
    //cannot return non-exist or available books, cannot return books borrowed by somebody else
    if (trans.type == "RETURN" && (!data.catalog.has(key) || data.catalpg.get(key).available || data.catalog.get(key).borrower_pk != trans.borrower_pl)) {
      return false;
    }

    return true;

  },

  //broadcast transaction - TESTING
  broadcast_trans: function(trans) {

    //create signature and payload
    let trans_sig = data.private_key.hashAndSign("sha256", stringify(trans));
    let payload = {
      transaction: trans,
      signature: trans_sig
    };

    data.node_list.forEach(function(node){
      let peer_url = node.address + "/api/transactions";
      axios.post(peer_url, payload)
        .then(response => console.log(response))
        .catch(error => console.log(error));
    });

  },

  //create a new block, include all unposted transactions - DONE
  create_block: function(cur_proof) {
    console.log("Enter create block");

    //create new block object
    let new_block = {};
    new_block.timestamp = Date.now();
    new_block.index = data.block_chain.length;
    if (data.block_chain.length == 0) {
      new_block.prev_hash = "1";
    } else {
      new_block.prev_hash = this.hash(this.get_last_block());
    }
    new_block.proof = cur_proof;
    new_block.transactions = JSON.parse(JSON.stringify(data.unposted_trans));

    //push into chain
    data.block_chain.push(new_block);

    //move unposted trans to posted transactions
    data.unposted_trans.forEach(function(trans) {
      data.posted_trans.push(trans);
    });
    data.unposted_trans = [];

  },

  //get last blockchain - DONE
  get_last_block: function() {
    return data.block_chain[data.block_chain.length - 1];
  },

  //fetch blockchain
  fetch_chain: function() {

    //get blockchain from each peers

      //validate chain

      //resolve conflict


  },

  //send blockchain to one peer - TESTING
  send_chain: function(url) {
    let payload = {
      block_chain: data.block_chain
    };
    axios.post(url, payload)
      .then(response => console.log(response))
      .catch(error => console.log(error));
  },

  //broadcast blockchain - TESTING
  broadcast_chain: function() {

    data.node_list.forEach(function(node){
      let peer_url = node.address + "/api/blockchain";
      send_chain(peer_url);
    });

  },

  //resolve chain conflict - TESTING
  resolve_conflict: function(chain, url) {

    //local chain is better, send it back
    if (!valid_chain(chain) || chain.length <= data.block_chain.length) {
      send_chain(url);
      return false;
    }

    //check if unposted transactions are in the new blocks, if yes, discard - NEXT PHASE

    //override local chain
    data.block_chain = chain;

    //render catalog
    render_catalog();

  },

  //render catalog - DONE
  render_catalog: function() {
    console.log("Enter render catalog");

    //combine all transactions and clear catalog
    let all_trans = [];
    data.posted_trans.forEach(function(trans) {
      all_trans.push(trans);
    });
    data.unposted_trans.forEach(function(trans) {
      all_trans.push(trans);
    });
    data.catalog = new Map();

    //render catalog by unposted transactions
    all_trans.forEach(function(trans) {
      //create book key
      let key = trans.isbn + trans.owner_pk;
      //check if exists in the catalog
      if (trans.type == "LIST") {
        console.log("Processing LIST transaction");

        data.catalog.set(key, {});
        data.catalog.get(key).available = true;
        data.catalog.get(key).isbn = trans.isbn;
        data.catalog.get(key).title = trans.title;
        data.catalog.get(key).owner_pk = trans.owner_pk;
        data.catalog.get(key).owner_name = trans.owner_name;
        data.catalog.get(key).owner_address = trans.owner_address;

        console.log("Book "+ trans.title+ " is listed");
        return;
      }
      else if (trans.type == "UNLIST") {
        console.log("Processing UNLIST transaction");

        data.catalog.delete(key);

        console.log("Book "+ trans.title+ " is unlisted");
        return;
      }
      else if (trans.type == "BORROW") {
        console.log("Processing BORROW transaction");

        data.catalog.get(key).available = false;
        data.catalog.get(key).borrower_pk = trans.borrower_pk;
        data.catalog.get(key).borrower_name = trans.borrower_name;
        data.catalog.get(key).borrower_address = trans.borrower_address;
        data.catalog.get(key).borrow_date = trans.borrow_date;
        data.catalog.get(key).due_date = trans.due_date;

        console.log("Book "+ trans.title+ " is borrowed");
        return;
      }
      else if (trans.type == "RETURN") {
        console.log("Processing RETURN transaction");
        data.catalog.get(key).available = true;
        data.catalog.get(key).borrower_pk = null;
        data.catalog.get(key).borrower_name = null;
        data.catalog.get(key).borrower_address = null;
        data.catalog.get(key).borrow_date = null;
        data.catalog.get(key).due_date = null;

        console.log("Book "+ trans.title+ " is returned");
        return;
      }
      else {
        console.log("error: TRANSACTION TYPE NOT EXIST");
        return;
      }
    });

    //export catalog as sorted array
    let catalog_list = [];
    data.catalog.forEach(function(item) {
      catalog_list.push(item);
    });
    catalog_list.sort(function(item_1, item_2) {
      if (item_1.title > item_2.title) {
        return 1;
      } else if (item_1.title < item2.title) {
        return -1;
      }
      if (item_1.available > item_2.available) {
        return 1;
      } else if (item_1.available < item2.available) {
        return -1;
      }
      return 0;
    });

    return catalog_list;
  },

  //get catalog as array - DONE
  get_catalog: function(){
    //export catalog as sorted array
    let catalog_list = [];
    data.catalog.forEach(function(item) {
      catalog_list.push(item);
    });
    catalog_list.sort(function(item_1, item_2) {
      if (item_1.title > item_2.title) {
        return 1;
      } else if (item_1.title < item2.title) {
        return -1;
      }
      if (item_1.available > item_2.available) {
        return 1;
      } else if (item_1.available < item2.available) {
        return -1;
      }
      return 0;
    });

    return catalog_list;
  },

};

module.exports = blockchain_util;
