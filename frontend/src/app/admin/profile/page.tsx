"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type AuthUser } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<(AuthUser & { createdAt?: string }) | null>(
    null
  );
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        setUser(res.user);
        setName(res.user.name);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load profile")
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.updateProfile(name.trim());
      setUser(res.user);
      setSuccess("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading profile...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your admin account details.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            disabled
            value={user?.email ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-1 font-medium text-slate-900">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Joined</p>
            <p className="mt-1 font-medium text-slate-900">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
