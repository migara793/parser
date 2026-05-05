import { create } from "zustand";
import type { ParseResponse } from "../types";

interface ResultState {
  result: ParseResponse | null;
  setResult: (r: ParseResponse | null) => void;
}

export const useResultStore = create<ResultState>((set) => ({
  result: null,
  setResult: (r) => set({ result: r }),
}));
