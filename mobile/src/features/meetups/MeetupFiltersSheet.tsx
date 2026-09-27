import { useState } from "react";
import { ChipWrap } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import FilterSheet, { FilterSection, FilterToggle } from "@/features/filters/FilterSheet";
import { EMPTY_MEETUP_FILTERS, EVENT_CATEGORIES, filterEvents, WHEN_OPTIONS, type MeetupFilters } from "./logic";

type Props = {
  /** Events matching the search, for the "Show N events" count */
  events: MeetupEvent[];
  applied: MeetupFilters;
  onApply: (filters: MeetupFilters) => void;
  onClose: () => void;
};

// Type, when, walk-ins and free spots; nothing changes until "Show N events"
export default function MeetupFiltersSheet({ events, applied, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(applied);
  const count = filterEvents(events, draft).length;
  const set = (change: Partial<MeetupFilters>) => setDraft({ ...draft, ...change });

  return (
    <FilterSheet
      visible
      onClose={onClose}
      onClear={() => setDraft(EMPTY_MEETUP_FILTERS)}
      onApply={() => onApply(draft)}
      applyLabel={count === 1 ? "Show 1 event" : `Show ${count} events`}
    >
      <FilterSection title="Type" value={draft.categories.length ? undefined : "All"}>
        <ChipWrap
          options={EVENT_CATEGORIES.map((c) => ({
            label: c,
            active: draft.categories.includes(c),
            onPress: () =>
              set({ categories: draft.categories.includes(c) ? draft.categories.filter((x) => x !== c) : [...draft.categories, c] }),
          }))}
        />
      </FilterSection>

      <FilterSection title="When">
        <ChipWrap
          options={WHEN_OPTIONS.map((o) => ({ label: o.label, active: draft.when === o.value, onPress: () => set({ when: o.value }) }))}
        />
      </FilterSection>

      <FilterSection title="Getting in">
        <FilterToggle
          label="Walk-ins welcome"
          note="Just turn up, no need to join first"
          value={draft.walkInsOnly}
          onChange={(walkInsOnly) => set({ walkInsOnly })}
        />
        <FilterToggle label="Spots left" note="Hide full events" value={draft.spotsLeft} onChange={(spotsLeft) => set({ spotsLeft })} />
      </FilterSection>
    </FilterSheet>
  );
}
