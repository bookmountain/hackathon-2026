import { useState } from "react";
import { ChipWrap, RangeSlider } from "@/components/ui";
import type { Flat } from "@/data/types";
import FilterSheet, { FilterSection, FilterToggle } from "@/features/filters/FilterSheet";
import { BILLS_OPTIONS, EMPTY_FLAT_FILTERS, filterFlats, type FlatFilters } from "./logic";

type Props = {
  /** Rooms matching the search, for the "Show N rooms" count */
  flats: Flat[];
  /** Ends of the rent slider, from every room */
  bounds: { min: number; max: number };
  applied: FlatFilters;
  onApply: (filters: FlatFilters) => void;
  onClose: () => void;
};

// Rent range, bills, furnished and ensuite; nothing changes until "Show N rooms"
export default function FlatFiltersSheet({ flats, bounds, applied, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(applied);
  const low = draft.rentMin ?? bounds.min;
  const high = draft.rentMax ?? bounds.max;
  const count = filterFlats(flats, draft).length;
  const set = (change: Partial<FlatFilters>) => setDraft({ ...draft, ...change });

  return (
    <FilterSheet
      visible
      onClose={onClose}
      onClear={() => setDraft(EMPTY_FLAT_FILTERS)}
      onApply={() => onApply(draft)}
      applyLabel={count === 1 ? "Show 1 room" : `Show ${count} rooms`}
    >
      <FilterSection title="Rent per week" value={`$${low} – $${high}${draft.rentMax === null ? "+" : ""}`}>
        <RangeSlider
          min={bounds.min}
          max={bounds.max}
          step={10}
          low={low}
          high={high}
          labels={["Minimum rent", "Maximum rent"]}
          format={(v) => `$${v} a week`}
          // An end left at its limit means no limit, so new, dearer rooms still show
          onChange={(l, h) => set({ rentMin: l <= bounds.min ? null : l, rentMax: h >= bounds.max ? null : h })}
        />
      </FilterSection>

      <FilterSection title="Bills per week">
        <ChipWrap
          options={BILLS_OPTIONS.map((o) => ({
            label: o.label,
            active: draft.maxBills === o.max,
            onPress: () => set({ maxBills: o.max }),
          }))}
        />
      </FilterSection>

      <FilterSection title="The room">
        <FilterToggle label="Fully furnished" value={draft.furnished} onChange={(furnished) => set({ furnished })} />
        <FilterToggle label="Private ensuite" note="Your own toilet" value={draft.ensuite} onChange={(ensuite) => set({ ensuite })} />
      </FilterSection>
    </FilterSheet>
  );
}
