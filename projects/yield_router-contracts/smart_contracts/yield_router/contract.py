from algopy import ARC4Contract, arc4, UInt64, Bytes, Asset, BoxMap, Account, Txn, itxn, Global, gtxn

STATE_NONE = 0
STATE_OPEN = 1
STATE_STARTED = 2
STATE_RESOLVING = 3
STATE_RESOLVED = 4
STATE_REFUNDABLE = 5


class CricketStakeContract(ARC4Contract):
    
    def __init__(self) -> None:
       
        self.local_stakes = BoxMap(Account, UInt64, key_prefix="local_stake_")
        self.claimed = BoxMap(Account, UInt64, key_prefix="claimed_")

    @arc4.abimethod(create="require")
    def custom_create(self, initial_oracle: Account, initial_fee_bps: UInt64) -> None:
        self.owner = Txn.sender
        self.oracle = initial_oracle
        self.fee_bps = initial_fee_bps
        self.state = UInt64(STATE_NONE)
        self.pot = UInt64(0)

    @arc4.abimethod
    def create_match(self, asset: Asset, stake: UInt64, start_after_round: UInt64, resolve_after_round: UInt64) -> None:
        assert Txn.sender == self.owner, "only owner"
        assert self.state != UInt64(STATE_OPEN) and self.state != UInt64(STATE_STARTED), "match already active"

        self.asset_id = asset.id
        self.stake_amount = stake
        self.state = UInt64(STATE_OPEN)
        self.pot = UInt64(0)
        self.winner = Account()
        self.start_round = start_after_round
        self.resolve_after = resolve_after_round

    #  join (stake) 
    @arc4.abimethod
    def join_match(self, payment: gtxn.PaymentTransaction) -> None:
        assert self.state == UInt64(STATE_OPEN), "not open"
        cur_stake = self.local_stakes.get(Txn.sender, default=UInt64(0))
        assert cur_stake == UInt64(0), "already joined"

        required = self.stake_amount

        # validate payment transaction
        assert payment.sender == Txn.sender, "payment sender mismatch"
        assert payment.receiver == Global.current_application_address, "payment must go to contract"
        assert payment.amount >= required, "insufficient payment"

        # record stake and increase pot
        self.local_stakes[Txn.sender] = required
        total = self.pot + required
        self.pot = total

    # start match 
    @arc4.abimethod
    def start_match(self) -> None:
        assert Txn.sender == self.owner, "only owner"
        assert self.state == UInt64(STATE_OPEN), "not open"
        self.state = UInt64(STATE_STARTED)

    # submit result 
    @arc4.abimethod
    def submit_result(self, winner_addr: Account, sig: Bytes, signed_msg: Bytes) -> None:
        assert self.state == UInt64(STATE_STARTED), "match not started"
        assert Txn.sender == self.oracle, "only oracle signer"

        self.winner = winner_addr
        self.state = UInt64(STATE_RESOLVING)

    # settle (payout) 
    @arc4.abimethod
    def settle(self) -> None:
        assert self.state == UInt64(STATE_RESOLVING), "not resolving"
        assert self.winner != Account(), "no winner"

        pot = self.pot
        fee = (pot * self.fee_bps) // UInt64(10000)
        payout = pot - fee

        # pay winner
        itxn.Payment(receiver=self.winner, amount=payout, fee=0).submit()

        # pay fee to owner
        if fee > UInt64(0):
            itxn.Payment(receiver=self.owner, amount=fee, fee=0).submit()

        self.pot = UInt64(0)
        self.state = UInt64(STATE_RESOLVED)

    # claim 
    @arc4.abimethod
    def claim(self) -> None:
        assert self.state == UInt64(STATE_RESOLVED), "not resolved"
        assert Txn.sender == self.winner, "only winner"
        assert self.claimed[Txn.sender] == UInt64(0), "already claimed"
        self.claimed[Txn.sender] = UInt64(1)

    # ---------- refund ----------
    @arc4.abimethod
    def refund(self) -> None:
        cur_round = Global.round
        assert (
            self.state == UInt64(STATE_OPEN)
            or self.state == UInt64(STATE_STARTED)
            or self.state == UInt64(STATE_RESOLVING)
        ), "not refundable state"
        assert cur_round >= self.resolve_after, "too early to refund"

        s = self.local_stakes.get(Txn.sender, default=UInt64(0))
        assert s > UInt64(0), "no stake to refund"
        assert self.claimed[Txn.sender] == UInt64(0), "already refunded/claimed"

        itxn.Payment(receiver=Txn.sender, amount=s, fee=0).submit()

        self.local_stakes[Txn.sender] = UInt64(0)
        self.pot = self.pot - s

    # ---------- admin helpers ----------
    @arc4.abimethod
    def update_oracle(self, new_oracle: Account) -> None:
        assert Txn.sender == self.owner, "only owner"
        self.oracle = new_oracle

    @arc4.abimethod
    def pause(self) -> None:
        assert Txn.sender == self.owner, "only owner"
        self.state = UInt64(STATE_REFUNDABLE)

    @arc4.abimethod(readonly=True)
    def get_state(self) -> UInt64:
        return self.state

    @arc4.abimethod(readonly=True)
    def get_pot(self) -> UInt64:
        return self.pot