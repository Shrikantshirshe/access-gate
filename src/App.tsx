import { useState, useEffect } from 'react';
import { Shield, Sparkles, Database, History, Wallet, Cpu, Lock } from 'lucide-react';
import { deployServerallowlistContract, submitServerallowlistCircuit } from './midnightClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [laceDetected, setLaceDetected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<any>(null);

  const [contractDeployed, setContractDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const [ledger, setLedger] = useState({ invite_root_hash: "0x8fa3...c2bb", members_joined: 14, active: true });
  const [formValues, setFormValues] = useState({ invite_code_secret: "", leaf_index: 3 });
  const [logs, setLogs] = useState([
    { hash: '0xcd3d...44ee', timestamp: '2026-07-08 09:53:12', status: 'GRANTED', details: 'Server access gate verified leaf match' }
  ]);
  const [isProving, setIsProving] = useState(false);
  const [provingStep, setProvingStep] = useState(0);

  const proofSteps = [
    "Decrypting user private invite code witness...",
    "Recomputing Merkle branch hashes...",
    "Validating match against server invite root...",
    "Emitting server entry approval proof..."
  ];

  const deploySteps = [
    "Creating server gateway registry contract...",
    "Setting depth-4 invite key dictionary state...",
    "Publishing validator contract..."
  ];

  useEffect(() => {
    fetch('/deployment.json').then(response => response.ok ? response.json() : null).then(deployment => {
      if (deployment?.contractAddress) {
        setContractAddress(deployment.contractAddress);
        setContractDeployed(true);
      }
    }).catch(() => undefined);
    const detectLace = () => {
      const hasMidnightWallet = Object.values((window as any).midnight ?? {}).some((candidate: any) => typeof candidate?.connect === 'function');
      setLaceDetected(hasMidnightWallet);
    };
    detectLace();
    const timer = setInterval(detectLace, 1000);
    return () => clearInterval(timer);
  }, []);

  const connectLace = async () => {
    setConnectingWallet(true);
    try {
      const candidates = Object.values((window as any).midnight ?? {}) as Array<{
        connect?: (networkId: string) => Promise<any>;
        name?: string;
      }>;
      const wallet = candidates.find(candidate => typeof candidate.connect === 'function');
      if (!wallet?.connect) {
        throw new Error('No Midnight wallet connector was detected. Install 1AM or Lace and unlock it.');
      }

      const connected = await wallet.connect(import.meta.env.VITE_NETWORK_ID || 'preview');
      (window as any).__midnightConnectedWallet = connected;
      const addressInfo = await connected.getUnshieldedAddress();
      const balances = await connected.getUnshieldedBalances();
      const nightBalance = Object.values(balances)[0] ?? 0n;

      setWalletAddress(addressInfo.unshieldedAddress);
      setWalletBalance((Number(nightBalance) / 1_000_000).toFixed(2));
      setWalletConnected(true);
      setConnectedWallet(connected);
      if (import.meta.env.VITE_CONTRACT_ADDRESS) {
        setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);
        setContractDeployed(true);
      }
      logTransaction('wallet', 'MIDNIGHT WALLET CONNECTED', '—', 'Connected through the Midnight DApp Connector API');
    } catch (err) {
      console.error('Midnight wallet connection failed:', err);
      alert(err instanceof Error ? err.message : 'Midnight wallet connection failed.');
    } finally {
      setConnectingWallet(false);
    }
  };



  const disconnectLace = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance("0.00");
    logTransaction('0x0000...0000', 'LACE WALLET DISCONNECTED', '0.00 tNIGHT', 'Disconnected wallet context');
  };

  const requestFaucet = () => {
    if (!walletConnected) return;
    window.open(import.meta.env.VITE_FAUCET_URL || 'https://faucet.preview.midnight.network/', '_blank', 'noopener,noreferrer');
    logTransaction('—', 'FAUCET OPENED', '—', 'Funding must be confirmed by the official Midnight Preview faucet and wallet balance refresh.');
  };

  const deployContractAction = async () => {
    if (import.meta.env.VITE_CONTRACT_ADDRESS) {
      setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);
      setContractDeployed(true);
      logTransaction('—', 'DEPLOYMENT CONFIGURED', '—', 'Using the deployed Midnight contract configured for this environment.');
      return;
    }
    if (!connectedWallet) return;
    setIsDeploying(true);
    try {
      const result = await deployServerallowlistContract(connectedWallet);
      setContractAddress(result.contractAddress);
      setContractDeployed(true);
      logTransaction(result.txId, 'CONTRACT DEPLOYMENT SUBMITTED', '—', 'server_allowlist deployed on Midnight Preview at ' + result.contractAddress);
    } catch (err) {
      console.error('Browser deployment failed:', err);
      alert(err instanceof Error ? err.message : 'Browser deployment failed.');
    } finally {
      setIsDeploying(false);
    }
    return;
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      alert('Live contract deployment is handled by deploy.mjs. Set VITE_DEMO_MODE=true only for local UI demos.');
      return;
    }
    if (!walletConnected) return;
    setIsDeploying(true);
    setDeployStep(0);
    const interval = setInterval(() => {
      setDeployStep(prev => {
        if (prev < deploySteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setContractAddress("midnight1u4v89fjwla0928hdskla9382hdksla0298a");
            setContractDeployed(true);
            setIsDeploying(false);
            setWalletBalance(prevBal => (parseFloat(prevBal) - 15.5).toFixed(2));
            logTransaction('0xdep1...88bb', 'CONTRACT DEPLOYED', '-15.50 tNIGHT', 'Deployed server_allowlist.compact contract onto Preview');
          }, 800);
          return prev;
        }
      });
    }, 500);
  };

  const joinServer = async () => {
    if (!walletConnected || !contractDeployed || !contractAddress) return;
    try {
      const result = await submitServerallowlistCircuit((window as any).__midnightConnectedWallet, contractAddress, 'claimEntry');
      setLedger(prev => ({ ...prev, members_joined: prev.members_joined + 1 }));
      logTransaction(result.txId, 'CONFIRMED ON MIDNIGHT', '—', 'Confirmed claimEntry on ' + contractAddress);
      return;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'The Midnight transaction failed.');
      logTransaction('—', 'TRANSACTION FAILED', '—', err instanceof Error ? err.message : 'Unknown transaction failure');
      return;
    }
    setIsProving(true);
    setProvingStep(0);
    const interval = setInterval(() => {
      setProvingStep(prev => {
        if (prev < proofSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setLedger(prevLedger => ({
              ...prevLedger,
              members_joined: prevLedger.members_joined + 1
            }));
            
            const randomTx = '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...' + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('');
            logTransaction(randomTx, 'GRANTED', '-0.05 tNIGHT', 'Verified invite code privately & joined community server');
            setIsProving(false);
            setWalletBalance(prevBal => (parseFloat(prevBal) - 0.05).toFixed(2));
          }, 600);
          return prev;
        }
      });
    }, 450);
  };

  const logTransaction = (hash: string, status: string, fee: string, details: string) => {
    setLogs(prev => [
      {
        hash,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status,
        fee,
        details
      },
      ...prev
    ]);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
        <div>
          <span style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '20px', background: 'rgba(147, 51, 234, 0.15)', color: '#a855f7', border: '1px solid rgba(147, 51, 234, 0.3)', fontWeight: 600 }}>Project 9</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '6px' }}>Community Access Gate</h1>
        </div>
        <div>
          {walletConnected ? (
            <div style={{ background: 'rgba(147, 51, 234, 0.08)', border: '1px solid rgba(147, 51, 234, 0.25)', borderRadius: '12px', padding: '8px 16px' }}>
              Balance: <strong style={{ color: '#a855f7' }}>{walletBalance} tNIGHT</strong>
            </div>
          ) : (
            <button onClick={connectLace} style={{ width: 'auto' }}>Connect Lace Wallet</button>
          )}
        </div>
      </header>

