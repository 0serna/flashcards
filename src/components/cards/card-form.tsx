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
import { useReliableAction } from "@/components/app/use-reliable-action";
import type { MutationOutcome } from "@/lib/mutations/outcome";
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
  updatedAt?: string;
  front: { text: string; imageUrl: string | null };
  back: { text: string; imageUrl: string | null };
};

type CardMutationValue = { id: string; next?: "deck" | "new-card" };
type FormAction = (
  formData: FormData,
) =>
  | void
  | MutationOutcome<CardMutationValue>
  | Promise<void | MutationOutcome<CardMutationValue>>;

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
  const [intentId, setIntentId] = useState(() => crypto.randomUUID());
  const reliableAction = useReliableAction();
  const formRef = useDirtyFormTracker();
  const router = useRouter();

  const edit = mode === "edit";

  async function submitWithOptimizedImages(
    selectedAction: FormAction,
    formData: FormData,
  ): Promise<MutationOutcome<CardMutationValue> | void | false> {
    if (front.removeImage) {
      formData.delete("frontImage");
      formData.append("frontImage", "clear");
    }
    if (back.removeImage) {
      formData.delete("backImage");
      formData.append("backImage", "clear");
    }

    formData.set("intentId", intentId);
    if (edit && initial?.updatedAt) {
      formData.set("expectedUpdatedAt", initial.updatedAt);
    }

    try {
      const attempt = await reliableAction.run(async () => {
        const optimized = await optimizeFormDataImages(formData);
        return await selectedAction(optimized);
      });
      if (!attempt) return false;
      if (attempt.status === "unconfirmed") {
        setSubmitError(
          "We could not confirm whether this was saved. Try again safely.",
        );
        return false;
      }
      return (
        attempt.value ?? {
          status: "confirmed" as const,
          value: { id: intentId },
        }
      );
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
          const outcome = await submitWithOptimizedImages(action, formData);
          if (!outcome) return;
          if (outcome.status === "rejected") {
            setSubmitError(outcome.message);
            setPendingAction(null);
            return;
          }
          setPendingAction(null);
          markFormClean();
          if (!edit) {
            router.replace(cancelHref);
            return;
          }
          setSuccess(true);
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (getPreviousAppPath() === cancelHref) {
            router.back();
          } else {
            router.replace(cancelHref);
          }
        } catch {
          setSubmitError(
            edit
              ? "Could not save the card. Try again."
              : "Could not create the card. Try again.",
          );
        } finally {
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

        if (reliableAction.pending) {
          event.preventDefault();
          return;
        }
        setSubmitError(null);
        setPendingAction(
          submitter instanceof HTMLElement &&
            submitter.dataset.formAction === "add-another"
            ? "add-another"
            : "save",
        );
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
          disabled={pendingAction !== null || reliableAction.pending}
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
                const outcome = await submitWithOptimizedImages(
                  alternativeAction,
                  formData,
                );
                if (!outcome) return;
                if (outcome.status === "rejected") {
                  setSubmitError(outcome.message);
                  return;
                }
                markFormClean();
                setFront({ text: "", imageUrl: null, removeImage: false });
                setBack({ text: "", imageUrl: null, removeImage: false });
                setIntentId(crypto.randomUUID());
                setErrors({});
                setPendingAction(null);
              } catch {
                setSubmitError("Could not create the card. Try again.");
              } finally {
                setPendingAction(null);
              }
            }}
            variant="secondary"
            data-form-action="add-another"
            className="w-full sm:w-auto"
            disabled={pendingAction !== null || reliableAction.pending}
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
                const attempt = await reliableAction.run(() =>
                  archiveAction(formData),
                );
                if (!attempt) return;
                if (attempt.status === "unconfirmed") {
                  setSubmitError(
                    "We could not confirm this action. Try again safely.",
                  );
                  return;
                }
                const outcome = attempt.value;
                if (outcome?.status === "rejected") {
                  setSubmitError(outcome.message);
                  return;
                }
                markFormClean();
                router.replace(cancelHref);
              } finally {
                setPendingAction(null);
              }
            }}
            variant="destructive"
            className="w-full sm:w-auto"
            data-form-action="archive"
            disabled={pendingAction !== null || reliableAction.pending}
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
