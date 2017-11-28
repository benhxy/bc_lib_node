/*
  blockchain utility functions
 */
var stringify = require("json-stable-stringify"); //offer stable string with keys sorted for hash
var axios = require("axios"); //json comm library
var ursa = require("ursa"); //key pair generation library
var sha256 = require("js-sha3").sha3_256; //hash function
var bc_util = require("../src/blockchain_util");
var node_util = require("../src/node_util");
var data = require("../src/blockchain_data");


var test = {

  //insert transaction and render catalog
  test_render_catalog: function() {
    console.log("enter test function");

    //LIST item
    let list_trans = {
      type: "LIST",
      owner_pk: "12345",
      owner_name: "benhu",
      owner_address: "0.0.0.1:1212",
      isbn: "ISBN0234029485",
      title: "First book"
    }

    //BORROW item
    let today = new Date(Date.now());
    let duedate = new Date(today.valueOf());
    duedate.setDate(duedate.getDate() + 14);
    let borrow_trans = {
      type: "BORROW",
      owner_pk: "12345",
      owner_name: "benhu",
      owner_address: "0.0.0.1:1212",
      isbn: "ISBN0234029485",
      title: "First book",
      borrower_pk: "123452323",
      borrower_name: "peer 12",
      borrower_address: "0.0.0.1:3434",
      borrow_date: today,
      due_date: duedate
    }

    //UNLIST item
    let unlist_trans = {
      type: "UNLIST",
      owner_pk: "12345",
      owner_name: "benhu",
      owner_address: "0.0.0.1:1212",
      isbn: "ISBN0234029485",
      title: "First book"
    }

    let return_trans = {
      type: "RETURN",
      owner_pk: "12345",
      owner_name: "benhu",
      owner_address: "0.0.0.1:1212",
      isbn: "ISBN0234029485",
      title: "First book",
      borrower_pk: "123452323",
      borrower_name: "peer 12",
      borrower_address: "0.0.0.1:3434",
      borrow_date: today,
      due_date: duedate
    }

    data.posted_trans.push(list_trans);
    data.unposted_trans.push(borrow_trans);
    data.unposted_trans.push(return_trans);
    //data.unposted_trans.push(unlist_trans);

    return bc_util.render_catalog()

    ;
  },

  //test valid chain function
  test_valid_chain: function() {
    let chain = [
        {
            "timestamp": 1511912726267,
            "index": 0,
            "prev_hash": "1",
            "proof": 100,
            "transactions": []
        },
        {
            "timestamp": 1511912728967,
            "index": 1,
            "prev_hash": "163c4b6f50056f9bead3488e8e7c41702d02ff28cb0a4b8d813426ab9420aa44",
            "proof": 41047,
            "transactions": []
        }
    ];

    return bc_util.valid_chain(chain);
  }


};

module.exports = test;
