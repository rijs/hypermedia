"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = fn;

function fn(ripple) {
  log("creating");
  ripple.on("change.hypermedia", trickle(ripple));
  ripple.types["application/hypermedia"] = {
    header: "application/hypermedia",
    priority: 10,
    check: function check(res) {
      return header("content-type", "application/hypermedia")(ripple.resources[res.name]) || isURL(res.body) || !res.body && parent(ripple)(res.name);
    },
    parse: function parse(res) {

      var name = res.name,
          nearest = parent(ripple)(name),
          sup = ripple.types["application/data"].parse,
          register = function (r) {
        return ripple({ name: name });
      },
          isLoaded = function (r) {
        return ripple.resources[nearest].headers.timestamp;
      };

      if (isURL(res.body)) res.headers.url = res.body;

      if (!res.body && nearest) res.headers.parent = nearest;

      if (nearest && ripple.resources[nearest].headers.http) res.headers.http = ripple.resources[nearest].headers.http;

      if (!is.obj(res.body)) res.body = {};

      if (res.headers.timestamp) {
        return sup(res);
      }if (res.headers.url) {
        return (request(opts(res.headers.url, res.headers.http), fetched(ripple)(res)), sup(res));
      }if (res.headers.parent && !ripple.resources[nearest].headers.timestamp) {
        return (ripple(nearest).once("change", wait(isLoaded)(register)), // console.log('parent not loaded yet')
        sup(res));
      }if (res.headers.parent) {
        var parts = subtract(name, nearest),
            value;

        for (var i = 1; i < parts.length + 1; i++) {
          var path = parts.slice(0, i).join("."),
              next = [nearest, path].join(".");
          value = key(path)(ripple(nearest));

          if (isURL(value)) {
            ripple(next, value);
            if (next != name) ripple(next).once("change", wait(isLoaded)(register));
            return ( /*console.log('loading link'),*/sup(res)
            );
          }
        }

        res.headers.timestamp = new Date();
        res.body = is.obj(value) ? value : { value: value };
        log("loaded".green, name);
        return sup(res);
      }

      return sup(res);
    }
  };

  return ripple;
}

var includes = _interopRequire(require("utilise/includes"));

var header = _interopRequire(require("utilise/header"));

var extend = _interopRequire(require("utilise/extend"));

var parse = _interopRequire(require("utilise/parse"));

var wait = _interopRequire(require("utilise/wait"));

var key = _interopRequire(require("utilise/key"));

var not = _interopRequire(require("utilise/not"));

var log = _interopRequire(require("utilise/log"));

var err = _interopRequire(require("utilise/err"));

var is = _interopRequire(require("utilise/is"));

var fn = _interopRequire(require("utilise/fn"));

var to = _interopRequire(require("utilise/to"));

log = log("[ri/hypermedia]");
err = err("[ri/hypermedia]");
var request = require("request");

function parent(ripple) {
  return function (key) {
    var parts = key.split(".");
    for (var i = parts.length - 1; i > 0; i--) {
      var candidate = parts.slice(0, i).join(".");
      if (candidate in ripple.resources) return candidate;
    }
  };
}

function subtract(a, b) {
  return a.slice(b.length + 1).split(".");
}

function isURL(d) {
  return includes("://")(d);
}

function opts(url, headers) {
  return { url: url, headers: extend({ "User-Agent": "request" })(headers) };
}

function fetched(ripple) {
  return function (res) {
    return function (e, response, body) {
      body = parse(body);
      if (e) return err(e);
      if (response.statusCode != 200) return err(body.message);
      // log('fetched', res.name)
      res.headers.timestamp = new Date();
      ripple(res.name, body);
    };
  };
}

function trickle(ripple) {
  return function (res) {
    var args = [arguments[0].body, arguments[1]];
    return header("content-type", "application/hypermedia")(res) && ripple.resources[res.name].body.emit("change", to.arr(args), not(is["in"](["bubble"])));
  };
}