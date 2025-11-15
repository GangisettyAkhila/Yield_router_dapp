# Yield Router (smart contract)

This contract implements staking and settlement primitives for the Yield Router
Cricket DApp. It includes two phases:

## Phase A - Mock staking

- `stake_mock(for_account, match_id, player_id, amount)` - stores stake in local state
- `withdraw_mock(for_account, match_id, player_id, amount)` - remove mock stake
- `view_stake(for_account, match_id, player_id)` - query stake amount

These endpoints only change on-chain state (mock balances and BoxMap entries)
and do not transfer ALGO. They are intended for frontend integration tests and
UI development.

## Phase B - Real ALGO staking & payouts

- `stake_real(payment_txn, for_account, match_id, player_id, amount)` - expects a
  payment to the contract to be the first txn in an atomic group and the app
  call to be the second. Validates payment and records the stake.

- `withdraw_real(for_account, match_id, player_id, amount)` - removes stake and
  sends ALGO back to the user using an inner payment transaction.

- `settle_match(caller, match_id, winner_accounts, payouts)` - (admin/oracle only)
  accepts parallel arrays of winners and payouts. Calculates protocol fees and
  sends payouts to winners and fees to admin using inner transactions.

## Admin Controls

- `pause(caller)` - pauses contract if caller is admin
- `unpause(caller)` - unpauses contract if caller is admin
- `emergency_withdraw(caller, to_account)` - sends remaining contract balance to
  recipient (admin only, uses inner tx)

## Inner Transaction Implementation (Phase B)

The Phase B endpoints use Algopy's `InnerTransaction.payment()` API to perform
actual ALGO transfers:

### `withdraw_real` example
```python
InnerTransaction.payment(
    receiver=for_account,
    amount=amount,
).submit()
```

### `settle_match` example
```python
# Send net payout to winner
if net > UInt64(0):
    InnerTransaction.payment(
        receiver=w,
        amount=net,
    ).submit()

# Send protocol fee to admin
if fee > UInt64(0):
    InnerTransaction.payment(
        receiver=admin_account,
        amount=fee,
    ).submit()
```

These inner transactions are executed atomically as part of the outer application
call, ensuring all-or-nothing settlement.

## Frontend Integration: How to call `stake_real`

1. Create a Payment transaction that pays `amount` ALGOs to the contract address.
2. Create an ApplicationCall transaction to this contract, calling `stake_real`
   and passing `match_id` and `player_id` as ABI arguments.
3. Group the two transactions (payment first, app call second).
4. Sign appropriately (payer signs the payment; app call signer depends on your
   account model).
5. Submit the group.

Example (pseudocode):

```
tx1 = PaymentTxn(sender, params, receiver=contract_addr, amt=amount)
tx2 = ApplicationCallTxn(sender, params, app_id=app_id,
                        app_args=["stake_real", match_id, player_id, amount])
group = [tx1, tx2]
assign_group_id(group)
sign_and_submit(group)
```

## State Schema

See `schema.md` for detailed documentation of global/local keys, BoxMap usage,
and storage layout.

## Testing

Run tests with:
```
pytest tests/test_stake_and_settle.py -v
```

Tests cover:
- Phase A: mock staking flows (stake, withdraw, view)
- Phase B: real staking and settlement logic (permission checks, amount validation)
- Admin controls: pause/unpause permissions

For full end-to-end testing with actual inner-txn execution, use Beaker or
AlgoKit's test harness for transaction group simulation.

## TODOs and Future Work

- Production mapping: For efficient match settlement, consider storing a mapping
  from (match_id, player_id) -> winner_account to enable direct lookups during
  settle_match, avoiding O(n) searches in BoxMap.

- Off-chain oracle: Implement a backend service to call `settle_match` with
  winners and payouts after match completion.

- Fee management: Add endpoints to withdraw accumulated protocol fees from the
  admin account.

