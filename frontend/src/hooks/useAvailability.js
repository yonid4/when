import { useCallback, useEffect, useState } from "react";

import { busySlotsAPI } from "../services/apiService.js";

export function useAvailability(eventId, userId) {
  const [busySlots, setBusySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId || !userId) return;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await busySlotsAPI.getByUser(userId, eventId);
        if (mounted) {
          setBusySlots(res || []);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || "Failed to load availability");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [eventId, userId]);

  const submitSlots = useCallback(
    async (slots) => {
      try {
        await busySlotsAPI.add(eventId, slots);
        const res = await busySlotsAPI.getByUser(userId, eventId);
        setBusySlots(res || []);
      } catch (e) {
        setError(e.message || "Failed to submit slots");
        throw e;
      }
    },
    [eventId, userId]
  );

  return { busySlots, loading, error, submitSlots };
}
