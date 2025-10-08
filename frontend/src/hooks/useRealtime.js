import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function useRealtime({ channelName = "when-realtime", onEvent }) {
  useEffect(() => {
    const channel = supabase.channel(channelName);

    if (onEvent) {
      channel.on("broadcast", { event: "update" }, (payload) => onEvent(payload));
    }

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelName, onEvent]);
}


