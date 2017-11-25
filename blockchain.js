//define blockchain functionalities here

//function to query peer nodes
exports.query_peer_nodes = function() {
  User.findOne({name: req.body.name}, function(err, user) {
    if (err || !user) {
      return res.json({success: false, message: "User not found"});
    }
    if (!req.body.password) {
      return res.json({success: false, message: "Password cannot be empty"});
    }
    if (user.password != req.body.password) {
      return res.json({success: false, message: "Wrong password"});
    }

    //contruct token, which include user id, role,TTL
    const payload = {
      user: user._id, //to query runs by user
      role: user.role //to check permission
    };
    var token = jwt.sign(payload, config.secret, {expiresIn: config.ttl});

    //return user role so frontend can selectively display admin links
    return res.json({
      success: true,
      message: "Authentication successful",
      user: user._id,
      name: user.name,
      role: user.role,
      token: token
    });

  });
};