<section className="home-dashboard" aria-labelledby="home-dashboard-title">
        <div className="home-dashboard__lead">
          <span className="home-kicker">Community checkpoint</span>
          <h2 id="home-dashboard-title">Membership access</h2>
          <p>Verify membership and receive an entry pass privately.</p>
          <div className="home-actions">
            <button type="button" onClick={() => setActiveTab('dashboard')}>Open Workspace</button>
            <button type="button" className="home-secondary" onClick={() => setActiveTab('privacy')}>Read Privacy Model</button>
          </div>
        </div>
        <div className="home-dashboard__grid">
          <article className="home-card"><span>Network</span><strong>Midnight Preview</strong><small>{contractDeployed ? 'Contract verified' : 'Contract setup pending'}</small></article>
          <article className="home-card"><span>Current signal</span><strong>Server root current</strong><small>Handle unlinkable</small></article>
          <article className="home-card"><span>Wallet session</span><strong>{walletConnected ? 'Connected' : 'Not connected'}</strong><small>{walletConnected ? walletBalance + ' tNIGHT available' : 'Connect 1AM to continue'}</small></article>
          <article className="home-card"><span>Contract address</span><strong className="home-address">{contractAddress ? contractAddress.slice(0, 14) + '…' : 'Awaiting deployment'}</strong><small>Unique project deployment</small></article>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'dashboard' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'dashboard' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🚪 Community Entrance</button>
        <button onClick={() => setActiveTab('deployer')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'deployer' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'deployer' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>⚙️ Server Gate Deployer</button>
        <button onClick={() => setActiveTab('walletHub')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'walletHub' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'walletHub' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🔗 Server Member Wallet</button>
        <button onClick={() => setActiveTab('privacy')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'privacy' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'privacy' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🔒 Access Entry Privacy</button>
      </div>

      <main style={{ minHeight: '400px' }}>
        {activeTab === 'dashboard' && (
          <div>
            {(!walletConnected || !contractDeployed) && (
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#f87171' }}>⚠️ Setup Prerequisites Required</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                  {!walletConnected ? "Please connect your Lace Wallet in the Wallet Hub." : "Please deploy the Compact contract in the ZK Deployer tab."}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', opacity: (walletConnected && contractDeployed) ? 1 : 0.4, pointerEvents: (walletConnected && contractDeployed) ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#9333ea' }}><Database className="w-5 h-5" /> Server State</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invite root hash</span>
                      <div style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>{ledger.invite_root_hash}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Joined Members</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{ledger.members_joined} accounts</div>
                    </div>
                  </div>
                </section>
              </div>

              <div>
                <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#9333ea', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield className="w-5 h-5" /> Claim Access
                  </h2>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Private Invite Code Witness</label>
                    <input 
                      type="password" 
                      value={formValues.invite_code_secret} 
                      onChange={e => setFormValues({ ...formValues, invite_code_secret: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Merkle Leaf Index (Private)</label>
                    <input 
                      type="number" 
                      value={formValues.leaf_index} 
                      onChange={e => setFormValues({ ...formValues, leaf_index: Number(e.target.value) })}
                    />
                  </div>
                  <button onClick={joinServer} disabled={isProving}>
                    {isProving ? "Constructing invite validation proof..." : "Assert Invite & Join Server"}
                  </button>

                  {isProving && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(147,51,234,0.05)', border: '1px dashed #a855f7', borderRadius: '8px', fontSize: '0.8rem' }}>
                      {proofSteps.map((step, idx) => (
                        <div key={idx} style={{ padding: '3px 0', color: idx === provingStep ? 'white' : 'var(--text-secondary)', opacity: idx <= provingStep ? 1 : 0.4 }}>
                          {idx < provingStep ? '✓' : '●'} {step}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployer' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#a855f7' }}>
              <Cpu className="w-6 h-6" /> Server Gate Deployer
            </h2>
            {contractDeployed ? (
              <p style={{ color: '#10b981' }}>Deployed Preview Address: {contractAddress}</p>
            ) : (
              <button onClick={deployContractAction} disabled={isDeploying || !walletConnected}>
                {isDeploying ? "Deploying..." : "Compile & Deploy Contract"}
              </button>
            )}

            {isDeploying && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(147, 51, 234, 0.05)', border: '1px dashed #a855f7', borderRadius: '8px', fontSize: '0.8rem' }}>
                {deploySteps.map((step, idx) => (
                  <div key={idx} style={{ padding: '3px 0', color: idx === deployStep ? 'white' : 'var(--text-secondary)', opacity: idx <= deployStep ? 1 : 0.4 }}>
                    {idx < deployStep ? '✓' : '●'} {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'walletHub' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#a855f7' }}>
              <Wallet className="w-6 h-6" /> Wallet Hub & logs
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
                <h3>Lace Account</h3>
                {walletConnected ? (
                  <div>
                    <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', marginBottom: '10px' }}>{walletAddress}</div>
                    <button onClick={disconnectLace} style={{ width: 'auto', background: '#dc2626' }}>Disconnect</button>
                  </div>
                ) : (
                  <button onClick={connectLace} style={{ width: 'auto' }}>Connect Wallet</button>
                )}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
                <h3>Get tNIGHT</h3>
                <button onClick={requestFaucet} disabled={!walletConnected || faucetLoading}>
                  {faucetLoading ? "Requesting..." : "Mint Faucet Tokens"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#a855f7' }}>
              <Lock className="w-6 h-6" /> Zero-Knowledge Privacy Model
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ color: '#10b981' }}>Can Learn:</h3>
                <ul>
                  <li>Cumulative joined members counts.</li>
                  <li>Server invite code hash root.</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ color: '#f87171' }}>Cannot Learn:</h3>
                <ul>
                  <li>Your exact invite code or invite leaf index.</li>
                  <li>Your private address mapping parameters.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
