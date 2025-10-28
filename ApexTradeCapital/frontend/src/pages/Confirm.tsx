import { useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";
import InvestmentProgress from "../components/InvestmentProgress";

export default function Confirm() {
  const [invId, setInvId] = useState("");
  const [otp, setOtp] = useState("");
  const [started, setStarted] = useState(false);

  async function sendConfirm(){
    const r = await api(`/api/investments/${invId}/confirm`,{method:"POST"});
    if(r.ok) toast.info("OTP envoyÃ© Ã  l'admin.");
  }

  async function verify(){
    const r = await api(`/api/investments/${invId}/verify-otp`,{method:"POST",body:JSON.stringify({otp})});
    if(r.ok){ toast.success("Investissement dÃ©marrÃ© !"); setStarted(true); }
    else toast.error("OTP incorrect ou expirÃ©");
  }

  return (
    <div className="card">
      <h2>Confirmation OTP</h2>
      <input placeholder="ID Investissement" value={invId} onChange={e=>setInvId(e.target.value)}/>
      <button onClick={sendConfirm}>Envoyer OTP</button>
      <input placeholder="Entrer OTP" value={otp} onChange={e=>setOtp(e.target.value)}/>
      <button onClick={verify}>VÃ©rifier</button>
      {started && <InvestmentProgress id={invId}/>}
    </div>
  );
}

