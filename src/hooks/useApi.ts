"use client";

import { useCallback } from "react";
import api from "@/lib/api";

type ApiResponse<T> = Promise<T>;

export const useApi = () => {

  const get = useCallback(async <T = any>(url: string, config = {}) : ApiResponse<T> => {
    const res = await api.get(url, config);
    return res.data;
  }, []);

  const post = useCallback(async <T = any>(url: string, body = {}) : ApiResponse<T> => {
    const res = await api.post(url, body);
    return res.data;
  }, []);

  const put = useCallback(async <T = any>(url: string, body = {}) : ApiResponse<T> => {
    const res = await api.put(url, body);
    return res.data;
  }, []);

  const del = useCallback(async <T = any>(url: string) : ApiResponse<T> => {
    const res = await api.delete(url);
    return res.data;
  }, []);

  return { get, post, put, del };
};
