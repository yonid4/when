import { useEffect, useState, useCallback } from "react";
import { busySlotsAPI } from "../services/apiService";

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
        const res = await busySlotsAPI.getByUser(userId, eventId);
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

  const submitSlots = useCallback(async (slots) => {
    try {
      await busySlotsAPI.add(eventId, slots);
      // refresh
      const res = await busySlotsAPI.getByUser(userId, eventId);
      setBusySlots(res || []);
    } catch (e) {
      setError(e.message || "Failed to submit slots");
      throw e;
    }
  }, [eventId, userId]);

  return { busySlots, loading, error, submitSlots };
}


