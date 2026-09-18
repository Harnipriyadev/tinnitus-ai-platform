"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  authenticatedFetch,
} from "../../../../lib/authService";

type TimeSlotInput = {
  startTime: string;
  endTime: string;
};

type StoredSlot = TimeSlotInput & {
  _id: string;
  isBooked: boolean;
  appointment?: string | null;
};

type Availability = {
  _id: string;
  date: string;
  timezone: string;
  active: boolean;
  slots: StoredSlot[];
};

type AvailabilityResponse = {
  success: boolean;
  message?: string;
  availability?: Availability | Availability[];
};

const EMPTY_SLOT: TimeSlotInput = {
  startTime: "09:00",
  endTime: "09:30",
};

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("Backend API URL is not configured");
  }

  return apiUrl;
};

const readResponse = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed");
  }

  return data;
};

const getIndiaDateInput = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [
      part.type,
      part.value,
    ])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const formatAvailabilityDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function DoctorAvailability() {
  const minimumDate = useMemo(getIndiaDateInput, []);
  const [date, setDate] = useState(minimumDate);
  const [slots, setSlots] = useState<TimeSlotInput[]>([
    { ...EMPTY_SLOT },
  ]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/doctor/availability`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await readResponse<AvailabilityResponse>(response);
      setAvailability(
        Array.isArray(data.availability) ? data.availability : []
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load availability"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const updateSlot = (
    index: number,
    field: keyof TimeSlotInput,
    value: string
  ) => {
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              [field]: value,
            }
          : slot
      )
    );
  };

  const addSlot = () => {
    if (slots.length >= 30) {
      setError("A maximum of 30 slots can be added for one date.");
      return;
    }

    setError("");
    setSlots((current) => [...current, { ...EMPTY_SLOT }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length === 1) {
      setError("At least one time slot is required.");
      return;
    }

    setError("");
    setSlots((current) =>
      current.filter((_, slotIndex) => slotIndex !== index)
    );
  };

  const editAvailability = (item: Availability) => {
    if (item.slots.some((slot) => slot.isBooked)) {
      setError("Availability with a booked appointment cannot be edited.");
      return;
    }

    const indiaDate = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(item.date));

    const values = Object.fromEntries(
      indiaDate
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );

    setDate(`${values.year}-${values.month}-${values.day}`);
    setSlots(
      item.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
    );
    setError("");
    setSuccess("Availability loaded into the form. Save to update it.");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const saveAvailability = async () => {
    setError("");
    setSuccess("");

    if (!date) {
      setError("Select an availability date.");
      return;
    }

    if (slots.some((slot) => !slot.startTime || !slot.endTime)) {
      setError("Enter a start and end time for every slot.");
      return;
    }

    if (slots.some((slot) => slot.startTime >= slot.endTime)) {
      setError("Every slot must end after its start time.");
      return;
    }

    setSaving(true);

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/doctor/availability`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            slots,
            timezone: "Asia/Kolkata",
          }),
        }
      );

      const data = await readResponse<AvailabilityResponse>(response);
      setSuccess(data.message || "Availability saved successfully.");
      setSlots([{ ...EMPTY_SLOT }]);
      await loadAvailability();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save availability"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability = async (id: string) => {
    if (!window.confirm("Remove this availability date?")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/api/doctor/availability/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await readResponse<AvailabilityResponse>(response);
      setSuccess(data.message || "Availability removed successfully.");
      await loadAvailability();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove availability"
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
          <CalendarDays size={23} />
        </span>
        <div>
          <h2 className="text-xl font-bold">Consultation availability</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add the dates and times when patients can book a consultation.
            Times use the Asia/Kolkata timezone.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Available date
          </span>
          <input
            type="date"
            value={date}
            min={minimumDate}
            onChange={(event) => setDate(event.target.value)}
            disabled={saving}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 sm:max-w-xs"
          />
        </label>

        <div className="mt-5 space-y-3">
          {slots.map((slot, index) => (
            <div key={index} className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
              <label>
                <span className="text-xs font-semibold text-slate-600">
                  Start time
                </span>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(event) =>
                    updateSlot(index, "startTime", event.target.value)
                  }
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500"
                />
              </label>

              <label>
                <span className="text-xs font-semibold text-slate-600">
                  End time
                </span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(event) =>
                    updateSlot(index, "endTime", event.target.value)
                  }
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500"
                />
              </label>

              <button
                type="button"
                onClick={() => removeSlot(index)}
                disabled={saving || slots.length === 1}
                aria-label={`Remove slot ${index + 1}`}
                className="flex h-10 items-center justify-center rounded-xl border border-red-200 px-3 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={addSlot}
            disabled={saving || slots.length >= 30}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-white py-3 font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
          >
            <Plus size={19} />
            Add another slot
          </button>

          <button
            type="button"
            onClick={() => void saveAvailability()}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : (
              <Save size={19} />
            )}
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold">Upcoming availability</h3>

        {loading ? (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading availability...
          </div>
        ) : availability.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No availability has been added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {availability.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-bold">{formatAvailabilityDate(item.date)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.timezone}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editAvailability(item)}
                      disabled={item.slots.some((slot) => slot.isBooked)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAvailability(item._id)}
                      disabled={
                        deletingId === item._id ||
                        item.slots.some((slot) => slot.isBooked)
                      }
                      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === item._id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.slots.map((slot) => (
                    <span
                      key={slot._id}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                        slot.isBooked
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      <Clock3 size={15} />
                      {slot.startTime}–{slot.endTime}
                      {slot.isBooked ? " · Booked" : " · Open"}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
