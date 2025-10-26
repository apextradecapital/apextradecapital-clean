import WhatsAppFloat from "./components/WhatsAppFloat";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Invest from "./pages/Invest";
import Confirm from "./pages/Confirm";
import Withdraw from "./pages/Withdraw";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import React from 'react';
import logo from '/logo.png';
export default function App(){
  return (
  <div style={{background:'#1e3a8a',padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>
    <img src={logo} alt='Apex' style={{height:32}} />
    <span style={{color:'#D4AF37',fontWeight:700,letterSpacing:1}}>Apex Trade Capital</span>
  </div>
  
    <BrowserRouter>
      <header className="header">APEX TRADE CAPITAL</header>
      <nav className="navbar">
        <Link to="/">Accueil</Link>
        <Link to="/register">Inscription</Link>
        <Link to="/invest">Investir</Link>
        <Link to="/confirm">Confirmer OTP</Link>
        <Link to="/withdraw">Retrait</Link>
      </nav>
      <div className="main">
        <Routes>
          <Route path="/" element={<h2>Bienvenue sur Apex Trade Capital</h2>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/invest" element={<Invest/>}/>
          <Route path="/confirm" element={<Confirm/>}/>
          <Route path="/withdraw" element={<Withdraw/>}/>
        </Routes>
      </div>
      <FloatingWhatsApp/>
      <ToastContainer position="bottom-center"/>
    </BrowserRouter>
  );
}


<WhatsAppFloat/>

