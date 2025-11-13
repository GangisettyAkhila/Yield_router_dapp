import { useWallet } from "@txnlab/use-wallet-react";
import { useMemo } from "react";
import { ellipseAddress } from "../utils/ellipseAddress";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";

const Account = () => {
  const { activeAddress } = useWallet();
  const algoConfig = getAlgodConfigFromViteEnvironment();

  const networkName = useMemo(() => {
    return algoConfig.network === "" ? "localnet" : algoConfig.network.toLocaleLowerCase();
  }, [algoConfig.network]);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-2xl p-6 shadow-lg mb-6 backdrop-blur-sm border border-white/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800">Connected Account</h3>
            <a
              className="text-indigo-600 hover:text-indigo-700 font-medium"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
            >
              {ellipseAddress(activeAddress)}
            </a>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
          {networkName}
        </span>
      </div>
    </div>
  );
};

export default Account;
