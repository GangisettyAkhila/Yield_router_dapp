/**
 * Yield Router Frontend-Contract Sync Test Script
 * 
 * Validates two-way synchronization between React frontend and on-chain contract:
 * 1. Account state and local state reading
 * 2. Global contract state reading  
 * 3. BoxMap composite key queries (stakes)
 * 4. Grouped transaction submission (stake_real)
 * 5. Transaction confirmation polling
 * 6. State verification after confirmation
 * 7. Polling interval simulation (real-time sync)
 * 8. Error handling and access control
 * 
 * Usage:
 *   Set environment variables:
 *   - APP_ID (required): Deployed contract app ID
 *   - ALGOD_SERVER (default: http://localhost:4001)
 *   - ALGOD_TOKEN (default: 'a' * 64)
 *   - TEST_ADDRESS: Test account address
 *   - TEST_MNEMONIC: Test account mnemonic
 *   
 *   Run: npx ts-node src/utils/syncTest.ts
 */

import algosdk from "algosdk";

// ============================================================================
// Configuration
// ============================================================================

const config = {
  algodToken: process.env.ALGOD_TOKEN || "a".repeat(64),
  algodServer: process.env.ALGOD_SERVER || "http://localhost:4001",
  appId: Number(process.env.APP_ID || 0),
  testAddress: process.env.TEST_ADDRESS || "",
  testMnemonic: process.env.TEST_MNEMONIC || "",
};

// ============================================================================
// Test Result Tracking
// ============================================================================

class TestHarness {
  private tests: Array<{
    name: string;
    status: "PASS" | "FAIL";
    message: string;
    duration: number;
  }> = [];

