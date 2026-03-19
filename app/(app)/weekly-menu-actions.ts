"use server";

import { revalidatePath } from "next/cache";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readDayIndex(formData: FormData) {
  const rawValue = readText(formData, "dayIndex");
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue)) {
    throw new Error("Invalid day index");
  }

  return parsedValue;
}

export async function assignWeeklySlotAction(formData: FormData) {
  const { assignDishToCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

  await assignDishToCurrentWeekSlot({
    dayIndex: readDayIndex(formData),
    mealType: readText(formData, "mealType"),
    dishId: readText(formData, "dishId"),
  });

  revalidatePath("/");
  revalidatePath("/products");
}

export async function clearWeeklySlotAction(formData: FormData) {
  const { clearCurrentWeekSlot } = await import("@/lib/weekly-menu-crud");

  await clearCurrentWeekSlot({
    dayIndex: readDayIndex(formData),
    mealType: readText(formData, "mealType"),
  });

  revalidatePath("/");
  revalidatePath("/products");
}
