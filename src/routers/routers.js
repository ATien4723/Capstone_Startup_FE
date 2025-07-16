import { lazy } from 'react';
import InternshipDetail from "@pages/InternshipDetail/InternshipDetail";

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
const MeInternshipPost = lazy(() => import('@/pages/Me/Post/InternshipPost'));
const MeMember = lazy(() => import('@/pages/Me/Member/Member'));
const MilestoneBoards = lazy(() => import('@/pages/Me/Milestone/MilestoneBoards'));
const Milestone = lazy(() => import('@/pages/Me/Milestone/Milestone'));
const CV = lazy(() => import('@/pages/Me/CV/CV'));
const nhap = lazy(() => import('@/pages/Test/Nhap'));

const routers = [
    {
        path: "/startup-detail/:id",
        component: StartupDetail,
        protected: true
    },
    {
        path: "/",
        component: Login
    },
    {
        path: "/login",
        component: Login
    },
    {
        path: "/home",
        component: Home,
        protected: true
    },
    {
        path: "/mynetwork",
        component: MyNetwork,
        protected: true
    },
    {
        path: "/network/following",
        component: NetworkList,
        protected: true
    },
    {
        path: "/network/followers",
        component: NetworkList,
        protected: true
    },
    {
        path: "/profile/:id",
        component: PublicProfile,
        protected: true
    },
    {
        path: "/startups",
        component: Startups,
        protected: true
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
        component: Settings,
        protected: true
    },
    {
        path: '/forget-password',
        component: FortgetPassword
    },
    {
        path: '/create-startup',
        component: CreateStartup,
        protected: true,
        preventIfMember: true
    },
    // Thêm các đường dẫn mới
    {
        path: '/me',
        component: Me,
        children: true,
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/dashboard',
        component: MeDashboard,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/chat',
        component: MeChat,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/post',
        component: MePost,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/post/internship',
        component: MeInternshipPost,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/member',
        component: MeMember,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/milestones',
        component: MilestoneBoards,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/milestones/:boardId',
        component: Milestone,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/cv',
        component: CV,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/settings',
        component: Settings,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: "/internship/:id",
        component: InternshipDetail,
        protected: true
    },
    {
        path: "/nhap",
        component: nhap,
        protected: true
    },
];
export default routers;