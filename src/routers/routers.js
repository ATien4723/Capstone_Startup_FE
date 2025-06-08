import { lazy } from 'react';

const StartupDetail = lazy(() => import('@/pages/StartupDetails/StartupDetail'));
const Login = lazy(() => import('@/pages/Login/Login'));
const Home = lazy(() => import('@/pages/Home/Home'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile/PublicProfile'));
const Startups = lazy(() => import('@/pages/Startups/Startups'));
const Register = lazy(() => import('@/pages/Register/Register'));
const Settings = lazy(() => import('@/pages/Settings/Setting'));
const OTPVerification = lazy(() => import('@/components/OTPVerification/OTPVerification'));
const FortgetPassword = lazy(() => import('@/components/ForgetPassword/ForgetPassword'));
const MyNetwork = lazy(() => import('@/pages/MyNetwork/MyNetwork'));
const NetworkList = lazy(() => import('@/pages/MyNetwork/NetworkList'));

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
        path: "/mynetwork",
        component: MyNetwork
    },
    {
        path: "/network/following",
        component: NetworkList
    },
    {
        path: "/network/followers",
        component: NetworkList
    },
    {
        path: "/profile/:id",
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
    },
    {
        path: '/settings/:accountId',
        component: Settings
    },
    {
        path: '/forget-password',
        component: FortgetPassword
    }
];
export default routers;