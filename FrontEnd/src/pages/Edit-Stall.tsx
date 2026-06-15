import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { FileCheck, ImagePlus, Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getStall, stallImageUrl, updateStall } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileFieldProps = {
    id: string;
    label: string;
    hint: string;
    accept: string;
    file: File | null;
    onChange: (file: File | null) => void;
    icon: ReactNode;
    optional?: boolean;
};

function FileField({
    id,
    label,
    hint,
    accept,
    file,
    onChange,
    icon,
    optional,
}: FileFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium text-foreground">
                {label}
                {optional && (
                    <span className="ml-1 font-normal text-muted-foreground">
                        (optional)
                    </span>
                )}
            </label>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <div
                className={cn(
                    "rounded-xl border border-dashed border-border bg-card p-4 transition-colors",
                    file && "border-primary/40 bg-primary/5",
                )}
            >
                <input
                    ref={inputRef}
                    id={id}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {icon}
                        </div>
                        <div className="min-w-0">
                            {file ? (
                                <>
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {optional
                                        ? "Keep current file or choose a new one"
                                        : "No file selected"}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => inputRef.current?.click()}
                        >
                            {file ? "Change file" : "Choose file"}
                        </Button>
                        {file && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-lg"
                                onClick={() => {
                                    onChange(null);
                                    if (inputRef.current)
                                        inputRef.current.value = "";
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EditStallPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const stallId = Number(id);
    const isValidStallId = Number.isInteger(stallId) && stallId > 0;
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [stallOwner, setStallOwner] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
        null,
    );
    const [photo, setPhoto] = useState<File | null>(null);
    const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(isValidStallId);
    const [loadError, setLoadError] = useState<string | null>(null);
    const displayLoadError = isValidStallId ? loadError : "Invalid stall id";
    const [isSubmitting, setIsSubmitting] = useState(false);

    const photoPreviewUrl = useMemo(
        () => (photo ? URL.createObjectURL(photo) : null),
        [photo],
    );

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        };
    }, [photoPreviewUrl]);

    useEffect(() => {
        if (!isValidStallId) return;

        let cancelled = false;

        (async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const stall = await getStall(stallId);
                if (cancelled) return;
                setStallOwner(stall.owner);
                setName(stall.name);
                setDescription(stall.description);
                setAddress(stall.address);
                setExistingImageUrl(stall.image ? stallImageUrl(stallId) : null);
            } catch (err: unknown) {
                if (cancelled) return;
                const message =
                    axios.isAxiosError(err) && err.response?.data
                        ? String(
                              (err.response.data as { error?: string }).error ??
                                  `Failed to load stall (${err.response.status})`,
                          )
                        : "Failed to load stall. Please try again.";
                setLoadError(message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [stallId, isValidStallId]);

    const displayImageUrl = photoPreviewUrl ?? existingImageUrl;

    const isOwner =
        stallOwner !== null && userId !== null && stallOwner === userId;

    const isFormValid = name.trim() && description.trim() && address.trim();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isOwner || !isFormValid || isSubmitting || !isValidStallId) return;

        setIsSubmitting(true);

        try {
            const stall = await updateStall(stallId, {
                name: name.trim(),
                description: description.trim(),
                address: address.trim(),
                ...(photo ? { photo } : {}),
                ...(proofOfOwnership ? { proofOfOwnership } : {}),
            });

            toast.success("Stall updated successfully!");
            navigate(`/stall/${stall.id}`);
        } catch (err: unknown) {
            const message =
                axios.isAxiosError(err) && err.response?.data
                    ? String(
                          (err.response.data as { error?: string }).error ??
                              `Failed to update stall (${err.response.status})`,
                      )
                    : "Failed to update stall. Please try again.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Edit Stall"
                backTo="/my-stalls"
                backLabel="Back to my stalls"
            />

            <main className="max-w-lg mx-auto px-4 py-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                        Loading stall…
                    </p>
                ) : displayLoadError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive space-y-3">
                        <p>{displayLoadError}</p>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-lg"
                        >
                            <Link to="/my-stalls">Back to My Stalls</Link>
                        </Button>
                    </div>
                ) : !isOwner ? (
                    <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You don&apos;t have permission to edit this stall.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-lg"
                        >
                            <Link
                                to={isValidStallId ? `/stall/${stallId}` : "/"}
                            >
                                View stall
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-6">
                            Update your stall details. Leave files unchanged
                            unless you want to replace them.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="stall-name"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Stall name
                                </label>
                                <Input
                                    id="stall-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. The Golden Wok"
                                    className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="stall-description"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Description
                                </label>
                                <Textarea
                                    id="stall-description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Tell customers what your stall offers..."
                                    rows={4}
                                    className="px-4 py-3 rounded-xl border-border bg-card resize-none focus-visible:ring-primary/20 focus-visible:border-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="stall-address"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Address
                                </label>
                                <Input
                                    id="stall-address"
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. Food Court Level 2, Booth 12"
                                    className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
                                />
                            </div>

                            <FileField
                                id="stall-photo"
                                label="Stall photo"
                                hint="Upload a new photo to replace the current one (JPG, PNG, or WebP)."
                                accept="image/jpeg,image/png,image/webp,image/*"
                                file={photo}
                                onChange={setPhoto}
                                icon={<ImagePlus className="size-5" />}
                                optional
                            />

                            {displayImageUrl && (
                                <div className="overflow-hidden rounded-xl border border-border">
                                    <img
                                        src={displayImageUrl}
                                        alt="Stall photo"
                                        className="w-full max-h-56 object-cover"
                                    />
                                </div>
                            )}

                            <FileField
                                id="stall-proof"
                                label="Proof of ownership"
                                hint="Upload a new document only if you need to replace the existing proof (PDF or image)."
                                accept="image/jpeg,image/png,image/webp,application/pdf,image/*,.pdf"
                                file={proofOfOwnership}
                                onChange={setProofOfOwnership}
                                icon={<FileCheck className="size-5" />}
                                optional
                            />

                            <Button
                                asChild
                                variant="outline"
                                className="w-full h-12 rounded-xl"
                            >
                                <Link to={`/add-dish?stall=${stallId}`}>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add dish to this stall
                                </Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isFormValid || isSubmitting}
                                className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {isSubmitting ? "Saving…" : "Save Changes"}
                            </Button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}
