/*
  blockchain data structures
 */

var blockchain_data = {};

blockchain_data.username = "";
blockchain_data.private_key = "";
blockchain_data.public_key = "";

blockchain_data.node_list = new Map();
blockchain_data.block_chain = [];

blockchain_data.posted_trans = [];
blockchain_data.unposted_trans = [];
blockchain_data.catalog = new Map();

module.exports = blockchain_data;
