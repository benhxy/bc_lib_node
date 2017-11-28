/*
  import packages
  setup global variables and data structures
 */

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var stringify = require("json-stable-stringify"); //offer stable string with keys sorted for hashing
var axios = require("axios"); //json comm library
var ursa = require("ursa"); //key pair generation library
var sha256 = require("js-sha3").sha3_256; //hash function
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var bc_util = require("./blockchain_util");
var bc_data = require("./blockchain_data");
var node_data = require("./node_data");
var config = require("../config");

//initiate data structures
var tracker_url = "http://localhost:3001";
node_data.username = "";
node_data.public_key = "";
node_data.private_key = "";
node_data.node_list= new Map();
bc_data.posted_trans = [];
bc_data.unposted_trans = [];
bc_data.block_chain = [];
bc_data.catalog = new Map();

console.log("App initiated");

//testing paths
app.get("/", function(req, res) {
  console.log(bc_data.catalog);
  bc_data.catalog.set("1", "2_value");
  console.log(bc_data.catalog.get("1"));
  return res.json({message: bc_util.test_function()});
});
app.post("/hash", function(req, res) {
  console.log("entered route");
  return res.send(bc_util.hash(req.body.string));
});

/*
  routes for frontend
 */

//enter username and start mining
app.post("/api/users", function(req, res) {
/*
  //uncomment this checking upon production
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
  if (!req.body.username || req.body.username == "") {
    console.log("Require username in body.");
    res.status(400);
    return res.json({
      success: false,
      message: "Please provide a username."
    });
  }

  //write username, generate key-pair
  node_data.username = req.body.username;
  node_data.private_key = ursa.generatePrivateKey(2048, 65537);
  node_data.public_key = node_data.private_key.toPublicPem("base64");

  //contact tracker-server and get node list
  //create an object about itself
  let node_info = {
    username: node_data.username,
    public_key: node_data.public_key
  };
  console.log(node_info);

  axios.post("http://localhost:3001/api/nodes", node_info)
    .then(response => {
      //write node list into local data
      console.log("Successfully get node list from tracker.");
      for (let i = 0; i < response.data.list.length; i++) {
        node_data.node_list.set(response.data.list[i].public_key, response.data.list[i]);
      }
    })
    .catch(error => {
      console.log("Rejected: " + error);
    });

  //create the first block


  //query neighbours, get node lists and blockchain


  //update node list and blockchain


  //render ledger



  //temp return json: delete upon production
  res.status(200);
  return res.json({
    success: true
  });
});

//view all transaction history
app.get("/api/local/transactions", function(req, res) {
  res.status(200);
  let payload = [];
  for (let i = 0; i < bc_data.posted_trans.length; i++) {

  }
});

//create a new transaction
app.post("/api/local/transactions/new", function(req, res) {

});

/*
  routes for nodes communication
 */
 //receive individual node information from peer
 app.get("/api/peer/receive_node", function(req, res) {
   if (req.data.username && req.data.public_key) {
     //add node into list
     let new_node = {
       address: req.connection.remoteAddress + ":" + req.connection.remotePort,
       username: req.data.username,
       public_key: req.data.public_key
     }
     node_list.set(req.data.node.public_key, new_node);
     //push current blockchain and transactions to new node
   }
   return;
 });

 //receiv transaction from peer
 app.post("/api/peer/receive_trans", function(req, res) {
   //error handling
   if (!req.data.transaction || !req.data.signature) {
     return;
   }
   //validate signature
   let cur_trans = req.data.transaction;
   let creator_pub_key_pem = "";
   if (cur_trans.type = "BORROW") {
     creator_pub_key_pem = transaction
   }

 });
 //receive blockchain from peer
 app.get("/api/peer/receive_chain", function(req, res) {
   if (req.data.blockchain && valid_chain(req.data.blockchain) && req.data.blockchain.length > block_chain.length) {
     //if received chain is valid and longer, update self chain and broadcast
     block_chain = req.data.blockchain;
     broadcast_chain(block_chain);
   }
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
