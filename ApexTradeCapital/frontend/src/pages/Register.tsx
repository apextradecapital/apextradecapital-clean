import { useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ firstName:"", lastName:"", phone:"", countryCode:"HT" });
  const handle = e => setForm({...form,[e.target.name]:e.target.value});
  async function submit(e){
    e.preventDefault();
    const r = await api("/api/register",{method:"POST",body:JSON.stringify(form)});
    if(r.ok) toast.success("Compte crÃ©Ã© avec succÃ¨s !");
    else toast.error("Erreur : "+r.error);
  }
  return (
    <div className="card">
      <h2>CrÃ©er un compte</h2>
      <form onSubmit={submit}>
        <input name="firstName" placeholder="PrÃ©nom" value={form.firstName} onChange={handle}/>
        <input name="lastName" placeholder="Nom" value={form.lastName} onChange={handle}/>
        <select name="countryCode" value={form.countryCode} onChange={handle}>
          <option value="HT">HaÃ¯ti (+509)</option>
          <option value="FR">France (+33)</option>
          <option value="US">Ã‰tats-Unis (+1)</option>
        </select>
        <input name="phone" placeholder="NumÃ©ro WhatsApp" value={form.phone} onChange={handle}/>
        <button type="submit">CrÃ©er mon compte</button>
      </form>
    </div>
  );
}
