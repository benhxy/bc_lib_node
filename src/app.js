/*
  import packages
  setup global variables and data structures
 */

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var stringify = require("json-stable-stringify"); //offer stable string for hashing
var axios = require("axios"); //json comm library
var ursa = require("ursa"); //key pair generation library
var sha256 = require("js-sha3").sha3_256; //hash function
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//initiate data structures
var tracker_url = "0.0.0.1:3001"; //replace with AWS production address
var username = "";
var public_key = "";
var private_key = "";
var node_list = new Map();//use public_key as unique ID
var unposted_transactions = [];
var block_chain = [];
var catalog = []; //current ledger, including owner, book, location, availablity

console.log("App initiated");

//testing paths
app.get("/", function(req, res) {
  return res.send("Hello world!");
});
app.get("/hash", function(req, res) {
  let hash = sha256(req.headers.string);
  return res.send(hash);
});

/*
  blockchain utility functions
 */

//get last block
var last_block = function() {
  return block_chain[block_chain.length - 1];
}
//get hash of a block
var block_hash = function(block) {
  let block_string = stringify(block);
  return sha256(block_string);
}
//register a peer node
var register_node = function(node) {
  node_list.set(node.public_key, node);
  return;
}
//valid proof
var valid_proof = function(prev_proof, cur_proof) {
  let guess_hash = sha256(prev_proof.concat(cur_proof));
  return guess_hash.substring(0,4) == "0000";
}
//valid whole chain
var valid_chain = function() {
  if (block_chain.length == 1) {
    return true;
  }
  for (let i = 1; i < block_chain.length; i++) {
    //check if hash is continuous
    if (block_hash(block_chain[i - 1]) != block_chain[i].previous_hash) {
      return false;
    }
    //check if proof is continuous
    if (!valid_proof(block_chain[i - 1].proof, block_chain[i].proof)) {
      return false;
    }
  }
  return true;
}
//resolve block chain conflicts by keeping the longest chain

//create a new block, include all unposted transactions


/*
  routes for frontend
 */

//enter username and start mining
app.post("/api/local/create_user", function(req, res) {

//uncomment this checking upon production
/*
  //user already generated, return error
  if (username != "") {
    console.log("User already exists.");
    res.status(400);
    return res.json({
      success: false,
      message: "This node has been initiated already. Please launch a new node for a new user."
    });
  }
*/

  //error on empty username
  if (!req.headers.username || req.headers.username == "") {
    console.log("Require username in headers.");
    res.status(400);
    return res.json({
      success: false,
      message: "Please provide a username."
    });
  }

  //write username
  username = req.headers.username;

  //generate key-pair and user_id
  private_key = ursa.generatePrivateKey(2048, 65537);
  public_key = private_key.toPublicPem("base64");

  //contact tracker-server and get node list
  //create an object about itself
  const node_info = {};
  node_info.username = username;
  node_info.public_key = public_key;
  axios.post("http://localhost:3001/api/nodes", node_info)
    .then(response => {
      console.log("Tracker server response: " + response.status);
      //write node list into local data
      if (!response.data.success) {
        console.log("Tracker server internal error");
        res.status(400);
        return res.json({
          success: false,
          message: "Tracker server internal error"
        });
      } else {
        console.log("Successfully get node list from tracker.");
        for (let i = 0; i < response.data.list.length; i++) {
          node_list.set(response.data.list[i].public_key, response.data.list[i]);
        }
        console.log(node_list);
      }
    })
    .catch(error => {
      console.log("Rejected: " + error);
      res.status(400);
      return res.json({
        success: false,
        message: "Axios fetch failure"
      });
    });

  //create the first block


  //query neighbours, get node lists and blockchain



  //update node list and blockchain
  //render ledger



  //temp return json: delete upon production
  res.status(200);
  return res.json({
    success: true,
    list: node_list
  });
});

//register book
app.post("/api/local/add_book", function(req, res) {

});

//unregister book
app.post("/api/local/remove_book", function(req, res) {

});

//borrow book
app.post("/api/local/borrow_book", function(req, res) {

});

//return book
app.post("/api/local/return_book", function(req, res) {

});

//view all transactions
app.get("/api/local/transactions", function(req, res) {

});

//view catalog
app.get("/api/local/catalog", function(req, res) {

});

/*
  routes for nodes communication
 */

 //receiv transaction from peer
 app.post("/api/peer/receive_trans", function(req, res) {

 });

 //receive node information from peer
 app.get("/api/peer/receive_node", function(req, res) {

 });

 //receive blockchain from peer
 app.get("/api/peer/receive_chain", function(req, res) {

 });

 /*
   error handling boilerplate
  */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({message: "An error occurred", error: err});
});

module.exports = app;
