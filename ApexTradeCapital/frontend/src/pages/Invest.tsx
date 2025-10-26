import { useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export default function Invest() {
  const [form, setForm] = useState({ userId:"", offer:"Bronze", amount:5000 });
  const handle = e => setForm({...form,[e.target.name]:e.target.value});
  async function submit(e){
    e.preventDefault();
    const r = await api("/api/investments",{method:"POST",body:JSON.stringify(form)});
    if(r.ok) toast.success("Investissement lancÃ© !");
    else toast.error("Erreur "+r.error);
  }
  return (
    <div className="card">
      <h2>Nouvel investissement</h2>
      <form onSubmit={submit}>
        <input name="userId" placeholder="ID utilisateur" value={form.userId} onChange={handle}/>
        <select name="offer" value={form.offer} onChange={handle}>
          <option>Bronze</option>
          <option>Argent</option>
          <option>Or</option>
        </select>
        <input name="amount" type="number" value={form.amount} onChange={handle}/>
        <button type="submit">Investir</button>
      </form>
    </div>
  );
}
