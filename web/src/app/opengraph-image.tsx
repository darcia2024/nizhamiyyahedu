import { ImageResponse } from "next/og";
export const runtime="nodejs";
export const alt="Nizhamiyyah Edu - Belajar kitab, satu marhalah demi satu marhalah";
export const size={width:1200,height:630};
export const contentType="image/png";
export default function Image(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",background:"#0F4736",color:"#F6E7B4",padding:90,fontFamily:"sans-serif"}}><div style={{fontSize:26,letterSpacing:5,marginBottom:36}}>NIZHAMIYYAH EDU</div><div style={{fontSize:68,lineHeight:1.2,maxWidth:950}}>Belajar kitab, satu marhalah demi satu marhalah.</div><div style={{fontSize:26,marginTop:36,color:"#d6ddd7"}}>Kurikulum berjenjang. Materi terstruktur. Belajar sesuai ritme kamu.</div></div>,size);}
