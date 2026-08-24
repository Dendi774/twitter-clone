


import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignupPage";
import Sidebar from "./components/common/SideBar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";

const App = () => {
    
    const {data:authUser, isLoading, error, isError} = useQuery({
        queryKey: ['authUser'],
        queryFn: async () => {
            try{
                const res = await fetch('/api/auth/me');
                const data = await res.json();

                if (data.error) return null;
                
                if (!res.ok) throw new Error(data.error || 'something went wrong');
                console.log(`authUser: `, data);
                return data
                
            }catch(err){
                throw new Error(err);
            }
        },
        retry: false,
    });

    if (isLoading){
        return(
            <div className="h-screen flex justify-center items-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }
    
    return(
        <div className="flex max-w-6xl mx-auto">
            {authUser && <Sidebar />}
            <Routes>
                <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />}></Route>
                <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />}></Route>
                <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />}></Route>
                <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />}></Route>
                <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/' />}></Route>
            </Routes>
            {authUser && <RightPanel />}
            <Toaster />
        </div>     
    );
}

export default App;