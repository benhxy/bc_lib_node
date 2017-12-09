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
var ip_checker = require("is-ip");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var bc_util = require("./blockchain_util");
var node_util = require("./node_util");
var data = require("./blockchain_data");
var test = require("../test/test");
var config = require("../config");

/*
  routes for testing
 */

app.get("/test_render_catalog", function(req, res) {
  return res.json({message: test.test_render_catalog()});
});
app.get("/test_valid_chain", function(req, res) {
  return res.json({message: test.test_valid_chain()});
});
app.post("/hash", function(req, res) {
  console.log("entered route");
  return res.send(bc_util.hash(req.body.string));
});

/*
  routes for frontend
 */

//enter username and start mining
app.post("/api/frontend/users", function(req, res) {
  console.log("========================================");
  console.log("Entered POST /api/frontend/users");

  //user already generated, return error
  if (data.username != "") {
    console.log("User already exists.");
    return res.json({
      success: false,
      message: "This node has been initiated already. Please launch a new node for a new user."
    });
  }

  //error checking on empty username
  if (!req.body.username || req.body.username == "") {
    console.log("Error: no user name in request");
    return res.json({
      success: false,
      message: "Please provide a username."
    });
  }

  //write username, generate key-pair
  node_util.init_node(req.body.username);

  //contact tracker-server and get node list
  node_util.register_node(config.tracker_url);

  //create the first block
  bc_util.create_block(config.first_proof);

  //query peers, get node lists
  node_data.node_list.forEach( function(node) {
    let peer_url = node.address + "/api/nodes";
    node_util.register_node(peer_url);
  });

  //query peers, get blockchains
  bc_util.fetch_chain();

  //return catalog and private key
  return res.json({
    success: true,
    catalog: bc_util.render_catalog(),
    blockchain: data.block_chain,
    private_key: data.private_key.toPrivatePem("base64"),
    public_key: data.public_key
  });
});

//view all transaction history
app.get("/api/frontend/transactions", function(req, res) {
  console.log("========================================");
  console.log("Entered GET /api/frontend/transactions");
  let all_trans = [];
  data.posted_trans.forEach(function(trans) {
    all_trans.push(trans);
  });
  data.unposted_trans.forEach(function(trans) {
    all_trans.push(trans);
  });
  return res.json({
    success: true,
    transactions: all_trans
  });
});

//create a new transaction
app.post("/api/frontend/transactions", function(req, res) {
  console.log("========================================");
  console.log("Entered POST /api/frontend/transactions");

  //create trans object
  let new_trans = {
    type: req.body.type,
    owner_pk: req.body.owner_pk,
    owner_name: req.body.owner_name,
    owner_address: req.body.owner_address,
    isbn: req.body.isbn,
    title: req.body.title,
    borrower_pk: req.body.borrower_pk,
    borrower_name: req.body.borrower_name,
    borrower_address: req.body.borrower_address,
    borrow_date: req.body.borrow_date,
    due_date: req.body.due_date
  };

  //validate against catalog
  if (!bc_util.valid_trans(new_trans)) {
    console.log("Invalid transaction");
    return res.json({
      success: false,
      message: "Transaction is invalid"
    });
  }

  //insert into unposted transactions
  data.unposted_trans.push(new_trans);

  //broadcast transaction
  let payload = bc_util.broadcast_trans(new_trans);

  //send catalog back
  res.json({
    success: true,
    catalog: bc_util.render_catalog(),
    transaction: payload.transaction,
    signature: payload.signature
  });

});

//view all peers
app.get("/api/frontend/nodes", function(req, res) {
  console.log("========================================");
  console.log("Entered GET /api/frontend/nodes");

  let peers = [];
  data.node_list.forEach(function(node) {
    peers.push(node);
  });

  res.json({
    success: true,
    nodes: peers
  });
});

