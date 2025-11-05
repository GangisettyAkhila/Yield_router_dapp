import { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import { useWallet } from "@txnlab/use-wallet-react";
import ConnectWallet from "./components/ConnectWallet";
import Home from "./Home";

function App() {
  const { activeAddress } = useWallet();
  const [openModal, setOpenModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevAddressRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevAddressRef.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!prev && activeAddress) {
      setShowSuccess(true);
      timer = setTimeout(() => setShowSuccess(false), 3000);
    }
    prevAddressRef.current = activeAddress ?? null;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeAddress]);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return addr.substring(0, 4) + "..." + addr.substring(addr.length - 4);
  };

  // Modern dApp: highlight nav link based on scroll position
  const [activeSection, setActiveSection] = useState<string>("defi-section");

  // Smooth scroll handler for nav links
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(id);
  };

  // Listen for scroll to update active nav
  useEffect(() => {
    const sectionIds = ["defi-section", "gaming-section", "leaderboard-section"];
    const handleScroll = () => {
      let found = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) found = id;
        }
      }
      setActiveSection(found);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="app-root">
      {/* Modern NavBar */}
      <nav className="topbar">
        <div className="logo" style={{ letterSpacing: "0.5px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6b4ce6, #00b894)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(107,76,230,0.3)",
              transition: "transform 0.3s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          Yield Router
        </div>
        <div className="nav-links">
          <ul style={{ display: "flex", gap: "1.5rem", listStyle: "none", margin: 0, padding: 0 }}>
            <li>
              <a
                href="#defi"
                className={`nav-link${activeSection === "defi-section" ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, "defi-section")}
              >
                DeFi
              </a>
            </li>
            <li>
              <a
                href="#gaming"
                className={`nav-link${activeSection === "gaming-section" ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, "gaming-section")}
              >
                Gaming Arena
              </a>
            </li>
            <li>
              <a
                href="#leaderboard"
                className={`nav-link${activeSection === "leaderboard-section" ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, "leaderboard-section")}
              >
                Leaderboard
              </a>
            </li>
          </ul>
        </div>
        {/* Wallet status or connect button */}
        {activeAddress ? (
          <div
            className={`wallet-status-enhanced ${showSuccess ? "wallet-status-success" : ""}`}
            style={{ boxShadow: showSuccess ? "0 0 0 4px #00b89433" : undefined, transition: "box-shadow 0.3s" }}
          >
            <div className="wallet-status-icon-enhanced" style={{ animation: showSuccess ? "successPulse 0.6s" : undefined }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="wallet-status-content-enhanced">
              <div className="wallet-status-addr-enhanced" style={{ letterSpacing: "0.5px", fontWeight: 700 }}>
                {formatAddress(activeAddress || "")}
              </div>
              <div
                className="wallet-status-label-enhanced"
                style={{ color: showSuccess ? "#00b894" : undefined, fontWeight: showSuccess ? 700 : 500 }}
              >
                Connected
                {showSuccess ? (
                  <span style={{ color: "#00b894", marginLeft: 6, fontWeight: 700, transition: "color 0.3s" }}>✓ Ready to transact</span>
                ) : null}
              </div>
            </div>
            <button
              className="wallet-status-disconnect-enhanced"
              title="Manage Wallet"
              style={{ border: showSuccess ? "1.5px solid #00b894" : undefined }}
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 17l5-5-5-5M19.8 12H9M10 22a10 10 0 1 1 10-10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button className="btn btn-primary glow-cta" onClick={() => setOpenModal(true)}>
            Connect Wallet
          </button>
        )}
      </nav>

      {/* ConnectWallet Modal - only render when needed */}
      <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />

      {/* Landing Headline & Subline */}
      <header className="top-banner" style={{ marginBottom: 0, animation: "fadeIn 0.7s" }}>
        <div className="banner-left">
          <div className="brand-mark">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="banner-title">Yield Router</h1>
            <h2 className="banner-sub">
              Grow your stake while cheering your favorite players — <span style={{ color: "#6b4ce6", fontWeight: 700 }}>minimal DeFi</span>{" "}
              meets <span style={{ color: "#00b894", fontWeight: 700 }}>playful gaming</span>.
            </h2>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Home />
      </main>
    </div>
  );
}

export default App;
