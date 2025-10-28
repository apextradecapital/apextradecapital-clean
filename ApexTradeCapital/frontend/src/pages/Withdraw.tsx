import { useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export default function Withdraw() {
  const [form, setForm] = useState({ userId:"", amount:0, network:"MonCash", account:"" });
  const handle = e => setForm({...form,[e.target.name]:e.target.value});
  async function submit(e){
    e.preventDefault();
    const r = await api("/api/withdraw",{method:"POST",body:JSON.stringify(form)});
    if(r.ok) toast.success("Retrait demandÃ© !");
    else toast.error("Erreur "+r.error);
  }
  return (
    <div className="card">
      <h2>Retirer mes gains</h2>
      <form onSubmit={submit}>
        <input name="userId" placeholder="ID utilisateur" value={form.userId} onChange={handle}/>
        <input name="amount" type="number" placeholder="Montant" value={form.amount} onChange={handle}/>
        <select name="network" value={form.network} onChange={handle}>
          <option>MonCash</option>
          <option>NatCash</option>
        </select>
        <input name="account" placeholder="NumÃ©ro compte" value={form.account} onChange={handle}/>
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}

