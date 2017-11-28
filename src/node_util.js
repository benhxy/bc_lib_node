/*
  blockchain utility functions
 */
var stringify = require("json-stable-stringify"); //offer stable string with keys sorted for hash
var axios = require("axios"); //json comm library
var ursa = require("ursa"); //key pair generation library
var sha256 = require("js-sha3").sha3_256; //hash function
var data = require("./blockchain_data");
var ip_checker = require("is-ip");

var node_util = {

  //initiate node identity data - DONE
  init_node: function(username) {
    data.username = username;
    data.private_key = ursa.generatePrivateKey(2048, 65537);
    data.public_key = data.private_key.toPublicPem("base64");
    //console.log("Successfully created user and key pair.");
  },

  //register node on either tracker server or peers - DONE
  register_node: function(url) {
    let node_info = {
      username: data.username,
      public_key: data.public_key
    };

    axios.post(url, node_info)
      .then(response => {
        //write node list into local data
        //console.log("Successfully get node list from tracker.");
        response.data.list.forEach(function(node) {
          data.node_list.set(node.public_key, node);
        });
      })
      .catch(error => {
        console.log("Rejected: " + error);
      });

  },

  //return address with IP and port - DONE
  get_address: function(req) {

    let address = "";
    if (ip_checker.v6(req.connection.remoteAddress)) {
      address = "[" + req.connection.remoteAddress + "]:" + req.connection.remotePort;
    } else {
      address = req.connection.remoteAddress + ":" + req.connection.remotePort;
    }

    return address;

  }

};

module.exports = node_util;
