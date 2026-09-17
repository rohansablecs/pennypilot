"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "./auth";
import Dashboard from "./dashboard";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">◒</div>
        <p>Loading PennyPilot...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <Dashboard session={session} />;
}