import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import useModalBackDismiss from "./useModalBackDismiss";

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const FALLBACK_SUPPORTED_LANGUAGES = ["ko", "en"];
const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER"];

const LANGUAGE_LABELS = {
  ko: "한국어",
  en: "English",
};

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0 ? userLike.roles : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

function hasAnyRole(userLike, roles) {
  const userRoles = normalizeRoles(userLike);
  return roles.some((role) => userRoles.includes(role));
}

function createTranslationForm() {
  return {
    title: "",
    summary: "",
    content: "",
    tags: "",
  };
}

function createCategoryTranslationForm() {
  return {
    name: "",
    description: "",
  };
}

function createTranslationForms(supportedLanguages, factory) {
  return supportedLanguages.reduce((translations, languageCode) => {
    translations[languageCode] = factory();
    return translations;
  }, {});
}

function createItemForm(defaultCategoryId = "", supportedLanguages = FALLBACK_SUPPORTED_LANGUAGES) {
  return {
    categoryId: defaultCategoryId,
    status: "PUBLISHED",
    displayOrder: 10,
    decisionDate: "",
    effectiveFrom: "",
    effectiveTo: "",
    sourceNote: "",
    translations: createTranslationForms(supportedLanguages, createTranslationForm),
  };
}

function createCategoryForm(supportedLanguages = FALLBACK_SUPPORTED_LANGUAGES) {
  return {
    displayOrder: 10,
    translations: createTranslationForms(supportedLanguages, createCategoryTranslationForm),
  };
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDateInputValue(value) {
  return value || "";
}

function formatDate(value, languageCode, emptyLabel = "-") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(languageCode === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value, languageCode, emptyLabel = "-") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(languageCode === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTranslation(entity, languageCode, defaultLanguage, emptyTranslation) {
  const selectedTranslation = entity?.translations?.[languageCode];
  const defaultTranslation = entity?.translations?.[defaultLanguage];

  return {
    value: selectedTranslation || defaultTranslation || emptyTranslation,
    missing: !selectedTranslation,
  };
}

function hasAnyValue(translation) {
  return Object.values(translation).some((value) => String(value || "").trim());
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-swing-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Notice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  const className =
    type === "success"
      ? "border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
      : "border-red-200 bg-red-50 text-red-700";

  return <div className={`rounded-lg border px-3 py-2 text-sm leading-6 ${className}`}>{children}</div>;
}

function MissingBadge({ show, label }) {
  if (!show) {
    return null;
  }

  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
      {label}
    </span>
  );
}

function LanguageTabs({ supportedLanguages, activeLanguage, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {supportedLanguages.map((languageCode) => (
        <button
          key={languageCode}
          type="button"
          onClick={() => onChange(languageCode)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            activeLanguage === languageCode
              ? "border-swing-teal bg-swing-teal-deep text-swing-paper"
              : "border-swing-border/45 bg-swing-paper text-swing-muted hover:bg-swing-cream/50"
          }`}
        >
          {LANGUAGE_LABELS[languageCode] || languageCode}
        </button>
      ))}
    </div>
  );
}

function TagList({ tags, query }) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-swing-teal/20 bg-swing-teal/10 px-2.5 py-1 text-xs font-semibold text-swing-teal-deep">
          {/* Tags are part of what the search matches on, so they are part of
              what it marks. */}
          <Highlight text={tag} query={query} />
        </span>
      ))}
    </div>
  );
}

// Marks every occurrence of the search term in a block of text. The reader
// arrived here from a filtered list, so the word that put the document in front
// of them is the one they are looking for — in a long manual entry, finding it
// unaided is the whole job.
function Highlight({ text, query }) {
  const value = String(text ?? "");
  const needle = String(query || "").trim();
  if (!needle) {
    return value;
  }

  const segments = [];
  const haystack = value.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let cursor = 0;

  while (cursor <= value.length) {
    const found = haystack.indexOf(lowerNeedle, cursor);
    if (found === -1) {
      segments.push(value.slice(cursor));
      break;
    }
    if (found > cursor) {
      segments.push(value.slice(cursor, found));
    }
    segments.push(
      <mark key={`${found}-${segments.length}`} className="rounded bg-amber-200 px-0.5 text-swing-ink">
        {value.slice(found, found + needle.length)}
      </mark>
    );
    cursor = found + needle.length;
  }

  return segments;
}

/**
 * Read-only view of one document, opened from the search results. It carries no
 * edit or delete action — those live on the 설정 copy of this screen — and it
 * folds the dates and source note away behind 상세보기, so what opens first is
 * the thing worth reading rather than a wall of metadata.
 */
function KnowledgeItemReaderModal({ item, itemTranslation, categoryTranslation, kb, labels, query, manualLanguage, onClose }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Mounted only while open, so back closes this rather than reaching the exit
  // prompt behind it.
  useModalBackDismiss(true, "admin-knowledge-item", onClose);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-swing-ink/40 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Capped to the viewport with the body scrolling inside: a long manual
          entry would otherwise carry the title and 닫기 off the top of a phone. */}
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-swing-border/30 bg-swing-paper shadow-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-swing-border/30 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-swing-teal-deep">
                <Highlight text={categoryTranslation.value.name} query={query} />
              </span>
              <MissingBadge show={categoryTranslation.missing || itemTranslation.missing} label={kb.translationMissing} />
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-swing-ink">
              <Highlight text={itemTranslation.value.title} query={query} />
            </h2>
            {itemTranslation.value.summary ? (
              <p className="mt-2 text-sm leading-6 text-swing-muted">
                <Highlight text={itemTranslation.value.summary} query={query} />
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={kb.close}
            className="shrink-0 rounded-lg border border-swing-border/45 px-3 py-2 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
          >
            {kb.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {itemTranslation.value.tags?.length ? (
            <div className="mb-4">
              <TagList tags={itemTranslation.value.tags} query={query} />
            </div>
          ) : null}

          <div className="whitespace-pre-wrap rounded-lg border border-swing-border/30 bg-swing-cream/50 p-5 text-sm leading-7 text-swing-ink">
            <Highlight text={itemTranslation.value.content} query={query} />
          </div>

          <div className="mt-4 rounded-lg border border-swing-border/30">
            <button
              type="button"
              onClick={() => setIsDetailOpen((current) => !current)}
              aria-expanded={isDetailOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
            >
              <span>{kb.detailSectionTitle}</span>
              <span className="text-xs font-bold text-swing-muted">
                {isDetailOpen ? kb.detailToggleClose : kb.detailToggleOpen}
              </span>
            </button>
            {isDetailOpen ? (
              <div className="border-t border-swing-border/20 p-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Info label={kb.decisionDate} value={formatDate(item.decisionDate, manualLanguage, labels.common.empty)} />
                  <Info label={kb.effectiveFrom} value={formatDate(item.effectiveFrom, manualLanguage, labels.common.empty)} />
                  <Info label={kb.effectiveTo} value={formatDate(item.effectiveTo, manualLanguage, labels.common.empty)} />
                  <Info label={kb.lastUpdated} value={formatDateTime(item.updatedAt, manualLanguage, labels.common.empty)} />
                  <div className="sm:col-span-2">
                    <Info label={kb.sourceNote} value={item.sourceNote || labels.common.empty} />
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBasePanel({ token, currentUser, labels, langCd, readOnly = false }) {
  const kb = labels.knowledgeBase;
  // Read-only is the 운영진 copy of this screen: search and results only, with
  // a document opening in a modal. Registering and editing live on the 설정
  // copy, which renders the detail pane and the forms below it.
  const canManage = !readOnly && hasAnyRole(currentUser, ["SUPER_ADMIN", "STAFF"]);
  const preferredLanguage = langCd === "Eng" ? "en" : "ko";

  const [defaultLanguage, setDefaultLanguage] = useState("ko");
  const [supportedLanguages, setSupportedLanguages] = useState(FALLBACK_SUPPORTED_LANGUAGES);
  const [manualLanguage, setManualLanguage] = useState(preferredLanguage);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  // Read-only mode only: which document the reader opened. Kept apart from
  // selectedItemId, which the detail pane wants defaulted to the first result.
  const [openedItemId, setOpenedItemId] = useState(null);
  const [activeItemFormLanguage, setActiveItemFormLanguage] = useState(preferredLanguage);
  const [activeCategoryFormLanguage, setActiveCategoryFormLanguage] = useState(preferredLanguage);
  const [itemForm, setItemForm] = useState(() => createItemForm("", FALLBACK_SUPPORTED_LANGUAGES));
  const [editingItemId, setEditingItemId] = useState(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(() => createCategoryForm(FALLBACK_SUPPORTED_LANGUAGES));
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBootstrap = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await adminApi.bootstrapKnowledgeBase(token);
      const nextSupportedLanguages = data.supportedLanguages?.length ? data.supportedLanguages : FALLBACK_SUPPORTED_LANGUAGES;
      const nextDefaultLanguage = data.defaultLanguage || "ko";

      setDefaultLanguage(nextDefaultLanguage);
      setSupportedLanguages(nextSupportedLanguages);
      setCategories(data.categories || []);
      setItems(data.items || []);
      setManualLanguage((currentLanguage) =>
        nextSupportedLanguages.includes(currentLanguage) ? currentLanguage : nextDefaultLanguage
      );
      setSelectedItemId((currentId) => {
        if (data.items?.some((item) => item.id === currentId)) {
          return currentId;
        }
        return data.items?.[0]?.id || null;
      });
      setItemForm((currentForm) => ({
        ...currentForm,
        categoryId: currentForm.categoryId || data.categories?.[0]?.id || "",
        translations: normalizeItemFormTranslations(currentForm.translations, nextSupportedLanguages),
      }));
      setCategoryForm((currentForm) => ({
        ...currentForm,
        translations: normalizeCategoryFormTranslations(currentForm.translations, nextSupportedLanguages),
      }));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return items.filter((item) => {
      const matchesCategory = categoryId === "ALL" || item.categoryId === Number(categoryId);
      const category = categories.find((candidate) => candidate.id === item.categoryId);
      const categoryText = Object.values(category?.translations || {})
        .flatMap((translation) => [translation.name, translation.description])
        .join(" ");
      const itemText = Object.values(item.translations || {})
        .flatMap((translation) => [
          translation.title,
          translation.summary,
          translation.content,
          ...(translation.tags || []),
        ])
        .join(" ");
      const haystack = `${categoryText} ${itemText}`.toLowerCase();

      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [categories, categoryId, items, query]);

  const selectedItem = useMemo(() => {
    if (filteredItems.some((item) => item.id === selectedItemId)) {
      return filteredItems.find((item) => item.id === selectedItemId);
    }
    return filteredItems[0] || null;
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (selectedItem && selectedItem.id !== selectedItemId) {
      setSelectedItemId(selectedItem.id);
    }
  }, [selectedItem, selectedItemId]);

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm(createItemForm(categories[0]?.id || "", supportedLanguages));
    setActiveItemFormLanguage(manualLanguage);
  };

  /**
   * Writing a decision happens in a modal rather than in a form standing open
   * below the list. One form served both "new" and "edit" before, which meant
   * the screen always carried a full-height empty form, and whether it was
   * about to create or overwrite depended on a piece of state nothing on screen
   * named. Now it is only present while it is being used, and it says which of
   * the two it is doing.
   */
  const openCreateItemForm = () => {
    resetItemForm();
    setNotice("");
    setError("");
    setIsItemFormOpen(true);
  };

  const closeItemForm = useCallback(() => {
    setIsItemFormOpen(false);
    resetItemForm();
  // resetItemForm is redefined every render; the values it closes over are the
  // ones this callback is meant to reset to, so leave it out rather than making
  // the callback change identity on every keystroke.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, supportedLanguages, manualLanguage]);

  // Closed by the back gesture like every other modal here, so back does not
  // reach the exit prompt behind it. Clicking the backdrop and pressing Escape
  // deliberately do not close it — this one holds typing.
  useModalBackDismiss(isItemFormOpen, "admin-knowledge-item-form", closeItemForm);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(createCategoryForm(supportedLanguages));
    setActiveCategoryFormLanguage(manualLanguage);
  };

  const handleCommonItemChange = (event) => {
    const { name, value } = event.target;
    setItemForm((currentForm) => ({
      ...currentForm,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  const handleItemTranslationChange = (event) => {
    const { name, value } = event.target;
    setItemForm((currentForm) => ({
      ...currentForm,
      translations: {
        ...currentForm.translations,
        [activeItemFormLanguage]: {
          ...currentForm.translations[activeItemFormLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleCategoryCommonChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((currentForm) => ({
      ...currentForm,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  const handleCategoryTranslationChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((currentForm) => ({
      ...currentForm,
      translations: {
        ...currentForm.translations,
        [activeCategoryFormLanguage]: {
          ...currentForm.translations[activeCategoryFormLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleEditItem = (item) => {
    const translations = supportedLanguages.reduce((nextTranslations, languageCode) => {
      const translation = item.translations?.[languageCode];
      nextTranslations[languageCode] = {
        title: translation?.title || "",
        summary: translation?.summary || "",
        content: translation?.content || "",
        tags: (translation?.tags || []).join(", "),
      };
      return nextTranslations;
    }, {});

    setEditingItemId(item.id);
    setItemForm({
      categoryId: item.categoryId,
      status: item.status,
      displayOrder: item.displayOrder,
      decisionDate: toDateInputValue(item.decisionDate),
      effectiveFrom: toDateInputValue(item.effectiveFrom),
      effectiveTo: toDateInputValue(item.effectiveTo),
      sourceNote: item.sourceNote || "",
      translations,
    });
    setActiveItemFormLanguage(manualLanguage);
    setNotice("");
    setError("");
    setIsItemFormOpen(true);
  };

  const handleSubmitItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    const payload = {
      categoryId: Number(itemForm.categoryId),
      status: itemForm.status,
      displayOrder: Number(itemForm.displayOrder),
      decisionDate: itemForm.decisionDate || null,
      effectiveFrom: itemForm.effectiveFrom || null,
      effectiveTo: itemForm.effectiveTo || null,
      sourceNote: itemForm.sourceNote.trim() || null,
      translations: buildItemTranslationsPayload(itemForm.translations, supportedLanguages, defaultLanguage),
    };

    try {
      const savedItem = editingItemId
        ? await adminApi.updateKnowledgeItem(token, editingItemId, payload)
        : await adminApi.createKnowledgeItem(token, payload);

      setNotice(editingItemId ? kb.itemUpdated : kb.itemCreated);
      // Only on success: a failed save leaves the modal open with the typing
      // still in it, so the person can fix what the error named.
      setIsItemFormOpen(false);
      resetItemForm();
      await loadBootstrap();
      setSelectedItemId(savedItem.status === "PUBLISHED" ? savedItem.id : null);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const itemTranslation = getTranslation(item, manualLanguage, defaultLanguage, {}).value;
    if (!window.confirm(kb.confirmDeleteItem(itemTranslation.title || String(item.id)))) {
      return;
    }

    setNotice("");
    setError("");

    try {
      await adminApi.deleteKnowledgeItem(token, item.id);
      setNotice(kb.itemDeleted);
      resetItemForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const handleEditCategory = (category) => {
    const translations = supportedLanguages.reduce((nextTranslations, languageCode) => {
      const translation = category.translations?.[languageCode];
      nextTranslations[languageCode] = {
        name: translation?.name || "",
        description: translation?.description || "",
      };
      return nextTranslations;
    }, {});

    setEditingCategoryId(category.id);
    setCategoryForm({
      displayOrder: category.displayOrder,
      translations,
    });
    setActiveCategoryFormLanguage(manualLanguage);
    setNotice("");
    setError("");
  };

  const handleSubmitCategory = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    const payload = {
      displayOrder: Number(categoryForm.displayOrder),
      translations: buildCategoryTranslationsPayload(categoryForm.translations, supportedLanguages, defaultLanguage),
    };

    try {
      await (editingCategoryId
        ? adminApi.updateKnowledgeCategory(token, editingCategoryId, payload)
        : adminApi.createKnowledgeCategory(token, payload));

      setNotice(editingCategoryId ? kb.categoryUpdated : kb.categoryCreated);
      resetCategoryForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {}).value;
    if (!window.confirm(kb.confirmDeleteCategory(categoryTranslation.name || String(category.id)))) {
      return;
    }

    setNotice("");
    setError("");

    try {
      await adminApi.deleteKnowledgeCategory(token, category.id);
      setNotice(kb.categoryDeleted);
      resetCategoryForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  // A filter change can drop the open document out of the results; it closes
  // rather than lingering over a list it is no longer part of.
  const openedItem = readOnly ? filteredItems.find((item) => item.id === openedItemId) || null : null;

  const selectedItemTranslation = getTranslation(selectedItem, manualLanguage, defaultLanguage, {
    title: "",
    summary: "",
    content: "",
    tags: [],
  });
  const selectedCategory = categories.find((category) => category.id === selectedItem?.categoryId);
  const selectedCategoryTranslation = getTranslation(selectedCategory, manualLanguage, defaultLanguage, {
    name: "",
    description: "",
  });

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-swing-ink">{kb.searchLabel}</h2>
          {/* Searching is the whole point of the read-only screen, so its
              fields are never folded away behind a toggle. */}
          {readOnly ? null : (
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <button
                  type="button"
                  onClick={openCreateItemForm}
                  disabled={categories.length === 0}
                  className="rounded-lg bg-swing-teal-deep px-3 py-2 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
                >
                  {kb.createItemTitle}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                className="rounded-lg border border-swing-border/55 bg-swing-paper px-3 py-2 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
              >
                {showFilters ? labels.common.hideFilters : labels.common.showFilters}
              </button>
            </div>
          )}
        </div>
        {/* Three conditions on one row wherever they fit. This used to widen at
            xl, which is the viewport and not the width this panel actually gets
            — the sidebar takes its share — so on anything short of a wide
            desktop each field became its own full-width row. Keyed off md now,
            with the two selects capped so the search box takes the slack. */}
        <div
          className={`mt-4 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,9rem)] ${
            showFilters || readOnly ? "grid" : "hidden"
          }`}
        >
          <Field label={kb.searchLabel}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={kb.searchPlaceholder}
            />
          </Field>
          <Field label={kb.categoryFilter}>
            <SelectInput value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="ALL">{kb.allCategories}</option>
              {categories.map((category) => {
                const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                  name: "",
                  description: "",
                });
                return (
                  <option key={category.id} value={category.id}>
                    {categoryTranslation.value.name || category.id}
                  </option>
                );
              })}
            </SelectInput>
          </Field>
          <Field label={kb.manualLanguage}>
            <SelectInput value={manualLanguage} onChange={(event) => setManualLanguage(event.target.value)}>
              {supportedLanguages.map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {LANGUAGE_LABELS[languageCode] || languageCode}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="mt-4 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>
      </div>

      <div className={`grid gap-5 ${readOnly ? "" : "xl:grid-cols-[390px_minmax(0,1fr)]"}`}>
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
            <h2 className="text-lg font-bold text-swing-ink">{kb.resultsTitle}</h2>
            <span className="text-sm text-swing-muted">
              {isLoading ? labels.common.loading : labels.common.count(filteredItems.length)}
            </span>
          </div>

          <div
            className={
              readOnly
                ? "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                : "mt-4 grid max-h-[640px] gap-3 overflow-y-auto pr-1"
            }
          >
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-swing-border/45 bg-swing-cream/50 p-5 text-sm leading-6 text-swing-muted sm:col-span-2 xl:col-span-3">
                {kb.noResults}
              </div>
            ) : null}

            {filteredItems.map((item) => {
              const itemTranslation = getTranslation(item, manualLanguage, defaultLanguage, {
                title: "",
                summary: "",
                content: "",
                tags: [],
              });
              const category = categories.find((candidate) => candidate.id === item.categoryId);
              const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                name: "",
                description: "",
              });

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (readOnly ? setOpenedItemId(item.id) : setSelectedItemId(item.id))}
                  className={`rounded-lg border p-4 text-left transition ${
                    !readOnly && selectedItem?.id === item.id
                      ? "border-swing-teal/40 bg-swing-teal/10"
                      : "border-swing-border/30 bg-swing-paper hover:border-swing-border/45 hover:bg-swing-cream/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-swing-teal-deep">
                      <Highlight text={categoryTranslation.value.name} query={query} />
                    </span>
                    <MissingBadge show={categoryTranslation.missing || itemTranslation.missing} label={kb.translationMissing} />
                  </div>
                  <div className="mt-1 text-base font-bold text-swing-ink">
                    <Highlight text={itemTranslation.value.title} query={query} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-swing-muted">
                    <Highlight text={itemTranslation.value.summary} query={query} />
                  </p>
                  <div className="mt-3">
                    <TagList tags={itemTranslation.value.tags} query={query} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {readOnly ? null : (
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          {selectedItem ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-swing-border/30 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-swing-teal-deep">{selectedCategoryTranslation.value.name}</span>
                    <MissingBadge show={selectedCategoryTranslation.missing || selectedItemTranslation.missing} label={kb.translationMissing} />
                  </div>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-swing-ink">{selectedItemTranslation.value.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-swing-muted">{selectedItemTranslation.value.summary}</p>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditItem(selectedItem)}
                      className="rounded-lg border border-swing-border/45 px-3 py-2 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
                    >
                      {labels.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItem)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      {labels.common.delete}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <TagList tags={selectedItemTranslation.value.tags} />
              </div>

              <div className="mt-5 whitespace-pre-wrap rounded-lg border border-swing-border/30 bg-swing-cream/50 p-5 text-sm leading-7 text-swing-ink">
                {selectedItemTranslation.value.content}
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Info label={kb.decisionDate} value={formatDate(selectedItem.decisionDate, manualLanguage, labels.common.empty)} />
                <Info label={kb.effectiveFrom} value={formatDate(selectedItem.effectiveFrom, manualLanguage, labels.common.empty)} />
                <Info label={kb.effectiveTo} value={formatDate(selectedItem.effectiveTo, manualLanguage, labels.common.empty)} />
                <Info label={kb.lastUpdated} value={formatDateTime(selectedItem.updatedAt, manualLanguage, labels.common.empty)} />
              </dl>

              <div className="mt-4 rounded-lg border border-swing-border/30 p-4">
                <div className="text-xs font-semibold text-swing-muted">{kb.sourceNote}</div>
                <div className="mt-1 text-sm leading-6 text-swing-ink/80">{selectedItem.sourceNote || labels.common.empty}</div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-swing-border/45 bg-swing-cream/50 p-8 text-sm text-swing-muted">
              {kb.selectItem}
            </div>
          )}
        </div>
        )}
      </div>

      {canManage && isItemFormOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-start justify-center bg-swing-ink/40 p-4 sm:p-8"
        >
          {/* Capped to the viewport with the body scrolling inside, so the title
              and the save button stay reachable on a phone. No backdrop-click or
              Escape close: this holds typing, and both are easy to hit by
              accident. */}
          <form
            onSubmit={handleSubmitItem}
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-swing-border/30 bg-swing-paper shadow-lg"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-swing-border/30 p-5">
              <h2 className="text-lg font-bold text-swing-ink">
                {editingItemId ? kb.editItemTitle : kb.createItemTitle}
              </h2>
              <button type="button" onClick={closeItemForm} className="text-sm font-semibold text-swing-muted hover:text-swing-ink">
                {labels.common.cancel}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

            {/* Two per row from the point the modal stops growing. Keyed to sm
                rather than lg because the panel is capped at max-w-3xl: between
                640 and 1024px the modal was already as wide as it ever gets
                while a viewport-keyed lg still had it in one column, so a date
                picker sat alone across 711px. */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={kb.category}>
                <SelectInput name="categoryId" value={itemForm.categoryId} onChange={handleCommonItemChange}>
                  {categories.map((category) => {
                    const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                      name: "",
                      description: "",
                    });
                    return (
                      <option key={category.id} value={category.id}>
                        {categoryTranslation.value.name || category.id}
                      </option>
                    );
                  })}
                </SelectInput>
              </Field>
              <Field label={kb.status}>
                <SelectInput name="status" value={itemForm.status} onChange={handleCommonItemChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {kb.statuses[status]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={kb.decisionDate}>
                <TextInput name="decisionDate" type="date" value={itemForm.decisionDate} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.effectiveFrom}>
                <TextInput name="effectiveFrom" type="date" value={itemForm.effectiveFrom} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.effectiveTo}>
                <TextInput name="effectiveTo" type="date" value={itemForm.effectiveTo} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.displayOrder}>
                <TextInput name="displayOrder" type="number" value={itemForm.displayOrder} onChange={handleCommonItemChange} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={kb.sourceNote}>
                  <TextInput name="sourceNote" value={itemForm.sourceNote} onChange={handleCommonItemChange} />
                </Field>
              </div>
            </div>

            <div className="mt-6 border-t border-swing-border/30 pt-5">
              <LanguageTabs
                supportedLanguages={supportedLanguages}
                activeLanguage={activeItemFormLanguage}
                onChange={setActiveItemFormLanguage}
              />
              <div className="mt-4 grid gap-4">
                <Field label={activeItemFormLanguage === "en" ? "Title" : kb.title}>
                  <TextInput
                    name="title"
                    value={itemForm.translations[activeItemFormLanguage]?.title || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Summary" : kb.summary}>
                  <TextArea
                    name="summary"
                    rows={3}
                    value={itemForm.translations[activeItemFormLanguage]?.summary || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Content" : kb.content}>
                  <TextArea
                    name="content"
                    rows={8}
                    value={itemForm.translations[activeItemFormLanguage]?.content || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Tags" : kb.tags}>
                  <TextInput
                    name="tags"
                    value={itemForm.translations[activeItemFormLanguage]?.tags || ""}
                    onChange={handleItemTranslationChange}
                    placeholder={kb.tagsPlaceholder}
                  />
                </Field>
              </div>
            </div>

            </div>

            <div className="shrink-0 border-t border-swing-border/30 p-5">
              <button
                type="submit"
                disabled={isSaving || categories.length === 0}
                className="inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
              >
                {isSaving ? labels.common.saving : editingItemId ? labels.common.save : labels.common.create}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Category management is all that is left standing on the page now that
          writing a decision happens in a modal. Its form was built for a 390px
          column, so it keeps that width and the list takes the room the item
          form used to occupy, rather than both stretching across the page. */}
      {canManage ? (
        <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)] xl:items-start">
          <div className="grid gap-5">
            <form onSubmit={handleSubmitCategory} className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
                <h2 className="text-lg font-bold text-swing-ink">
                  {editingCategoryId ? kb.editCategoryTitle : kb.createCategoryTitle}
                </h2>
                {editingCategoryId ? (
                  <button type="button" onClick={resetCategoryForm} className="text-sm font-semibold text-swing-muted hover:text-swing-ink">
                    {labels.common.cancel}
                  </button>
                ) : null}
              </div>

              <div className="mt-4">
                <Field label={kb.displayOrder}>
                  <TextInput name="displayOrder" type="number" value={categoryForm.displayOrder} onChange={handleCategoryCommonChange} />
                </Field>
              </div>

              <div className="mt-5 border-t border-swing-border/30 pt-5">
                <LanguageTabs
                  supportedLanguages={supportedLanguages}
                  activeLanguage={activeCategoryFormLanguage}
                  onChange={setActiveCategoryFormLanguage}
                />
                <div className="mt-4 grid gap-4">
                  <Field label={activeCategoryFormLanguage === "en" ? "Category Name" : kb.categoryName}>
                    <TextInput
                      name="name"
                      value={categoryForm.translations[activeCategoryFormLanguage]?.name || ""}
                      onChange={handleCategoryTranslationChange}
                    />
                  </Field>
                  <Field label={activeCategoryFormLanguage === "en" ? "Description" : kb.categoryDescription}>
                    <TextArea
                      name="description"
                      rows={3}
                      value={categoryForm.translations[activeCategoryFormLanguage]?.description || ""}
                      onChange={handleCategoryTranslationChange}
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
              >
                {isSaving ? labels.common.saving : editingCategoryId ? labels.common.save : labels.common.create}
              </button>
            </form>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
              <h2 className="text-lg font-bold text-swing-ink">{kb.categoryListTitle}</h2>
              <div className="mt-4 grid gap-2">
                {categories.map((category) => {
                  const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                    name: "",
                    description: "",
                  });
                  return (
                    <div key={category.id} className="rounded-lg border border-swing-border/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-swing-ink">{categoryTranslation.value.name}</span>
                            <MissingBadge show={categoryTranslation.missing} label={kb.translationMissing} />
                          </div>
                          <div className="mt-1 text-xs leading-5 text-swing-muted">{categoryTranslation.value.description}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(category)}
                            className="rounded-lg border border-swing-border/45 px-2.5 py-1.5 text-xs font-semibold text-swing-ink/80 hover:bg-swing-cream/50"
                          >
                            {labels.common.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            {labels.common.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {openedItem ? (
        <KnowledgeItemReaderModal
          item={openedItem}
          itemTranslation={getTranslation(openedItem, manualLanguage, defaultLanguage, {
            title: "",
            summary: "",
            content: "",
            tags: [],
          })}
          categoryTranslation={getTranslation(
            categories.find((category) => category.id === openedItem.categoryId),
            manualLanguage,
            defaultLanguage,
            { name: "", description: "" }
          )}
          kb={kb}
          labels={labels}
          query={query}
          manualLanguage={manualLanguage}
          onClose={() => setOpenedItemId(null)}
        />
      ) : null}
    </section>
  );
}

function normalizeItemFormTranslations(translations, supportedLanguages) {
  return supportedLanguages.reduce((nextTranslations, languageCode) => {
    nextTranslations[languageCode] = {
      ...createTranslationForm(),
      ...(translations?.[languageCode] || {}),
    };
    return nextTranslations;
  }, {});
}

function normalizeCategoryFormTranslations(translations, supportedLanguages) {
  return supportedLanguages.reduce((nextTranslations, languageCode) => {
    nextTranslations[languageCode] = {
      ...createCategoryTranslationForm(),
      ...(translations?.[languageCode] || {}),
    };
    return nextTranslations;
  }, {});
}

function buildItemTranslationsPayload(translations, supportedLanguages, defaultLanguage) {
  return supportedLanguages.reduce((payload, languageCode) => {
    const translation = translations[languageCode] || createTranslationForm();
    if (languageCode === defaultLanguage || hasAnyValue(translation)) {
      payload[languageCode] = {
        title: translation.title.trim(),
        summary: translation.summary.trim(),
        content: translation.content.trim(),
        tags: splitTags(translation.tags),
      };
    }
    return payload;
  }, {});
}

function buildCategoryTranslationsPayload(translations, supportedLanguages, defaultLanguage) {
  return supportedLanguages.reduce((payload, languageCode) => {
    const translation = translations[languageCode] || createCategoryTranslationForm();
    if (languageCode === defaultLanguage || hasAnyValue(translation)) {
      payload[languageCode] = {
        name: translation.name.trim(),
        description: translation.description.trim() || null,
      };
    }
    return payload;
  }, {});
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-swing-border/30 bg-swing-cream/50 p-4">
      <dt className="text-xs font-semibold text-swing-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-swing-ink">{value}</dd>
    </div>
  );
}
