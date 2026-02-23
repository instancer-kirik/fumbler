import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ShareKeyGrant = "matches" | "express";

export interface ShareKey {
  id: string;
  profile_id: string;
  key: string;
  label: string | null;
  grants: ShareKeyGrant;
  expires_at: string | null;
  use_count: number;
  created_at: string;
}

export interface CreateShareKeyParams {
  label?: string;
  grants: ShareKeyGrant;
  expires_at?: string | null;
}

/** Generates a cryptographically random URL-safe token */
function generateKey(byteLength = 18): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function useShareKeys(username: string | null | undefined) {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ShareKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_share_keys")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) {
      toast.error("Could not load share keys: " + error.message);
      return;
    }
    setKeys((data ?? []) as ShareKey[]);
  }, [user]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(
    async (params: CreateShareKeyParams): Promise<ShareKey | null> => {
      if (!user) return null;
      setCreating(true);

      const newKey = generateKey();
      const { data, error } = await supabase
        .from("profile_share_keys")
        .insert({
          profile_id: user.id,
          key: newKey,
          label: params.label?.trim() || null,
          grants: params.grants,
          expires_at: params.expires_at ?? null,
        })
        .select()
        .single();

      setCreating(false);
      if (error) {
        toast.error("Failed to create share key: " + error.message);
        return null;
      }

      const created = data as ShareKey;
      setKeys((prev) => [created, ...prev]);
      toast.success("Share link created!");
      return created;
    },
    [user]
  );

  const revokeKey = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("profile_share_keys")
        .delete()
        .eq("id", id)
        .eq("profile_id", user.id);

      if (error) {
        toast.error("Failed to revoke key: " + error.message);
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("Share link revoked.");
    },
    [user]
  );

  const shareUrl = useCallback(
    (key: ShareKey): string => {
      if (!username) return "";
      const base = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}`;
      return `${base}/u/${username}?key=${key.key}`;
    },
    [username]
  );

  const isExpired = (key: ShareKey): boolean => {
    if (!key.expires_at) return false;
    return new Date(key.expires_at) < new Date();
  };

  return {
    keys,
    loading,
    creating,
    fetchKeys,
    createKey,
    revokeKey,
    shareUrl,
    isExpired,
  };
}
