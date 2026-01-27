import { useEffect, useState } from "react";
import { busySlotsAPI } from "../services/apiService";

export function useCalendar(eventId) {
  const [mergedBusy, setMergedBusy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await busySlotsAPI.getMerged(eventId);
        if (!mounted) return;
        // API returns { event_id, merged_busy_slots, total_slots, date_range }
        setMergedBusy(res?.merged_busy_slots || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load calendar");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [eventId]);

  return { mergedBusy, loading, error };
}


