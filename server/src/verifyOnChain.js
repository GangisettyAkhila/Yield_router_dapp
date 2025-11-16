const algosdk = require('algosdk');
require('dotenv').config();

const INDEXER_URL = process.env.INDEXER_URL || '';
const INDEXER_TOKEN = process.env.INDEXER_TOKEN || '';

let indexer = null;
if (INDEXER_URL) {
  indexer = new algosdk.Indexer({ 'X-API-Key': INDEXER_TOKEN }, INDEXER_URL, '');
}

async function verifyTransaction(txid) {
  if (!indexer) {
    // No indexer configured — assume verification is a no-op (for local/dev)
    return { verified: true, txid };
  }

  try {
    const resp = await indexer.lookupTransactionByID(txid).do();
    return { verified: true, tx: resp };
  } catch (err) {
    return { verified: false, error: err.message || String(err) };
  }
}

module.exports = { verifyTransaction };
