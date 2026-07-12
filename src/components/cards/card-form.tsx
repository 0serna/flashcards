"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { GuardedLink } from "@/components/app/guarded-link";
import { markFormClean } from "@/components/app/dirty-form-store";
import { getPreviousAppPath } from "@/components/app/navigation-history-store";
import { useDirtyFormTracker } from "@/components/app/use-dirty-form-tracker";
import { PrivateCardImage } from "@/components/cards/private-card-image";
import { runWithPendingMutation } from "@/lib/navigation/pending-mutations";
import { Button } from "@/components/ui/button";
import { FormActions, FormSurface } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CardImageOptimizationError,
  optimizeCardImageFile,
} from "@/lib/cards/image-optimization";

type Side = "front" | "back";

type SideState = {
  text: string;
  imageUrl: string | null;
  removeImage: boolean;
};

export type CardFormInitial = {
  front: { text: string; imageUrl: string | null };
  back: { text: string; imageUrl: string | null };
};

type FormAction = (formData: FormData) => void | Promise<void>;

type CardFormProps = {
  mode: "create" | "edit";
  action: FormAction;
  alternativeAction?: FormAction;
  alternativeLabel?: string;
  archiveAction?: FormAction;
  cancelHref: string;
  initial?: CardFormInitial;
  submitLabel: string;
};

export function CardForm({
  mode,
  action,
  alternativeAction,
  alternativeLabel,
  archiveAction,
  cancelHref,
  initial,
  submitLabel,
}: CardFormProps) {
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
    "save" | "add-another" | "archive" | null
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
    if (front.removeImage) {
      formData.delete("frontImage");
      formData.append("frontImage", "clear");
    }
    if (back.removeImage) {
      formData.delete("backImage");
      formData.append("backImage", "clear");
    }

    try {
      await runWithPendingMutation(async () => {
        const optimized = await optimizeFormDataImages(formData);
        await selectedAction(optimized);
      });
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
    <FormSurface
      ref={formRef}
      action={async (formData) => {
        setSubmitError(null);
        try {
          const ok = await submitWithOptimizedImages(action, formData);
          if (edit && ok) {
            setPendingAction(null);
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
        const submitter = event.nativeEvent.submitter;
        if (
          submitter instanceof HTMLElement &&
          submitter.dataset.formAction === "archive"
        ) {
          return;
        }

        setSubmitError(null);
        setPendingAction("save");
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
      <FormActions>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={pendingAction !== null}
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
              setPendingAction("add-another");
              try {
                await submitWithOptimizedImages(alternativeAction, formData);
              } catch {
                setSubmitError("Could not create the card. Try again.");
                setPendingAction(null);
              }
            }}
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={pendingAction !== null}
          >
            {pendingAction === "add-another"
              ? "Saving and preparing another…"
              : (alternativeLabel ?? "Save and add another")}
          </Button>
        ) : null}
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <GuardedLink href={cancelHref} replace>
            Cancel
          </GuardedLink>
        </Button>
        {archiveAction ? (
          <Button
            type="submit"
            formAction={async (formData) => {
              setPendingAction("archive");
              try {
                await runWithPendingMutation(() => archiveAction(formData));
              } finally {
                setPendingAction(null);
              }
            }}
            variant="destructive"
            className="w-full sm:w-auto"
            data-form-action="archive"
            disabled={pendingAction !== null}
          >
            Archive
          </Button>
        ) : null}
      </FormActions>
    </FormSurface>
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  function revokePreviewUrl() {
    if (!previewUrlRef.current) return;
    URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }

  useEffect(() => revokePreviewUrl, []);

  function removeImage() {
    if (imageInputRef.current) imageInputRef.current.value = "";
    revokePreviewUrl();
    onChange({ ...value, removeImage: true });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Textarea
        id={fieldId}
        name={`${side}Text`}
        rows={3}
        maxLength={2000}
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
        placeholder={
          side === "front"
            ? "Question, word, or prompt"
            : "Answer or explanation"
        }
        className="min-h-24"
      />
      <input
        ref={imageInputRef}
        id={imageId}
        name={`${side}Image`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="peer sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          revokePreviewUrl();
          const url = URL.createObjectURL(file);
          previewUrlRef.current = url;
          onChange({ ...value, imageUrl: url, removeImage: false });
        }}
      />
      {value.imageUrl && !value.removeImage ? (
        <div className="relative overflow-hidden rounded-md border border-dashed border-border">
          {value.imageUrl.startsWith("blob:") ? (
            <Image
              src={value.imageUrl}
              alt={`${label} preview`}
              width={320}
              height={240}
              unoptimized
              className="h-40 w-full object-contain"
            />
          ) : (
            <PrivateCardImage
              src={value.imageUrl}
              alt={`${label} preview`}
              width={320}
              height={240}
              className="h-40 max-h-40 w-full object-contain"
            />
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`Remove ${label.toLowerCase()} image`}
            className="absolute right-2 top-2"
            onClick={removeImage}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={imageId}
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60 peer-focus-visible:ring-1 peer-focus-visible:ring-ring"
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
      {edit && value.removeImage ? (
        <input type="hidden" name={`${side}Image`} value="clear" />
      ) : null}
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
        next.append(name, await optimizeCardImageFile(value));
      } catch (error) {
        if (error instanceof CardImageOptimizationError) {
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