  async run(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.tests.push({ name: testName, status: "PASS", message: "", duration });
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;
      this.tests.push({ name: testName, status: "FAIL", message, duration });
      console.log(`❌ ${testName}: ${message}`);
    }
  }

  printSummary(): void {
    const passed = this.tests.filter((t) => t.status === "PASS").length;
    const failed = this.tests.filter((t) => t.status === "FAIL").length;
    const total = this.tests.length;
    const totalTime = this.tests.reduce((sum, t) => sum + t.duration, 0);

    console.log("\n" + "=".repeat(70));
    console.log("TEST SUMMARY");
    console.log("=".repeat(70));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed:      ${passed}/${total}`);
    console.log(`Failed:      ${failed}/${total}`);
    console.log(`Total Time:  ${totalTime}ms`);

    if (failed > 0) {
      console.log("\nFailed Tests:");
      this.tests
        .filter((t) => t.status === "FAIL")
        .forEach((t) => console.log(`  ❌ ${t.name}: ${t.message}`));
    }

    console.log("=".repeat(70) + "\n");
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function createAlgodClient() {
  return new algosdk.Algodv2(config.algodToken, config.algodServer, "");
}

/**
 * Read composite key for stake (format: "{addr}|{matchId}|{playerId}")
 */
function encodeCompositeKey(addr: string, matchId: string, playerId: string): Uint8Array {
  const key = `${addr}|${matchId}|${playerId}`;
  return new TextEncoder().encode(key);
}

/**
 * Helper: Read stake amount from Uint8Array response
 */
function readStakeFromBox(boxValue: Uint8Array): bigint {
  if (boxValue.length < 8) {
    throw new Error("Invalid box value length");
  }
  // Read as big-endian uint64
  let result = BigInt(0);
  for (let i = 0; i < 8; i++) {
    result = (result << BigInt(8)) | BigInt(boxValue[i]);
  }
  return result;
}

// ============================================================================
// Test Functions
// ============================================================================

/**
 * TEST 1: Read Account State (Local State)
 */
async function testReadAccountState(): Promise<void> {
  const algodClient = createAlgodClient();

  const acctInfo = await algodClient.accountInformation(config.testAddress).do();

  const localState = (acctInfo["apps-local-state"] as any[])?.find(
    (app) => app.id === config.appId
  );

  if (!localState) {
    throw new Error(`Account not opted-in to app ${config.appId}`);
  }

  console.log("  → Local state found");
}

/**
 * TEST 2: Read Global State
 */
async function testReadGlobalState(): Promise<void> {
  const algodClient = createAlgodClient();

  const appInfo = await algodClient.getApplicationByID(config.appId).do();
  const globalState = appInfo.params["global-state"] as any[] | undefined;

  if (!globalState || globalState.length === 0) {
    throw new Error("No global state found");
  }

  const keys = new Set<string>();
  globalState.forEach((item) => {
    const key = Buffer.from(item.key as string, "base64").toString("utf-8");
    keys.add(key);
  });

  console.log(`  → Found ${keys.size} global state keys`);
}

/**
 * TEST 3: Query BoxMap (Stake Query)
 */
async function testQueryBoxMap(): Promise<void> {
  const algodClient = createAlgodClient();

  const matchId = "test_match_001";
  const playerId = "test_player_001";
  const boxKey = encodeCompositeKey(config.testAddress, matchId, playerId);

  try {
    const boxResponse = await algodClient
      .getApplicationBoxByName(config.appId, boxKey)
      .do();

    const stakeAmount = readStakeFromBox(new Uint8Array(boxResponse.value));
    console.log(`  → Stake found: ${stakeAmount / BigInt(1e6)} ALGO`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("box not found")) {
      console.log(`  → No stake found (expected on first test)`);
    } else {
      throw err;
    }
  }
}

/**
 * TEST 4: Submit Grouped Transaction (stake_real)
 */
async function testSubmitGroupedTransaction(): Promise<string> {
  const algodClient = createAlgodClient();

  const account = algosdk.mnemonicToSecretKey(config.testMnemonic);
  if (account.addr !== config.testAddress) {
    throw new Error("Mnemonic does not match test address");
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = 2000;

  // Payment transaction
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: algosdk.getApplicationAddress(config.appId),
    amount: 5_000_000, // 5 ALGO
    suggestedParams,
  });

  // App call transaction
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: account.addr,
    appIndex: config.appId,
    onComplete: 0, // NoOpOC = 0
    appArgs: [
      new TextEncoder().encode("stake_real"),
      new TextEncoder().encode("test_match_001"),
      new TextEncoder().encode("test_player_001"),
    ],
    suggestedParams,
  });

  // Create group
  const txns = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(txns);

  // Sign
  const signedTxns = txns.map((txn) => algosdk.signTransaction(txn, account.sk));

  // Submit
  const { txId } = await algodClient.sendRawTransaction(signedTxns.map((t) => t.blob)).do();

  console.log(`  → Submitted txId: ${txId.slice(0, 16)}...`);
  return txId;
}

/**
 * TEST 5: Confirmation Polling
 */
async function testConfirmationPolling(txId: string): Promise<void> {
  const algodClient = createAlgodClient();

  let attempts = 0;
  let confirmed = false;

  while (!confirmed && attempts < 30) {
    try {
      const pendingTxn = await algodClient.pendingTransactionInformation(txId).do();

      if (pendingTxn["confirmed-round"]) {
        confirmed = true;
        console.log(`  → Confirmed in round ${pendingTxn["confirmed-round"]}`);
      }
    } catch (err) {
      // Ignore not-found errors during polling
    }

    attempts++;
    if (!confirmed) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (!confirmed) {
    throw new Error("Transaction not confirmed after 30 attempts");
  }
}

/**
 * TEST 6: Verify State After Confirmation
 */
async function testVerifyStateAfterConfirmation(): Promise<void> {
  const algodClient = createAlgodClient();

  // Wait for state to settle
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const acctInfo = await algodClient.accountInformation(config.testAddress).do();
  const localState = (acctInfo["apps-local-state"] as any[] | undefined)?.find(
    (app) => app.id === config.appId
  );

  if (!localState) {
    throw new Error("Local state not found after transaction");
  }

  console.log(`  → State verified for app ${config.appId}`);
}

/**
 * TEST 7: Verify Stake in BoxMap After Confirmation
 */
async function testVerifyStakeInBoxMap(): Promise<void> {
  const algodClient = createAlgodClient();

  const matchId = "test_match_001";
  const playerId = "test_player_001";
  const boxKey = encodeCompositeKey(config.testAddress, matchId, playerId);

  try {
    const boxResponse = await algodClient
      .getApplicationBoxByName(config.appId, boxKey)
      .do();

    const stakeAmount = readStakeFromBox(new Uint8Array(boxResponse.value));

    if (stakeAmount !== BigInt(5_000_000)) {
      throw new Error(`Stake mismatch: expected 5000000, got ${stakeAmount}`);
    }

    console.log(`  → Stake verified: ${stakeAmount / BigInt(1e6)} ALGO`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("box not found")) {
      throw new Error("Stake not found in BoxMap after confirmation");
    }
    throw err;
  }
}

/**
 * TEST 8: Polling Intervals (Real-time Sync Simulation)
 */
async function testPollingIntervals(): Promise<void> {
  const algodClient = createAlgodClient();

  const cycles = 3;
  const intervalMs = 2000;

  for (let i = 0; i < cycles; i++) {
    try {
      // Simulate polling: read account state
      await algodClient.accountInformation(config.testAddress).do();
      console.log(`  → Polling cycle ${i + 1}/${cycles} successful`);
    } catch (err) {
      throw new Error(`Polling cycle ${i + 1} failed`);
    }

    if (i < cycles - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

/**
 * TEST 9: Error Handling - Invalid App ID
 */
async function testErrorHandlingInvalidAppId(): Promise<void> {
  const algodClient = createAlgodClient();

  try {
    await algodClient.getApplicationByID(999999).do();
    throw new Error("Expected error for invalid app ID");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("Expected error")) {
      throw err;
    }
    console.log(`  → Error correctly rejected for invalid app ID`);
  }
}

/**
 * TEST 10: Account Information Consistency
 */
async function testAccountConsistency(): Promise<void> {
  const algodClient = createAlgodClient();

  const info1 = await algodClient.accountInformation(config.testAddress).do();
  const info2 = await algodClient.accountInformation(config.testAddress).do();

  if (info1.amount !== info2.amount) {
    throw new Error("Account balance changed between consecutive reads");
  }

  console.log(`  → Account info consistent: ${info1.amount / 1e6} ALGO`);
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests(): Promise<void> {
  console.log("=".repeat(70));
  console.log("YIELD ROUTER FRONTEND-CONTRACT SYNC TEST");
  console.log("=".repeat(70));
  console.log(`App ID:        ${config.appId}`);
  console.log(`Test Address:  ${config.testAddress}`);
  console.log(`Algod Server:  ${config.algodServer}`);
  console.log("=".repeat(70));
  console.log("");

  if (!config.appId || !config.testAddress) {
    console.error("❌ Missing required environment variables:");
    console.error("   APP_ID, TEST_ADDRESS");
    process.exit(1);
  }

  const harness = new TestHarness();

  // Run tests
  await harness.run("TEST 1: Read Account State", testReadAccountState);
  await harness.run("TEST 2: Read Global State", testReadGlobalState);
  await harness.run("TEST 3: Query BoxMap", testQueryBoxMap);

  let txId = "";
  await harness.run("TEST 4: Submit Grouped Transaction", async () => {
    txId = await testSubmitGroupedTransaction();
  });

  if (txId) {
    await harness.run("TEST 5: Confirmation Polling", () =>
      testConfirmationPolling(txId)
    );
    await harness.run("TEST 6: Verify State After Confirmation", testVerifyStateAfterConfirmation);
    await harness.run("TEST 7: Verify Stake in BoxMap", testVerifyStakeInBoxMap);
  }

  await harness.run("TEST 8: Polling Intervals", testPollingIntervals);
  await harness.run("TEST 9: Error Handling", testErrorHandlingInvalidAppId);
  await harness.run("TEST 10: Account Consistency", testAccountConsistency);

  harness.printSummary();
}

// Execute
if (require.main === module) {
  runTests().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export { runTests };