//trigger mining - DONE
app.get("/api/frontend/mine", function(req, res) {
  console.log("========================================");
  console.log("Enter GET /api/frontend/mine");

  let last_block = bc_util.get_last_block();
  let last_proof = last_block.proof;
  let cur_proof = bc_util.mine_proof(last_proof);
  bc_util.create_block(cur_proof);

  //broadcast blockchain and resolve conflict

  res.json({
    success: true,
    block_chain: data.block_chain,
    catalog: bc_util.get_catalog()
  });

});

//view catalog - DONE
app.get("/api/frontend/catalog", function(req, res) {
  console.log("========================================");
  console.log("Enter GET /api/frontend/catalog");

  res.json({
    success: true,
    catalog: bc_util.get_catalog()
  });

});

/*
  routes for nodes communication
 */

//receive individual node information from peer and send own node list back - TESTING
app.post("/api/nodes", function(req, res) {
 console.log("========================================");
 console.log("Entered POST /api/nodes");

 if (req.body.username && req.body.public_key) {

   //check duplicate
   if (node_data.node_list.has(req.body.public_key)) {
     console.log("Already visited this node");
     return res.send("You have already visited me");
   }

   //create new node object
   let new_node = {
     username: req.body.username,
     publick_key: req.body.public_key
   };
   if (ip_checker.v6(req.connection.remoteAddress)) {
     new_node.address = "[" + req.connection.remoteAddress + "]:" + req.connection.remotePort;
   } else {
     new_node.address = req.connection.remoteAddress + ":" + req.connection.remotePort;
   }
   console.log(new_node);

   //make copy of own list
   let node_list_copy = [];
   node_data.node_list.forEach(function(node){
     node_list_copy.push(node);
   });

   //insert new node
   node_data.node_list.set(new_node.public_key, new_node);

   //send list back
   return res.json({
     success: true,
     list: node_list_copy
   });

 } else {
   return res.json({
     success: false,
     message: "Need username and public_key"
   });
 }

});

//receiv transaction from peer
app.post("/api/transactions", function(req, res) {
 console.log("========================================");
 console.log("Entered POST /api/transactions");

 //error input handling
 if (!req.body.transaction || !req.body.signature) {
   console.log("Error: no transaction or signature");
   return res.json({
     success: false,
     message: "Transaction and signature are both required."
   });
 }

 let cur_trans = req.data.transaction;
 let cur_sig = req.body.signature;

 //determine whose signature to use
 let creator_pub_key_pem = "";
 if (cur_trans.type = "BORROW") {
   //only borrowing transactions can be initiated by borrower
   creator_pub_key_pem = cur_trans.borrower_pk;
 } else {
   creator_pub_key_pem = cur_trans.owner_pk;
 }

 //validate signature
 if (!bc_util.verify_sig(cur_trans, cur_sig, creator_pub_key_pem)) {
   console.log("Invalid signature");
   res.status(400);
   return res.json({
     success: false,
     error: "Invalid signature"
   });
 }

 //validate transactions against catalog
 if (!bc_util.valid_trans(cur_trans)) {
   console.log("Invalid transaction");
   res.status(400);
   return res.json({
     success: false,
     error: "Invalid transaction"
   });
 }

 //save transaction locally
 data.unposted_trans.push(cur_trans);

 //update catalog
 bc_util.render_catalog();

 res.status(200);
 return res.json({
   success: true
 });

});

//receive blockchain push from peer - TESTING
app.post("/api/blockchain", function(req, res) {
 console.log("========================================");
 console.log("Entered POST /api/blockchain");
 if (req.body.block_chain && !bc_util.resolve_conflict(req.body.block_chain)) {

   //local chain is better. Send back
   res.json({
     success: false,
     block_chain: data.block_chain
   });

 }
});

//respind to peer's blockchain request - DONE
app.get("/api/blockchain", function(req, res) {
 console.log("========================================");
 console.log("Enter GET /api/blockchain");

 res.json({
   success: true,
   block_chain: data.block_chain
 });

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
