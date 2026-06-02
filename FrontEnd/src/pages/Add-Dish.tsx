import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL, getMyStalls, type Stall } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AllergenSelector } from "@/components/allergen-selector";
import type { AllergenType } from "@/components/ui/allergen-badge";

const VALID_ALLERGENS: AllergenType[] = [
    "gluten",
    "dairy",
    "nuts",
    "eggs",
    "soy",
    "fish",
    "shellfish",
    "sesame",
];

interface DishApiResponse {
    id?: string | number;
    stallId?: string | number;
    name: string;
    description: string;
    category: string;
    allergens?: unknown;
}

function parseAllergens(value: unknown): AllergenType[] {
    if (Array.isArray(value)) {
        return value.filter(
            (a): a is AllergenType =>
                typeof a === "string" &&
                VALID_ALLERGENS.includes(a as AllergenType),
        );
    }
    if (typeof value === "string" && value.length > 0) {
        return value
            .split(",")
            .map((a) => a.trim())
            .filter((a): a is AllergenType =>
                VALID_ALLERGENS.includes(a as AllergenType),
            );
    }
    return [];
}

const sampleCategories = [
    "Appetizers",
    "Main Courses",
    "Noodles & Rice",
    "Desserts",
];

export default function AddDishPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const editId = searchParams.get("edit");
    const stallFromQuery = searchParams.get("stall");
    const isEditMode = !!editId;

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { replace: true, state: { from: "/add-dish" } });
        }
    }, [isLoggedIn, navigate]);

    const [selectedStall, setSelectedStall] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [allergens, setAllergens] = useState<AllergenType[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDish, setIsLoadingDish] = useState(isEditMode);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [myStalls, setMyStalls] = useState<Stall[]>([]);
    const [isLoadingStalls, setIsLoadingStalls] = useState(!isEditMode);
    const [stallsError, setStallsError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn || !user || isEditMode) {
            if (!isEditMode) setIsLoadingStalls(false);
            return;
        }

        let cancelled = false;

        (async () => {
            setIsLoadingStalls(true);
            setStallsError(null);

            try {
                const result = await getMyStalls(user.id);
                if (!cancelled) {
                    setMyStalls(result.stalls);
                    if (
                        stallFromQuery &&
                        result.stalls.some((s) => String(s.id) === stallFromQuery)
                    ) {
                        setSelectedStall(stallFromQuery);
                    }
                }
            } catch (err: unknown) {
                if (cancelled) return;
                const message =
                    axios.isAxiosError(err) && err.response?.data
                        ? String(
                              (err.response.data as { error?: string }).error ??
                                  `Failed to load stalls (${err.response.status})`,
                          )
                        : "Failed to load your stalls. Please try again.";
                setStallsError(message);
                toast.error(message);
            } finally {
                if (!cancelled) setIsLoadingStalls(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, user, isEditMode, stallFromQuery]);

    useEffect(() => {
        if (!editId) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await axios.get<DishApiResponse>(
                    `${API_BASE_URL}/dishes/${editId}`,
                );
                if (cancelled) return;

                const dish = res.data;
                setLoadError(null);
                if (dish.stallId != null) {
                    setSelectedStall(String(dish.stallId));
                }
                setName(dish.name ?? "");
                setCategory(dish.category ?? "");
                setDescription(dish.description ?? "");
                setAllergens(parseAllergens(dish.allergens));
            } catch (err: unknown) {
                if (cancelled) return;
                const message =
                    axios.isAxiosError(err) && err.response?.status === 404
                        ? "Dish not found"
                        : axios.isAxiosError(err) && err.response?.data
                          ? String(
                                (err.response.data as { message?: string })
                                    .message ??
                                    `Failed to load dish (${err.response.status})`,
                            )
                          : "Failed to load dish. Please try again.";
                setLoadError(message);
                toast.error(message);
            } finally {
                if (!cancelled) setIsLoadingDish(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [editId]);

    const selectedStallName = myStalls.find(
        (s) => String(s.id) === selectedStall,
    )?.name;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);

        try {
            if (isEditMode && editId) {
                await axios.put(`${API_BASE_URL}/dishes/${editId}`, {
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    allergens,
                });
                toast.success("Dish updated successfully!");
                if (selectedStall) {
                    navigate(`/stall/${selectedStall}`);
                }
            } else {
                await axios.post(`${API_BASE_URL}/dishes`, {
                    stallId: Number(selectedStall),
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    allergens: allergens,
                });

                toast.success("Dish added successfully!");
                setSelectedStall("");
                setName("");
                setCategory("");
                setDescription("");
                setAllergens([]);
            }

        } catch (err: unknown) {
            const message =
                axios.isAxiosError(err) && err.response?.data
                    ? String(
                          (err.response.data as { message?: string }).message ??
                              `Failed to save dish (${err.response.status})`,
                      )
                    : "Failed to save dish. Please try again.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        (isEditMode || selectedStall) &&
        name.trim() &&
        category.trim() &&
        description.trim();

    if (!isLoggedIn) {
        return null;
    }

    if (isEditMode && isLoadingDish) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-5">
                <p className="text-muted-foreground">Loading dish…</p>
            </div>
        );
    }

    if (isEditMode && loadError) {
        return (
            <div className="min-h-screen bg-background px-5 py-8">
                <p className="text-destructive">{loadError}</p>
                <Link
                    to="/"
                    className="mt-4 inline-block text-primary underline"
                >
                    Back to home
                </Link>
            </div>
        );
    }

    if (!isEditMode && isLoadingStalls) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-5">
                <p className="text-muted-foreground">Loading your stalls…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <PageHeader
                title={isEditMode ? "Edit Dish" : "Add New Dish"}
                backTo="/my-stalls"
                backLabel="Back to my stalls"
            />

            {/* Form */}
            <main className="max-w-lg mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Stall Dropdown */}
                    {!isEditMode && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Your Stall
                            </label>
                            {stallsError ? (
                                <p className="text-sm text-destructive">{stallsError}</p>
                            ) : myStalls.length === 0 ? (
                                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        You don&apos;t have any stalls yet. Create one before
                                        adding dishes.
                                    </p>
                                    <Button asChild variant="outline" className="rounded-lg">
                                        <Link to="/create-stall">Create a stall</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDropdownOpen(!isDropdownOpen)
                                        }
                                        className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-left transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <span
                                            className={
                                                selectedStallName
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {selectedStallName ||
                                                "Select a stall..."}
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20">
                                            {myStalls.map((stall) => (
                                                <button
                                                    key={stall.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStall(String(stall.id));
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                                                        selectedStall === String(stall.id)
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {stall.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dish Name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="dish-name"
                            className="text-sm font-medium text-foreground"
                        >
                            Dish Name
                        </label>
                        <Input
                            id="dish-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Crispy Spring Rolls"
                            className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label
                            htmlFor="dish-category"
                            className="text-sm font-medium text-foreground"
                        >
                            Category
                        </label>
                        <Input
                            id="dish-category"
                            type="text"
                            list="dish-category-options"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Appetizers"
                            className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                        <datalist id="dish-category-options">
                            {sampleCategories.map((option) => (
                                <option key={option} value={option} />
                            ))}
                        </datalist>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label
                            htmlFor="dish-description"
                            className="text-sm font-medium text-foreground"
                        >
                            Description
                        </label>
                        <Textarea
                            id="dish-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your dish..."
                            rows={3}
                            className="px-4 py-3 rounded-xl border-border bg-card resize-none focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                    </div>

                    {/* Allergens */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Allergens
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Tap to add or remove allergens contained in this
                            dish
                        </p>
                        <div className="mt-3 p-4 bg-card border border-border rounded-xl">
                            <AllergenSelector
                                selected={allergens}
                                onChange={setAllergens}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEditMode ? (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Changes
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Dish
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </main>

            {/* Close dropdown when clicking outside */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
