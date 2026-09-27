// Goals, interests and study level from "Make it yours". Interests are also saved
// to the profile; the API has no field for goals or study level, so the whole
// persona is kept on the device per account.
import { useMemo } from "react";
import { deviceStore } from "@/lib/deviceStore";
import { useAppStore } from "@/store";
import { EMPTY_PERSONA, interestsFromTags, type Persona } from "./logic";

const store = deviceStore<Persona>("persona", EMPTY_PERSONA);

/** Save for the signed-in account (updates every screen using usePersona) */
export function savePersona(persona: Persona) {
  store.update(() => persona);
}

export function usePersona(): { persona: Persona; loaded: boolean } {
  const { state } = useAppStore();
  const me = state.session.me;
  const tags = me?.profile?.interests;
  // A fresh device still knows the interests saved to the profile
  const initial = useMemo(() => ({ ...EMPTY_PERSONA, interests: interestsFromTags(tags ?? []) }), [tags]);
  const { value, loaded } = store.useValue(me?.userId ?? null, initial);
  return { persona: value, loaded };
}
