import {useState, useEffect} from "react";
import {ethers} from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";
import "bootstrap/dist/css/bootstrap.min.css";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [interest, setInterest] = useState(undefined);

  const getWallet = async() => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({method: "eth_accounts"});
      handleAccount(account);
    }
  }

  const handleAccount = (account) => {
    if (account) {
      console.log ("Account connected: ", account);
      setAccount(account);
    }
    else {
      console.log("No account found");
    }
  }

  const connectAccount = async() => {
    if (!ethWallet) {
      alert('MetaMask wallet is required to connect');
      return;
    }
  
    const accounts = await ethWallet.request({ method: 'eth_requestAccounts' });
    handleAccount(accounts);
    
    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
 
    setATM(atmContract);
  }

  const getBalance = async() => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  }


  const deposit = async () => {
    if (atm) {
      let tx = await atm.deposit(1);
      await tx.wait();
      getBalance();

      // Add deposit transaction to the history
      const newTransaction = {
        account: account,
        type: "Deposit",
        amount: 1,
        date: new Date().toISOString(),
      };
      setTransactionHistory((prevHistory) => [...prevHistory, newTransaction]);
    }
  };

  const withdraw = async () => {
    if (atm) {
      let tx = await atm.withdraw(1);
      await tx.wait();
      getBalance();

      // Add withdrawal transaction to the history
      const newTransaction = {
        account: account,
        type: "Withdrawal",
        amount: 1,
        date: new Date().toISOString(),
      };
      setTransactionHistory((prevHistory) => [...prevHistory, newTransaction]);
    }
  };

  const getInterest = async () => {
    if (atm) {
      const interest = await atm.calculateBalanceAfterOneYear();
      const formattedInterest = ethers.utils.formatEther(interest); 
      setInterest(formattedInterest);
    }
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>
    }

    if (balance == undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        {interest !== undefined && (
          <p>Interest After One Year: {interest}</p>
        )}
        <button onClick={deposit}>Deposit 1 ETH</button>
        <button onClick={withdraw}>Withdraw 1 ETH</button>
      </div>
    )
  }

  useEffect(() => {
    getWallet();
    getInterest();
  }, [balance]);

  return (
    <main className="container d-flex justify-content-center align-items-center">
      <div className="text-center">
        <header>
          <h1>Welcome to the Metacrafters Bank!</h1>
        </header>
        {initUser()}

        {account && (
          <div>
            <h2>Transaction History</h2>
            <ul className="list-group">
              {transactionHistory.map((transaction, index) => (
                <li key={index} className="list-group-item">
                  <p>Account: {transaction.account}</p>
                  <p>Type: {transaction.type}</p>
                  <p>Amount: {transaction.amount} ETH</p>
                  <p>Date: {new Date(transaction.date).toLocaleString('en-GB', {
                    day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric',
                  })}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          text-align: center;
        }
        ul {
          list-style-type: none;
          list-style-position: inside;
          padding-left: 0;
        }
      `}</style>
    </main>
  );
}
