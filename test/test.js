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
  test_catalog: function() {
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
  }

  //


};

module.exports = test;
