"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { GuardedLink } from "@/components/app/guarded-link";
import { markFormClean } from "@/components/app/dirty-form-store";
import { getPreviousAppPath } from "@/components/app/navigation-history-store";
import { useDirtyFormTracker } from "@/components/app/use-dirty-form-tracker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FlashcardImageOptimizationError,
  optimizeFlashcardImageFile,
} from "@/lib/cards/image-optimization";

type Side = "front" | "back";

type SideState = {
  text: string;
  imageUrl: string | null;
  removeImage: boolean;
};

export type FlashcardFormInitial = {
  front: { text: string; imageUrl: string | null };
  back: { text: string; imageUrl: string | null };
};

type FormAction = (formData: FormData) => void | Promise<void>;

type FlashcardFormProps = {
  mode: "create" | "edit";
  action: FormAction;
  alternativeAction?: FormAction;
  alternativeLabel?: string;
  cancelHref: string;
  initial?: FlashcardFormInitial;
  submitLabel: string;
};

export function FlashcardForm({
  mode,
  action,
  alternativeAction,
  alternativeLabel,
  cancelHref,
  initial,
  submitLabel,
}: FlashcardFormProps) {
  const frontId = useId();
  const backId = useId();
  const frontImageId = useId();
  const backImageId = useId();
  const [front, setFront] = useState<SideState>({
    text: initial?.front.text ?? "",
    imageUrl: initial?.front.imageUrl ?? null,
    removeImage: false,
  });
  const [back, setBack] = useState<SideState>({
    text: initial?.back.text ?? "",
    imageUrl: initial?.back.imageUrl ?? null,
    removeImage: false,
  });
  const [pendingAction, setPendingAction] = useState<
    "save" | "add-another" | null
  >(null);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useDirtyFormTracker();
  const router = useRouter();

  const edit = mode === "edit";

  async function submitWithOptimizedImages(
    selectedAction: FormAction,
    formData: FormData,
  ): Promise<boolean> {
    try {
      await selectedAction(await optimizeFormDataImages(formData));
      return true;
    } catch (error) {
      if (error instanceof FormImageError) {
        setErrors({ [error.side]: error.message });
        setPendingAction(null);
        return false;
      }
      throw error;
    }
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSubmitError(null);
        try {
          const ok = await submitWithOptimizedImages(action, formData);
          if (edit && ok) {
            markFormClean();
            setSuccess(true);
            await new Promise((resolve) => setTimeout(resolve, 800));
            if (getPreviousAppPath() === cancelHref) {
              router.back();
            } else {
              router.replace(cancelHref);
            }
          }
          // create mode: server redirect handles navigation on success
        } catch {
          setSubmitError(
            edit
              ? "Could not save the card. Try again."
              : "Could not create the card. Try again.",
          );
          setPendingAction(null);
        }
        return undefined;
      }}
      onSubmit={(event) => {
        setSubmitError(null);
        const nextErrors: { front?: string; back?: string } = {};
        if (!sideHasContent(front))
          nextErrors.front = "Front needs text or an image.";
        if (!sideHasContent(back))
          nextErrors.back = "Back needs text or an image.";
        setErrors(nextErrors);
        if (nextErrors.front || nextErrors.back) {
          event.preventDefault();
          setPendingAction(null);
        }
      }}
      className="space-y-6 rounded-xl border border-border bg-background p-4"
    >
      <SideEditor
        side="front"
        label="Front"
        value={front}
        onChange={setFront}
        fieldId={frontId}
        imageId={frontImageId}
        edit={edit}
      />
      <SideEditor
        side="back"
        label="Back"
        value={back}
        onChange={setBack}
        fieldId={backId}
        imageId={backImageId}
        edit={edit}
      />
      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}
      {errors.front || errors.back ? (
        <div className="space-y-1 text-sm text-destructive" role="alert">
          {errors.front ? <p>{errors.front}</p> : null}
          {errors.back ? <p>{errors.back}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 pt-1">
        <Button
          type="submit"
          className="w-full"
          disabled={pendingAction !== null}
          onClick={() => setPendingAction("save")}
        >
          {pendingAction === "save"
            ? "Saving…"
            : success
              ? "Saved!"
              : submitLabel}
        </Button>
        {alternativeAction ? (
          <Button
            type="submit"
            formAction={async (formData) => {
              setSubmitError(null);
              try {
                await submitWithOptimizedImages(alternativeAction, formData);
              } catch {
                setSubmitError("Could not create the card. Try again.");
                setPendingAction(null);
              }
            }}
            variant="secondary"
            className="w-full"
            disabled={pendingAction !== null}
            onClick={() => setPendingAction("add-another")}
          >
            {pendingAction === "add-another"
              ? "Saving and preparing another…"
              : (alternativeLabel ?? "Save and add another")}
          </Button>
        ) : null}
        <Button asChild variant="ghost" className="w-full">
          <GuardedLink href={cancelHref} replace>
            Cancel
          </GuardedLink>
        </Button>
      </div>
    </form>
  );
}

function SideEditor({
  side,
  label,
  value,
  onChange,
  fieldId,
  imageId,
  edit,
}: {
  side: Side;
  label: string;
  value: SideState;
  onChange: (next: SideState) => void;
  fieldId: string;
  imageId: string;
  edit: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <textarea
        id={fieldId}
        name={`${side}Text`}
        rows={4}
        maxLength={2000}
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
        placeholder={
          side === "front"
            ? "Question, word, or prompt"
            : "Answer or explanation"
        }
        className="flex min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
      />
      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        {value.imageUrl && !value.removeImage ? (
          <div className="relative overflow-hidden rounded-md">
            <Image
              src={value.imageUrl}
              alt={`${label} preview`}
              width={320}
              height={240}
              unoptimized
              className="h-40 w-full object-contain bg-muted"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={`Remove ${label.toLowerCase()} image`}
              className="absolute right-2 top-2"
              onClick={() => onChange({ ...value, removeImage: true })}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={imageId}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-muted/40 px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            <span>
              {edit
                ? `Replace ${label.toLowerCase()} image`
                : `Add ${label.toLowerCase()} image`}
            </span>
            <span className="text-xs">JPEG, PNG, or WebP up to 5 MB</span>
          </label>
        )}
        <input
          id={imageId}
          name={`${side}Image`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            onChange({ ...value, imageUrl: url, removeImage: false });
          }}
        />
        {edit && value.removeImage ? (
          <input type="hidden" name={`${side}Image`} value="clear" />
        ) : null}
      </div>
    </div>
  );
}

async function optimizeFormDataImages(formData: FormData): Promise<FormData> {
  const next = new FormData();
  for (const [name, value] of formData.entries()) {
    if (
      (name === "frontImage" || name === "backImage") &&
      value instanceof File &&
      value.size > 0
    ) {
      try {
        next.append(name, await optimizeFlashcardImageFile(value));
      } catch (error) {
        if (error instanceof FlashcardImageOptimizationError) {
          const side = name === "frontImage" ? "front" : "back";
          const label = side === "front" ? "Front" : "Back";
          throw new FormImageError(
            side,
            `${label} ${error.message.toLowerCase()}.`,
          );
        }
        throw error;
      }
    } else {
      next.append(name, value);
    }
  }
  return next;
}

class FormImageError extends Error {
  constructor(
    readonly side: Side,
    message: string,
  ) {
    super(message);
    this.name = "FormImageError";
  }
}

function sideHasContent(side: SideState) {
  return (
    side.text.trim().length > 0 || Boolean(side.imageUrl && !side.removeImage)
  );
}
