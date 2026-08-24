/* @ts-nocheck */
/* Project-owned route tree. Regenerate with the TanStack router plugin if routes change. */
import { Route as rootRoute } from "./routes/__root";
import { Route as indexRoute } from "./routes/index";
import { Route as authRoute } from "./routes/auth";
import { Route as resetPasswordRoute } from "./routes/reset-password";
import { Route as authenticatedRoute } from "./routes/_authenticated/route";
import { Route as dashboardRoute } from "./routes/_authenticated/dashboard";
import { Route as leadsRoute } from "./routes/_authenticated/leads";
import { Route as onboardingRoute } from "./routes/_authenticated/onboarding";
import { Route as aiRoute } from "./routes/_authenticated/ai";

const Index = indexRoute.update({ id:"/", path:"/", getParentRoute:()=>rootRoute } as never);
const Auth = authRoute.update({ id:"/auth", path:"/auth", getParentRoute:()=>rootRoute } as never);
const ResetPassword = resetPasswordRoute.update({ id:"/reset-password", path:"/reset-password", getParentRoute:()=>rootRoute } as never);
const Authenticated = authenticatedRoute.update({ id:"/_authenticated", getParentRoute:()=>rootRoute } as never);
const Dashboard = dashboardRoute.update({ id:"/dashboard", path:"/dashboard", getParentRoute:()=>Authenticated } as never);
const Leads = leadsRoute.update({ id:"/leads", path:"/leads", getParentRoute:()=>Authenticated } as never);
const Onboarding = onboardingRoute.update({ id:"/onboarding", path:"/onboarding", getParentRoute:()=>Authenticated } as never);
const Ai = aiRoute.update({ id:"/ai", path:"/ai", getParentRoute:()=>Authenticated } as never);

export interface FileRoutesByFullPath { "/":typeof Index; "/auth":typeof Auth; "/reset-password":typeof ResetPassword; "/dashboard":typeof Dashboard; "/leads":typeof Leads; "/onboarding":typeof Onboarding; "/ai":typeof Ai; }
export interface FileRoutesByTo extends FileRoutesByFullPath {}
declare module "@tanstack/react-router" { interface FileRoutesByPath { "/":{preLoaderRoute:typeof Index;parentRoute:typeof rootRoute;id:"/";path:"/";fullPath:"/"}; "/auth":{preLoaderRoute:typeof Auth;parentRoute:typeof rootRoute;id:"/auth";path:"/auth";fullPath:"/auth"}; "/reset-password":{preLoaderRoute:typeof ResetPassword;parentRoute:typeof rootRoute;id:"/reset-password";path:"/reset-password";fullPath:"/reset-password"}; "/dashboard":{preLoaderRoute:typeof Dashboard;parentRoute:typeof Authenticated;id:"/dashboard";path:"/dashboard";fullPath:"/dashboard"}; "/leads":{preLoaderRoute:typeof Leads;parentRoute:typeof Authenticated;id:"/leads";path:"/leads";fullPath:"/leads"}; "/onboarding":{preLoaderRoute:typeof Onboarding;parentRoute:typeof Authenticated;id:"/onboarding";path:"/onboarding";fullPath:"/onboarding"}; "/ai":{preLoaderRoute:typeof Ai;parentRoute:typeof Authenticated;id:"/ai";path:"/ai";fullPath:"/ai"}; } }
export const routeTree = rootRoute.addChildren([Index, Auth, ResetPassword, Authenticated.addChildren([Dashboard, Leads, Onboarding, Ai])]);
