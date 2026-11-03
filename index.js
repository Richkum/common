// "use strict"
// import {pathToFileUrl} from "node"

// SyntaxError
// EvalError
// RangeError
// ReferenceError
// TypeError
// URIError

class Odd extends Error {
  constructor(varname = "") {
    super(varname + "must be even");
  }
  get name() {
    return "OddError";
  }
}

const t = new Odd("amount");

function doTask(amout) {
  if (amout != "number") throw new TypeError("amount must be a number");
  if (amout <= 0) throw new RangeError("amount must be greater than zero");
  if (amout % 2) {
    const err = Error("amount must be even");
    err.code = "ERR_MUST_BE_EVEN";
    throw err;
  }
  return amout / 2;
}
