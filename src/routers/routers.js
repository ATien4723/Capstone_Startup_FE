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
const CreateStartup = lazy(() => import('@/pages/Startups/CreateStartup'));

// Thêm các component mới
const Me = lazy(() => import('@/pages/Me/Me'));
const MeDashboard = lazy(() => import('@/pages/Me/Dashboard/Dashboard'));
const MeChat = lazy(() => import('@/pages/Me/Chat/Chat'));
const MePost = lazy(() => import('@/pages/Me/Post/Post'));
const MeMember = lazy(() => import('@/pages/Me/Member/Member'));

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
    },
    {
        path: '/create-startup',
        component: CreateStartup
    },
    // Thêm các đường dẫn mới
    {
        path: '/me',
        component: Me,
        children: true
    },
    {
        path: '/me/dashboard',
        component: MeDashboard,
        parent: '/me'
    },
    {
        path: '/me/chat',
        component: MeChat,
        parent: '/me'
    },
    {
        path: '/me/post',
        component: MePost,
        parent: '/me'
    },
    {
        path: '/me/member',
        component: MeMember,
        parent: '/me'
    }
];
export default routers;