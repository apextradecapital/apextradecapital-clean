import { FaWhatsapp } from "react-icons/fa";
export default function FloatingWhatsApp() {
  const num = import.meta.env.VITE_WHATSAPP_NUMBER || "+16265333367";
  const link = `https://wa.me/${num.replace(/[^0-9]/g,"")}`;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
       style={{
         position:"fixed", bottom:"20px", right:"20px",
         backgroundColor:"#25D366", color:"white",
         borderRadius:"50%", width:"55px", height:"55px",
         display:"flex", alignItems:"center", justifyContent:"center",
         boxShadow:"0 2px 8px rgba(0,0,0,0.3)", zIndex:9999
       }}>
      <FaWhatsapp size={32}/>
    </a>
  );
}
