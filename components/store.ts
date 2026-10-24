import { create } from "zustand";
import type { AssistantRequest, Summary } from "../contracts/assistant";
export type Message = {
  role: "user" | "assistant";
  content: string;
  degraded?: boolean;
};
interface State {
  messages: Message[];
  status: "idle" | "loading" | "streaming";
  error: string | null;
  summary: Summary | null;
  action: AssistantRequest["action"];
  language: AssistantRequest["language"];
  set: (v: Partial<State>) => void;
  reset: () => void;
}
export const useAssistant = create<State>((set) => ({
  messages: [],
  status: "idle",
  error: null,
  summary: null,
  action: "talk",
  language: "English",
  set,
  reset: () =>
    set({
      messages: [],
      status: "idle",
      error: null,
      summary: null,
      action: "talk",
      language: "English",
    }),
}));
