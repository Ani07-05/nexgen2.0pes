// cognitium/src/providers/SessionProvider.tsx
"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type SessionContextType = {
  username: string | null;
  setUsername: (name: string | null) => void;
};

const SessionContext = createContext<SessionContextType>({
  username: null,
  setUsername: () => {},
});

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const name =
            session.user.user_metadata.full_name || session.user.email;
          setUsername(name);
          router.refresh(); // Ensure server components are updated with new session
        }
      } catch (error: any) {
        console.error("Error checking session:", error);
      }
    };

    initSession();

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata.full_name || session.user.email;
        setUsername(name);
        router.refresh(); // Refresh server components
      } else {
        setUsername(null);
        if (event === "SIGNED_OUT") {
          router.push("/");
          router.refresh(); // Refresh server components
        }
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <SessionContext.Provider value={{ username, setUsername }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
