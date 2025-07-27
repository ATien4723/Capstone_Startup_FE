import { lazy } from 'react';
import InternshipDetail from "@pages/InternshipDetail/InternshipDetail";
import Messages from '@/pages/Messages/Messages';

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
const AccessDenied = lazy(() => import('@/pages/AccessDenied/AccessDenied'));
const Policy = lazy(() => import('@/pages/Policy/Policy'));
const PolicyDetail = lazy(() => import('@/pages/Policy/PolicyDetail'));

// Thêm các component mới
const Me = lazy(() => import('@/pages/Me/Me'));
const MeDashboard = lazy(() => import('@/pages/Me/Dashboard/Dashboard'));
const MeChat = lazy(() => import('@/pages/Me/Chat/Chat'));
const MeUserChat = lazy(() => import('@/pages/Me/Chat/UserChat'));
const MePost = lazy(() => import('@/pages/Me/Post/Post'));
const MeInternshipPost = lazy(() => import('@/pages/Me/Post/InternshipPost'));
const MeMember = lazy(() => import('@/pages/Me/Member/Member'));
const MilestoneBoards = lazy(() => import('@/pages/Me/Milestone/MilestoneBoards'));
const Milestone = lazy(() => import('@/pages/Me/Milestone/Milestone'));
const CV = lazy(() => import('@/pages/Me/CV/CV'));
const StartupInfo = lazy(() => import('@/pages/Me/StartupInfo/StartupInfo'));
const MeAnalytics = lazy(() => import('@/pages/Me/Analytics/Analytics'));
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
    {
        path: '/access-denied',
        component: AccessDenied,
        protected: true
    },
    {
        path: '/policy',
        component: Policy,
        protected: true
    },
    {
        path: '/policy/:id',
        component: PolicyDetail,
        protected: true
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
        path: '/me/chat/user',
        component: MeUserChat,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/post',
        component: MePost,
        parent: '/me',
        protected: true,
        requireStartup: true,
        requirePostPermission: true
    },
    {
        path: '/me/post/internship',
        component: MeInternshipPost,
        parent: '/me',
        protected: true,
        requireStartup: true,
        requirePostPermission: true
    },
    {
        path: '/me/member',
        component: MeMember,
        parent: '/me',
        protected: true,
        requireStartup: true,
        requireMemberManagement: true
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
        path: '/me/startup-info',
        component: StartupInfo,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/me/analytics',
        component: MeAnalytics,
        parent: '/me',
        protected: true,
        requireStartup: true
    },
    {
        path: '/messages',
        component: Messages,
        protected: true
    },
    {
        path: '/messages/u/:chatRoomId',
        component: Messages,
        protected: true
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