import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";

const items = [
  { name: "Buckwheat", amount: "400 g" },
  { name: "Tomatoes", amount: "6 pcs" },
  { name: "Milk", amount: "1 l" },
];

export function ProductsPlaceholder() {
  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Shopping List"
        title="Products"
        description="The future generated shopping list lives here. The skeleton already leaves room for auto items, manual edits, and checking items off."
      />

      <SurfaceCard className="bg-gradient-to-br from-white to-sand">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cocoa">This week&apos;s list</p>
            <p className="mt-1 text-sm leading-6 text-cocoa">
              Auto-generated products will appear here after weekly planning is connected.
            </p>
          </div>
          <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-semibold text-leaf">
            Shared
          </span>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl bg-sand/55 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-md border-2 border-clay/60 bg-white" />
              <div>
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-sm text-cocoa">{item.amount}</p>
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
              Auto
            </span>
          </div>
        ))}

        <button
          type="button"
          className="w-full rounded-2xl border border-dashed border-clay/40 bg-white px-4 py-3 text-sm font-semibold text-cocoa"
        >
          Add manual product
        </button>
      </SurfaceCard>
    </div>
  );
}
