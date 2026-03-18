import { createDishAction } from "../actions";

import { DishFormScreen } from "@/components/screens/dish-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { addDishDraft } from "@/lib/dish-form";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export default function NewDishPage() {
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title="Supabase is not configured"
        description="The Add Dish form cannot save yet because local Supabase environment variables are missing."
        hint={`${configurationError}. Fill in .env.local from .env.example and restart npm.cmd run dev.`}
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
