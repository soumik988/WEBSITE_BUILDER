import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { useNavigate, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type ProvidersProps = {
    children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
    const navigate = useNavigate();

    return (
        <AuthUIProvider
            authClient={authClient}
            navigate={navigate}
            Link={(props) => <NavLink {...props} to={props.href} />}
        >
            {children}
        </AuthUIProvider>
    );
}