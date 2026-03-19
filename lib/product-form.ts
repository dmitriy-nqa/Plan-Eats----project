import type { ProductDuplicateResult } from "@/lib/products";

export type ProductAliasDraft = {
  id: string;
  value: string;
};

export type ProductFormValues = {
  displayName: string;
  aliases: ProductAliasDraft[];
};

export type ProductFormSubmissionState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors: {
    displayName?: string;
    aliasRows: Record<number, string>;
  };
  duplicate?: ProductDuplicateResult;
};

export type ProductMergeSubmissionState = {
  status: "idle" | "error";
  formError?: string;
};

export const initialProductFormSubmissionState: ProductFormSubmissionState = {
  status: "idle",
  fieldErrors: {
    aliasRows: {},
  },
};

export const initialProductMergeSubmissionState: ProductMergeSubmissionState = {
  status: "idle",
};

export function createEmptyAlias(id: string): ProductAliasDraft {
  return {
    id,
    value: "",
  };
}

export const addProductDraft: ProductFormValues = {
  displayName: "",
  aliases: [createEmptyAlias("alias-1")],
};

export type ProductFormValidationIssue =
  | { code: "display_name_required" }
  | { code: "alias_duplicate"; rowIndex: number }
  | { code: "alias_matches_display_name"; rowIndex: number };

