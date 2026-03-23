"use server";

import { revalidatePath } from "next/cache";

import { isWeeklyMenuMutationError } from "@/lib/weekly-menu";

export type WeeklyMenuSlotMutationResult =
  | {
      status: "success";
      slotIsEmpty?: boolean;
    }
  | {
      status: "error";
      code:
        | "duplicate_dish_in_slot"
        | "slot_item_not_found"
        | "slot_not_found"
        | "slot_not_empty"
        | "dish_not_available"
        | "failed";
    };

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readDayIndex(formData: FormData) {
  return readNamedDayIndex(formData, "dayIndex");
}

function readNamedDayIndex(formData: FormData, key: string) {
  const rawValue = readText(formData, key);
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue)) {
    throw new Error("Invalid day index");
  }

  return parsedValue;
}

function revalidateWeeklyMenuPaths() {
  revalidatePath("/");
  revalidatePath("/products");
}

function mapWeeklyMenuActionError(error: unknown): WeeklyMenuSlotMutationResult {
  if (isWeeklyMenuMutationError(error)) {
    return {
      status: "error",
      code: error.code,
    };
  }

  console.error("Weekly menu slot mutation failed", error);

  return {
    status: "error",
    code: "failed",
  };
}

export async function assignWeeklySlotAction(formData: FormData) {
  const { assignDishToCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

  await assignDishToCurrentWeekSlot({
    dayIndex: readDayIndex(formData),
    mealType: readText(formData, "mealType"),
    dishId: readText(formData, "dishId"),
  });

  revalidateWeeklyMenuPaths();
}

export async function clearWeeklySlotAction(formData: FormData) {
  const { clearCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

  await clearCurrentWeekSlot({
    dayIndex: readDayIndex(formData),
    mealType: readText(formData, "mealType"),
  });

  revalidateWeeklyMenuPaths();
}

export async function addWeeklySlotDishAction(
  formData: FormData,
): Promise<WeeklyMenuSlotMutationResult> {
  try {
    const { addDishToCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

    await addDishToCurrentWeekSlot({
      dayIndex: readDayIndex(formData),
      mealType: readText(formData, "mealType"),
      dishId: readText(formData, "dishId"),
    });

    revalidateWeeklyMenuPaths();

    return {
      status: "success",
    };
  } catch (error) {
    return mapWeeklyMenuActionError(error);
  }
}

export async function replaceWeeklySlotItemAction(
  formData: FormData,
): Promise<WeeklyMenuSlotMutationResult> {
  try {
    const { replaceCurrentWeekSlotItemDish } = await import("@/lib/weekly-menu-crud");

    await replaceCurrentWeekSlotItemDish({
      dayIndex: readDayIndex(formData),
      mealType: readText(formData, "mealType"),
      slotItemId: readText(formData, "slotItemId"),
      dishId: readText(formData, "dishId"),
    });

    revalidateWeeklyMenuPaths();

    return {
      status: "success",
    };
  } catch (error) {
    return mapWeeklyMenuActionError(error);
  }
}

export async function removeWeeklySlotItemAction(
  formData: FormData,
): Promise<WeeklyMenuSlotMutationResult> {
  try {
    const { removeCurrentWeekSlotItem } = await import("@/lib/weekly-menu-crud");

    const result = await removeCurrentWeekSlotItem({
      dayIndex: readDayIndex(formData),
      mealType: readText(formData, "mealType"),
      slotItemId: readText(formData, "slotItemId"),
    });

    revalidateWeeklyMenuPaths();

    return {
      status: "success",
      slotIsEmpty: result.slotIsEmpty,
    };
  } catch (error) {
    return mapWeeklyMenuActionError(error);
  }
}

export async function reuseWeeklySlotItemAction(
  formData: FormData,
): Promise<WeeklyMenuSlotMutationResult> {
  try {
    const { copyCurrentWeekSlotItem } = await import("@/lib/weekly-menu-crud");

    await copyCurrentWeekSlotItem({
      sourceDayIndex: readNamedDayIndex(formData, "sourceDayIndex"),
      sourceMealType: readText(formData, "sourceMealType"),
      slotItemId: readText(formData, "slotItemId"),
      targetDayIndex: readDayIndex(formData),
      targetMealType: readText(formData, "mealType"),
    });

    revalidateWeeklyMenuPaths();

    return {
      status: "success",
    };
  } catch (error) {
    return mapWeeklyMenuActionError(error);
  }
}

export async function reuseWeeklySlotAction(
  formData: FormData,
): Promise<WeeklyMenuSlotMutationResult> {
  try {
    const { copyCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

    await copyCurrentWeekSlot({
      sourceDayIndex: readNamedDayIndex(formData, "sourceDayIndex"),
      sourceMealType: readText(formData, "sourceMealType"),
      targetDayIndex: readDayIndex(formData),
      targetMealType: readText(formData, "mealType"),
    });

    revalidateWeeklyMenuPaths();

    return {
      status: "success",
    };
  } catch (error) {
    return mapWeeklyMenuActionError(error);
  }
}
