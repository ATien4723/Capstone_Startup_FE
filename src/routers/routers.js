import StartupDetail from '@/pages/StartupDetails/StartupDetail';
import Login from '@/pages/Login/Login';
import Home from '@/pages/Home/Home';
import PublicProfile from '@/pages/PublicProfile/PublicProfile';
import Startups from '@/pages/Startups/Startups';
import Register from '@/pages/Register/Register';
import OTPVerification from '@/components/OTPVerification/OTPVerification'





const routers = [
    {
        path: "/startup-detail/:id",
        component: StartupDetail
    },
    {
        path: "/login",
        component: Login
    },
    {
        path: "/home",
        component: Home
    },
    {
        path: "/profile",
        component: PublicProfile
    },
    {
        path: "/startups",
        component: Startups
    },
    {
        path: "/register",
        component: Register
    },
    {
        path: '/verify-otp',
        component: OTPVerification
    }
];
export default routers;