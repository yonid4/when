import { useEffect } from "react";

import { supabase } from "../services/supabaseClient.js";

export function useRealtime({ channelName = "when-realtime", onEvent }) {
  useEffect(() => {
    const channel = supabase.channel(channelName);

    if (onEvent) {
      channel.on("broadcast", { event: "update" }, onEvent);
    }

    channel.subscribe();

    return () => channel.unsubscribe();
  }, [channelName, onEvent]);
}
