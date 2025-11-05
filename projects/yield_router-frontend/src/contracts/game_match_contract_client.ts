import algosdk from 'algosdk';

export type MatchInfo = {
  matchId: string;
  player1: string;
  player2: string;
  entryFee: number;
  status: 'open' | 'ready' | 'finished';
  winner?: string;
};

export interface IGameMatchContractClient {
  createMatch(matchId: string, entryFee: number, creator: string): Promise<void>;
  joinMatch(matchId: string, player: string): Promise<void>;
  submitResult(matchId: string, winner: string, submitter: string): Promise<void>;
  getMatch(matchId: string): Promise<MatchInfo>;
  getPlayerCredits(playerAddress: string): Promise<number>;
}

export class GameMatchContractClient implements IGameMatchContractClient {
  constructor(
    private appId: number,
    private algodClient: algosdk.Algodv2,
    private signer?: (txnGroup: algosdk.Transaction[], address: string) => Promise<Uint8Array[]>
  ) {
    this.signer = signer || this.defaultSigner;
  }

  private defaultSigner = async (txnGroup: algosdk.Transaction[], address: string): Promise<Uint8Array[]> => {
    return txnGroup.map(txn => {
      const signedTxn = txn.signTxn(algosdk.generateAccount().sk);
      return signedTxn;
    });
  };

  async createMatch(matchId: string, entryFee: number, creator: string): Promise<void> {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const createMatchTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: creator,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode("create_match"),
        new TextEncoder().encode(matchId),
        algosdk.encodeUint64(entryFee),
      ],
      accounts: [creator],
      suggestedParams,
    });

    const signedTxns = await this.signer!([createMatchTxn], creator);
    await this.algodClient.sendRawTransaction(signedTxns).do();
    await this.waitForConfirmation(creator);
  }

  async joinMatch(matchId: string, player: string): Promise<void> {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const joinMatchTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: player,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode("join_match"),
        new TextEncoder().encode(matchId),
      ],
      accounts: [player],
      suggestedParams,
    });

    const signedTxns = await this.signer!([joinMatchTxn], player);
    await this.algodClient.sendRawTransaction(signedTxns).do();
    await this.waitForConfirmation(player);
  }

  async submitResult(matchId: string, winner: string, submitter: string): Promise<void> {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const submitResultTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: submitter,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode("submit_result"),
        new TextEncoder().encode(matchId),
      ],
      accounts: [winner],
      suggestedParams,
    });

    const signedTxns = await this.signer!([submitResultTxn], submitter);
    await this.algodClient.sendRawTransaction(signedTxns).do();
    await this.waitForConfirmation(submitter);
  }

  async getMatch(matchId: string): Promise<MatchInfo> {
    const box = await this.algodClient.getApplicationBoxByName(this.appId, new TextEncoder().encode(`match_${matchId}`)).do();
    if (!box) {
      throw new Error('Match not found');
    }

    const [player1, player2, entryFee, status, winner] = this.decodeMatchInfo(box.value);
    
    return {
      matchId,
      player1,
      player2,
      entryFee: Number(entryFee),
      status: status as 'open' | 'ready' | 'finished',
      winner: winner || undefined
    };
  }

  async getPlayerCredits(playerAddress: string): Promise<number> {
    const box = await this.algodClient.getApplicationBoxByName(this.appId, new TextEncoder().encode(`credits_${playerAddress}`)).do();
    if (!box) {
      return 0;
    }
    return algosdk.decodeUint64(box.value, 'safe');
  }

  private decodeMatchInfo(value: Uint8Array): [string, string, bigint, string, string] {
    // This is a placeholder implementation
    // You'll need to implement proper decoding based on your contract's box value format
    return ['', '', BigInt(0), 'open', ''];
  }

  private async waitForConfirmation(address: string): Promise<void> {
    const pendingTxn = await this.algodClient.pendingTransactionInformation(address).do();
    const txId = pendingTxn['txn']['txid'];
    let lastRound = (await this.algodClient.status().do())['last-round'];
    let confirmedRound = 0;

    while (confirmedRound < lastRound + 5) {
      const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
      if (pendingInfo['confirmed-round']) {
        confirmedRound = pendingInfo['confirmed-round'];
        break;
      }
      lastRound = (await this.algodClient.status().do())['last-round'];
    }
  }
}