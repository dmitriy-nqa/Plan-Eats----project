import { createDishAction } from "../actions";

import { DishFormScreen } from "@/components/screens/dish-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { addDishDraft } from "@/lib/dish-form";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export default async function NewDishPage() {
  const locale = await getRequestLocale();
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={getTranslation(locale, "dishes.setup.title")}
        description={getTranslation(locale, "dishes.setup.newDescription")}
        hint={getTranslation(locale, "dishes.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.dishLibrary")}
        ctaLabel={getTranslation(locale, "dishes.navigation.backToLibrary")}
      />
    );
  }

  return (
    <DishFormScreen
      mode="add"
      initialValues={addDishDraft}
      saveAction={createDishAction}
    />
  );
}
