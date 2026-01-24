import { useNavigate } from "react-router-dom";

export default function Welcome(){
    const navigate = useNavigate();

    return(
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Welcome</h1>
            <button className="mt-6 rounded-xl bg-black px-4 py-2 text-white"
            onClick={() => navigate("/breakdown")}> Go to Breakdown
            </button>
        </div>
    );

}