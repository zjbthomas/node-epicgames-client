const { readFileSync: read, readdirSync: readdir } = require('fs');
const path = require('path');

function getGraphQL(type) {
  let dir = `${__dirname}/graphql/${type}`
  let documents = {};
  readdir(dir, {withFileTypes: true}).forEach((e) => {
    if (e.isFile() && path.extname(e.name) == '.graphql') {
      let name = path.basename(e.name, '.graphql');
      documents[name] = read(`${dir}/${e.name}`).toString();
    }
  });

  return documents;
}

let queries = getGraphQL("queries");
let mutations = getGraphQL("mutations");

module.exports = Object.freeze({
  queries: Object.freeze(queries),
  mutations: Object.freeze(mutations),

  /* These are ddeprecated and kept only for backwards compatibility, to be removed! */
  get EVALUATE_CODE_QUERY() { return queries.evaluateCodeQuery; },
  get REDEEM_CODE_MUTATION() { return rmutations.redeemCodeMutation; },
});

