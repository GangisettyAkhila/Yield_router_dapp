# yield_router

This starter full stack project has been generated using AlgoKit. See below for default getting started instructions.

## testnet addresses

-ceater UODKHGPAPKGIPGVV7D23RGRRMPPEVDISN2KKR3XHZ62ZQKHZKCLJUXSVOE
-account 7K443N5GFDDX57AKNG6T7LO4IUQJF2V4CHC2UBRL43DFKWICKOXDQWCW4A

## lora link

https://lora.algokit.io/testnet/application/749708005

## updated game version working demo

https://drive.google.com/drive/folders/1KwLDYkRVZM09AXB8w3eX4dL57KqxsBKX

## Setup

### Initial setup

1. Clone this repository to your local machine.
2. Ensure [Docker](https://www.docker.com/) is installed and operational. Then, install `AlgoKit` following this [guide](https://github.com/algorandfoundation/algokit-cli#install).
3. Run `algokit project bootstrap all` in the project directory. This command sets up your environment by installing necessary dependencies, setting up a Python virtual environment, and preparing your `.env` file.
4. In the case of a smart contract project, execute `algokit generate env-file -a target_network localnet` from the `yield_router-contracts` directory to create a `.env.localnet` file with default configuration for `localnet`.
5. To build your project, execute `algokit project run build`. This compiles your project and prepares it for running.
6. For project-specific instructions, refer to the READMEs of the child projects:
   - Smart Contracts: [yield_router-contracts](projects/yield_router-contracts/README.md)
   - Frontend Application: [yield_router-frontend](projects/yield_router-frontend/README.md)

> This project is structured as a monorepo, refer to the [documentation](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/run.md) to learn more about custom command orchestration via `algokit project run`.

### Subsequently

1. If you update to the latest source code and there are new dependencies, you will need to run `algokit project bootstrap all` again.
2. Follow step 3 above.

## Tools

This project makes use of Python and React to build Algorand smart contracts and to provide a base project configuration to develop frontends for your Algorand dApps and interactions with smart contracts. The following tools are in use:

- Algorand, AlgoKit, and AlgoKit Utils
- Python dependencies including Poetry, Black, Ruff or Flake8, mypy, pytest, and pip-audit
- React and related dependencies including AlgoKit Utils, Tailwind CSS, daisyUI, use-wallet, npm, jest, playwright, Prettier, ESLint, and Github Actions workflows for build validation

### VS Code

It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [backend .vscode](./backend/.vscode) and [frontend .vscode](./frontend/.vscode) folders for more details.

## Integrating with smart contracts and application clients

Refer to the [yield_router-contracts](projects/yield_router-contracts/README.md) folder for overview of working with smart contracts, [projects/yield_router-frontend](projects/yield_router-frontend/README.md) for overview of the React project and the [projects/yield_router-frontend/contracts](projects/yield_router-frontend/src/contracts/README.md) folder for README on adding new smart contracts from backend as application clients on your frontend. The templates provided in these folders will help you get started.
When you compile and generate smart contract artifacts, your frontend component will automatically generate typescript application clients from smart contract artifacts and move them to `frontend/src/contracts` folder, see [`generate:app-clients` in package.json](projects/yield_router-frontend/package.json). Afterwards, you are free to import and use them in your frontend application.

The frontend starter also provides an example of interactions with your YieldRouterClient in [`AppCalls.tsx`](projects/yield_router-frontend/src/components/AppCalls.tsx) component by default.

## Next Steps

You can take this project and customize it to build your own decentralized applications on Algorand. Make sure to understand how to use AlgoKit and how to write smart contracts for Algorand before you start.

## Quickstart (frontend)

1. Copy the TestNet environment variables — a `.env` has been added to the frontend folder using public algonode endpoints.

2. From the frontend folder, install dependencies and run the dev server:

```powershell
cd projects\yield_router-frontend
npm install
npm run dev
```

3. Use the Connect Wallet button to connect a TestNet wallet (Pera, MyAlgo, etc.). The app uses `@txnlab/use-wallet-react` to manage wallet providers.

## Deploying contracts

Smart contracts live in `projects/yield_router-contracts/smart_contracts/yield_router`. We provide an algokit-style `deploy_config.py` that demonstrates how to deploy using algokit/algokit-utils. You will need to configure Algorand credentials and an account named `DEPLOYER` in your environment before running deployment.

Typical workflow (local machine must have Python and algokit tooling configured):

```powershell
cd projects\yield_router-contracts\smart_contracts\yield_router
# Ensure your environment contains the deployer account and Algod/Indexer configs
python deploy_config.py
```

If you prefer to deploy from the frontend or other tooling, generate the ARC-56 TypeScript client (the frontend build step already does this) and call deploy via the Algokit client factory.
