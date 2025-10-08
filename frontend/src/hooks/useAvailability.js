import { useEffect, useState } from "react";
import { getUserBusySlots, addBusySlots } from "../services/busySlotsService";

export function useAvailability(eventId, userId) {
  const [busySlots, setBusySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId || !userId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getUserBusySlots(userId, eventId);
        if (!mounted) return;
        setBusySlots(res || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load availability");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [eventId, userId]);

  const submitSlots = async (slots) => {
    await addBusySlots(eventId, slots);
    // refresh
    const res = await getUserBusySlots(userId, eventId);
    setBusySlots(res || []);
  };

  return { busySlots, loading, error, submitSlots };
}


