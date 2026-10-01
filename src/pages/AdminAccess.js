import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminAccess() {

    const [code,setCode]=useState("");

    const navigate=useNavigate();

   const handleSubmit=()=>{

    if(code==="PUBLICVOICE2026"){

        sessionStorage.setItem("adminAccess","true");

        navigate("/admin/login");

    }else{

        alert("Invalid Access Code");

    }

}

    return(

        <div
        style={{
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            height:"100vh",
            background:"#f5f5f5"
        }}
        >

            <div
            style={{
                width:"420px",
                background:"#fff",
                padding:"40px",
                borderRadius:"12px",
                boxShadow:"0 0 20px rgba(0,0,0,.1)"
            }}
            >

                <h2>Admin Access</h2>

                <p>
                    Enter administrator access code
                </p>

                <input

                type="password"

                value={code}

                onChange={(e)=>setCode(e.target.value)}

                placeholder="Access Code"

                style={{
                    width:"100%",
                    padding:"12px",
                    marginBottom:"20px"
                }}

                />

                <button

                onClick={handleSubmit}

                style={{
                    width:"100%",
                    padding:"12px",
                    background:"#1A56DB",
                    color:"white",
                    border:"none",
                    borderRadius:"8px"
                }}

                >

                    Continue

                </button>

            </div>

        </div>

    );

}